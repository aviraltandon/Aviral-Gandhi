-- ============================================================
-- Aviral & Gandhi · Schema Migration 001
-- All tables for the AG platform
-- ============================================================

-- ---------- PROFILES (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- NEWS ----------
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'general' check (kind in ('general', 'tournament')),
  tournament_id uuid,
  created_at timestamptz default now()
);
create index news_created_idx on public.news (created_at desc);

-- ---------- WORLD RANKINGS ----------
create table public.rankings (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  linked_user_id uuid references public.profiles(id) on delete set null,
  titles text[] default '{}',
  rank_position int not null,
  updated_at timestamptz default now()
);
create unique index rankings_pos_idx on public.rankings (rank_position);

-- ---------- PARTIES ----------
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  motto text,
  logo_url text,
  founder_id uuid references public.profiles(id) on delete set null,
  founder_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table public.party_members (
  party_id uuid references public.parties(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'approved')),
  joined_at timestamptz default now(),
  primary key (party_id, user_id)
);

-- ---------- ELECTIONS ----------
create table public.elections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'closed')),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now()
);
-- Only ONE active election (open or scheduled) at a time
create unique index elections_active_idx on public.elections (status)
  where status in ('scheduled', 'open');

create table public.votes (
  election_id uuid references public.elections(id) on delete cascade,
  voter_id uuid references public.profiles(id) on delete cascade,
  party_id uuid references public.parties(id) on delete cascade,
  cast_at timestamptz default now(),
  primary key (election_id, voter_id)
);
create index votes_party_idx on public.votes (election_id, party_id);

-- ---------- COURT CASES ----------
create table public.court_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text unique not null,
  title text not null,
  body text,
  filer_id uuid references public.profiles(id) on delete set null,
  filer_name text not null,
  status text not null default 'requested' check (status in ('requested', 'scheduled', 'live', 'closed')),
  jitsi_room text,
  created_at timestamptz default now(),
  scheduled_at timestamptz,
  closed_at timestamptz
);

-- Auto-generate case number
create sequence if not exists case_seq start 2001;

create or replace function public.assign_case_number()
returns trigger language plpgsql as $$
begin
  if new.case_number is null then
    new.case_number := 'AG-' || nextval('case_seq');
  end if;
  if new.jitsi_room is null then
    new.jitsi_room := 'agcourt_' || replace(new.id::text, '-', '');
  end if;
  return new;
end;
$$;

create trigger court_case_number_trigger
  before insert on public.court_cases
  for each row execute function public.assign_case_number();

-- ---------- TOURNAMENTS ----------
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  format text not null,
  prize text not null,
  start_date timestamptz not null,
  scope text not null check (scope in ('world', 'title', 'local')),
  proposed_by text not null,
  description text,
  submitted_by_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz default now()
);
create index tournaments_status_idx on public.tournaments (status, start_date);

create table public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  unique (tournament_id, user_id)
);
