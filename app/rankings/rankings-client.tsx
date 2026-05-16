"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { addRanking, updateTitles, moveRanking, removeRanking } from "./actions";

type Ranking = {
  id: string;
  display_name: string;
  linked_user_id: string | null;
  titles: string[];
  rank_position: number;
  linked_user: { name: string; avatar_url: string | null } | null;
};

export function RankingsClient({
  isAdmin,
  rankings,
}: {
  isAdmin: boolean;
  rankings: Ranking[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onAdd(formData: FormData) {
    startTransition(async () => {
      const r = await addRanking(formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Fighter added");
        setShowAdd(false);
      }
    });
  }

  async function onMove(id: string, dir: "up" | "down") {
    startTransition(async () => {
      const r = await moveRanking(id, dir);
      if (r?.error) toast.error(r.error);
    });
  }

  async function onRemove(id: string) {
    if (!confirm("Remove this fighter from rankings?")) return;
    startTransition(async () => {
      const r = await removeRanking(id);
      if (r?.error) toast.error(r.error);
      else toast.success("Removed");
    });
  }

  function startEdit(r: Ranking) {
    setEditingId(r.id);
    setEditValue(r.titles.join(", "));
  }

  async function saveEdit(id: string) {
    startTransition(async () => {
      const r = await updateTitles(id, editValue);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Titles updated");
        setEditingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          <Button onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "outline" : "default"}>
            {showAdd ? "Cancel" : "+ Add fighter"}
          </Button>
        </div>
      )}

      {showAdd && isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <form action={onAdd} className="space-y-3">
              <div>
                <label className="text-xs text-ag-mid">Display name (used if no linked account)</label>
                <Input name="display_name" required />
              </div>
              <div>
                <label className="text-xs text-ag-mid">Link to user email (optional)</label>
                <Input name="linked_email" type="email" placeholder="If linked, account name & photo are used" />
              </div>
              <div>
                <label className="text-xs text-ag-mid">Titles (comma-separated)</label>
                <Input name="titles" placeholder="e.g. World Champion 2024, Title Holder" />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add to rankings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rankings.length === 0 ? (
        <p className="text-sm text-ag-mid">No rankings yet.</p>
      ) : (
        <div className="space-y-2">
          {rankings.map((r, idx) => {
            const displayName = r.linked_user?.name || r.display_name;
            const avatar = r.linked_user?.avatar_url;
            const isFirst = idx === 0;
            const isLast = idx === rankings.length - 1;

            return (
              <Card key={r.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-serif text-ag-deep w-10 text-center">
                      {r.rank_position}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-ag-parchment flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-ag-deep font-medium">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{displayName}</div>
                      {editingId === r.id ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Titles, comma-separated"
                            className="text-xs h-8"
                          />
                          <Button size="sm" onClick={() => saveEdit(r.id)} disabled={isPending}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="text-xs text-ag-mid mt-1">
                          {r.titles.length === 0 ? "No titles" : r.titles.join(" · ")}
                        </div>
                      )}
                    </div>
                    {isAdmin && editingId !== r.id && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => onMove(r.id, "up")} disabled={isFirst || isPending}>↑</Button>
                        <Button size="sm" variant="outline" onClick={() => onMove(r.id, "down")} disabled={isLast || isPending}>↓</Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit titles</Button>
                        <Button size="sm" variant="outline" onClick={() => onRemove(r.id)}>Remove</Button>
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
  );
}