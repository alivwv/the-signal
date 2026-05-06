-- Row Level Security: default-deny on every table, then allow narrowly.
-- Helper function is SECURITY DEFINER + STABLE + search_path locked.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.activity_pings enable row level security;

-- profiles ---------------------------------------------------------------
create policy "users see own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "admins see all profiles" on public.profiles
  for select using (public.is_admin());

create policy "admins update all profiles" on public.profiles
  for update using (public.is_admin());

-- courses ----------------------------------------------------------------
create policy "employees see enrolled published courses" on public.courses
  for select using (
    status = 'published'
    and exists (
      select 1 from public.enrollments
      where course_id = courses.id and user_id = auth.uid()
    )
  );

create policy "admins manage all courses" on public.courses
  for all using (public.is_admin());

-- modules ----------------------------------------------------------------
create policy "employees see modules of visible courses" on public.modules
  for select using (
    exists (
      select 1 from public.courses c
      join public.enrollments e on e.course_id = c.id
      where c.id = modules.course_id
        and c.status = 'published'
        and e.user_id = auth.uid()
    )
  );

create policy "admins manage all modules" on public.modules
  for all using (public.is_admin());

-- lessons ----------------------------------------------------------------
create policy "employees see lessons of visible modules" on public.lessons
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      join public.enrollments e on e.course_id = c.id
      where m.id = lessons.module_id
        and c.status = 'published'
        and e.user_id = auth.uid()
    )
  );

create policy "admins manage all lessons" on public.lessons
  for all using (public.is_admin());

-- enrollments ------------------------------------------------------------
create policy "users see own enrollments" on public.enrollments
  for select using (auth.uid() = user_id);

create policy "admins manage all enrollments" on public.enrollments
  for all using (public.is_admin());

-- lesson_progress --------------------------------------------------------
create policy "users see own progress" on public.lesson_progress
  for select using (auth.uid() = user_id);

create policy "users insert own progress" on public.lesson_progress
  for insert with check (auth.uid() = user_id);

create policy "users update own progress" on public.lesson_progress
  for update using (auth.uid() = user_id);

create policy "admins see all progress" on public.lesson_progress
  for select using (public.is_admin());

-- activity_pings ---------------------------------------------------------
create policy "users insert own pings" on public.activity_pings
  for insert with check (auth.uid() = user_id);

create policy "admins see all pings" on public.activity_pings
  for select using (public.is_admin());
