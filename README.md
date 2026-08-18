# OpenProposal

An agent that already knows how to write a winning freelance proposal — so
you never have to re-explain the do's and don'ts every time you use it.

**Flow:** log in or sign up → land in a Claude-style chat layout → paste a
job description → the agent writes the proposal immediately, following its
built-in rulebook, without you prompting it on how → keep chatting to refine
("make it shorter") → every proposal is saved in the sidebar under **New
chat** / past chats, just like a real chat app.

- **Backend:** Python, FastAPI, OpenAI Agents SDK, SQLite (via SQLAlchemy)
  for accounts + chat history, JWT auth. The agent's rulebook lives
  permanently in `backend/app/agent.py`.
- **Frontend:** Next.js + Tailwind — auth pages, a sidebar with conversation
  history, and a chat panel where the first message generates and every
  message after that refines.

## Quick start

**1. Backend**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (new terminal)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`, sign up, paste a job post, and watch it write
the proposal — no extra instructions needed. Use the sidebar's **+ New chat**
to start on a different job, or click any past chat to reopen and refine it.

## How it stays "already trained"

The rules — open with the client's problem, prove don't claim, keep it
scannable, close with a question, never sound templated — live once, in the
agent's system instructions (`backend/app/agent.py`). Every request inherits
them automatically. To teach it a new rule permanently, edit that file; you
never need to put instructions in the UI itself.

## What each request sends

- `job_description` (required) — the client's post
- `freelancer_profile` (optional) — your bio/skills/past results, used for
  honest proof points
- `platform` — Upwork / Fiverr / Direct client
- `tone` (optional) — e.g. "confident and direct"

The `/api/refine` endpoint lets you iterate ("make it shorter", "more
casual") without losing the underlying rules.
