"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  createParty,
  approveParty,
  rejectParty,
  deleteParty,
  requestJoin,
  approveJoin,
  rejectJoin,
  leaveParty,
} from "./actions";

type Party = {
  id: string;
  name: string;
  motto: string | null;
  logo_url: string | null;
  founder_id: string | null;
  founder_name: string;
  status: string;
};

type Member = {
  party_id: string;
  user_id: string;
  status: string;
  profiles:
    | { name: string; avatar_url: string | null }
    | { name: string; avatar_url: string | null }[]
    | null;
};

export function PartiesClient({
  isAdmin,
  currentUserId,
  approvedParties,
  pendingParties,
  members,
  electionOpen,
}: {
  isAdmin: boolean;
  currentUserId: string | null;
  approvedParties: Party[];
  pendingParties: Party[];
  members: Member[];
  electionOpen: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function membersOf(partyId: string, status?: string) {
    return members.filter((m) => m.party_id === partyId && (!status || m.status === status));
  }

  function myStatusIn(partyId: string): string | null {
    if (!currentUserId) return null;
    const m = members.find((mm) => mm.party_id === partyId && mm.user_id === currentUserId);
    return m?.status || null;
  }

  async function onCreate(formData: FormData) {
    startTransition(async () => {
      const r = await createParty(formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Party submitted for admin review");
        setShowForm(false);
      }
    });
  }

  async function onApproveParty(id: string) {
    startTransition(async () => {
      const r = await approveParty(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Party approved");
    });
  }

  async function onRejectParty(id: string) {
    startTransition(async () => {
      const r = await rejectParty(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Rejected");
    });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this party? This cannot be undone.")) return;
    startTransition(async () => {
      const r = await deleteParty(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Party deleted");
    });
  }

  async function onJoin(id: string) {
    startTransition(async () => {
      const r = await requestJoin(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Join request sent");
    });
  }

  async function onApproveMember(partyId: string, userId: string) {
    startTransition(async () => {
      const r = await approveJoin(partyId, userId);
      if (r?.error) toast.error(r.error);
      else toast.success("Member approved");
    });
  }

  async function onRejectMember(partyId: string, userId: string) {
    startTransition(async () => {
      const r = await rejectJoin(partyId, userId);
      if (r?.error) toast.error(r.error);
      else toast.success("Request rejected");
    });
  }

  async function onLeave(id: string) {
    if (!confirm("Leave this party?")) return;
    startTransition(async () => {
      const r = await leaveParty(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Left the party");
    });
  }

  return (
    <div className="space-y-6">
      {currentUserId && !electionOpen && (
        <div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
            {showForm ? "Cancel" : "+ Create party"}
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form action={onCreate} className="space-y-3">
              <div>
                <label className="text-xs text-ag-mid">Party name</label>
                <Input name="name" required maxLength={50} />
              </div>
              <div>
                <label className="text-xs text-ag-mid">Motto (optional)</label>
                <Input name="motto" maxLength={120} />
              </div>
              <div>
                <label className="text-xs text-ag-mid">Logo URL (optional)</label>
                <Input name="logo_url" type="url" placeholder="https://..." />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Send for admin review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin && pendingParties.length > 0 && (
        <div>
          <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Pending parties ({pendingParties.length})</h3>
          <div className="space-y-3">
            {pendingParties.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      {p.motto && <div className="text-xs text-ag-mid italic mt-1">"{p.motto}"</div>}
                      <div className="text-xs text-ag-mid mt-1">Founder: {p.founder_name}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApproveParty(p.id)} disabled={isPending}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => onRejectParty(p.id)} disabled={isPending}>Reject</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-base font-medium text-ag-deep mb-3">Active parties ({approvedParties.length})</h3>
        {approvedParties.length === 0 ? (
          <p className="text-sm text-ag-mid">No parties yet.</p>
        ) : (
          <div className="space-y-4">
            {approvedParties.map((p) => {
              const isFounder = p.founder_id === currentUserId;
              const myStatus = myStatusIn(p.id);
              const approvedMembers = membersOf(p.id, "approved");
              const pendingMembers = isFounder ? membersOf(p.id, "requested") : [];

              return (
                <Card key={p.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-ag-parchment flex items-center justify-center text-ag-deep font-medium">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{p.name}</div>
                          {p.motto && <div className="text-xs text-ag-mid italic">"{p.motto}"</div>}
                          <div className="text-xs text-ag-mid">
                            Founder: {p.founder_name} · {approvedMembers.length} member{approvedMembers.length === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!currentUserId || electionOpen ? null : isFounder ? (
                          <Button size="sm" variant="outline" onClick={() => onDelete(p.id)} disabled={isPending}>Delete party</Button>
                        ) : myStatus === "approved" ? (
                          <Button size="sm" variant="outline" onClick={() => onLeave(p.id)} disabled={isPending}>Leave</Button>
                        ) : myStatus === "requested" ? (
                          <span className="text-xs text-ag-mid self-center">Pending</span>
                        ) : (
                          <Button size="sm" onClick={() => onJoin(p.id)} disabled={isPending}>Request to join</Button>
                        )}
                      </div>
                    </div>

                    {approvedMembers.length > 0 && (
                      <div className="text-xs text-ag-mid">
                       Members: {approvedMembers.map((m) => (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)?.name || "—").join(", ")}
                      </div>
                    )}

                    {isFounder && pendingMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-medium text-ag-deep mb-2">Pending join requests ({pendingMembers.length})</div>
                        <div className="space-y-2">
                          {pendingMembers.map((m) => (
                            <div key={m.user_id} className="flex justify-between items-center text-sm">
                              <span>{(Array.isArray(m.profiles) ? m.profiles[0] : m.profiles)?.name || "—"}</span>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => onApproveMember(p.id, m.user_id)} disabled={isPending}>Approve</Button>
                                <Button size="sm" variant="outline" onClick={() => onRejectMember(p.id, m.user_id)} disabled={isPending}>Reject</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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