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
    pinned: bool
    created_at: datetime.datetime


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    pinned: Optional[bool] = None


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
    name: str = Field(..., min_length=1)   
    title: Optional[str] = None
    skills: Optional[str] = None
    bio: str = Field(..., min_length=10)
    portfolio_links: Optional[str] = None
    proof_story: Optional[str] = None
    hourly_rate: Optional[str] = None
    availability: Optional[str] = None
    default_platform: Optional[str] = "Upwork"
    default_tone: Optional[str] = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: Optional[str] = None
    title: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    portfolio_links: Optional[str] = None
    proof_story: Optional[str] = None
    hourly_rate: Optional[str] = None
    availability: Optional[str] = None
    default_platform: Optional[str] = None
    default_tone: Optional[str] = None

class ApiConfigIn(BaseModel):
    provider: str = Field(..., description="openai | anthropic | gemini | openrouter | deepseek | custom")
    api_key: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    custom_base_url: Optional[str] = None


class ApiConfigOut(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    custom_base_url: Optional[str] = None
    has_key: bool = False 