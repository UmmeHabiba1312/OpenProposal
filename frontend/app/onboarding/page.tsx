"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../providers";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [proofStory, setProofStory] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [tone, setTone] = useState("");

  const [showMore, setShowMore] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
          setIsEditing(true);
          setTitle(p.title || "");
          setSkills(p.skills || "");
          setBio(p.bio || "");
          setPortfolioLinks(p.portfolio_links || "");
          setProofStory(p.proof_story || "");
          setHourlyRate(p.hourly_rate || "");
          setPlatform(p.default_platform || "Upwork");
          setTone(p.default_tone || "");
          // If they already filled in extras before, keep that section open
          if (p.proof_story || p.portfolio_links || p.hourly_rate) setShowMore(true);
        }
      })
      .finally(() => setChecking(false));
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!bio.trim() || bio.trim().length < 10) {
      setError("Add a bit more to your bio — this is what every proposal draws its proof from.");
      return;
    }
    setSaving(true);
    try {
      await api.saveProfile({
        title: title || undefined,
        skills: skills || undefined,
        bio,
        portfolio_links: portfolioLinks || undefined,
        proof_story: proofStory || undefined,
        hourly_rate: hourlyRate || undefined,
        default_platform: platform,
        default_tone: tone || undefined,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Couldn't save your profile. Try again.");
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display italic text-3xl">
            {isEditing ? "Edit your profile" : "Tell OpenProposal about you"}
          </h1>
          {isEditing && (
            <Link href="/" className="text-sm text-paper/40 hover:text-paper">
              ← Back to chat
            </Link>
          )}
        </div>
        <p className="text-paper/40 text-sm mb-8">
          Fill this in once — every proposal is tailored from it, so you never
          have to repeat yourself.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-paper/70 mb-2">
              Bio / proof points <span className="text-seal">*</span>
            </label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder='e.g. "Full-stack dev, 4 years. Built a RAG chatbot for a support team using LangChain + Pinecone, cut manual doc searches to near zero."'
              className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-y"
            />
            <p className="text-paper/30 text-xs mt-1.5">
              This is the single most important field — it's what turns a
              generic proposal into a proof-backed one.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-paper/70 mb-2">
                Title / role <span className="text-paper/40">(optional)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-stack developer"
                className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-paper/70 mb-2">
                Core skills <span className="text-paper/40">(optional)</span>
              </label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Next.js, FastAPI, LangChain"
                className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="text-sm text-moss hover:text-moss/80 font-mono"
          >
            {showMore ? "− Hide extra details" : "＋ Add more for sharper proposals"}
          </button>

          {showMore && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  A real project story{" "}
                  <span className="text-paper/40">(optional, but strong)</span>
                </label>
                <textarea
                  value={proofStory}
                  onChange={(e) => setProofStory(e.target.value)}
                  rows={3}
                  placeholder="What did you build, what broke, and how did you find and fix it? Concrete stories like this are the strongest proof a proposal can use."
                  className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Portfolio / demo links <span className="text-paper/40">(one per line)</span>
                </label>
                <textarea
                  value={portfolioLinks}
                  onChange={(e) => setPortfolioLinks(e.target.value)}
                  rows={2}
                  placeholder="https://github.com/you/project"
                  className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-y"
                />
                <p className="text-paper/30 text-xs mt-1.5">
                  A live demo or POC link carries more weight than any past
                  project description.
                </p>
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Typical rate <span className="text-paper/40">(optional)</span>
                </label>
                <input
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. $25-35/hr, or project-based"
                  className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40"
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
            </div>
          )}

          {error && <p className="text-seal text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-3.5 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Save & start writing proposals"}
          </button>
        </form>
      </div>
    </main>
  );
} 