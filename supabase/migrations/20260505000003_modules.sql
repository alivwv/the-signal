create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(course_id, position)
);
