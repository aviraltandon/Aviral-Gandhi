"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { timeAgo, cn } from "@/lib/utils";
import type { CourtCase } from "@/types/database";

export function CourtList({
  initialCases,
  isAdmin,
  currentUserId,
  currentUserName,
}: {
  initialCases: CourtCase[];
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
}) {
  const [cases, setCases] = useState(initialCases);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // Real-time updates so members see "LIVE" the moment admin clicks Go Live
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("court_cases_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "court_cases" }, (payload) => {
        setCases((prev) => {
          if (payload.eventType === "INSERT") return [payload.new as CourtCase, ...prev];
          if (payload.eventType === "UPDATE") return prev.map((c) => (c.id === (payload.new as CourtCase).id ? (payload.new as CourtCase) : c));
          if (payload.eventType === "DELETE") return prev.filter((c) => c.id !== (payload.old as CourtCase).id);
          return prev;
        });
      })
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, []);

  async function fileCase(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("court_cases").insert({
      title: title.trim(),
      body: body.trim() || null,
      filer_id: currentUserId,
      filer_name: currentUserName,
      status: "requested",
    });
    if (error) return toast.error(error.message);
    toast.success("Case filed. Admin will review it.");
    setTitle("");
    setBody("");
  }

  async function setStatus(id: string, status: CourtCase["status"]) {
    const supabase = createClient();
    const patch: Partial<CourtCase> = { status };
    if (status === "scheduled") patch.scheduled_at = new Date().toISOString();
    if (status === "closed") patch.closed_at = new Date().toISOString();
    const { error } = await supabase.from("court_cases").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "live") toast.success("CourtCall is live. Anyone can choose to join.");
    if (status === "scheduled") toast.success("Live session ended.");
    if (status === "closed") toast.success("Case closed.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="font-serif text-lg font-medium text-ag-deep">Request a court case</h2>
          <p className="text-xs text-ag-mid">Anyone can file. Admin schedules and starts the CourtCall when ready.</p>
          <form onSubmit={fileCase} className="space-y-2">
            <Input placeholder="Case title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea
              placeholder="Describe the matter..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-card p-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex justify-end">
              <Button type="submit">Submit request</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {cases.length === 0 && (
          <div className="rounded-lg border border-ag-line bg-card py-10 text-center text-sm text-muted-foreground">
            No cases on the docket yet.
          </div>
        )}
        {cases.map((c) => (
          <Card key={c.id} className={cn("border-l-[3px]", c.status === "live" ? "border-l-destructive bg-destructive/5" : "border-l-ag-umber")}>
            <CardContent className="pt-5 pb-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-ag-umber">Case № {c.case_number}</div>
              <div className="mt-1 font-medium text-ag-deep">{c.title}</div>
              {c.body && <div className="mt-1 text-sm text-ag-mid whitespace-pre-wrap">{c.body}</div>}
              <div className="mt-2 text-[11px] text-ag-mid">
                Filed by {c.filer_name} · {timeAgo(c.created_at)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={c.status} />
                {c.status === "live" && (
                  <Link href={`/court/${c.id}`}>
                    <Button variant="live" size="sm">
                      Join CourtCall
                    </Button>
                  </Link>
                )}
                {isAdmin && c.status === "requested" && (
                  <>
                    <Button size="sm" onClick={() => setStatus(c.id, "scheduled")}>
                      Schedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "closed")}>
                      Close without hearing
                    </Button>
                  </>
                )}
                {isAdmin && c.status === "scheduled" && (
                  <>
                    <Button size="sm" variant="live" onClick={() => setStatus(c.id, "live")}>
                      Start CourtCall (Go live)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "closed")}>
                      Close
                    </Button>
                  </>
                )}
                {isAdmin && c.status === "live" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "scheduled")}>
                      End live session
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "closed")}>
                      Close case
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: CourtCase["status"] }) {
  const styles: Record<CourtCase["status"], string> = {
    requested: "bg-ag-amberLight text-ag-amber",
    scheduled: "bg-blue-100 text-blue-800",
    live: "bg-destructive/15 text-destructive font-medium",
    closed: "bg-muted text-muted-foreground",
  };
  const labels: Record<CourtCase["status"], string> = {
    requested: "Requested",
    scheduled: "Scheduled",
    live: "● LIVE NOW",
    closed: "Closed",
  };
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px]", styles[status])}>{labels[status]}</span>;
}
