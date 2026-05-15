import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

export default function TournamentsPage() {
  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep">Tournaments</h2>
            <p className="mt-2 text-sm text-ag-mid">
              Members request tournaments; admin reviews and publishes. Published tournaments auto-post to news with a Register link.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              See <code>app/tournaments/tournaments-client.tsx</code> — implement the form (title, format, prize, start date, scope, proposed_by free text, description), the list with status pills, and the registration modal. The schema and RLS are already in place in <code>supabase/migrations/001_schema.sql</code> and <code>002_rls.sql</code>.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
