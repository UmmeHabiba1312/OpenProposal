# OpenProposal

**An agent that already knows how to write a winning freelance proposal —
so you never have to re-explain the rules every time you use it.**

Most people write proposals by copy-pasting a job description into a
chatbot and then spending ten minutes re-explaining what "good" looks
like: *open with their problem, don't sound generic, keep it short, close
with a question.* OpenProposal skips that step entirely — the rules live
permanently inside the agent's own instructions, not in your prompt.

```
Paste. Send. Sealed.
```

---

## How it works

1. **Sign up** (Better Auth) and fill in a short, one-time profile —
   your name, skills, a real proof story, portfolio links.
2. **Paste a job description.** The agent reads it, follows a 15-rule
   playbook, and writes a proposal in seconds — no prompting required.
3. **Keep chatting to refine it** — "make it shorter," "more casual" —
   without losing any of the underlying rules.
4. Every proposal is saved in the sidebar, Claude-style: **New chat**,
   pin, rename, or delete past conversations any time.
5. **Bring your own API key** — OpenAI, Anthropic, Gemini, OpenRouter,
   DeepSeek, or any OpenAI-compatible endpoint. Nothing runs on a shared
   key; every generation uses the credentials you set in Settings.

---

## What makes a proposal "good" here

The agent's playbook (`backend/app/rulebook.md`) is the actual product —
everything else is just the delivery mechanism. It was built and refined
through repeated head-to-head testing against unprompted LLM output on
real job posts, not written once and left alone. Some of what it enforces:

- Open with the client's specific problem, never a generic bio line
- Prove capability with relevant, technically accurate detail — never
  invent a specialization, project, or credential that wasn't in the
  freelancer's actual profile, even when the profile is empty or
  placeholder text
- Match the proposal's tone, format, and length to the job's actual
  complexity, instead of using one template for everything
- Acknowledge a stated budget explicitly, and commit to the full scope
  requested rather than quietly shrinking it
- Close with one specific, insightful question — never "let's discuss"

To change a rule permanently, edit `rulebook.md`. Every future generation
picks it up automatically — nothing else in the codebase needs to change.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python, FastAPI, OpenAI Agents SDK |
| Auth | Better Auth (Next.js), JWT verified via JWKS on the backend |
| Database | Neon (serverless Postgres), SQLAlchemy ORM |
| AI | Bring-your-own-key — OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, or custom, encrypted at rest with Fernet |
| Frontend | Next.js (App Router), Tailwind |

---

## Quick start

### 1. Database

Create a free [Neon](https://neon.tech) Postgres project and grab its
connection string — you'll use the same one for both the frontend
(Better Auth's tables) and the backend (conversations, profiles).

### 2. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```

Fill in `.env`:

```
DATABASE_URL=postgresql://user:pass@ep-xxxx.neon.tech/openproposal?sslmode=require
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Generate with:
# python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=
```

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@ep-xxxx.neon.tech/openproposal?sslmode=require
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

Run Better Auth's migration once, against the same database:

```bash
npx @better-auth/cli migrate
```

```bash
npm run dev
```

### 4. First run

Open `http://localhost:3000`, sign up, complete the short profile wizard,
then go to **Settings** and add your own API key (any of the supported
providers) before generating your first proposal.

---

## Project structure

```
backend/
  app/
    main.py          # all API routes
    agent.py          # builds the OpenProposal agent per-request (BYOK)
    rulebook.md        # the actual proposal-writing playbook
    rulebook.py         # loads rulebook.md at runtime
    providers.py         # supported LLM providers + their base URLs
    crypto.py             # encrypts/decrypts stored API keys
    auth.py                 # verifies Better Auth JWTs via JWKS
    db_models.py              # Conversation, Message, Profile
    schemas.py                  # Pydantic request/response models
    database.py                   # SQLAlchemy engine/session

frontend/
  app/
    login/, signup/    # auth pages
    onboarding/          # multi-step profile wizard
    settings/              # BYOK provider/key/model settings
    page.tsx                 # protected home: sidebar + chat
    providers.tsx               # Better Auth session context
  components/
    Sidebar.tsx          # pinned/today/week/older, rename, pin, delete
    ChatPanel.tsx           # the chat thread, generate + refine
    Rulebook.tsx               # the do's/don'ts panel shown in-app
  lib/
    api.ts                       # typed fetch client
    auth-client.ts                 # Better Auth client + JWT plugin
```

---

## API reference

All endpoints except auth require `Authorization: Bearer <token>` (a JWT
issued by Better Auth on the frontend).

**Profile**
- `GET /api/profile` — current user's profile
- `PUT /api/profile` — create/update it

**BYOK settings**
- `GET /api/providers` — supported providers, for rendering the dropdown
- `GET /api/settings` — current provider/model (never returns the key)
- `PUT /api/settings` — save provider, API key, model, optional base URL
- `DELETE /api/settings` — clear stored credentials

**Conversations**
- `GET /api/conversations` — list, pinned first
- `GET /api/conversations/{id}` — full message history
- `PATCH /api/conversations/{id}` — rename and/or pin/unpin
- `DELETE /api/conversations/{id}`

**Proposals**
- `POST /api/generate` — start a new chat (or add to an existing one) and
  get the first proposal, using the caller's profile and BYOK credentials
- `POST /api/refine` — apply a requested change within an existing chat

---

## Design notes

- **BYOK by default.** There is no shared server-side API key — every
  generation runs on the credentials the user set in Settings, encrypted
  at rest. This keeps the product free to run and puts cost control in
  each user's own hands.
- **The rulebook is data, not code.** It lives in a plain Markdown file
  so it can be read, reviewed, and edited without touching Python.
- **Never fabricate.** The strictest rule in the playbook: the agent must
  never invent a specialization, credential, or project that wasn't in
  the user's actual profile — including when the profile is empty or
  filled with placeholder text. This was added after testing surfaced the
  agent inventing plausible-sounding experience from the job post itself.