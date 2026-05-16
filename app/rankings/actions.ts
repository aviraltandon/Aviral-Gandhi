"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admin only", supabase: null };
  return { error: null, supabase };
}

export async function addRanking(formData: FormData) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const display_name = String(formData.get("display_name") || "").trim();
  const linked_email = String(formData.get("linked_email") || "").trim();
  const titles = String(formData.get("titles") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!display_name) return { error: "Display name is required" };

  let linked_user_id: string | null = null;
  let finalDisplayName = display_name;

  if (linked_email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("email", linked_email.toLowerCase())
      .single();
    if (!profile) return { error: "No user found with that email" };
    linked_user_id = profile.id;
    finalDisplayName = profile.name;
  }

  const { data: existing } = await supabase
    .from("rankings")
    .select("rank_position")
    .order("rank_position", { ascending: false })
    .limit(1)
    .single();

  const nextPos = (existing?.rank_position || 0) + 1;

  const { error } = await supabase.from("rankings").insert({
    display_name: finalDisplayName,
    linked_user_id,
    titles,
    rank_position: nextPos,
  });

  if (error) return { error: error.message };

  revalidatePath("/rankings");
  return { success: true };
}

export async function updateTitles(rankingId: string, titlesCsv: string) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const titles = titlesCsv.split(",").map((t) => t.trim()).filter(Boolean);

  const { error } = await supabase.from("rankings").update({ titles }).eq("id", rankingId);
  if (error) return { error: error.message };

  revalidatePath("/rankings");
  return { success: true };
}

export async function moveRanking(rankingId: string, direction: "up" | "down") {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const { data: current } = await supabase
    .from("rankings")
    .select("id, rank_position")
    .eq("id", rankingId)
    .single();

  if (!current) return { error: "Not found" };

  const targetPos = direction === "up" ? current.rank_position - 1 : current.rank_position + 1;

  const { data: swap } = await supabase
    .from("rankings")
    .select("id, rank_position")
    .eq("rank_position", targetPos)
    .single();

  if (!swap) return { error: "Already at edge" };

  // Use a temp position to avoid unique constraint conflict
  await supabase.from("rankings").update({ rank_position: -1 }).eq("id", current.id);
  await supabase.from("rankings").update({ rank_position: current.rank_position }).eq("id", swap.id);
  await supabase.from("rankings").update({ rank_position: targetPos }).eq("id", current.id);

  revalidatePath("/rankings");
  return { success: true };
}

export async function removeRanking(rankingId: string) {
  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) return { error: authError };

  const { data: removed } = await supabase
    .from("rankings")
    .select("rank_position")
    .eq("id", rankingId)
    .single();

  if (!removed) return { error: "Not found" };

  await supabase.from("rankings").delete().eq("id", rankingId);

  // Shift everyone below up by one
  const { data: below } = await supabase
    .from("rankings")
    .select("id, rank_position")
    .gt("rank_position", removed.rank_position)
    .order("rank_position", { ascending: true });

  if (below) {
    for (const r of below) {
      await supabase.from("rankings").update({ rank_position: r.rank_position - 1 }).eq("id", r.id);
    }
  }

  revalidatePath("/rankings");
  return { success: true };
}