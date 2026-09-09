"use client";

import { useState } from "react";
import Link from "next/link";

type Conversation = { id: number; title: string; pinned: boolean; created_at: string };
type UserT = { id: string; email: string; name?: string | null } | null;

function initials(nameOrEmail: string) {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return chars.toUpperCase();
}

function groupByRecency(conversations: Conversation[]) {
  const now = new Date();
  const pinned: Conversation[] = [];
  const today: Conversation[] = [];
  const week: Conversation[] = [];
  const older: Conversation[] = [];

  for (const c of conversations) {
    if (c.pinned) {
      pinned.push(c);
      continue;
    }
    const d = new Date(c.created_at);
    const diffDays = (now.getTime() - d.getTime()) / 86400000;
    if (diffDays < 1) today.push(c);
    else if (diffDays < 7) week.push(c);
    else older.push(c);
  }
  return { pinned, today, week, older };
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onTogglePin,
  user,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
  onTogglePin: (id: number, pinned: boolean) => void;
  user: UserT;
  onLogout: () => void;
}) {
  const { pinned, today, week, older } = groupByRecency(conversations);

  return (
    <aside className="w-72 shrink-0 border-r border-paper/10 flex flex-col h-screen sticky top-0 bg-ink">
      <div className="p-4">
        <h1 className="font-display italic text-xl mb-4 px-1">
          Open<span className="text-gold not-italic">Proposal</span>
        </h1>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm py-2.5 hover:bg-gold/15 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 && (
          <p className="text-paper/30 text-xs px-3 py-4 leading-relaxed">
            No proposals yet — paste a job post to start.
          </p>
        )}

        <ConversationGroup label="Pinned" items={pinned} activeId={activeId} onSelect={onSelect} onDelete={onDelete} onRename={onRename} onTogglePin={onTogglePin} />
        <ConversationGroup label="Today" items={today} activeId={activeId} onSelect={onSelect} onDelete={onDelete} onRename={onRename} onTogglePin={onTogglePin} />
        <ConversationGroup label="This week" items={week} activeId={activeId} onSelect={onSelect} onDelete={onDelete} onRename={onRename} onTogglePin={onTogglePin} />
        <ConversationGroup label="Older" items={older} activeId={activeId} onSelect={onSelect} onDelete={onDelete} onRename={onRename} onTogglePin={onTogglePin} />
      </div>

      <div className="p-3 border-t border-paper/10 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs text-paper/40 hover:text-paper px-1 py-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          API Settings
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-moss/20 border border-moss/30 flex items-center justify-center text-moss text-xs font-medium shrink-0">
            {initials(user?.name || user?.email || "?")}
          </div>
          <span className="flex-1 text-sm text-paper/60 truncate">
            {user?.name || user?.email}
          </span>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="text-paper/30 hover:text-seal transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function ConversationGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
}: {
  label: string;
  items: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
  onTogglePin: (id: number, pinned: boolean) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  if (items.length === 0) return null;

  function startRename(c: Conversation) {
    setEditingId(c.id);
    setDraft(c.title);
    setOpenMenuId(null);
  }

  function commitRename(id: number) {
    const trimmed = draft.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  return (
    <div className="mt-3 first:mt-0">
      <p className="text-paper/25 text-[11px] px-3 py-1.5">{label}</p>
      <div className="space-y-0.5">
        {items.map((c) => (
          <div
            key={c.id}
            onClick={() => editingId !== c.id && onSelect(c.id)}
            className={`group relative flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${
              activeId === c.id ? "bg-paper/10 text-paper" : "text-paper/55 hover:bg-paper/5 hover:text-paper/80"
            }`}
          >
            {editingId === c.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(c.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => commitRename(c.id)}
                className="flex-1 bg-paper/10 rounded px-1.5 py-0.5 text-sm outline-none border border-gold/50"
              />
            ) : (
              <span className="flex-1 truncate">{c.title || "New proposal"}</span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === c.id ? null : c.id);
              }}
              aria-label="More options"
              className="opacity-0 group-hover:opacity-100 text-paper/30 hover:text-paper transition-all shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>

            {openMenuId === c.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-9 z-20 bg-ink border border-paper/15 rounded-lg shadow-xl py-1 w-36"
              >
                <button
                  onClick={() => startRename(c)}
                  className="w-full text-left px-3 py-1.5 text-xs text-paper/70 hover:bg-paper/5"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    onTogglePin(c.id, !c.pinned);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-paper/70 hover:bg-paper/5"
                >
                  {c.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => {
                    onDelete(c.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-seal hover:bg-seal/10"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}