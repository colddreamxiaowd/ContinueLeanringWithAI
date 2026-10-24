-- G3 V1: a single owner-private source snapshot, three derived strategies,
-- one cross-mode concept mastery table. Requires 202610220001 library tables.
create table if not exists public.course_plan_families (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 library_item_id uuid not null references public.library_items(id) on delete cascade,
 source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
 planner_version text not null check (char_length(planner_version) between 1 and 80),
 source_name text not null,
 bundle jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (user_id, library_item_id, source_sha256, planner_version),
 unique (id, user_id)
);
create index if not exists course_plan_families_recent
 on public.course_plan_families(user_id,created_at desc);
create table if not exists public.course_concept_mastery (
 user_id uuid not null references auth.users(id) on delete cascade,
 family_id uuid not null,
 concept_id text not null check (char_length(concept_id) between 1 and 80),
 level smallint not null default 0 check (level between 0 and 2),
 evidence text not null check (evidence in ('reviewed','self-assessed')),
 updated_at timestamptz not null default now(),
 primary key (user_id,family_id,concept_id),
 foreign key (family_id,user_id) references public.course_plan_families(id,user_id) on delete cascade
);
create index if not exists course_concept_mastery_owner_family
 on public.course_concept_mastery(user_id,family_id);
alter table public.course_plan_families enable row level security;
alter table public.course_concept_mastery enable row level security;
revoke all on public.course_plan_families,public.course_concept_mastery from anon;
revoke insert,update,delete on public.course_plan_families,public.course_concept_mastery from authenticated;
grant select on public.course_plan_families,public.course_concept_mastery to authenticated;
drop policy if exists "owners read own plan families" on public.course_plan_families;
create policy "owners read own plan families" on public.course_plan_families
 for select to authenticated using(auth.uid()=user_id);
drop policy if exists "owners read own mastery" on public.course_concept_mastery;
create policy "owners read own mastery" on public.course_concept_mastery
 for select to authenticated using(auth.uid()=user_id);

-- Atomic monotonic upgrade: an older request or second device cannot downgrade
-- a higher status. Marking "read" or "self-assessed" is NOT an exam score.
create or replace function public.record_course_concept_mastery(
 p_user_id uuid, p_family_id uuid, p_concept_id text, p_level integer
) returns table(saved_level smallint)
language plpgsql security definer set search_path = public
as $$
declare
 allowed boolean;
 result_level smallint;
 evidence_value text;
begin
 if p_level not in (1,2) or p_concept_id is null or length(p_concept_id)>80 then
   raise exception 'INVALID_MASTERY_LEVEL' using errcode='22023';
 end if;
 select exists (
   select 1 from public.course_plan_families f
   where f.id=p_family_id and f.user_id=p_user_id
   and exists(
     select 1 from jsonb_array_elements(f.bundle->'topics') topic
     where topic->>'id'=p_concept_id
   )
 ) into allowed;
 if not allowed then raise exception 'MASTERY_TOPIC_NOT_FOUND' using errcode='22023';end if;
 evidence_value=case when p_level=2 then 'self-assessed' else 'reviewed' end;
 insert into public.course_concept_mastery(user_id,family_id,concept_id,level,evidence)
 values (p_user_id,p_family_id,p_concept_id,p_level,evidence_value)
 on conflict(user_id,family_id,concept_id) do update
 set level=greatest(public.course_concept_mastery.level,excluded.level),
     evidence=case when excluded.level>public.course_concept_mastery.level
         then excluded.evidence else public.course_concept_mastery.evidence end,
     updated_at=now()
 returning level into result_level;
 return query select result_level;
end;
$$;
revoke all on function public.record_course_concept_mastery(uuid,uuid,text,integer)
 from public,anon,authenticated;
grant execute on function public.record_course_concept_mastery(uuid,uuid,text,integer) to service_role;
