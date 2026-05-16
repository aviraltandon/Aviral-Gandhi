"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { scheduleElection, startElection, closeElection, castVote } from "./actions";

type Election = {
  id: string;
  name: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  ended_at: string | null;
};

type Party = {
  id: string;
  name: string;
  motto: string | null;
  logo_url: string | null;
};

type Tally = { party_id: string; count: number };

type Winner = {
  party_id: string;
  count: number;
  party_name: string;
};

export function ElectionsClient({
  isAdmin,
  isAuthed,
  activeElection,
  pastElections,
  parties,
  myVote,
  liveTally,
  winners,
}: {
  isAdmin: boolean;
  isAuthed: boolean;
  activeElection: Election | null;
  pastElections: Election[];
  parties: Party[];
  myVote: { party_id: string } | null;
  liveTally: Tally[];
  winners: Record<string, Winner>;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSchedule(formData: FormData) {
    startTransition(async () => {
      const r = await scheduleElection(formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Election scheduled");
        setShowSchedule(false);
      }
    });
  }

  async function onStart(id: string) {
    if (!confirm("Start this election? Voting opens immediately.")) return;
    startTransition(async () => {
      const r = await startElection(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Election is now open");
    });
  }

  async function onClose(id: string) {
    if (!confirm("Close this election? The winner will be revealed; loser counts stay sealed forever.")) return;
    startTransition(async () => {
      const r = await closeElection(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Election closed");
    });
  }

  async function onVote(electionId: string, partyId: string) {
    if (!confirm("Cast your vote? This cannot be changed.")) return;
    startTransition(async () => {
      const r = await castVote(electionId, partyId);
      if (r?.error) toast.error(r.error);
      else toast.success("Vote recorded");
    });
  }

  const tallyMap = new Map(liveTally.map((t) => [t.party_id, t.count]));
  const totalVotes = liveTally.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      {isAdmin && !activeElection && (
        <div>
          <Button onClick={() => setShowSchedule(!showSchedule)} variant={showSchedule ? "outline" : "default"}>
            {showSchedule ? "Cancel" : "+ Schedule election"}
          </Button>
        </div>
      )}

      {showSchedule && isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <form action={onSchedule} className="space-y-3">
              <div>
                <label className="text-xs text-ag-mid">Election name</label>
                <Input name="name" placeholder="e.g. General Election 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ag-mid">Scheduled start</label>
                  <Input name="scheduled_start" type="datetime-local" required />
                </div>
                <div>
                  <label className="text-xs text-ag-mid">Scheduled end</label>
                  <Input name="scheduled_end" type="datetime-local" required />
                </div>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeElection && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start gap-3 mb-4">
              <div>
                <div className="font-serif text-base font-medium text-ag-deep">{activeElection.name}</div>
                <div className="text-xs text-ag-mid mt-1">
                  Status: <span className="font-medium">{activeElection.status}</span>
                  {activeElection.scheduled_start && (
                    <> · Scheduled {format(new Date(activeElection.scheduled_start), "PPp")}
                    {activeElection.scheduled_end && <> – {format(new Date(activeElection.scheduled_end), "PPp")}</>}</>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  {activeElection.status === "scheduled" && (
                    <Button size="sm" onClick={() => onStart(activeElection.id)} disabled={isPending}>Start (go live)</Button>
                  )}
                  {activeElection.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => onClose(activeElection.id)} disabled={isPending}>Close election</Button>
                  )}
                </div>
              )}
            </div>

            {activeElection.status === "scheduled" && (
              <p className="text-sm text-ag-mid">Voting hasn't started yet. {isAdmin ? "Click Start when ready." : "Wait for admin to open voting."}</p>
            )}

            {activeElection.status === "open" && (
              <div className="space-y-3">
                {parties.length === 0 ? (
                  <p className="text-sm text-ag-mid">No approved parties available to vote for.</p>
                ) : isAuthed && myVote ? (
                  <p className="text-sm text-green-700">Your vote has been recorded. Results will be shown when voting closes.</p>
                ) : !isAuthed ? (
                  <p className="text-sm text-ag-mid">Sign in to vote.</p>
                ) : (
                  <>
                    <p className="text-xs text-ag-mid">Pick one party. You can only vote once.</p>
                    {parties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded border">
                        <div className="flex items-center gap-3 flex-1">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-ag-parchment flex items-center justify-center text-ag-deep font-medium">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{p.name}</div>
                            {p.motto && <div className="text-xs text-ag-mid italic">"{p.motto}"</div>}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => onVote(activeElection.id, p.id)} disabled={isPending}>
                          Vote
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {isAdmin && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs font-medium text-ag-deep mb-2">Live tally (admin only) — {totalVotes} total votes</div>
                    {parties.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm py-1">
                        <span>{p.name}</span>
                        <span className="font-medium">{tallyMap.get(p.id) || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!activeElection && !isAdmin && (
        <p className="text-sm text-ag-mid">No active election right now.</p>
      )}

      {pastElections.length > 0 && (
        <div>
          <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Past elections</h3>
          <div className="space-y-3">
            {pastElections.map((e) => {
              const winner = winners[e.id];
              return (
                <Card key={e.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-ag-mid">
                          {e.ended_at && <>Closed {format(new Date(e.ended_at), "PPp")}</>}
                        </div>
                      </div>
                      <div className="text-right">
                        {winner ? (
                          <>
                            <div className="text-xs text-ag-mid">Winner</div>
                            <div className="font-medium text-ag-deep">{winner.party_name}</div>
                            <div className="text-xs text-ag-mid">{winner.count} vote{winner.count === 1 ? "" : "s"}</div>
                          </>
                        ) : (
                          <div className="text-xs text-ag-mid">No votes cast</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}