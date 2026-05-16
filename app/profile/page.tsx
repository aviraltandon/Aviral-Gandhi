import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep mb-2">Your profile</h2>
            <p className="text-sm text-ag-mid mb-6">Update your name and profile picture. Other people see this across AG.</p>
            <ProfileClient profile={profile} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}