import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export default async function CourtCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user!.id).single();
  const { data: c } = await supabase.from("court_cases").select("*").eq("id", id).single();
  if (!c) notFound();
  const isLive = c.status === "live";
  const roomName = c.jitsi_room || `agcourt_${c.id.replace(/-/g, "")}`;
  const userName = profile?.name || "Member";
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName=%22${encodeURIComponent(userName)}%22&config.prejoinPageEnabled=false`;

  return (
    <>
      <Header />
      <main className="container py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/court" className="text-sm text-ag-umber hover:underline">
            ← Back to docket
          </Link>
          <span className="text-xs text-ag-mid">Case № {c.case_number}</span>
        </div>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-ag-deep">{c.title}</h2>
              {c.body && <p className="mt-2 text-sm text-ag-mid whitespace-pre-wrap">{c.body}</p>}
              <div className="mt-2 text-[11px] text-ag-mid">
                Filed by {c.filer_name} · {timeAgo(c.created_at)}
              </div>
            </div>

            {isLive ? (
              <>
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  <span className="mr-1 inline-block h-2 w-2 animate-pulse-live rounded-full bg-destructive align-middle" /> LIVE · CourtCall in session
                </div>
                <div className="overflow-hidden rounded-lg border border-ag-line bg-black">
                  <iframe
                    src={jitsiUrl}
                    className="h-[480px] w-full border-0"
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                </div>
                <div className="text-[11px] text-ag-mid">
                  Room: <code className="rounded bg-ag-parchment px-1.5 py-0.5">{roomName}</code> · everyone who joins this case enters the same room.
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-ag-line bg-ag-cream px-4 py-6 text-center text-sm text-ag-mid">
                {c.status === "requested" && "Waiting for admin to schedule this case."}
                {c.status === "scheduled" && "Scheduled. Waiting for admin to start the CourtCall."}
                {c.status === "closed" && "This case is closed. No further hearings."}
                <div className="mt-3">
                  <Link href="/court">
                    <Button variant="outline" size="sm">
                      Back to docket
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
