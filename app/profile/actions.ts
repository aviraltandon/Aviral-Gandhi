"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileName(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name cannot be empty" };
  if (name.length > 80) return { error: "Name too long (max 80 chars)" };

  const { error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file uploaded" };

  // Basic validation
  if (file.size > 2 * 1024 * 1024) return { error: "File must be under 2MB" };
  if (!file.type.startsWith("image/")) return { error: "Must be an image" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { success: true, url: publicUrl.publicUrl };
}