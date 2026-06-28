"""Pydantic models for API request/response schemas."""
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Card ──
class CardOut(BaseModel):
    id: str
    deck: str
    title: str
    stars: str = ""
    difficulty: str = ""
    example: str = ""
    solution: str = ""
    answer: str = ""
    variants: str = ""
    blank_steps: Optional[str] = None


# ── Quiz ──
class QuizItemOut(BaseModel):
    id: int
    desc: str
    opts: list[str]
    ans: int
    tip: str


# ── Learning Events ──
class EventIn(BaseModel):
    card_id: str = Field(max_length=100)
    action: Literal['correct', 'wrong', 'mastered', 'reset']
    created_at: Optional[str] = Field(default=None, max_length=30)  # ISO 8601, ignored by server


class SyncIn(BaseModel):
    events: list[EventIn] = Field(min_length=1, max_length=100)


class SyncOut(BaseModel):
    accepted: int


# ── High-frequency vocab ──
class VocabOut(BaseModel):
    word: str
    meaning: str
    category: str
