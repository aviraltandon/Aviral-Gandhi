"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { timeAgo, initials, cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

type NewsItem = {
  id: string; title: string; body: string | null; created_at: string;
  kind: "general" | "tournament"; tournament_id: string | null;
  author?: { name: string; avatar_url: string | null } | null;
};

export function NewsClient({
  initialNews, isAdmin, currentUserId,
}: { initialNews: NewsItem[]; isAdmin: boolean; currentUserId: string }) {
  const [news, setNews] = useState(initialNews);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("news")
      .insert({ title: title.trim(), body: body.trim() || null, author_id: currentUserId, kind: "general" })
      .select("*, author:profiles!news_author_id_fkey(name, avatar_url)")
      .single();
    setLoading(false);
    if (error) return toast.error(error.message);
    setNews([data as NewsItem, ...news]);
    setTitle(""); setBody("");
    toast.success("Published.");
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNews(news.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep">Publish to the Daily Gleaner</h2>
            <form onSubmit={publish} className="space-y-2">
              <Input placeholder="Headline..." value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea
                placeholder="Body (optional)" value={body} onChange={(e) => setBody(e.target.value)}
                className="min-h-[80px] w-full rounded-md border border-input bg-card p-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {news.length === 0 && (
          <div className="rounded-lg border border-ag-line bg-card py-10 text-center text-sm text-muted-foreground">
            No headlines yet.
          </div>
        )}
        {news.map((n) => (
          <Card key={n.id} className={cn(n.kind === "tournament" && "border-l-[3px] border-l-ag-amber")}>
            <CardContent className="pt-5 pb-4">
              {n.kind === "tournament" && (
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ag-amber">
                  <Trophy className="h-3 w-3" /> Tournament announcement
                </div>
              )}
              <div className="font-medium text-ag-deep">{n.title}</div>
              {n.body && <div className="mt-1 text-sm text-ag-mid whitespace-pre-wrap">{n.body}</div>}
              {n.tournament_id && (
                <div className="mt-2">
                  <Link href={`/tournaments/${n.tournament_id}`}>
                    <Button size="sm" variant="outline">Register</Button>
                  </Link>
                </div>
              )}
              <div className="mt-2 flex items-center gap-2 text-[11px] text-ag-umber">
                <Avatar className="h-5 w-5">
                  {n.author?.avatar_url && <AvatarImage src={n.author.avatar_url} alt={n.author.name} />}
                  <AvatarFallback className="text-[8px]">{initials(n.author?.name || "?")}</AvatarFallback>
                </Avatar>
                <span>{n.author?.name || "Unknown"} · {timeAgo(n.created_at)}</span>
                {isAdmin && (
                  <button onClick={() => remove(n.id)} className="ml-auto text-destructive hover:underline">delete</button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
