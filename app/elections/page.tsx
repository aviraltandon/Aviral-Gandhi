import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ElectionsClient } from "./elections-client";

export default async function ElectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  const { data: activeElection } = await supabase
    .from("elections")
    .select("*")
    .in("status", ["scheduled", "open"])
    .limit(1)
    .single();

  const { data: pastElections } = await supabase
    .from("elections")
    .select("*")
    .eq("status", "closed")
    .order("ended_at", { ascending: false })
    .limit(10);

  const { data: parties } = await supabase
    .from("parties")
    .select("id, name, motto, logo_url")
    .eq("status", "approved")
    .order("name", { ascending: true });

  let myVote = null;
  if (user && activeElection) {
    const { data } = await supabase
      .from("votes")
      .select("party_id")
      .eq("election_id", activeElection.id)
      .eq("voter_id", user.id)
      .single();
    myVote = data;
  }

  // Admin sees live tally; everyone else sees nothing until close
  let liveTally: { party_id: string; count: number }[] = [];
  if (isAdmin && activeElection?.status === "open") {
    const { data: voteRows } = await supabase
      .from("votes")
      .select("party_id")
      .eq("election_id", activeElection.id);

    if (voteRows) {
      const counts = new Map<string, number>();
      for (const v of voteRows) {
        counts.set(v.party_id, (counts.get(v.party_id) || 0) + 1);
      }
      liveTally = Array.from(counts.entries()).map(([party_id, count]) => ({ party_id, count }));
    }
  }

  // For closed elections, fetch winner only (not all party counts)
  const winners: Record<string, { party_id: string; count: number; party_name: string }> = {};
  if (pastElections) {
    for (const e of pastElections) {
      const { data: voteRows } = await supabase
        .from("votes")
        .select("party_id")
        .eq("election_id", e.id);

      if (voteRows && voteRows.length > 0) {
        const counts = new Map<string, number>();
        for (const v of voteRows) {
          counts.set(v.party_id, (counts.get(v.party_id) || 0) + 1);
        }
        const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        const [winnerPartyId, winnerCount] = entries[0];
        const { data: winnerParty } = await supabase
          .from("parties")
          .select("name")
          .eq("id", winnerPartyId)
          .single();
        winners[e.id] = {
          party_id: winnerPartyId,
          count: winnerCount,
          party_name: winnerParty?.name || "Unknown",
        };
      }
    }
  }

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep mb-2">Elections</h2>
            <p className="text-sm text-ag-mid mb-6">
              {isAdmin
                ? "Schedule, start, and close elections. Only the winner's vote count is revealed when an election closes."
                : "Vote for your party during an open election. Only the winner is announced when voting closes."}
            </p>
            <ElectionsClient
              isAdmin={isAdmin}
              isAuthed={!!user}
              activeElection={activeElection}
              pastElections={pastElections || []}
              parties={parties || []}
              myVote={myVote}
              liveTally={liveTally}
              winners={winners}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}