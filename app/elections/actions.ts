"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only", supabase: null, user: null };
  return { error: null, supabase, user };
}

export async function scheduleElection(formData: FormData) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const name = String(formData.get("name") || "").trim();
  const scheduled_start = String(formData.get("scheduled_start") || "").trim();
  const scheduled_end = String(formData.get("scheduled_end") || "").trim();

  if (!name || !scheduled_start || !scheduled_end) {
    return { error: "All fields are required" };
  }

  const { error } = await supabase.from("elections").insert({
    name,
    scheduled_start,
    scheduled_end,
    status: "scheduled",
  });

  if (error) {
    if (error.code === "23505") return { error: "Another election is already active" };
    return { error: error.message };
  }

  revalidatePath("/elections");
  return { success: true };
}

export async function startElection(electionId: string) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const { error } = await supabase
    .from("elections")
    .update({ status: "open", started_at: new Date().toISOString() })
    .eq("id", electionId)
    .eq("status", "scheduled");

  if (error) return { error: error.message };

  revalidatePath("/elections");
  return { success: true };
}

export async function closeElection(electionId: string) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const { error } = await supabase
    .from("elections")
    .update({ status: "closed", ended_at: new Date().toISOString() })
    .eq("id", electionId)
    .eq("status", "open");

  if (error) return { error: error.message };

  revalidatePath("/elections");
  return { success: true };
}

export async function castVote(electionId: string, partyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify election is open
  const { data: election } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (election?.status !== "open") return { error: "Voting is not open" };

  // Verify party is approved
  const { data: party } = await supabase
    .from("parties")
    .select("status")
    .eq("id", partyId)
    .single();

  if (party?.status !== "approved") return { error: "Party not eligible" };

  const { error } = await supabase.from("votes").insert({
    election_id: electionId,
    voter_id: user.id,
    party_id: partyId,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already voted in this election" };
    return { error: error.message };
  }

  revalidatePath("/elections");
  return { success: true };
}