import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

export default function ElectionsPage() {
  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep">Elections</h2>
            <p className="mt-2 text-sm text-ag-mid">
              Admin schedules and starts/stops voting. Members see hidden tallies during open voting; only the winner&rsquo;s count is revealed on close.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Query the <code>election_results_public</code> view in <code>002_rls.sql</code> — it returns null vote_count for losing parties unless the user is admin.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
