-- ============================================================
-- Aviral & Gandhi · RLS Migration 002
-- All access control rules
-- ============================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- PROFILES ----------
alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_self" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_role_change" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- ---------- NEWS ----------
alter table public.news enable row level security;
create policy "news_select_all" on public.news for select using (true);
create policy "news_admin_insert" on public.news for insert with check (public.is_admin());
create policy "news_admin_update" on public.news for update using (public.is_admin());
create policy "news_admin_delete" on public.news for delete using (public.is_admin());

-- ---------- RANKINGS ----------
alter table public.rankings enable row level security;
create policy "rankings_select_all" on public.rankings for select using (true);
create policy "rankings_admin_all" on public.rankings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- PARTIES ----------
alter table public.parties enable row level security;
create policy "parties_select_all" on public.parties for select using (true);
-- Any authenticated user can create a party (pending status)
create policy "parties_member_insert" on public.parties for insert
  with check (auth.uid() = founder_id and status = 'pending');
-- Founder can delete their own party; admin can do anything
create policy "parties_founder_delete" on public.parties for delete using (auth.uid() = founder_id);
create policy "parties_admin_delete" on public.parties for delete using (public.is_admin());
create policy "parties_admin_update" on public.parties for update using (public.is_admin());

-- ---------- PARTY MEMBERS ----------
alter table public.party_members enable row level security;
create policy "party_members_select_all" on public.party_members for select using (true);
-- User can request to join (insert with their own user_id and status='requested')
create policy "party_members_self_request" on public.party_members for insert
  with check (auth.uid() = user_id and status = 'requested');
-- Founder of the party can approve/reject members
create policy "party_members_founder_update" on public.party_members for update
  using (auth.uid() = (select founder_id from public.parties where id = party_id));
-- User can leave their own party (delete row); founder can remove any member
create policy "party_members_self_delete" on public.party_members for delete using (auth.uid() = user_id);
create policy "party_members_founder_delete" on public.party_members for delete
  using (auth.uid() = (select founder_id from public.parties where id = party_id));

-- ---------- ELECTIONS ----------
alter table public.elections enable row level security;
create policy "elections_select_all" on public.elections for select using (true);
create policy "elections_admin_all" on public.elections for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- VOTES ----------
alter table public.votes enable row level security;
-- Members can only see their own vote; admin sees all
create policy "votes_self_select" on public.votes for select using (auth.uid() = voter_id);
create policy "votes_admin_select" on public.votes for select using (public.is_admin());
-- Members can insert their own vote if the election is open
create policy "votes_self_insert" on public.votes for insert
  with check (
    auth.uid() = voter_id
    and exists(select 1 from public.elections where id = election_id and status = 'open')
  );
-- Members can update their own vote while election is open (changing their mind)
create policy "votes_self_update" on public.votes for update
  using (
    auth.uid() = voter_id
    and exists(select 1 from public.elections where id = election_id and status = 'open')
  );

-- ---------- COURT CASES ----------
alter table public.court_cases enable row level security;
create policy "court_select_all" on public.court_cases for select using (true);
-- Any authenticated user can file (with status='requested')
create policy "court_filer_insert" on public.court_cases for insert
  with check (auth.uid() = filer_id and status = 'requested');
-- Admin updates status (schedule, go live, close)
create policy "court_admin_update" on public.court_cases for update using (public.is_admin());
create policy "court_admin_delete" on public.court_cases for delete using (public.is_admin());

-- ---------- TOURNAMENTS ----------
alter table public.tournaments enable row level security;
-- Members see only published; admin sees all
create policy "tournaments_select_published" on public.tournaments for select using (status = 'published');
create policy "tournaments_admin_select_all" on public.tournaments for select using (public.is_admin());
-- Members can submit a request (status='pending')
create policy "tournaments_member_insert" on public.tournaments for insert
  with check (auth.uid() = submitted_by_id and status = 'pending');
-- Admin can insert directly with status='published'
create policy "tournaments_admin_insert" on public.tournaments for insert with check (public.is_admin());
create policy "tournaments_admin_update" on public.tournaments for update using (public.is_admin());
create policy "tournaments_admin_delete" on public.tournaments for delete using (public.is_admin());

-- ---------- TOURNAMENT REGISTRATIONS ----------
alter table public.tournament_registrations enable row level security;
create policy "registrations_select_self" on public.tournament_registrations for select
  using (auth.uid() = user_id);
create policy "registrations_select_admin" on public.tournament_registrations for select
  using (public.is_admin());
create policy "registrations_self_insert" on public.tournament_registrations for insert
  with check (auth.uid() = user_id and status = 'pending');
create policy "registrations_admin_update" on public.tournament_registrations for update using (public.is_admin());
create policy "registrations_admin_delete" on public.tournament_registrations for delete using (public.is_admin());

-- ============================================================
-- WINNER REVEAL: a view that hides losers after election closes
-- Admin gets the full tally; members only see the winner's count
-- ============================================================
create or replace view public.election_results_public as
select
  v.election_id,
  v.party_id,
  case
    when public.is_admin() then count(*)::int
    when e.status = 'closed' and v.party_id = (
      select party_id from public.votes
      where election_id = v.election_id
      group by party_id
      order by count(*) desc
      limit 1
    ) then count(*)::int
    else null
  end as vote_count
from public.votes v
join public.elections e on e.id = v.election_id
group by v.election_id, v.party_id, e.status;

-- Grant access to the view
grant select on public.election_results_public to authenticated;
