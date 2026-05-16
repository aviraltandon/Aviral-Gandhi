"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function proposeTournament(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  const title = String(formData.get("title") || "").trim();
  const format = String(formData.get("format") || "").trim();
  const prize = String(formData.get("prize") || "").trim();
  const start_date = String(formData.get("start_date") || "").trim();
  const scope = String(formData.get("scope") || "local").trim();
  const proposed_by = String(formData.get("proposed_by") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title || !format || !prize || !start_date || !proposed_by) {
    return { error: "All fields except description are required" };
  }

  const isAdmin = profile?.role === "admin";
  const status = isAdmin ? "published" : "pending";

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      title, format, prize, start_date, scope, proposed_by,
      description: description || null,
      submitted_by_id: user.id,
      status,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (isAdmin && tournament) {
    await supabase.from("news").insert({
      title: `New tournament: ${title}`,
      body: `${format} · ${prize} · ${scope} scope · proposed by ${proposed_by}${description ? "\n\n" + description : ""}`,
      author_id: user.id,
      kind: "tournament",
      tournament_id: tournament.id,
    });
  }

  revalidatePath("/tournaments");
  revalidatePath("/news");
  return { success: true };
}

export async function approveTournament(tournamentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .update({ status: "published" })
    .eq("id", tournamentId)
    .select()
    .single();

  if (error || !tournament) return { error: error?.message || "Not found" };

  await supabase.from("news").insert({
    title: `New tournament: ${tournament.title}`,
    body: `${tournament.format} · ${tournament.prize} · ${tournament.scope} scope · proposed by ${tournament.proposed_by}${tournament.description ? "\n\n" + tournament.description : ""}`,
    author_id: user.id,
    kind: "tournament",
    tournament_id: tournament.id,
  });

  revalidatePath("/tournaments");
  revalidatePath("/news");
  return { success: true };
}

export async function rejectTournament(tournamentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  await supabase.from("tournaments").update({ status: "rejected" }).eq("id", tournamentId);
  revalidatePath("/tournaments");
  return { success: true };
}

export async function registerForTournament(tournamentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase.from("tournament_registrations").insert({
    tournament_id: tournamentId,
    user_id: user.id,
    display_name: profile.name,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already registered" };
    return { error: error.message };
  }

  revalidatePath("/tournaments");
  return { success: true };
}

export async function approveRegistration(regId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  await supabase.from("tournament_registrations").update({ status: "approved" }).eq("id", regId);
  revalidatePath("/tournaments");
  return { success: true };
}

export async function rejectRegistration(regId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  await supabase.from("tournament_registrations").update({ status: "rejected" }).eq("id", regId);
  revalidatePath("/tournaments");
  return { success: true };
}