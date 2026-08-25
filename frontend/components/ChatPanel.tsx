"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import Rulebook from "./Rulebook";
import Link from "next/link";
type Msg = { role: "user" | "assistant"; content: string };

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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    const isFirstMessage = !conversationId && messages.length === 0;

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
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-paper/10">
  <p className="text-paper/40 text-sm">
    {isEmpty
      ? "Paste a job description to get started"
      : "Ask for changes below, or start a new chat for a different job"}
  </p>
  <div className="flex items-center gap-4 shrink-0">
    <Link href="/onboarding" className="text-xs text-paper/40 hover:text-paper font-mono">
      Edit profile
    </Link>
    <button
      onClick={() => setShowRules(true)}
      className="text-xs text-gold/80 hover:text-gold font-mono"
    >
      Rules it follows
    </button>
  </div>
</header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isEmpty && !loading && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-sm">
              <p className="font-display italic text-2xl text-paper/70 mb-2">
                Paste. Send. Sealed.
              </p>
              <p className="text-paper/40 text-sm">
                It already knows how to open with their problem, prove instead
                of claim, and close with a question — no explaining required.
              </p>
              <button
                onClick={() => setShowSettings((s) => !s)}
                className="mt-4 text-xs text-moss hover:text-moss/80 font-mono"
              >
                {showSettings ? "Hide" : "＋ Add profile / platform / tone"}
              </button>

              {showSettings && (
                <div className="mt-4 space-y-3 text-left">
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
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-paper/10 px-4 py-3 text-[15px] whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[85%] paper-grain bg-paper text-ink rounded-lg rounded-tl-sm px-5 py-4 shadow-xl relative">
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full seal flex items-center justify-center">
                    <span className="text-paper text-[9px] font-mono">OP</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
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

      {error && <p className="text-seal text-sm px-6 pb-2">{error}</p>}

      <form onSubmit={handleSend} className="border-t border-paper/10 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isEmpty
                ? "Paste the client's job description…"
                : "Ask for a change — “make it shorter”, “more casual”…"
            }
            rows={isEmpty ? 4 : 1}
            className="flex-1 rounded-lg bg-paper/[0.06] border border-paper/15 px-4 py-3 text-[15px] placeholder:text-paper/30 focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-gold text-ink font-semibold px-5 hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
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
