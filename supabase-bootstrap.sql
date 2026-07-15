-- Run this once in the Supabase SQL editor.
-- After this, the dashboard can call bootstrap_fiber_factory_schema() on startup.

create extension if not exists pgcrypto;

create or replace function public.bootstrap_fiber_factory_schema()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  create table if not exists public.fiber_production (
    id uuid primary key default gen_random_uuid(),
    batch_code text not null unique,
    date_produced date not null,
    kg numeric(12,2) not null check (kg > 0),
    entered_by text not null,
    created_at timestamptz not null default now()
  );

  create table if not exists public.fiber_sack_storage (
    id uuid primary key default gen_random_uuid(),
    sack_code text not null,
    date_packed date not null,
    entered_by text not null,
    fiber_production_id uuid not null references public.fiber_production(id) on delete restrict,
    fiber_production_batch_code text not null,
    kg numeric(12,2) not null check (kg > 0),
    created_at timestamptz not null default now()
  );

  create index if not exists fiber_sack_storage_sack_code_idx on public.fiber_sack_storage (sack_code);
  create index if not exists fiber_sack_storage_fiber_production_id_idx on public.fiber_sack_storage (fiber_production_id);

  create table if not exists public.paper_production (
    id uuid primary key default gen_random_uuid(),
    batch_code text not null unique,
    date_produced date not null,
    sack_code text not null,
    fiber_sack_code text not null,
    kg_used numeric(12,2) not null check (kg_used > 0),
    sheets integer not null check (sheets > 0),
    entered_by text not null,
    created_at timestamptz not null default now()
  );

  create index if not exists paper_production_sack_code_idx on public.paper_production (sack_code);

  create table if not exists public.paper_sack_storage (
    id uuid primary key default gen_random_uuid(),
    sack_code text not null,
    date_packed date not null,
    entered_by text not null,
    paper_production_id uuid not null references public.paper_production(id) on delete restrict,
    paper_production_batch_code text not null,
    sheets integer not null check (sheets > 0),
    created_at timestamptz not null default now()
  );

  create index if not exists paper_sack_storage_sack_code_idx on public.paper_sack_storage (sack_code);
  create index if not exists paper_sack_storage_paper_production_id_idx on public.paper_sack_storage (paper_production_id);

  return jsonb_build_object('ok', true);
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.fiber_production to anon, authenticated;
grant select, insert, update, delete on public.fiber_sack_storage to anon, authenticated;
grant select, insert, update, delete on public.paper_production to anon, authenticated;
grant select, insert, update, delete on public.paper_sack_storage to anon, authenticated;
grant execute on function public.bootstrap_fiber_factory_schema() to anon, authenticated;
