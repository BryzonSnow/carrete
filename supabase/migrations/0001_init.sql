-- Carrete beta 0.1
-- Run in Supabase SQL editor or via CLI: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  host_name text not null default '',
  starts_at timestamptz not null,
  address text,
  fee_amount integer not null default 0 check (fee_amount >= 0),
  bank_holder text,
  bank_rut text,
  bank_name text,
  bank_account_type text,
  bank_account_number text,
  admin_token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null,
  session_token text not null unique,
  rsvp text not null default 'pending'
    check (rsvp in ('pending', 'going', 'not_going', 'late')),
  created_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx on public.guests(event_id);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null,
  name text not null,
  unit text not null default 'un',
  required_qty integer not null default 1 check (required_qty >= 0),
  is_open boolean not null default false,
  created_by_guest_id uuid references public.guests(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists items_event_id_idx on public.items(event_id);

create table if not exists public.item_claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  qty integer not null default 1 check (qty > 0),
  created_at timestamptz not null default now(),
  unique (item_id, guest_id)
);

create index if not exists item_claims_item_id_idx on public.item_claims(item_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  marked_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, guest_id)
);

create index if not exists payments_event_id_idx on public.payments(event_id);

-- Bell for live updates. Frontend listens here, then refetches the API
-- so address / bank details never leak through RLS.
create table if not exists public.live_signals (
  event_id uuid primary key references public.events(id) on delete cascade,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

create or replace function public.bump_live_signal()
returns trigger
language plpgsql
security definer
as $$
declare
  eid uuid;
begin
  if tg_table_name = 'events' then
    eid := coalesce(new.id, old.id);
  elsif tg_table_name = 'item_claims' then
    select i.event_id into eid
    from public.items i
    where i.id = coalesce(new.item_id, old.item_id);
  else
    eid := coalesce(new.event_id, old.event_id);
  end if;

  if eid is null then
    return coalesce(new, old);
  end if;

  insert into public.live_signals (event_id, revision, updated_at)
  values (eid, 1, now())
  on conflict (event_id) do update
    set revision = public.live_signals.revision + 1,
        updated_at = now();

  return coalesce(new, old);
end;
$$;

drop trigger if exists events_live_signal on public.events;
create trigger events_live_signal
after insert or update or delete on public.events
for each row execute function public.bump_live_signal();

drop trigger if exists guests_live_signal on public.guests;
create trigger guests_live_signal
after insert or update or delete on public.guests
for each row execute function public.bump_live_signal();

drop trigger if exists items_live_signal on public.items;
create trigger items_live_signal
after insert or update or delete on public.items
for each row execute function public.bump_live_signal();

drop trigger if exists item_claims_live_signal on public.item_claims;
create trigger item_claims_live_signal
after insert or update or delete on public.item_claims
for each row execute function public.bump_live_signal();

drop trigger if exists payments_live_signal on public.payments;
create trigger payments_live_signal
after insert or update or delete on public.payments
for each row execute function public.bump_live_signal();

alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.items enable row level security;
alter table public.item_claims enable row level security;
alter table public.payments enable row level security;
alter table public.live_signals enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.live_signals to anon, authenticated;

drop policy if exists live_signals_select_anon on public.live_signals;
create policy live_signals_select_anon
  on public.live_signals
  for select
  to anon, authenticated
  using (true);

-- Backend uses the postgres role (bypasses RLS). Anon cannot read event rows.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_signals'
  ) then
    execute 'alter publication supabase_realtime add table public.live_signals';
  end if;
end $$;
