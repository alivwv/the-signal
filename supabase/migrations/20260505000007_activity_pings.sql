-- 30-second heartbeats. No retention policy in v1 — add cleanup once volume justifies it.
create table public.activity_pings (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  pinged_at timestamptz not null default now()
);

create index activity_pings_user_pinged_idx on public.activity_pings (user_id, pinged_at desc);
create index activity_pings_pinged_idx on public.activity_pings (pinged_at desc);
