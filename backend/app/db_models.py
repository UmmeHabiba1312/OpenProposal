import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey 
from sqlalchemy.orm import relationship
from app.database import Base




class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, default="New proposal")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.id"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(String, primary_key=True)
    name = Column(String, nullable=True)              
    title = Column(String, nullable=True)
    skills = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    portfolio_links = Column(Text, nullable=True)
    proof_story = Column(Text, nullable=True)
    hourly_rate = Column(String, nullable=True)
    availability = Column(String, nullable=True)      
    default_platform = Column(String, default="Upwork")
    default_tone = Column(String, nullable=True)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )