"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { initials, timeAgo } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function AdminUsers({ initialUsers, currentUserId }: { initialUsers: Profile[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);

  async function setRole(id: string, role: "member" | "admin") {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) return toast.error(error.message);
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success(`Role updated to ${role}.`);
  }

  return (
    <div className="divide-y divide-ag-line">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar>
              {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.name} />}
              <AvatarFallback>{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-ag-deep">
                {u.name}
                {u.role === "admin" && (
                  <span className="ml-2 inline-block rounded bg-ag-umber px-1.5 py-0.5 text-[9px] tracking-wider text-ag-parchment">ADMIN</span>
                )}
              </div>
              <div className="text-[11px] text-ag-mid">{u.email} · joined {timeAgo(u.created_at)}</div>
            </div>
          </div>
          {u.id === currentUserId ? (
            <span className="text-[11px] text-ag-mid">you</span>
          ) : u.role === "admin" ? (
            <Button size="sm" variant="outline" onClick={() => setRole(u.id, "member")}>Demote</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setRole(u.id, "admin")}>Promote</Button>
          )}
        </div>
      ))}
    </div>
  );
}
