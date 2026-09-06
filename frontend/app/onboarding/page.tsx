"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../providers";
import { api } from "@/lib/api";
import SkillsInput from "@/components/SkillsInput";

const STEPS = ["About you", "Proof of work", "How you work", "Review"];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [proofStory, setProofStory] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [tone, setTone] = useState("");

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
        }
      })
      .finally(() => setChecking(false));
  }, [user]);

  function validateStep(s: number): string {
    if (s === 1 && bio.trim().length < 10) {
      return "Add a bit more to your bio — this is what every proposal draws its proof from.";
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const err = validateStep(1);
    if (err) {
      setError(err);
      setStep(1);
      return;
    }
    setSaving(true);
    setError("");
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

  const inputClass =
    "w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display italic text-3xl">
            {isEditing ? "Edit your profile" : "Tell OpenProposal about you"}
          </h1>
          {isEditing && (
            <Link href="/" className="text-sm text-paper/40 hover:text-paper shrink-0">
              ← Back to chat
            </Link>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-gold" : "bg-paper/10"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={i === step ? "text-gold" : "text-paper/30"}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Step 0 — About you */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Title / role <span className="text-paper/40">(optional)</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full-stack developer, RAG/AI engineer"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Core skills <span className="text-paper/40">(optional)</span>
                </label>
                <SkillsInput value={skills} onChange={setSkills} />
                <p className="text-paper/30 text-xs mt-1.5">
                  These help proposals match the client's exact technical
                  language instead of sounding generic.
                </p>
              </div>
            </div>
          )}

          {/* Step 1 — Proof of work */}
          {step === 1 && (
            <div className="space-y-4">
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
                  className={`${inputClass} resize-y`}
                />
                <p className="text-paper/30 text-xs mt-1.5">
                  The single most important field — this is what turns a
                  generic proposal into a proof-backed one.
                </p>
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  A real project story{" "}
                  <span className="text-paper/40">(optional, but strong)</span>
                </label>
                <textarea
                  value={proofStory}
                  onChange={(e) => setProofStory(e.target.value)}
                  rows={3}
                  placeholder="What did you build, what broke, and how did you find and fix it?"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Portfolio / demo links{" "}
                  <span className="text-paper/40">(one per line)</span>
                </label>
                <textarea
                  value={portfolioLinks}
                  onChange={(e) => setPortfolioLinks(e.target.value)}
                  rows={2}
                  placeholder="https://github.com/you/project"
                  className={`${inputClass} resize-y`}
                />
                <p className="text-paper/30 text-xs mt-1.5">
                  A live demo or POC link carries more weight than any past
                  project description.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 — How you work */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-paper/70 mb-2">
                    Default platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={inputClass}
                  >
                    <option>Upwork</option>
                    <option>Fiverr</option>
                    <option>Direct client</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-paper/70 mb-2">
                    Typical rate <span className="text-paper/40">(optional)</span>
                  </label>
                  <input
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="$25-35/hr, or project-based"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-paper/70 mb-2">
                  Default tone <span className="text-paper/40">(optional)</span>
                </label>
                <input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="confident, casual…"
                  className={inputClass}
                />
                <p className="text-paper/30 text-xs mt-1.5">
                  Leave blank to let the agent match tone to each job
                  automatically.
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-paper/40 text-sm">
                This is what the agent will use for every proposal. Looks
                good?
              </p>

              <ReviewRow label="Title" value={title} onEdit={() => setStep(0)} />
              <ReviewRow
                label="Skills"
                value={skills}
                onEdit={() => setStep(0)}
              />
              <ReviewRow label="Bio" value={bio} onEdit={() => setStep(1)} multiline />
              <ReviewRow
                label="Project story"
                value={proofStory}
                onEdit={() => setStep(1)}
                multiline
              />
              <ReviewRow
                label="Portfolio links"
                value={portfolioLinks}
                onEdit={() => setStep(1)}
                multiline
              />
              <ReviewRow
                label="Platform / rate"
                value={[platform, hourlyRate].filter(Boolean).join(" · ")}
                onEdit={() => setStep(2)}
              />
              <ReviewRow label="Tone" value={tone} onEdit={() => setStep(2)} />
            </div>
          )}

          {error && <p className="text-seal text-sm">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-paper/15 text-paper/70 px-5 py-3 text-sm hover:bg-paper/5 transition-colors"
              >
                Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 rounded-lg bg-gold text-ink font-semibold py-3 text-sm hover:bg-gold/90 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-gold text-ink font-semibold py-3 text-sm hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : isEditing ? "Save changes" : "Save & start writing proposals"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  multiline = false,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-paper/10 px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-paper/40 uppercase tracking-wide">{label}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-gold hover:text-gold/80"
        >
          Edit
        </button>
      </div>
      <p
        className={`text-sm text-paper/85 ${
          multiline ? "whitespace-pre-wrap" : "truncate"
        }`}
      >
        {value || <span className="text-paper/25 italic">Not set</span>}
      </p>
    </div>
  );
}