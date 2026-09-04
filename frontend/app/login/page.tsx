"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message || "Login failed.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display italic text-4xl mb-1 text-center">
          Open<span className="text-gold not-italic">Proposal</span>
        </h1>
        <p className="text-paper/40 text-sm text-center mb-8">Welcome back</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && <p className="text-seal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-3 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-paper/40 text-sm text-center mt-6">
          No account?{" "}
          <Link href="/signup" className="text-gold hover:text-gold/80">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}