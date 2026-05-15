import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

export default function PartiesPage() {
  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-serif text-lg font-medium text-ag-deep">Parties</h2>
            <p className="mt-2 text-sm text-ag-mid">
              Any member can create a party (status: pending → admin approves). Founder approves join requests. Locked when election is open.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Implement in <code>app/parties/parties-client.tsx</code>: party creation form with logo upload to <code>party-logos</code> bucket, join-request flow, admin approval list.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
