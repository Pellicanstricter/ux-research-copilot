from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProcessingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class InsightData(BaseModel):
    quote: str = Field(description="Exact quote from transcript")
    speaker: Optional[str] = Field(description="Speaker identifier if available")
    theme: str = Field(description="Primary theme category")
    sentiment: str = Field(description="Positive, Negative, or Neutral")
    confidence: float = Field(description="Confidence score 0-1")
    context: str = Field(description="Surrounding context")
    timestamp: Optional[str] = Field(description="Timestamp if available")

class ThemeCluster(BaseModel):
    theme_name: str = Field(description="Theme name")
    insights: List[InsightData] = Field(description="Related insights")
    frequency: int = Field(description="Number of mentions")
    priority: str = Field(description="High, Medium, or Low")
    summary: str = Field(description="Theme summary")

class PersonaData(BaseModel):
    name: str = Field(description="Persona name")
    demographics: str = Field(description="Age, occupation, etc.")
    goals: List[str] = Field(description="Primary goals")
    pain_points: List[str] = Field(description="Key frustrations")
    behaviors: List[str] = Field(description="Observed behaviors")
    quotes: List[str] = Field(description="Representative quotes")

class ProcessingSession(BaseModel):
    session_id: str
    status: ProcessingStatus
    created_at: datetime
    updated_at: datetime
    file_count: int
    insights_extracted: int = 0
    themes_identified: int = 0
    personas_created: int = 0
    processing_time: Optional[float] = None
    error_message: Optional[str] = None
