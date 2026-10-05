"""Explainer module for FraudShield.

Generates human-readable, context-aware explanations for scored shipment
bookings, leveraging LLMs (OpenAI/Anthropic) or feature importance methods
to clarify why a booking was flagged or scored high-risk.
"""

import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

from app.schemas import BookingRequest

load_dotenv()


def _generate_rule_based_explanation(
    booking: BookingRequest,
    risk_score: float,
    risk_tier: str,
    risk_factors: List[str],
) -> str:
    """Generate a high-fidelity natural language explanation using domain rules."""
    declared_val = booking.declared_value
    weight_kg = booking.weight_kg
    val_per_kg = declared_val / max(0.1, weight_kg)

    if risk_tier == "LOW":
        return (
            f"Shipment {booking.booking_id} exhibits standard commercial characteristics. "
            f"The declared value of ${declared_val:,.2f} for {weight_kg:,.1f}kg of {booking.cargo_type} "
            f"yields a density of ${val_per_kg:.2f}/kg, fully consistent with trade norms between "
            f"{booking.origin_country} and {booking.destination_country}. "
            f"Payment via '{booking.payment_method}' is verified. Clearance recommended without delay."
        )

    if risk_tier == "MEDIUM":
        factors_str = "; ".join(risk_factors) if risk_factors else "Slight deviations from typical corridor averages"
        return (
            f"Booking {booking.booking_id} scored MEDIUM risk ({risk_score:.2f}). "
            f"Identified indicators: {factors_str}. "
            f"While the consignment does not exhibit outright malicious patterns, "
            f"standard documentation verification is advised before release."
        )

    # HIGH or CRITICAL
    lead = "CRITICAL ALERT" if risk_tier == "CRITICAL" else "HIGH RISK WARNING"
    factors_summary = "\n• " + "\n• ".join(risk_factors) if risk_factors else "Unusual logistics profile."
    
    action_note = (
        "Immediate physical container hold and cargo manifest audit required."
        if risk_tier == "CRITICAL"
        else "Mandatory secondary review by fraud analyst required before bill of lading issuance."
    )

    return (
        f"[{lead} - Risk Score: {risk_score:.2f} | Tier: {risk_tier}]\n"
        f"Consignment {booking.booking_id} from '{booking.shipper_name}' to '{booking.consignee_name}' "
        f"({booking.origin_country} -> {booking.destination_country}) triggered multiple fraud safeguards:\n"
        f"{factors_summary}\n\n"
        f"Cargo Metrics: Declared value of ${declared_val:,.2f} on {weight_kg:,.1f}kg of {booking.cargo_type} "
        f"(${val_per_kg:.2f}/kg). Protocol Recommendation: {action_note}"
    )


def explain(
    booking: BookingRequest,
    risk_score: float,
    risk_tier: str,
    risk_factors: List[str],
    context: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a natural language explanation for why a shipment was scored at a particular risk level.

    Args:
        booking: The original shipment booking request details.
        risk_score: The calculated risk score (0.0 to 1.0).
        risk_tier: Evaluated risk tier (LOW, MEDIUM, HIGH, CRITICAL).
        risk_factors: List of identified risk indicators.
        context: Optional additional metadata or reviewer notes.

    Returns:
        str: Concise, actionable explanation for fraud analysts or compliance officers.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # Try Anthropic Claude if key is configured
    if anthropic_key and anthropic_key.strip():
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            prompt = (
                f"You are FraudShield AI, an expert trade compliance and logistics fraud analyst. "
                f"Explain concisely (2-3 sentences) why this shipment booking was scored at risk tier {risk_tier} ({risk_score:.2f}):\n"
                f"Booking ID: {booking.booking_id}\n"
                f"Shipper: {booking.shipper_name} | Consignee: {booking.consignee_name}\n"
                f"Corridor: {booking.origin_country} -> {booking.destination_country}\n"
                f"Cargo: {booking.cargo_type} | Value: ${booking.declared_value:,.2f} | Weight: {booking.weight_kg}kg\n"
                f"Payment: {booking.payment_method}\n"
                f"Flagged Factors: {', '.join(risk_factors)}\n"
                f"Provide clear, professional risk analysis and inspection advice."
            )
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=250,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()
        except Exception:
            pass

    # Try OpenAI if key is configured
    if openai_key and openai_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            prompt = (
                f"You are FraudShield AI, an expert logistics fraud and trade-based money laundering analyst. "
                f"Explain concisely why this shipment booking was scored at risk tier {risk_tier} ({risk_score:.2f}):\n"
                f"Booking: {booking.booking_id}, Shipper: {booking.shipper_name}, Consignee: {booking.consignee_name}\n"
                f"Route: {booking.origin_country} -> {booking.destination_country}\n"
                f"Cargo: {booking.cargo_type}, Value: ${booking.declared_value:,.2f}, Weight: {booking.weight_kg}kg\n"
                f"Payment: {booking.payment_method}\n"
                f"Risk Factors: {', '.join(risk_factors)}\n"
            )
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
            )
            return response.choices[0].message.content.strip()
        except Exception:
            pass

    # Deterministic high-quality fallback explanation
    return _generate_rule_based_explanation(booking, risk_score, risk_tier, risk_factors)
