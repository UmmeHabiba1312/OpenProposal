# OpenProposal — backend

FastAPI + OpenAI Agents SDK. One agent, `OpenProposal`, with the entire
proposal rulebook (do's and don'ts) baked permanently into its instructions
in `app/agent.py` — you never re-explain the rules in a prompt again.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and add your OPENROUTER_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs live at `http://localhost:8000/docs`.

## Endpoints

Auth:
- `POST /api/auth/signup` — `{ "email", "password", "name"? }` → token + user
- `POST /api/auth/login` — `{ "email", "password" }` → token + user
- `GET /api/auth/me` — current user (requires `Authorization: Bearer <token>`)

Conversations (all require `Authorization: Bearer <token>`):
- `GET /api/conversations` — list your past proposal chats
- `GET /api/conversations/{id}` — full message history for one chat
- `DELETE /api/conversations/{id}` — delete a chat

Proposals (all require `Authorization: Bearer <token>`):
- `POST /api/generate` — start a new chat and get the first proposal
  ```json
  {
    "job_description": "...",
    "freelancer_profile": "optional",
    "platform": "Upwork",
    "tone": "optional",
    "conversation_id": null
  }
  ```
- `POST /api/refine` — ask for a change within an existing chat
  ```json
  {
    "conversation_id": 1,
    "feedback": "make it shorter"
  }
  ```

Auth uses JWTs (30-day expiry) signed with `JWT_SECRET`. User accounts and
chat history are stored in SQLite by default (`DATABASE_URL` in `.env`).

## Changing the rules

Everything the agent "knows" lives in `PROPOSAL_RULEBOOK` inside
`app/agent.py`. Edit that string to add, remove, or tighten any rule — every
future generation picks it up automatically.
