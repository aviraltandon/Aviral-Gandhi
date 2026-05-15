import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { AdminUsers } from "./admin-users";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/news");
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-2 font-serif text-lg font-medium text-ag-deep">Admin panel</h2>
            <p className="mb-4 text-sm text-ag-mid">Promote or demote members. You can&rsquo;t demote yourself.</p>
            <AdminUsers initialUsers={users ?? []} currentUserId={user!.id} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
