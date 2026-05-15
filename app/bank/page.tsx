import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function BankPage() {
  return (
    <>
      <Header />
      <main className="container py-6">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Landmark className="mx-auto mb-3 h-8 w-8 text-ag-umber" />
            <h2 className="font-serif text-xl font-medium text-ag-deep">AG Bank</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-ag-mid">Private banking. Accounts, transfers, statements.</p>
            <a
              href="https://ag-bank-five.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-md bg-ag-umber px-6 py-2 text-sm font-medium text-ag-parchment hover:bg-ag-umberDark"
            >
              Open AG Bank ↗
            </a>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
