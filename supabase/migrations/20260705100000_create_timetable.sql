-- Create the technical base for a structured festival timetable.

create table if not exists public.festival_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint festival_days_label_not_blank check (length(trim(label)) > 0)
);

create table if not exists public.timetable_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint timetable_stages_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.timetable_acts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint timetable_acts_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.timetable_performances (
  id uuid primary key default gen_random_uuid(),
  festival_day_id uuid not null references public.festival_days(id) on delete cascade,
  stage_id uuid not null references public.timetable_stages(id) on delete cascade,
  act_id uuid not null references public.timetable_acts(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint timetable_performances_time_order check (
    ends_at is null or ends_at > starts_at
  )
);

create index if not exists timetable_stages_sort_order_idx
  on public.timetable_stages (sort_order, name);

create index if not exists timetable_acts_name_idx
  on public.timetable_acts (name);

create index if not exists timetable_performances_day_stage_time_idx
  on public.timetable_performances (
    festival_day_id,
    stage_id,
    starts_at
  );

alter table public.festival_days enable row level security;
alter table public.timetable_stages enable row level security;
alter table public.timetable_acts enable row level security;
alter table public.timetable_performances enable row level security;

revoke all on table public.festival_days from anon, authenticated;
revoke all on table public.timetable_stages from anon, authenticated;
revoke all on table public.timetable_acts from anon, authenticated;
revoke all on table public.timetable_performances from anon, authenticated;

create policy "deny direct festival day access"
  on public.festival_days
  for all
  using (false)
  with check (false);

create policy "deny direct timetable stage access"
  on public.timetable_stages
  for all
  using (false)
  with check (false);

create policy "deny direct timetable act access"
  on public.timetable_acts
  for all
  using (false)
  with check (false);

create policy "deny direct timetable performance access"
  on public.timetable_performances
  for all
  using (false)
  with check (false);

create or replace function public.ha_get_timetable(
  p_participant_access_code text
)
returns table (
  festival_days jsonb,
  stages jsonb,
  acts jsonb,
  performances jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;

  return query
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', fd.id,
            'date', fd.date,
            'label', fd.label,
            'sort_order', fd.sort_order
          )
          order by fd.sort_order, fd.date
        )
        from public.festival_days fd
      ),
      '[]'::jsonb
    ) as festival_days,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ts.id,
            'name', ts.name,
            'sort_order', ts.sort_order
          )
          order by ts.sort_order, ts.name
        )
        from public.timetable_stages ts
      ),
      '[]'::jsonb
    ) as stages,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ta.id,
            'name', ta.name,
            'description', ta.description
          )
          order by ta.name
        )
        from public.timetable_acts ta
      ),
      '[]'::jsonb
    ) as acts,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', tp.id,
            'festival_day_id', tp.festival_day_id,
            'stage_id', tp.stage_id,
            'act_id', tp.act_id,
            'starts_at', tp.starts_at,
            'ends_at', tp.ends_at
          )
          order by fd.sort_order, tp.starts_at, ts.sort_order
        )
        from public.timetable_performances tp
        join public.festival_days fd on fd.id = tp.festival_day_id
        join public.timetable_stages ts on ts.id = tp.stage_id
      ),
      '[]'::jsonb
    ) as performances;
end;
$$;

grant execute on function public.ha_get_timetable(text) to anon, authenticated;
