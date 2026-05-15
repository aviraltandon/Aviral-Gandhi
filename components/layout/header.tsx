import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { NavTabs } from "./nav-tabs";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <header className="border-b border-ag-line bg-ag-parchment">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/news" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ag-umber font-serif text-lg font-medium tracking-wider text-ag-parchment">
            AG
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ag-umber">AG × Pen Fights</div>
            <h1 className="font-serif text-xl font-medium text-ag-deep">Aviral &amp; Gandhi</h1>
            <div className="memorial">In memory of VG</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 hover:border-ag-line hover:bg-card">
            <Avatar className="h-9 w-9">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
              <AvatarFallback>{initials(profile?.name || "?")}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-medium text-ag-deep">
                {profile?.name}
                {profile?.role === "admin" && (
                  <span className="ml-1 inline-block rounded bg-ag-umber px-1.5 py-0.5 text-[9px] tracking-wider text-ag-parchment">ADMIN</span>
                )}
              </div>
              <div className="text-[11px] text-ag-mid">{profile?.email}</div>
            </div>
          </Link>
          <LogoutButton />
        </div>
      </div>
      <NavTabs isAdmin={profile?.role === "admin"} />
    </header>
  );
}
