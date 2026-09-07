"use client";

type Conversation = { id: number; title: string; created_at: string };
type UserT = { id: number; email: string; name?: string | null } | null;

function initials(nameOrEmail: string) {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return chars.toUpperCase();
}

function groupByRecency(conversations: Conversation[]) {
  const now = new Date();
  const today: Conversation[] = [];
  const week: Conversation[] = [];
  const older: Conversation[] = [];

  for (const c of conversations) {
    const d = new Date(c.created_at);
    const diffDays = (now.getTime() - d.getTime()) / 86400000;
    if (diffDays < 1) today.push(c);
    else if (diffDays < 7) week.push(c);
    else older.push(c);
  }
  return { today, week, older };
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  user,
  onLogout,
}: {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  user: UserT;
  onLogout: () => void;
}) {
  const { today, week, older } = groupByRecency(conversations);

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

        <ConversationGroup label="Today" items={today} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <ConversationGroup label="This week" items={week} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <ConversationGroup label="Older" items={older} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
      </div>

      <div className="p-3 border-t border-paper/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-seal/90 border border-moss/30 flex items-center justify-center text-moss text-xs font-medium shrink-0">
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
    </aside>
  );
}

function ConversationGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string;
  items: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-paper/25 text-[11px] px-3 py-1.5">{label}</p>
      <div className="space-y-0.5">
        {items.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${
              activeId === c.id ? "bg-paper/10 text-paper" : "text-paper/55 hover:bg-paper/5 hover:text-paper/80"
            }`}
          >
            <span className="flex-1 truncate">{c.title || "New proposal"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              aria-label="Delete conversation"
              className="opacity-0 group-hover:opacity-100 text-paper/30 hover:text-seal transition-all shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}