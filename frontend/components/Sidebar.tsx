"use client";

type Conversation = { id: number; title: string; created_at: string };
type UserT = { id: number; email: string; name?: string | null } | null;

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
  return (
    <aside className="w-72 shrink-0 border-r border-paper/10 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-paper/10">
        <h1 className="font-display italic text-xl mb-3">
          Open<span className="text-gold not-italic">Proposal</span>
        </h1>
        <button
          onClick={onNewChat}
          className="w-full rounded-lg border border-gold/50 text-gold text-sm py-2.5 hover:bg-gold/10 transition-colors"
        >
          + New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-paper/30 text-xs px-3 py-4">
            No proposals yet — paste a job post to start.
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${
              activeId === c.id
                ? "bg-paper/10 text-paper"
                : "text-paper/60 hover:bg-paper/5"
            }`}
          >
            <span className="flex-1 truncate">{c.title || "New proposal"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-paper/30 hover:text-seal text-xs shrink-0"
              aria-label="Delete conversation"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-paper/10 flex items-center justify-between gap-2">
        <span className="text-xs text-paper/40 truncate">
          {user?.name || user?.email}
        </span>
        <button
          onClick={onLogout}
          className="text-xs text-paper/40 hover:text-seal shrink-0"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
