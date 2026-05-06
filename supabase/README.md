# Supabase setup — The Signal

## Applying migrations

Run the SQL files in `migrations/` against your Supabase project **in filename order**:

```
20260505000001_profiles.sql
20260505000002_courses.sql
20260505000003_modules.sql
20260505000004_lessons.sql
20260505000005_enrollments.sql
20260505000006_lesson_progress.sql
20260505000007_activity_pings.sql
20260505000008_rls.sql
```

Two ways:

1. **Supabase SQL Editor** — paste each file in order, run.
2. **Supabase CLI** — `supabase link --project-ref <ref>` then `supabase db push`.

## Seeding content

Once the schema is in place and `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run seed
```

This reads `scripts/source/the-signal-v2-final.html`, parses the embedded `T.en` content object, and upserts:

- 1 course (`signal-foundations`, status `published`)
- 3 modules (IMC, PR Tools, Stakeholders)
- ~22 lessons (8 + 6 + 5 module lessons + cases/scenarios/glossary appended to module 3)
- Glossary embedded as a `glossary` block on the final lesson

The script is idempotent — re-running upserts on `slug` (course) and `(course_id, position)` / `(module_id, position)` (modules, lessons).

## Promoting your first admin

After signing up via the app with your `@prt.iq` email, run this in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'ali@prt.iq';
```

Replace the email with whichever account should be the admin. Once promoted, `public.is_admin()` returns `true` for that user's JWT and the admin RLS policies engage.

## Lesson `body` JSONB schema

Lessons store rich content as `{ "blocks": [...] }`. Each block has a `type` discriminator. The seed script emits these types — Phase 3 will need to render them.

```jsonc
{
  "blocks": [
    { "type": "text", "content": "<HTML>" },
    { "type": "highlight", "content": "<HTML>" },
    { "type": "case_study", "title": "...", "body": "<HTML>", "tags": ["..."] },
    { "type": "framework_pencils", "intro": "..." },
    { "type": "framework_promo_mix" },
    { "type": "framework_atl_btl_ttl" },
    { "type": "framework_kotler_8_steps" },
    {
      "type": "quiz",
      "questions": [
        { "q": "...", "options": ["..."], "correct": 0 }
      ]
    },
    {
      "type": "scenario",
      "eyebrow": "...",
      "title": "...",
      "situation": "...",
      "choices": ["..."],
      "results": ["best", "decent", "poor", "poor"],
      "feedback": ["..."]
    },
    {
      "type": "glossary",
      "terms": [{ "term": "...", "definition": "..." }]
    }
  ]
}
```

Schema is intentionally loose so adding new block types in future content doesn't require a migration. Until the admin UI lands (Phase 7), all content edits go through this seed script or raw SQL.

## Verifying RLS

After seeding and assigning an enrollment manually, log in as the employee in Supabase Studio's "Authenticated" mode (or via JWT) and confirm:

- `select * from profiles` returns only their own row
- `select * from courses` returns the enrolled, published course only
- `select * from lessons` returns the lessons of that course only
- A user without enrollments sees 0 courses, 0 modules, 0 lessons

Admin-promoted users see everything.

## Gotchas

### Always filter user-scoped queries by the current user's id

For any table where admins have a "see all" RLS policy (`profiles`, `lesson_progress`, `enrollments`, `activity_pings`), application code must always add an explicit `.eq('user_id', user.id)` (or `.eq('id', user.id)` for `profiles`) filter — even though RLS already handles scoping for employees.

Without this, queries run as admin will return all users' rows and break aggregations like progress percentages, completion counts, etc.

**Examples of correct usage:**

```ts
supabase.from('profiles').select('*').eq('id', user.id).single()
supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id)
supabase.from('enrollments').select('course_id').eq('user_id', user.id)
```

Phase 7 admin pages that intentionally aggregate across users (e.g. "all employees who completed lesson X") are the exception — they query without the filter on purpose, and rely on the admin RLS policy.

**Failure modes seen in development:**

- `profiles.single()` without `.eq('id', user.id)` → `PGRST116` "contains 2 rows" for admins (Phase 2 verification).
- `lesson_progress.select('lesson_id')` without `.eq('user_id', user.id)` → admin's `/dashboard` showed `1 / 22 lessons` complete because another user's progress was counted (Phase 3a verification).
