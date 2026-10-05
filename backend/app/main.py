"""Main FastAPI application entry point for FraudShield.

Configures application middleware, routing, and endpoint handlers for
real-time shipment fraud scoring, review management, and system stats.
"""

from typing import Any, Dict, List, Optional
import os
import json
import threading
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    BookingRecord,
    BookingRequest,
    ReviewDecision,
    ScoreResponse,
)
from app.risk_engine import RiskEngine
from app.data_gen import generate_bookings

app = FastAPI(
    title="FraudShield API",
    description="Real-time shipment fraud detection and risk assessment system",
    version="0.1.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistence store
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_FILE = DATA_DIR / "bookings.json"
_lock = threading.Lock()
_records: Dict[str, BookingRecord] = {}
_risk_engine = RiskEngine()


def _save_to_disk() -> None:
    """Save records to disk."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        serialized = {k: v.model_dump() for k, v in _records.items()}
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save to disk: {e}")


def _load_from_disk() -> None:
    """Load existing records from disk if available."""
    global _records
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for k, v in data.items():
                    _records[k] = BookingRecord(**v)
        except Exception as e:
            print(f"Warning: Failed to load from disk: {e}")


# Initialize data on startup
@app.on_event("startup")
def startup_event():
    """Load existing data or auto-seed on first start."""
    _load_from_disk()
    if not _records:
        # Seed 25 realistic bookings for instant demonstration
        demo_requests = generate_bookings(count=25, fraud_ratio=0.32)
        for req in demo_requests:
            score_res = _risk_engine.score(req)
            if score_res.risk_tier in ["CRITICAL", "HIGH"]:
                rec_status = "FLAGGED"
            elif score_res.risk_tier == "MEDIUM":
                rec_status = "PENDING"
            else:
                rec_status = "APPROVED"

            record = BookingRecord(
                id=req.booking_id,
                booking=req,
                score=score_res,
                review=None,
                status=rec_status,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            _records[req.booking_id] = record
        _save_to_disk()


@app.get("/api/health", summary="Health Check")
async def health_check() -> Dict[str, Any]:
    """Return health status of the API service."""
    return {"status": "ok", "version": "0.1.0", "records_count": len(_records)}


@app.post(
    "/api/bookings/score",
    response_model=ScoreResponse,
    summary="Score a shipment booking for fraud risk",
)
async def score_booking(booking: BookingRequest) -> ScoreResponse:
    """Evaluate an incoming shipment booking and return its risk score."""
    score_res = _risk_engine.score(booking)

    if score_res.risk_tier in ["CRITICAL", "HIGH"]:
        rec_status = "FLAGGED"
    elif score_res.risk_tier == "MEDIUM":
        rec_status = "PENDING"
    else:
        rec_status = "APPROVED"

    record = BookingRecord(
        id=booking.booking_id,
        booking=booking,
        score=score_res,
        review=None,
        status=rec_status,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    with _lock:
        _records[booking.booking_id] = record
        _save_to_disk()

    return score_res


@app.get(
    "/api/bookings",
    response_model=List[BookingRecord],
    summary="List shipment bookings",
)
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None, description="Filter by status (FLAGGED, APPROVED, REJECTED, ESCALATED, PENDING)"),
    tier: Optional[str] = Query(None, description="Filter by risk tier (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search by ID, shipper, consignee, or cargo"),
) -> List[BookingRecord]:
    """Retrieve a filtered and paginated list of shipment bookings."""
    with _lock:
        results = list(_records.values())

    # Sort descending by created_at
    results.sort(key=lambda r: r.created_at, reverse=True)

    if status and status.upper() != "ALL":
        stat_upper = status.upper()
        results = [r for r in results if r.status == stat_upper]

    if tier and tier.upper() != "ALL":
        tier_upper = tier.upper()
        results = [r for r in results if r.score and r.score.risk_tier == tier_upper]

    if search and search.strip():
        q = search.strip().lower()
        results = [
            r for r in results
            if (
                q in r.id.lower()
                or q in r.booking.shipper_name.lower()
                or q in r.booking.consignee_name.lower()
                or q in r.booking.cargo_type.lower()
                or q in r.booking.origin_country.lower()
                or q in r.booking.destination_country.lower()
            )
        ]

    return results[skip : skip + limit]


@app.get(
    "/api/bookings/{id}",
    response_model=BookingRecord,
    summary="Get shipment booking details by ID",
)
async def get_booking(id: str) -> BookingRecord:
    """Retrieve full details of a specific shipment booking record."""
    with _lock:
        record = _records.get(id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Booking '{id}' not found.")
    return record


@app.post(
    "/api/bookings/review",
    response_model=BookingRecord,
    summary="Submit analyst review decision",
)
async def review_booking(review: ReviewDecision) -> BookingRecord:
    """Submit a human analyst review decision for a flagged booking."""
    with _lock:
        record = _records.get(review.booking_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Booking '{review.booking_id}' not found.")

        # Update record with review decision
        norm_decision = review.decision.upper().strip()
        if norm_decision not in ["APPROVED", "REJECTED", "ESCALATED"]:
            norm_decision = "FLAGGED"

        record.review = review
        record.status = norm_decision
        _records[review.booking_id] = record
        _save_to_disk()

        return record


@app.get(
    "/api/stats",
    summary="Get fraud detection dashboard statistics",
)
async def get_stats() -> Dict[str, Any]:
    """Return summary statistics such as total bookings, flagged count, review backlog, and fraud rate."""
    with _lock:
        all_records = list(_records.values())

    total = len(all_records)
    if total == 0:
        return {
            "total_bookings": 0,
            "flagged_count": 0,
            "review_backlog": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "escalated_count": 0,
            "fraud_rate": 0.0,
            "value_at_risk": 0.0,
            "tier_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
        }

    flagged = sum(1 for r in all_records if r.status == "FLAGGED")
    rejected = sum(1 for r in all_records if r.status == "REJECTED")
    approved = sum(1 for r in all_records if r.status == "APPROVED")
    escalated = sum(1 for r in all_records if r.status == "ESCALATED")
    pending = sum(1 for r in all_records if r.status == "PENDING")

    backlog = flagged + pending

    # Declared value at risk
    val_at_risk = sum(
        r.booking.declared_value
        for r in all_records
        if r.status in ["FLAGGED", "REJECTED", "ESCALATED"] or (r.score and r.score.risk_tier in ["HIGH", "CRITICAL"])
    )

    tier_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for r in all_records:
        if r.score and r.score.risk_tier in tier_counts:
            tier_counts[r.score.risk_tier] += 1

    fraud_rate = round(((flagged + rejected + escalated) / total) * 100.0, 1)

    return {
        "total_bookings": total,
        "flagged_count": flagged,
        "review_backlog": backlog,
        "approved_count": approved,
        "rejected_count": rejected,
        "escalated_count": escalated,
        "fraud_rate": fraud_rate,
        "value_at_risk": round(val_at_risk, 2),
        "tier_distribution": tier_counts,
    }


@app.post(
    "/api/demo/seed",
    summary="Seed demo data for simulation",
)
async def seed_demo_data(count: int = Query(30, ge=1, le=500)) -> Dict[str, Any]:
    """Seed synthetic booking records into the system for testing and demonstrations."""
    new_bookings = generate_bookings(count=count, fraud_ratio=0.30)
    created_count = 0

    with _lock:
        for req in new_bookings:
            score_res = _risk_engine.score(req)
            if score_res.risk_tier in ["CRITICAL", "HIGH"]:
                rec_status = "FLAGGED"
            elif score_res.risk_tier == "MEDIUM":
                rec_status = "PENDING"
            else:
                rec_status = "APPROVED"

            record = BookingRecord(
                id=req.booking_id,
                booking=req,
                score=score_res,
                review=None,
                status=rec_status,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            _records[req.booking_id] = record
            created_count += 1
        _save_to_disk()

    return {
        "message": f"Successfully synthesized and scored {created_count} bookings",
        "total_records": len(_records),
    }
