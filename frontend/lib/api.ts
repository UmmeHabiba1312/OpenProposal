import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await authClient.token();
  return data?.token ? { Authorization: `Bearer ${data.token}` } : {};
}

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {

  getProfile: async () =>
  fetch(`${API_URL}/api/profile`, { headers: await authHeaders() }).then(handle),

saveProfile: async (payload: {
  name: string;
  title?: string;
  skills?: string;
  bio: string;
  portfolio_links?: string;
  proof_story?: string;
  hourly_rate?: string;
  availability?: string;
  default_platform?: string;
  default_tone?: string;
}) =>
  fetch(`${API_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  }).then(handle),
  
  listConversations: async () =>
    fetch(`${API_URL}/api/conversations`, { headers: await authHeaders() }).then(handle),

  getConversation: async (id: number) =>
    fetch(`${API_URL}/api/conversations/${id}`, { headers: await authHeaders() }).then(handle),

  deleteConversation: async (id: number) =>
    fetch(`${API_URL}/api/conversations/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    }).then(handle),

    updateConversation: async (id: number, payload: { title?: string; pinned?: boolean }) =>
  fetch(`${API_URL}/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  }).then(handle),
  
  generate: async (payload: any) =>
    fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    }).then(handle),

  refine: async (payload: any) =>
    fetch(`${API_URL}/api/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    }).then(handle),
};