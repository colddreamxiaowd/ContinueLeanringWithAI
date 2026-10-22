create extension if not exists pgcrypto;

create table if not exists public.feishu_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  feishu_open_id text,
  feishu_name text,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  granted_scopes text not null default '',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  root_folder_token text not null,
  root_folder_name text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  pending_folders jsonb not null default '[]'::jsonb,
  items_seen integer not null default 0,
  folders_seen integer not null default 0,
  pages_processed integer not null default 0,
  last_error text,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists sync_jobs_user_started_idx
  on public.sync_jobs (user_id, started_at desc);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_token text not null,
  parent_source_token text,
  root_folder_token text not null,
  name text not null,
  item_type text not null default 'file',
  mime_type text,
  size_bytes bigint,
  modified_time text,
  web_url text,
  relative_path text not null,
  last_seen_job_id uuid references public.sync_jobs(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_token)
);

create index if not exists library_items_user_path_idx
  on public.library_items (user_id, relative_path);
create index if not exists library_items_user_root_idx
  on public.library_items (user_id, root_folder_token);
create index if not exists library_items_user_parent_idx
  on public.library_items (user_id, parent_source_token);

alter table public.feishu_connections enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.library_items enable row level security;

-- OAuth credentials are server-only. The application never grants direct client
-- access to this table; server routes use the service role after authenticating
-- the Supabase user and filtering every query by that user's UUID.
revoke all on table public.feishu_connections from anon, authenticated;

-- Direct reads are owner-scoped as a second line of defense. Mutations are made
-- by authenticated server routes only, never by browser-side database clients.
revoke insert, update, delete on table public.library_items from anon, authenticated;
revoke insert, update, delete on table public.sync_jobs from anon, authenticated;
grant select on table public.library_items, public.sync_jobs to authenticated;

drop policy if exists "users read their own library items" on public.library_items;
create policy "users read their own library items"
  on public.library_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users read their own sync jobs" on public.sync_jobs;
create policy "users read their own sync jobs"
  on public.sync_jobs for select to authenticated
  using (auth.uid() = user_id);

-- No browser-side policy exists for feishu_connections, which contains encrypted
-- credentials. Service-role API routes still enforce explicit user_id filters.
