"""Pydantic schemas for the FraudShield shipment fraud detection system."""

from typing import List, Optional
from pydantic import BaseModel, Field


class BookingRequest(BaseModel):
    """Payload representing an incoming shipment booking to score for fraud."""
    # TODO: Add or adjust fields relevant to your shipment fraud scoring model
    booking_id: str
    shipper_name: str
    consignee_name: str
    origin_country: str
    destination_country: str
    cargo_type: str
    declared_value: float
    weight_kg: float
    shipping_date: str
    payment_method: str


class ScoreResponse(BaseModel):
    """Scoring result returned by the risk engine and explainer."""
    # TODO: Add or adjust scoring fields and metadata
    booking_id: str
    risk_score: float
    risk_tier: str
    risk_factors: List[str] = Field(default_factory=list)
    explanation: Optional[str] = None
    recommended_action: str


class ReviewDecision(BaseModel):
    """Manual review decision submitted by a fraud analyst/reviewer."""
    # TODO: Add or adjust manual review decision attributes
    booking_id: str
    reviewer_id: str
    decision: str  # e.g., 'APPROVED', 'REJECTED', 'ESCALATED'
    notes: Optional[str] = None


class BookingRecord(BaseModel):
    """Stored booking record encompassing request, score, review status, and timestamps."""
    # TODO: Add or adjust persistence fields
    id: str
    booking: BookingRequest
    score: Optional[ScoreResponse] = None
    review: Optional[ReviewDecision] = None
    status: str  # e.g., 'PENDING', 'FLAGGED', 'APPROVED', 'REJECTED'
    created_at: str
