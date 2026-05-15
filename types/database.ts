export type Profile = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: "member" | "admin";
  created_at: string;
};

export type News = {
  id: string;
  title: string;
  body: string | null;
  author_id: string | null;
  kind: "general" | "tournament";
  tournament_id: string | null;
  created_at: string;
  author?: Pick<Profile, "name" | "avatar_url"> | null;
};

export type Ranking = {
  id: string;
  display_name: string;
  linked_user_id: string | null;
  titles: string[];
  rank_position: number;
  updated_at: string;
  linked_user?: Pick<Profile, "name" | "avatar_url"> | null;
};

export type Party = {
  id: string;
  name: string;
  motto: string | null;
  logo_url: string | null;
  founder_id: string | null;
  founder_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type PartyMember = {
  party_id: string;
  user_id: string;
  status: "requested" | "approved";
  joined_at: string;
  user?: Pick<Profile, "name" | "avatar_url" | "email"> | null;
};

export type Election = {
  id: string;
  name: string;
  status: "scheduled" | "open" | "closed";
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type Vote = {
  election_id: string;
  voter_id: string;
  party_id: string;
  cast_at: string;
};

export type CourtCase = {
  id: string;
  case_number: string;
  title: string;
  body: string | null;
  filer_id: string | null;
  filer_name: string;
  status: "requested" | "scheduled" | "live" | "closed";
  jitsi_room: string | null;
  created_at: string;
  scheduled_at: string | null;
  closed_at: string | null;
};

export type Tournament = {
  id: string;
  title: string;
  format: string;
  prize: string;
  start_date: string;
  scope: "world" | "title" | "local";
  proposed_by: string;
  description: string | null;
  submitted_by_id: string | null;
  status: "pending" | "published" | "rejected";
  created_at: string;
};

export type TournamentRegistration = {
  id: string;
  tournament_id: string;
  user_id: string;
  display_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
