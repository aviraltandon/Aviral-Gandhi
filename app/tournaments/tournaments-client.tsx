"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  proposeTournament,
  approveTournament,
  rejectTournament,
  registerForTournament,
  approveRegistration,
  rejectRegistration,
} from "./actions";

type Tournament = {
  id: string;
  title: string;
  format: string;
  prize: string;
  start_date: string;
  scope: string;
  proposed_by: string;
  description: string | null;
  status: string;
};

type Registration = {
  tournament_id: string;
  status: string;
};

type PendingReg = {
  id: string;
  tournament_id: string;
  display_name: string;
  status: string;
  created_at: string;
  tournaments: { title: string } | null;
};

export function TournamentsClient({
  isAdmin,
  isAuthed,
  published,
  pending,
  myRegistrations,
  pendingRegs,
}: {
  isAdmin: boolean;
  isAuthed: boolean;
  published: Tournament[];
  pending: Tournament[];
  myRegistrations: Registration[];
  pendingRegs: PendingReg[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const myRegMap = new Map(myRegistrations.map((r) => [r.tournament_id, r.status]));

  async function onPropose(formData: FormData) {
    startTransition(async () => {
      const result = await proposeTournament(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(isAdmin ? "Tournament published" : "Proposal sent to admin");
        setShowForm(false);
      }
    });
  }

  async function onApprove(id: string) {
    startTransition(async () => {
      const r = await approveTournament(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Published");
    });
  }

  async function onReject(id: string) {
    startTransition(async () => {
      const r = await rejectTournament(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Rejected");
    });
  }

  async function onRegister(id: string) {
    startTransition(async () => {
      const r = await registerForTournament(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Registration submitted");
    });
  }

  async function onApproveReg(id: string) {
    startTransition(async () => {
      const r = await approveRegistration(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Registration approved");
    });
  }

  async function onRejectReg(id: string) {
    startTransition(async () => {
      const r = await rejectRegistration(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Registration rejected");
    });
  }

  return (
    <div className="space-y-6">
      {isAuthed && (
        <div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
            {showForm ? "Cancel" : isAdmin ? "+ Create tournament" : "+ Propose tournament"}
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form action={onPropose} className="space-y-3">
              <div>
                <label className="text-xs text-ag-mid">Title</label>
                <Input name="title" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ag-mid">Format</label>
                  <Input name="format" placeholder="e.g. Single elim, BO3" required />
                </div>
                <div>
                  <label className="text-xs text-ag-mid">Prize</label>
                  <Input name="prize" placeholder="e.g. AG 5000 + trophy" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ag-mid">Start date</label>
                  <Input name="start_date" type="datetime-local" required />
                </div>
                <div>
                  <label className="text-xs text-ag-mid">Scope</label>
                  <select name="scope" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required>
                    <option value="local">Local</option>
                    <option value="title">Title</option>
                    <option value="world">World rank</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-ag-mid">Proposed by</label>
                <Input name="proposed_by" placeholder="Any name" required />
              </div>
              <div>
                <label className="text-xs text-ag-mid">Description (optional)</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : isAdmin ? "Create & publish" : "Send proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin && pending.length > 0 && (
        <div>
          <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Pending proposals ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-ag-mid mt-1">
                        {t.format} · {t.prize} · {t.scope} · {format(new Date(t.start_date), "PPp")}
                      </div>
                      <div className="text-xs text-ag-mid mt-1">Proposed by: {t.proposed_by}</div>
                      {t.description && <div className="text-sm mt-2">{t.description}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApprove(t.id)} disabled={isPending}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(t.id)} disabled={isPending}>Reject</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isAdmin && pendingRegs.length > 0 && (
        <div>
          <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Pending registrations ({pendingRegs.length})</h3>
          <div className="space-y-2">
            {pendingRegs.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-center gap-3">
                    <div className="text-sm">
                      <span className="font-medium">{r.display_name}</span>
                      <span className="text-ag-mid"> wants to join </span>
                      <span className="font-medium">{r.tournaments?.title || "tournament"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApproveReg(r.id)} disabled={isPending}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onRejectReg(r.id)} disabled={isPending}>Reject</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Published ({published.length})</h3>
        {published.length === 0 ? (
          <p className="text-sm text-ag-mid">No tournaments yet.</p>
        ) : (
          <div className="space-y-3">
            {published.map((t) => {
              const regStatus = myRegMap.get(t.id);
              return (
                <Card key={t.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-ag-mid mt-1">
                          {t.format} · {t.prize} · {t.scope} · {format(new Date(t.start_date), "PPp")}
                        </div>
                        <div className="text-xs text-ag-mid mt-1">Proposed by: {t.proposed_by}</div>
                        {t.description && <div className="text-sm mt-2">{t.description}</div>}
                      </div>
                      {isAuthed && !isAdmin && (
                        <div>
                          {regStatus === "approved" ? (
                            <span className="text-xs text-green-700 font-medium">Approved ✓</span>
                          ) : regStatus === "pending" ? (
                            <span className="text-xs text-ag-mid">Pending approval</span>
                          ) : regStatus === "rejected" ? (
                            <span className="text-xs text-red-700">Rejected</span>
                          ) : (
                            <Button size="sm" onClick={() => onRegister(t.id)} disabled={isPending}>Register</Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}