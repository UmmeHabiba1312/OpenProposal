"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Rulebook from "./Rulebook";

type Msg = { role: "user" | "assistant"; content: string };

function CopyButton({ text, className = "", dark = false }: { text: string; className?: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] transition-opacity ${
        dark ? "text-ink/40 hover:text-ink/70" : "text-paper/40 hover:text-paper/70"
      } ${className}`}
    >
      {copied ? (
        "Copied ✓"
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function ChatPanel({
  conversationId,
  onConversationCreated,
}: {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [profile, setProfile] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [tone, setTone] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversationId) {
      api
        .getConversation(conversationId)
        .then((data) =>
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })))
        )
        .catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [input]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    const isFirstMessage = !conversationId && messages.length === 0;

    if (isFirstMessage && text.length < 10) {
      setError("Paste the full job description — a bit more detail helps it write a sharper proposal.");
      return;
    }

    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      if (isFirstMessage) {
        const data = await api.generate({
          job_description: text,
          freelancer_profile: profile || undefined,
          platform,
          tone: tone || undefined,
        });
        setMessages((m) => [...m, { role: "assistant", content: data.proposal }]);
        onConversationCreated(data.conversation_id);
      } else if (conversationId) {
        const data = await api.refine({ conversation_id: conversationId, feedback: text });
        setMessages((m) => [...m, { role: "assistant", content: data.proposal }]);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen ink-field">
      <header className="flex items-center justify-between px-6 py-4 border-b border-paper/10">
        <p className="text-paper/40 text-sm">
          {isEmpty
            ? "Paste a job description to get started"
            : "Ask for changes below, or start a new chat for a different job"}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 text-xs text-paper/45 hover:text-paper hover:bg-paper/5 px-3 py-1.5 rounded-md transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Edit profile
          </Link>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 text-xs text-gold/85 hover:text-gold hover:bg-gold/5 px-3 py-1.5 rounded-md transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
            Rules it follows
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isEmpty && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full seal-lg animate-float mb-6 flex items-center justify-center">
              <span className="text-paper text-xs font-mono tracking-wide">OP</span>
            </div>

            <p className="font-display italic text-2xl text-paper/80 mb-2">
              Paste. Send. Sealed.
            </p>
            <p className="text-paper/40 text-sm max-w-sm leading-relaxed">
              It already knows how to open with their problem, prove instead
              of claim, and close with a question — no explaining required.
            </p>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="mt-5 text-xs text-moss hover:text-moss/80 font-mono flex items-center gap-1"
            >
              <span className="transition-transform" style={{ transform: showSettings ? "rotate(45deg)" : "none" }}>+</span>
              Add profile / platform / tone
            </button>

            {showSettings && (
              <div className="mt-5 space-y-3 text-left w-full max-w-sm">
                <textarea
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  placeholder="Your profile / proof points (optional)"
                  rows={3}
                  className="w-full rounded-lg bg-paper/[0.06] border border-paper/15 px-3 py-2.5 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-none"
                />
                <div className="flex gap-2">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="flex-1 rounded-lg bg-paper/[0.06] border border-paper/15 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/70"
                  >
                    <option>Upwork</option>
                    <option>Fiverr</option>
                    <option>Direct client</option>
                  </select>
                  <input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Tone (optional)"
                    className="flex-1 rounded-lg bg-paper/[0.06] border border-paper/15 px-3 py-2.5 text-sm placeholder:text-paper/30 focus:outline-none focus:border-gold/70"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-9">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="group relative max-w-[80%] rounded-2xl rounded-tr-sm bg-paper/10 px-4 py-3 text-[15px] whitespace-pre-wrap">
                  {m.content}
                  <CopyButton text={m.content} className="absolute -bottom-6 right-0" />
                </div>
              ) : (
                <div className="group relative max-w-[85%] paper-grain bg-paper text-ink rounded-lg rounded-tl-sm px-5 py-4 shadow-xl">
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full seal flex items-center justify-center">
                    <span className="text-paper text-[9px] font-mono">OP</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                  <CopyButton text={m.content} className="absolute -bottom-6 left-0" dark />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 text-paper/40 text-sm px-1">
                <span className="w-2 h-2 rounded-full seal animate-pulse" />
                {isEmpty ? "Reading the brief, writing the pitch…" : "Revising…"}
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-seal text-sm px-6 pb-2 max-w-2xl mx-auto w-full">{error}</p>
      )}

      <form onSubmit={handleSend} className="border-t border-paper/10 p-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isEmpty
                ? "Paste the client's job description…"
                : "Ask for a change — “make it shorter”, “more casual”…"
            }
            rows={1}
            className="flex-1 rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-[15px] placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-none max-h-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="rounded-lg bg-gold text-ink w-11 h-11 flex items-center justify-center shrink-0 hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>

      {showRules && (
        <div
          className="fixed inset-0 bg-ink/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-ink border border-paper/15 rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-display italic text-lg">The rulebook</p>
              <button
                onClick={() => setShowRules(false)}
                className="text-paper/40 hover:text-paper text-sm"
              >
                ✕
              </button>
            </div>
            <Rulebook />
          </div>
        </div>
      )}
    </div>
  );
}