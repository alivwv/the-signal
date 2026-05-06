import { HighlightBlock } from "./blocks/HighlightBlock";
import { CaseStudyBlock } from "./blocks/CaseStudyBlock";
import { PencilsBlock } from "./blocks/PencilsBlock";
import { AtlBtlTtlBlock } from "./blocks/AtlBtlTtlBlock";
import { PromoMixBlock } from "./blocks/PromoMixBlock";
import { Kotler8StepsBlock } from "./blocks/Kotler8StepsBlock";
import { QuizBlock } from "./blocks/QuizBlock";
import { ScenarioBlock } from "./blocks/ScenarioBlock";
import { GlossaryBlock } from "./blocks/GlossaryBlock";

type Block = { type: string; [key: string]: unknown };

export function lessonHasQuiz(blocks: Block[]) {
  return blocks.some((b) => b.type === "quiz");
}

export function LessonBlocks({
  blocks,
  lessonId,
  courseSlug,
}: {
  blocks: Block[];
  lessonId: string;
  courseSlug: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return (
              <TextBlock key={i} content={String(block.content ?? "")} />
            );
          case "highlight":
            return (
              <HighlightBlock
                key={i}
                content={String(block.content ?? "")}
              />
            );
          case "case_study":
            return (
              <CaseStudyBlock
                key={i}
                title={String(block.title ?? "")}
                body={String(block.body ?? "")}
              />
            );
          case "framework_pencils":
            return (
              <PencilsBlock
                key={i}
                intro={(block.intro as string) ?? undefined}
              />
            );
          case "framework_atl_btl_ttl":
            return <AtlBtlTtlBlock key={i} />;
          case "framework_promo_mix":
            return <PromoMixBlock key={i} />;
          case "framework_kotler_8_steps":
            return <Kotler8StepsBlock key={i} />;
          case "quiz":
            return (
              <QuizBlock
                key={i}
                lessonId={lessonId}
                courseSlug={courseSlug}
                questions={
                  (block.questions as {
                    q: string;
                    options: string[];
                    correct: number;
                    explain?: string;
                  }[]) ?? []
                }
              />
            );
          case "scenario":
            return (
              <ScenarioBlock
                key={i}
                eyebrow={(block.eyebrow as string) ?? undefined}
                title={(block.title as string) ?? undefined}
                situation={String(block.situation ?? "")}
                choices={(block.choices as string[]) ?? []}
                results={(block.results as string[]) ?? []}
                feedback={(block.feedback as string[]) ?? undefined}
              />
            );
          case "glossary":
            return (
              <GlossaryBlock
                key={i}
                terms={
                  (block.terms as { term: string; definition: string }[]) ??
                  []
                }
              />
            );
          default:
            return <UnsupportedBlock key={i} type={block.type} />;
        }
      })}
    </div>
  );
}

function TextBlock({ content }: { content: string }) {
  return (
    <div
      className="prose-signal text-[14px] leading-[1.75] text-txt2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// Fallback for any future block types not yet rendered. Should never appear in
// normal use given the switch above covers all seeded types.
function UnsupportedBlock({ type }: { type: string }) {
  return (
    <div className="bg-[#f0f0e6] border border-dashed border-border rounded-[var(--radius-sm)] p-3 text-xs text-txt3 font-mono">
      Unknown block type: <span className="font-semibold">{type}</span>
    </div>
  );
}
