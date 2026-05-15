import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CourtList } from "./court-list";

export default async function CourtPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: cases } = await supabase.from("court_cases").select("*").order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="container py-6">
        <CourtList initialCases={cases ?? []} isAdmin={profile?.role === "admin"} currentUserId={user!.id} currentUserName={profile?.name ?? ""} />
      </main>
    </>
  );
}
