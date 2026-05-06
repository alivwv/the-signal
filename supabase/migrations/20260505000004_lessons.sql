-- body JSONB intentionally loose so new component types (quizzes, scenarios, frameworks)
-- don't require migrations. See /supabase/README.md for the documented block schema.
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  position int not null,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  estimated_minutes int,
  created_at timestamptz not null default now(),
  unique(module_id, position)
);
