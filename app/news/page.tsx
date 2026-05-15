import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { NewsClient } from "./news-client";

export default async function NewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role,name").eq("id", user!.id).single();
  const { data: news } = await supabase
    .from("news")
    .select("*, author:profiles!news_author_id_fkey(name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <Header />
      <main className="container py-6">
        <NewsClient initialNews={news ?? []} isAdmin={profile?.role === "admin"} currentUserId={user!.id} />
      </main>
    </>
  );
}
