"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(email, password, name || undefined);
      // Signup success hotay hi router.push aur refresh triggers hongay
      router.push("/"); // Ya jo bhi aapka route hai, e.g., "/dashboard"
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display italic text-4xl mb-1 text-center">
          Open<span className="text-gold not-italic">Proposal</span>
        </h1>
        <p className="text-paper/40 text-sm text-center mb-8">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />

          {error && <p className="text-seal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-3 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-paper/40 text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:text-gold/80">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}