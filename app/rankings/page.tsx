import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export default async function RankingsPage() {
  const supabase = await createClient();
  const { data: rankings } = await supabase
    .from("rankings")
    .select("*, linked_user:profiles!rankings_linked_user_id_fkey(name, avatar_url)")
    .order("rank_position", { ascending: true });

  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ag-deep">World rankings</h2>
            {!rankings?.length && <div className="py-10 text-center text-sm text-muted-foreground">No fighters ranked yet.</div>}
            <div className="divide-y divide-ag-line">
              {rankings?.map((r) => {
                const display = r.linked_user || { name: r.display_name, avatar_url: null as string | null };
                return (
                  <div key={r.id} className="grid grid-cols-[40px_44px_1fr] items-center gap-3 py-3">
                    <div className="text-center font-serif text-lg font-medium text-ag-umber">{r.rank_position}</div>
                    <Avatar className="h-10 w-10">
                      {display.avatar_url && <AvatarImage src={display.avatar_url} alt={display.name} />}
                      <AvatarFallback>{initials(display.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-ag-deep">{display.name}</div>
                      {r.titles?.length ? (
                        <div className="mt-1">
                          {r.titles.map((t: string) => (
                            <span key={t} className="title-pill">{t}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-ag-mute">No titles</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Admin can reorder ranks and edit titles via the admin panel. Names &amp; photos come from each user&rsquo;s profile and aren&rsquo;t editable here.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
