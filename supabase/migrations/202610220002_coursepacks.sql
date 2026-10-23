-- CoursePack v0.1: owner-private course data and separate learning progress.
create table if not exists public.coursepacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  pack_version integer not null,
  pack jsonb not null,
  visibility text not null default 'private' check (visibility = 'private'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coursepacks_user_created_idx
  on public.coursepacks(user_id,created_at desc);

create table if not exists public.coursepack_progress (
  coursepack_id uuid not null references public.coursepacks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(coursepack_id,user_id)
);
alter table public.coursepacks enable row level security;
alter table public.coursepack_progress enable row level security;
revoke insert,update,delete on public.coursepacks from anon,authenticated;
revoke insert,update,delete on public.coursepack_progress from anon,authenticated;
grant select on public.coursepacks,public.coursepack_progress to authenticated;
drop policy if exists "users read their own coursepacks" on public.coursepacks;
create policy "users read their own coursepacks" on public.coursepacks
  for select to authenticated using (auth.uid()=user_id);
drop policy if exists "users read their own coursepack progress" on public.coursepack_progress;
create policy "users read their own coursepack progress" on public.coursepack_progress
  for select to authenticated using (auth.uid()=user_id);
-- All changes pass via authenticated server routes filtering user_id.
