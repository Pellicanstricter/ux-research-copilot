from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ProcessingStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FeedbackSubmission(BaseModel):
    """User feedback submission"""
    feedback: str = Field(description="User feedback text")
    email: str = Field(description="User email address")
    name: str = Field(default="Anonymous User", description="User name")

class InsightData(BaseModel):
    quote: str = Field(description="Exact quote from transcript")
    speaker: Optional[str] = Field(default=None, description="Speaker identifier if available")
    theme: str = Field(description="Primary theme category")
    sentiment: str = Field(description="Positive, Negative, or Neutral")
    confidence: float = Field(description="Confidence score 0-1")
    context: str = Field(description="Surrounding context")
    timestamp: Optional[str] = Field(default=None, description="Timestamp if available")

class QuoteWithAttribution(BaseModel):
    """Individual quote with speaker attribution"""
    quote: str = Field(description="The actual quote from transcript")
    speaker: Optional[str] = Field(default=None, description="Speaker name/identifier")
    context: Optional[str] = Field(default=None, description="Additional context")

class KeyInsightCard(BaseModel):
    """Represents a Key Insight card matching presentation format"""
    insight_number: int = Field(description="Sequential number (e.g., 1, 2, 3)")
    title: str = Field(description="Key Insight title (e.g., 'Control & Transparency')")
    main_finding: str = Field(description="Main finding statement in blue box")
    finding_type: str = Field(description="Type: 'positive', 'negative', 'critical', 'neutral'")
    problem_statement: Optional[str] = Field(default=None, description="The problem description (optional)")
    supporting_quotes: List[QuoteWithAttribution] = Field(description="2-4 supporting quotes with attribution")
    behavioral_pattern: Optional[str] = Field(default=None, description="Observed behavioral pattern (optional)")
    expected_journey: Optional[List[str]] = Field(default=None, description="Expected user journey steps (optional)")
    impact_metric: Optional[str] = Field(default=None, description="Impact metric if available (e.g., '9 out of 11 participants')")

class ExecutiveSummary(BaseModel):
    """Executive summary matching presentation format"""
    research_question: str = Field(description="The primary research question")
    key_finding: str = Field(description="The single most important finding")
    key_insight: str = Field(description="Main insight/interpretation of the finding")
    recommendation: str = Field(description="Primary recommendation based on findings")
    context: Optional[str] = Field(default=None, description="Additional context paragraph")

class ThemeCluster(BaseModel):
    """Legacy theme cluster - kept for backward compatibility"""
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
