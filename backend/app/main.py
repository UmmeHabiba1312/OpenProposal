import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from agents import Runner

from app.agent import build_proposal_agent
from app.crypto import encrypt, decrypt
from app.providers import PROVIDERS
from app.database import Base, engine, get_db
from app.db_models import Conversation, Message, Profile
from app.auth import get_current_user, CurrentUser
from app.schemas import (
    GenerateRequest,
    RefineRequest,
    ProposalResponse,
    ConversationSummary,
    ConversationDetail,
    ConversationUpdate,
    ProfileIn,
    ProfileOut,
    ApiConfigIn,
    ApiConfigOut,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OpenProposal API", version="5.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/providers")
def list_providers():
    """Lets the frontend render the dropdown without hardcoding provider names."""
    return {
        key: {"label": v["label"], "default_model": v["default_model"], "needs_base_url": v["base_url"] is None}
        for key, v in PROVIDERS.items()
    }


# ---------------------------------------------------------------------------
# BYOK settings
# ---------------------------------------------------------------------------

@app.get("/api/settings", response_model=ApiConfigOut)
def get_api_config(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile or not profile.api_key_encrypted:
        return ApiConfigOut(has_key=False)
    return ApiConfigOut(
        provider=profile.api_provider,
        model=profile.api_model,
        custom_base_url=profile.api_custom_base_url,
        has_key=True,
    )


@app.put("/api/settings", response_model=ApiConfigOut)
def save_api_config(
    req: ApiConfigIn, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    if req.provider not in PROVIDERS:
        raise HTTPException(400, f"Unknown provider: {req.provider}")
    if req.provider == "custom" and not req.custom_base_url:
        raise HTTPException(400, "custom_base_url is required for a custom provider.")

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    profile.api_provider = req.provider
    profile.api_key_encrypted = encrypt(req.api_key)
    profile.api_model = req.model
    profile.api_custom_base_url = req.custom_base_url if req.provider == "custom" else None

    db.commit()
    db.refresh(profile)
    return ApiConfigOut(provider=profile.api_provider, model=profile.api_model, custom_base_url=profile.api_custom_base_url, has_key=True)


@app.delete("/api/settings")
def delete_api_config(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile:
        profile.api_provider = None
        profile.api_key_encrypted = None
        profile.api_model = None
        profile.api_custom_base_url = None
        db.commit()
    return {"status": "cleared"}


def _get_user_agent(profile: Optional[Profile]):
    if not profile or not profile.api_key_encrypted:
        raise HTTPException(
            400,
            "No API key configured. Add your API key in Settings before generating proposals.",
        )
    api_key = decrypt(profile.api_key_encrypted)
    return build_proposal_agent(
        provider=profile.api_provider,
        api_key=api_key,
        model=profile.api_model,
        custom_base_url=profile.api_custom_base_url,
    )


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

    profile.name = req.name
    profile.title = req.title
    profile.skills = req.skills
    profile.bio = req.bio
    profile.portfolio_links = req.portfolio_links
    profile.proof_story = req.proof_story
    profile.hourly_rate = req.hourly_rate
    profile.availability = req.availability
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
        .order_by(Conversation.pinned.desc(), Conversation.created_at.desc())
        .all()
    )


@app.patch("/api/conversations/{conversation_id}", response_model=ConversationSummary)
def update_conversation(
    conversation_id: int,
    req: ConversationUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(404, "Conversation not found.")

    if req.title is not None:
        conv.title = req.title.strip()
    if req.pinned is not None:
        conv.pinned = req.pinned

    db.commit()
    db.refresh(conv)
    return conv


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
    if profile.proof_story:
        parts.append(f"A real project example: {profile.proof_story}")
    if profile.portfolio_links:
        parts.append(f"Portfolio/demo links: {profile.portfolio_links}")
    if profile.hourly_rate:
        parts.append(f"Typical rate: {profile.hourly_rate}")
    if profile.availability:
        parts.append(f"Availability: {profile.availability}")
    return "\n".join(parts) if parts else None


@app.post("/api/generate", response_model=ProposalResponse)
async def generate_proposal(
    req: GenerateRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    proposal_agent = _get_user_agent(profile)

    if req.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id)
            .first()
        )
        if not conv:
            raise HTTPException(404, "Conversation not found.")
    else:
        conv = Conversation(user_id=user.id, title=_make_title(req.job_description))
        db.add(conv)
        db.commit()
        db.refresh(conv)

    db.add(Message(conversation_id=conv.id, role="user", content=req.job_description.strip()))
    db.commit()

    freelancer_profile = req.freelancer_profile or _profile_to_prompt_text(profile)
    platform = req.platform or (profile.default_platform if profile else None) or "Upwork"
    tone = req.tone or (profile.default_tone if profile else None)
    sender_name = profile.name if profile else None

    prompt_parts = [f"CLIENT JOB POST:\n{req.job_description.strip()}"]
    if freelancer_profile:
        prompt_parts.append(f"FREELANCER PROFILE / PROOF POINTS:\n{freelancer_profile}")
    prompt_parts.append(f"PLATFORM: {platform}")
    if tone:
        prompt_parts.append(f"DESIRED TONE: {tone}")
    if sender_name:
        prompt_parts.append(
            f"FREELANCER'S NAME (use only for sign-off, never as a credential or "
            f"experience claim): {sender_name}"
        )
    prompt_parts.append("Write the proposal now.")

    try:
        result = await Runner.run(proposal_agent, "\n\n".join(prompt_parts))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"Agent run failed - check your API key and model in Settings: {exc}") from exc

    proposal_text = result.final_output.strip()
    db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
    db.commit()

    return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)


@app.post("/api/refine", response_model=ProposalResponse)
async def refine_proposal(
    req: RefineRequest, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    proposal_agent = _get_user_agent(profile)

    conv = (
        db.query(Conversation)
        .filter(Conversation.id == req.conversation_id, Conversation.user_id == user.id)
        .first()
    )
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
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"Agent run failed - check your API key and model in Settings: {exc}") from exc

    proposal_text = result.final_output.strip()
    db.add(Message(conversation_id=conv.id, role="assistant", content=proposal_text))
    db.commit()

    return ProposalResponse(proposal=proposal_text, conversation_id=conv.id)