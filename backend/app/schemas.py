import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class GenerateRequest(BaseModel):
    job_description: str = Field(..., min_length=10)
    freelancer_profile: Optional[str] = None
    platform: Optional[str] = None
    tone: Optional[str] = None
    conversation_id: Optional[int] = None


class RefineRequest(BaseModel):
    conversation_id: int
    feedback: str = Field(..., min_length=2)


class ProposalResponse(BaseModel):
    proposal: str
    conversation_id: int


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime.datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    role: str
    content: str
    created_at: datetime.datetime


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    messages: List[MessageOut]


class ProfileIn(BaseModel):
    title: Optional[str] = None
    skills: Optional[str] = None
    bio: str = Field(..., min_length=10)
    portfolio_links: Optional[str] = None
    default_platform: Optional[str] = "Upwork"
    default_tone: Optional[str] = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    title: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    portfolio_links: Optional[str] = None
    default_platform: Optional[str] = None
    default_tone: Optional[str] = None