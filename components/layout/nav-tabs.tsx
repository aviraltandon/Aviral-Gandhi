"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/news", label: "News" },
  { href: "/rankings", label: "World rankings" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/parties", label: "Parties" },
  { href: "/elections", label: "Elections" },
  { href: "/court", label: "Court" },
  { href: "/bank", label: "Bank" },
];

export function NavTabs({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, { href: "/admin", label: "Admin" }] : TABS;
  return (
    <nav className="container -mt-1 flex gap-1 overflow-x-auto pb-3">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-full border border-ag-line px-3.5 py-1.5 text-sm transition-colors whitespace-nowrap",
              active ? "bg-ag-umber text-ag-parchment border-ag-umber" : "text-ag-mid hover:bg-ag-parchment hover:text-ag-deep"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
