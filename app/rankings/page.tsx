import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { RankingsClient } from "./rankings-client";

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  const { data: rankings } = await supabase
    .from("rankings")
    .select("*, linked_user:linked_user_id(name, avatar_url)")
    .order("rank_position", { ascending: true });

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep mb-2">World rankings</h2>
            <p className="text-sm text-ag-mid mb-6">
              {isAdmin
                ? "Add fighters, reorder by rank, and edit titles. Name and photo come from linked user accounts when available."
                : "The official AG world rankings."}
            </p>
            <RankingsClient isAdmin={isAdmin} rankings={rankings || []} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}