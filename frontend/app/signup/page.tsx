"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import PasswordInput from "@/components/PasswordInput";
import { getPasswordChecks, getPasswordStrength } from "@/lib/password";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);
  const meetsMinimum = checks[0].passed; // at least 8 characters — the only hard requirement

 async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setTouched(true);
  setError("");

  if (!meetsMinimum) {
    setError("Password must be at least 8 characters.");
    return;
  }

  setLoading(true);
  const { error } = await authClient.signUp.email({
    email,
    password,
    name: name.trim() || email.split("@")[0], // fallback to email prefix if name left blank
  });

  if (error) {
    setError(error.message || "Signup failed.");
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
        <p className="text-paper/40 text-sm text-center mb-8">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
          />

          <div>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                setTouched(true);
              }}
              placeholder="Password"
              autoComplete="new-password"
            />

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength.score ? strength.color : "bg-paper/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-paper/40 mt-1">{strength.label}</p>
              </div>
            )}

            {/* Requirements checklist */}
            {touched && (
              <ul className="mt-2 space-y-1">
                {checks.map((c) => (
                  <li
                    key={c.label}
                    className={`text-xs flex items-center gap-1.5 ${
                      c.passed ? "text-moss" : "text-paper/35"
                    }`}
                  >
                    <span>{c.passed ? "✓" : "○"}</span>
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

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