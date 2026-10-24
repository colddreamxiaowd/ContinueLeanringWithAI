-- G5-H incremental real events for the authenticated math pilot.
-- Kept separate from CoursePack v0.1 progress. Server routes validate client payloads.
create table if not exists public.learning_exploration_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null check (char_length(activity_id) between 1 and 100),
  client_event_id text not null check (char_length(client_event_id) between 8 and 110),
  kind text not null check (kind in ('attempt-submitted','note-saved')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_event_id)
);
create index if not exists learning_math_events_recent
  on public.learning_exploration_events(user_id, activity_id, created_at desc);
alter table public.learning_exploration_events enable row level security;
revoke all on public.learning_exploration_events from anon;
revoke insert, update, delete on public.learning_exploration_events from authenticated;
grant select on public.learning_exploration_events to authenticated;
drop policy if exists "math events owned by current user" on public.learning_exploration_events;
create policy "math events owned by current user"
 on public.learning_exploration_events for select to authenticated using (auth.uid()=user_id);
-- Service-side reads/writes use the already existing server-only Supabase key;
-- this key bypasses RLS, so the endpoint MUST always filter by session user_id.
