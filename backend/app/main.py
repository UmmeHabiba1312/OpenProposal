# import os
# from dotenv import load_dotenv

# load_dotenv()

# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# from agents import Runner

# from app.agent import build_proposal_agent
# from app.database import Base, engine, get_db
# from app.db_models import Conversation, Message
# from app.auth import get_current_user, CurrentUser
# from app.schemas import (
#     GenerateRequest,
#     RefineRequest,
#     ProposalResponse,
#     ConversationSummary,
#     ConversationDetail,
# )

# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="OpenProposal API", version="3.0.0")

# origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
# app.add_middleware(
#     CORSMiddleware, allow_origins=origins, allow_credentials=True,
#     allow_methods=["*"], allow_headers=["*"],
# )

# proposal_agent = build_proposal_agent()


# @app.get("/api/health")
# async def health():
#     return {"status": "ok"}


# @app.get("/api/conversations", response_model=list[ConversationSummary])
# def list_conversations(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
#     return (
#         db.query(Conversation)
#         .filter(Conversation.user_id == user.id)
#         .order_by(Conversation.created_at.desc())
#         .all()
#     )


# @app.get("/api/conversations/{conversation_id}", response_model=ConversationDetail)
# def get_conversation(conversation_id: int, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
#     conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
#     if not conv:
#         raise HTTPException(404, "Conversation not found.")
#     return conv


# @app.delete("/api/conversations/{conversation_id}")
# def delete_conversation(conversation_id: int, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
#     conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
#     if not conv:
#         raise HTTPException(404, "Conversation not found.")
#     db.delete(conv)
#     db.commit()
#     return {"status": "deleted"}


# def _make_title(text: str, limit: int = 60) -> str:
#     text = " ".join(text.strip().split())
#     return text[:limit] + "…" if len(text) > limit else (text or "New proposal")


# @app.post("/api/generate", response_model=ProposalResponse)
# async def generate_proposal(req: GenerateRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
#     if not os.getenv("OPENROUTER_API_KEY"):
#         raise HTTPException(500, "OPENROUTER_API_KEY is not configured on the server.")

#     if req.conversation_id:
#         conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id).first()
#         if not conv:
#             raise HTTPException(404, "Conversation not found.")
#     else:
#         conv = Conversation(user_id=user.id, title=_make_title(req.job_description))
#         db.add(conv); db.commit(); db.refresh(conv)

#     db.add(Message(conversation_id=conv.id, role="user", content=req.job_description.strip()))
#     db.commit()

#     prompt_parts = [f"CLIENT JOB POST:\n{req.job_description.strip()}"]
#     if req.freelancer_profile:
#         prompt_parts.append(f"FREELANCER PROFILE / PROOF POINTS:\n{req.freelancer_profile.strip()}")
#     prompt_parts.append(f"PLATFORM: {req.platform or 'Upwork'}")
#     if req.tone:
#         prompt_parts.append(f"DESIRED TONE: {req.tone}")
#     prompt_parts.append("Write the proposal now.")

#     try:
#         result = await Runner.run(proposal_agent, "\n\n".join(prompt_parts))
#     except Exception as exc:
#         raise HTTPException(502, f"Agent run failed: {exc}") from exc

#     proposal_text = result.final_output.strip()
#     db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
#     db.commit()

#     return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)


# @app.post("/api/refine", response_model=ProposalResponse)
# async def refine_proposal(req: RefineRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
#     if not os.getenv("OPENAI_API_KEY"):
#         raise HTTPException(500, "OPENAI_API_KEY is not configured on the server.")

#     conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id).first()
#     if not conv:
#         raise HTTPException(404, "Conversation not found.")

#     messages = conv.messages
#     job_description = next((m.content for m in messages if m.role == "user"), "")
#     previous_proposal = next((m.content for m in reversed(messages) if m.role == "assistant"), "")

#     db.add(Message(conversation_id=conv.id, role="user", content=req.feedback.strip()))
#     db.commit()

#     prompt = (
#         f"CLIENT JOB POST:\n{job_description}\n\n"
#         f"PREVIOUS DRAFT:\n{previous_proposal}\n\n"
#         f"REQUESTED CHANGE:\n{req.feedback.strip()}\n\n"
#         "Revise the draft according to the requested change, keeping every "
#         "rule in your instructions intact. Return the full revised proposal."
#     )

#     try:
#         result = await Runner.run(proposal_agent, prompt)
#     except Exception as exc:
#         raise HTTPException(502, f"Agent run failed: {exc}") from exc

#     proposal_text = result.final_output.strip()
#     db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
#     db.commit()

#     return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)


import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from agents import Runner

from app.agent import build_proposal_agent
from app.database import Base, engine, get_db
from app.db_models import Conversation, Message, Profile
from app.auth import get_current_user, CurrentUser
from app.schemas import (
    GenerateRequest,
    RefineRequest,
    ProposalResponse,
    ConversationSummary,
    ConversationDetail,
    ProfileIn,
    ProfileOut,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OpenProposal API", version="4.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

proposal_agent = build_proposal_agent()


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@app.get("/api/profile", response_model=Optional[ProfileOut])
def get_profile(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Profile).filter(Profile.user_id == user.id).first()


@app.put("/api/profile", response_model=ProfileOut)
def upsert_profile(
    req: ProfileIn, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    profile.title = req.title
    profile.skills = req.skills
    profile.bio = req.bio
    profile.portfolio_links = req.portfolio_links
    profile.default_platform = req.default_platform or "Upwork"
    profile.default_tone = req.default_tone

    db.commit()
    db.refresh(profile)
    return profile


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------

@app.get("/api/conversations", response_model=list[ConversationSummary])
def list_conversations(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@app.get("/api/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: int, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found.")
    return conv


@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found.")
    db.delete(conv)
    db.commit()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Proposal generation
# ---------------------------------------------------------------------------

def _make_title(text: str, limit: int = 60) -> str:
    text = " ".join(text.strip().split())
    return text[:limit] + "…" if len(text) > limit else (text or "New proposal")


def _profile_to_prompt_text(profile: Optional[Profile]) -> Optional[str]:
    if not profile:
        return None
    parts = []
    if profile.title:
        parts.append(f"Title: {profile.title}")
    if profile.skills:
        parts.append(f"Skills: {profile.skills}")
    if profile.bio:
        parts.append(profile.bio)
    if profile.portfolio_links:
        parts.append(f"Portfolio/demo links: {profile.portfolio_links}")
    return "\n".join(parts) if parts else None


@app.post("/api/generate", response_model=ProposalResponse)
async def generate_proposal(req: GenerateRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not os.getenv("OPENROUTER_API_KEY"):
        raise HTTPException(500, "OPENROUTER_API_KEY is not configured on the server.")

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id).first()
        if not conv:
            raise HTTPException(404, "Conversation not found.")
    else:
        conv = Conversation(user_id=user.id, title=_make_title(req.job_description))
        db.add(conv); db.commit(); db.refresh(conv)

    db.add(Message(conversation_id=conv.id, role="user", content=req.job_description.strip()))
    db.commit()

    # request values win if given; otherwise fall back to the saved profile
    freelancer_profile = req.freelancer_profile or _profile_to_prompt_text(profile)
    platform = req.platform or (profile.default_platform if profile else None) or "Upwork"
    tone = req.tone or (profile.default_tone if profile else None)

    prompt_parts = [f"CLIENT JOB POST:\n{req.job_description.strip()}"]
    if freelancer_profile:
        prompt_parts.append(f"FREELANCER PROFILE / PROOF POINTS:\n{freelancer_profile}")
    prompt_parts.append(f"PLATFORM: {platform}")
    if tone:
        prompt_parts.append(f"DESIRED TONE: {tone}")
    prompt_parts.append("Write the proposal now.")

    try:
        result = await Runner.run(proposal_agent, "\n\n".join(prompt_parts))
    except Exception as exc:
        raise HTTPException(502, f"Agent run failed: {exc}") from exc

    proposal_text = result.final_output.strip()
    db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
    db.commit()

    return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)


@app.post("/api/refine", response_model=ProposalResponse)
async def refine_proposal(req: RefineRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(500, "OPENAI_API_KEY is not configured on the server.")

    conv = db.query(Conversation).filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found.")

    messages = conv.messages
    job_description = next((m.content for m in messages if m.role == "user"), "")
    previous_proposal = next((m.content for m in reversed(messages) if m.role == "assistant"), "")

    db.add(Message(conversation_id=conv.id, role="user", content=req.feedback.strip()))
    db.commit()

    prompt = (
        f"CLIENT JOB POST:\n{job_description}\n\n"
        f"PREVIOUS DRAFT:\n{previous_proposal}\n\n"
        f"REQUESTED CHANGE:\n{req.feedback.strip()}\n\n"
        "Revise the draft according to the requested change, keeping every "
        "rule in your instructions intact. Return the full revised proposal."
    )

    try:
        result = await Runner.run(proposal_agent, prompt)
    except Exception as exc:
        raise HTTPException(502, f"Agent run failed: {exc}") from exc

    proposal_text = result.final_output.strip()
    db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
    db.commit()

    return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)