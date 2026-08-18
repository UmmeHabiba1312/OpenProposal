"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [tone, setTone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getProfile()
      .then((p) => {
        if (p) {
          setTitle(p.title || "");
          setSkills(p.skills || "");
          setBio(p.bio || "");
          setPortfolioLinks(p.portfolio_links || "");
          setPlatform(p.default_platform || "Upwork");
          setTone(p.default_tone || "");
        }
      })
      .finally(() => setChecking(false));
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!bio.trim() || bio.trim().length < 10) {
      setError("Bio / proof points thoda aur likho — proposals isi se banti hain.");
      return;
    }
    setSaving(true);
    try {
      await api.saveProfile({
        title: title || undefined,
        skills: skills || undefined,
        bio,
        portfolio_links: portfolioLinks || undefined,
        default_platform: platform,
        default_tone: tone || undefined,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-paper/40 text-sm">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-display italic text-3xl mb-1">
          Tell OpenProposal about you
        </h1>
        <p className="text-paper/40 text-sm mb-8">
          Ek baar fill karo — har proposal isi profile se tailor hoga, dobara
          poochna nahi padega.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-paper/70 mb-2">Title / role</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-stack developer, RAG/AI engineer"
              className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
            />
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Next.js, FastAPI, LangChain, Pinecone"
              className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
            />
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">
              Bio / proof points <span className="text-seal">*</span>
            </label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Real past projects, results, or POCs — this is what proposals use as proof."
              className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">
              Portfolio / demo links <span className="text-paper/40">(optional, one per line)</span>
            </label>
            <textarea
              value={portfolioLinks}
              onChange={(e) => setPortfolioLinks(e.target.value)}
              rows={3}
              placeholder="https://github.com/you/project"
              className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-y"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-paper/70 mb-2">Default platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
              >
                <option>Upwork</option>
                <option>Fiverr</option>
                <option>Direct client</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-paper/70 mb-2">
                Default tone <span className="text-paper/40">(optional)</span>
              </label>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="confident, casual…"
                className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
              />
            </div>
          </div>

          {error && <p className="text-seal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-3.5 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save & start writing proposals"}
          </button>
        </form>
      </div>
    </main>
  );
}