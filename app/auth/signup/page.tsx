"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-ag-line bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-ag-umber font-serif text-xl tracking-wider text-ag-parchment">
            AG
          </div>
          <h2 className="font-serif text-xl font-medium text-ag-deep">Check your email</h2>
          <p className="mt-2 text-sm text-ag-mid">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link href="/auth/login" className="mt-5 inline-block text-sm font-medium text-ag-umber underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-ag-line bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-ag-umber font-serif text-xl tracking-wider text-ag-parchment">
            AG
          </div>
          <h1 className="font-serif text-2xl font-medium text-ag-deep">Create an account</h1>
          <div className="memorial mt-1">Aviral &amp; Gandhi</div>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs text-ag-mid">Full name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ag-mid">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ag-mid">Password</label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Send verification email"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ag-mid">
          Have an account?{" "}
          <Link href="/auth/login" className="font-medium text-ag-umber underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
