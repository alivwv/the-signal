-- Admin-assigned. No self-enrollment in v1.
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  enrolled_by uuid references public.profiles(id),
  unique(user_id, course_id)
);
