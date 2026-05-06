/**
 * Seeds the database with The Signal's English content from the source HTML.
 * Idempotent — uses upsert on slug/position so re-running won't duplicate.
 *
 * Usage:
 *   npm run seed
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Service role bypasses RLS so this can write courses/modules/lessons directly.
 */

import * as fs from "fs";
import * as path from "path";
import { PostgrestClient } from "@supabase/postgrest-js";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

// PostgrestClient instead of supabase-js — avoids loading the realtime module,
// which throws on Node < 22 without a WebSocket transport. Seed scripts have no
// need for realtime/auth/storage clients.
const supabase = new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
});

// ---------- Source extraction ------------------------------------------------

type Lesson = {
  t: string;
  d?: string;
  b?: string;
  hl?: string;
  ex?: { l?: string; t?: string; b?: string };
  hasFW?: number;
  hasPC?: number;
  pcIntro?: string;
  hasATL?: number;
  atlHL?: string;
  hasSteps?: number;
};

type Quiz = { q: string; o: string[]; c: number };
type Case = { tags: string[]; title: string; body: string };
type Scenario = {
  eye: string;
  tt: string;
  sit: string;
  ch: string[];
  rt: string[];
  fb: string[];
};
type Glossary = { t: string; d: string };

type EnContent = {
  m1m: string;
  m1d: string;
  m1l: Lesson[];
  m1q: Quiz[];
  m2m: string;
  m2d: string;
  m2l: Lesson[];
  m2q: Quiz[];
  m3m: string;
  m3d: string;
  m3l: Lesson[];
  m3q: Quiz[];
  cases: Case[];
  casesDesc: string;
  scenarios: Scenario[];
  scDesc: string;
  gls: Glossary[];
  glsD: string;
  homeD: string;
};

function extractBalancedBraces(src: string, startIdx: number): string {
  let depth = 0;
  let inString: string | null = null;
  let escape = false;
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === inString) inString = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      inString = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.substring(startIdx, i + 1);
    }
  }
  throw new Error("No matching closing brace");
}

function loadEnContent(): EnContent {
  const htmlPath = path.join(
    __dirname,
    "source/the-signal-v2-final.html"
  );
  const html = fs.readFileSync(htmlPath, "utf-8");
  const tDecl = html.indexOf("const T={");
  if (tDecl < 0) throw new Error("Couldn't find `const T={` in source HTML");
  const objStart = html.indexOf("{", tDecl);
  const objStr = extractBalancedBraces(html, objStart);
  const T = new Function(`return ${objStr}`)() as { en: EnContent };
  return T.en;
}

// ---------- Block builders ---------------------------------------------------

type Block = Record<string, unknown>;

function buildLessonBlocks(lesson: Lesson, quiz?: Quiz[]): Block[] {
  const blocks: Block[] = [];
  if (lesson.b) blocks.push({ type: "text", content: lesson.b });
  if (lesson.hasPC)
    blocks.push({
      type: "framework_pencils",
      intro: lesson.pcIntro ?? "",
    });
  if (lesson.hasFW) blocks.push({ type: "framework_promo_mix" });
  if (lesson.hasATL) blocks.push({ type: "framework_atl_btl_ttl" });
  if (lesson.hasSteps) blocks.push({ type: "framework_kotler_8_steps" });
  if (lesson.atlHL)
    blocks.push({ type: "highlight", content: lesson.atlHL });
  if (lesson.hl) blocks.push({ type: "highlight", content: lesson.hl });
  if (lesson.ex)
    blocks.push({
      type: "case_study",
      title: lesson.ex.t ?? lesson.ex.l ?? "Example",
      body: lesson.ex.b ?? "",
    });
  if (quiz && quiz.length > 0) {
    blocks.push({
      type: "quiz",
      questions: quiz.map((q) => ({
        q: q.q,
        options: q.o,
        // source uses 1-based correct index; normalize to 0-based
        correct: q.c - 1,
      })),
    });
  }
  return blocks;
}

// ---------- Seed -------------------------------------------------------------

async function upsertLesson(
  moduleId: string,
  position: number,
  title: string,
  blocks: Block[],
  estimatedMinutes: number | null
) {
  const { error } = await supabase.from("lessons").upsert(
    {
      module_id: moduleId,
      position,
      title,
      body: { blocks },
      estimated_minutes: estimatedMinutes,
    },
    { onConflict: "module_id,position" }
  );
  if (error) throw error;
}

async function seed() {
  const en = loadEnContent();
  console.log(
    `Loaded source: ${en.m1l.length} + ${en.m2l.length} + ${en.m3l.length} lessons, ${en.cases.length} cases, ${en.scenarios.length} scenarios, ${en.gls.length} glossary terms`
  );

  // 1. Course
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .upsert(
      {
        slug: "signal-foundations",
        title: "Signal: PR & Comms Foundations",
        description: en.homeD,
        status: "published",
        cover_color: "#0B5351",
      },
      { onConflict: "slug" }
    )
    .select()
    .single();
  if (courseErr || !course) throw courseErr ?? new Error("Course upsert failed");
  console.log(`Course: ${course.id}`);

  // 2. Modules
  const moduleSpecs = [
    {
      position: 1,
      title: en.m1m,
      description: en.m1d,
      lessons: en.m1l,
      quiz: en.m1q,
    },
    {
      position: 2,
      title: en.m2m,
      description: en.m2d,
      lessons: en.m2l,
      quiz: en.m2q,
    },
    {
      position: 3,
      title: en.m3m,
      description: en.m3d,
      lessons: en.m3l,
      quiz: en.m3q,
    },
  ];

  const moduleIds: string[] = [];
  for (const m of moduleSpecs) {
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .upsert(
        {
          course_id: course.id,
          position: m.position,
          title: m.title,
          description: m.description,
        },
        { onConflict: "course_id,position" }
      )
      .select()
      .single();
    if (modErr || !mod) throw modErr ?? new Error("Module upsert failed");
    moduleIds.push(mod.id);
    console.log(`Module ${m.position}: ${mod.id}`);

    // 3. Lessons (quiz appended to last lesson of the module)
    for (let i = 0; i < m.lessons.length; i++) {
      const lesson = m.lessons[i];
      const isLast = i === m.lessons.length - 1;
      const blocks = buildLessonBlocks(lesson, isLast ? m.quiz : undefined);
      await upsertLesson(
        mod.id,
        i + 1,
        lesson.t,
        blocks,
        lesson.d ? parseInt(lesson.d, 10) : null
      );
    }
  }

  // 4. Append cases, scenarios, glossary as final lessons of Module 3
  const m3Id = moduleIds[2];
  const m3Base = en.m3l.length;

  await upsertLesson(
    m3Id,
    m3Base + 1,
    "Case Studies",
    [
      { type: "text", content: en.casesDesc },
      ...en.cases.map((c) => ({
        type: "case_study",
        title: c.title,
        body: c.body,
        tags: c.tags,
      })),
    ],
    20
  );

  await upsertLesson(
    m3Id,
    m3Base + 2,
    "Scenario Lab",
    [
      { type: "text", content: en.scDesc },
      ...en.scenarios.map((s) => ({
        type: "scenario",
        eyebrow: s.eye,
        title: s.tt,
        situation: s.sit,
        choices: s.ch,
        results: s.rt,
        feedback: s.fb,
      })),
    ],
    15
  );

  await upsertLesson(
    m3Id,
    m3Base + 3,
    "Glossary",
    [
      { type: "text", content: en.glsD },
      {
        type: "glossary",
        terms: en.gls.map((g) => ({ term: g.t, definition: g.d })),
      },
    ],
    10
  );

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
