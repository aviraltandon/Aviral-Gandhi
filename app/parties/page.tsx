import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PartiesClient } from "./parties-client";

export default async function PartiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  const { data: approvedParties } = await supabase
    .from("parties")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const { data: pendingParties } = isAdmin
    ? await supabase
        .from("parties")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: allMembers } = await supabase
    .from("party_members")
    .select("party_id, user_id, status, profiles(name, avatar_url)");

  const { data: openElection } = await supabase
    .from("elections")
    .select("id")
    .eq("status", "open")
    .limit(1)
    .single();

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep mb-2">Parties</h2>
            <p className="text-sm text-ag-mid mb-6">
              {openElection
                ? "An election is open — party changes are locked until it closes."
                : "Create a party, propose a motto, recruit members. Founders approve who joins. Admin reviews new parties."}
            </p>
            <PartiesClient
              isAdmin={isAdmin}
              currentUserId={user?.id || null}
              approvedParties={approvedParties || []}
              pendingParties={pendingParties || []}
              members={allMembers || []}
              electionOpen={!!openElection}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}