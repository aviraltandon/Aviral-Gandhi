"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUserAndProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name")
    .eq("id", user.id)
    .single();
  return { user, profile, supabase };
}

async function isElectionOpen(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("elections")
    .select("id")
    .eq("status", "open")
    .limit(1)
    .single();
  return !!data;
}

export async function createParty(formData: FormData) {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user || !profile) return { error: "Not authenticated" };

  if (await isElectionOpen(supabase)) {
    return { error: "Cannot create parties during an open election" };
  }

  const name = String(formData.get("name") || "").trim();
  const motto = String(formData.get("motto") || "").trim();
  const logo_url = String(formData.get("logo_url") || "").trim();

  if (!name) return { error: "Party name is required" };

  const { error } = await supabase.from("parties").insert({
    name,
    motto: motto || null,
    logo_url: logo_url || null,
    founder_id: user.id,
    founder_name: profile.name,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Party name already taken" };
    return { error: error.message };
  }

  revalidatePath("/parties");
  return { success: true };
}

export async function approveParty(partyId: string) {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") return { error: "Admin only" };

  const { error } = await supabase
    .from("parties")
    .update({ status: "approved" })
    .eq("id", partyId);

  if (error) return { error: error.message };

  // Auto-add founder as approved member
  const { data: party } = await supabase
    .from("parties")
    .select("founder_id")
    .eq("id", partyId)
    .single();

  if (party?.founder_id) {
    await supabase.from("party_members").insert({
      party_id: partyId,
      user_id: party.founder_id,
      status: "approved",
    });
  }

  revalidatePath("/parties");
  return { success: true };
}

export async function rejectParty(partyId: string) {
  const { user, profile, supabase } = await getUserAndProfile();
  if (!user || profile?.role !== "admin") return { error: "Admin only" };

  await supabase.from("parties").update({ status: "rejected" }).eq("id", partyId);
  revalidatePath("/parties");
  return { success: true };
}

export async function deleteParty(partyId: string) {
  const { user, supabase } = await getUserAndProfile();
  if (!user) return { error: "Not authenticated" };

  if (await isElectionOpen(supabase)) {
    return { error: "Cannot delete parties during an open election" };
  }

  const { data: party } = await supabase
    .from("parties")
    .select("founder_id")
    .eq("id", partyId)
    .single();

  if (!party) return { error: "Party not found" };
  if (party.founder_id !== user.id) return { error: "Only the founder can delete" };

  await supabase.from("parties").delete().eq("id", partyId);
  revalidatePath("/parties");
  return { success: true };
}

export async function requestJoin(partyId: string) {
  const { user, supabase } = await getUserAndProfile();
  if (!user) return { error: "Not authenticated" };

  if (await isElectionOpen(supabase)) {
    return { error: "Cannot join parties during an open election" };
  }

  const { error } = await supabase.from("party_members").insert({
    party_id: partyId,
    user_id: user.id,
    status: "requested",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already requested or joined" };
    return { error: error.message };
  }

  revalidatePath("/parties");
  return { success: true };
}

export async function approveJoin(partyId: string, userId: string) {
  const { user, supabase } = await getUserAndProfile();
  if (!user) return { error: "Not authenticated" };

  const { data: party } = await supabase
    .from("parties")
    .select("founder_id")
    .eq("id", partyId)
    .single();

  if (party?.founder_id !== user.id) return { error: "Only the founder can approve" };

  await supabase
    .from("party_members")
    .update({ status: "approved" })
    .eq("party_id", partyId)
    .eq("user_id", userId);

  revalidatePath("/parties");
  return { success: true };
}

export async function rejectJoin(partyId: string, userId: string) {
  const { user, supabase } = await getUserAndProfile();
  if (!user) return { error: "Not authenticated" };

  const { data: party } = await supabase
    .from("parties")
    .select("founder_id")
    .eq("id", partyId)
    .single();

  if (party?.founder_id !== user.id) return { error: "Only the founder can reject" };

  await supabase
    .from("party_members")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", userId);

  revalidatePath("/parties");
  return { success: true };
}

export async function leaveParty(partyId: string) {
  const { user, supabase } = await getUserAndProfile();
  if (!user) return { error: "Not authenticated" };

  if (await isElectionOpen(supabase)) {
    return { error: "Cannot leave parties during an open election" };
  }

  const { data: party } = await supabase
    .from("parties")
    .select("founder_id")
    .eq("id", partyId)
    .single();

  if (party?.founder_id === user.id) {
    return { error: "Founders must delete the party instead of leaving" };
  }

  await supabase
    .from("party_members")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", user.id);

  revalidatePath("/parties");
  return { success: true };
}