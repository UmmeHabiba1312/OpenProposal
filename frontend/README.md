# OpenProposal — frontend

Next.js 14 (App Router) + Tailwind. Sign up or log in, then land in a
Claude-style layout: a sidebar with **New chat** + your past proposal chats,
and a chat panel where pasting a job description immediately gets you a
proposal — no explaining the rules required.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local if your backend isn't on localhost:8000
```

## Run

```bash
npm run dev
```

Visit `http://localhost:3000`. Make sure the backend is running first
(see `../backend/README.md`).

## Structure

- `app/login`, `app/signup` — auth pages
- `app/providers.tsx` — auth context (token storage, login/signup/logout)
- `app/page.tsx` — protected home page: sidebar + chat panel
- `components/Sidebar.tsx` — New chat button + conversation history
- `components/ChatPanel.tsx` — the chat thread; first message generates,
  every message after that refines
- `components/Rulebook.tsx` — the do's/don'ts panel (opens from "Rules it
  follows" in the chat header)
- `lib/api.ts` — typed fetch client, attaches the JWT to every request
- `tailwind.config.ts` — design tokens (colors, fonts)

Auth token is stored in `localStorage`. A logged-out visitor hitting `/` is
redirected to `/login`.
