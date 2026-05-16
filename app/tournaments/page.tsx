import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { TournamentsClient } from "./tournaments-client";

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  const { data: published } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: true });

  const { data: pending } = isAdmin
    ? await supabase
        .from("tournaments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: myRegistrations } = user
    ? await supabase
        .from("tournament_registrations")
        .select("tournament_id, status")
        .eq("user_id", user.id)
    : { data: [] };

  const { data: pendingRegs } = isAdmin
    ? await supabase
        .from("tournament_registrations")
        .select("id, tournament_id, display_name, status, created_at, tournaments(title)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep mb-2">Tournaments</h2>
            <p className="text-sm text-ag-mid mb-6">
              {isAdmin
                ? "Create new tournaments or approve member proposals. Published tournaments auto-post to News."
                : "Browse upcoming tournaments and register, or propose your own (admin reviews member proposals)."}
            </p>
            <TournamentsClient
              isAdmin={isAdmin}
              isAuthed={!!user}
              published={published || []}
              pending={pending || []}
              myRegistrations={myRegistrations || []}
              pendingRegs={pendingRegs || []}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}