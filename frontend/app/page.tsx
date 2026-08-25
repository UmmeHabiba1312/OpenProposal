"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";

type Conversation = { id: number; title: string; created_at: string };

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);


  useEffect(() => {
  if (!loading && !user) router.push("/login");
}, [loading, user, router]);

useEffect(() => {
  if (!user) return;
  api
    .getProfile()
    .then((p) => {
      if (!p || !p.bio) router.push("/onboarding");
    })
    .catch(() => router.push("/onboarding"));
}, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) refreshConversations();
  }, [user]);

  async function refreshConversations() {
    try {
      const data = await api.listConversations();
      setConversations(data);
    } catch {
      // silently ignore - sidebar just stays empty
    }
  }

  function handleConversationCreated(id: number) {
    setActiveId(id);
    refreshConversations();
  }

  async function handleDelete(id: number) {
    await api.deleteConversation(id);
    if (activeId === id) setActiveId(null);
    refreshConversations();
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-paper/40 text-sm">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={() => setActiveId(null)}
        onDelete={handleDelete}
        user={{ ...user, id: Number(user.id) }} 
        onLogout={logout}
      />
      <div className="flex-1 min-w-0">
        <ChatPanel
          key={activeId ?? "new"}
          conversationId={activeId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </main>
  );
}
