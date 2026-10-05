"""Risk Engine module for FraudShield.

Evaluates shipment bookings against machine learning models and heuristic
rules to compute a risk score and identify potential fraud indicators.
"""

from typing import Any, Dict, List, Tuple
import math
import numpy as np
from sklearn.ensemble import IsolationForest

from app.schemas import BookingRequest, ScoreResponse

# Baseline benchmark ranges for value-to-weight density (USD per kg)
CARGO_VALUE_BENCHMARKS = {
    "Electronics": {"min": 25.0, "max": 500.0, "median": 120.0},
    "Pharmaceuticals": {"min": 40.0, "max": 1200.0, "median": 280.0},
    "Luxury Goods": {"min": 150.0, "max": 4000.0, "median": 850.0},
    "Textiles": {"min": 5.0, "max": 85.0, "median": 25.0},
    "Industrial Machinery": {"min": 10.0, "max": 180.0, "median": 45.0},
    "Scrap Metal": {"min": 0.4, "max": 8.0, "median": 2.5},
    "Chemicals": {"min": 8.0, "max": 160.0, "median": 35.0},
    "Automotive Parts": {"min": 12.0, "max": 200.0, "median": 50.0},
    "Perishables / Food": {"min": 1.0, "max": 30.0, "median": 6.0},
}

# High-risk jurisdiction corridors and transit watchlist
HIGH_RISK_COUNTRIES = {
    "KP", "IR", "SY", "CU", "VE", "MM", "BY", "RU", "SD", "YE"
}
MONITORED_TRANSIT_HUBS = {
    "CY", "VG", "KY", "PA", "BZ", "SC", "MH"
}

# Suspicious payment methods
HIGH_RISK_PAYMENTS = {
    "Cryptocurrency": 0.35,
    "Anonymous Prepaid Card": 0.30,
    "Third-Party Remittance": 0.25,
    "Cash on Delivery": 0.20,
}

# Shell company / red flag name patterns
SHELL_KEYWORDS = [
    "trading ltd", "global logistics offshore", "holding corp", "shell",
    "anonymous", "fast cash", "intl trade limited", "import export s.a.",
    "panama trading", "crypto freight"
]


class RiskEngine:
    """Core risk evaluation engine combining rule heuristics with anomaly detection."""

    def __init__(self, model_path: str = None) -> None:
        """Initialize the risk engine and pre-train baseline anomaly detector."""
        self._init_anomaly_model()

    def _init_anomaly_model(self) -> None:
        """Fit a baseline IsolationForest on typical logistics value/weight distributions."""
        np.random.seed(42)
        # Synthetic baseline: 2000 normal shipments across common log-values
        log_vals = np.random.normal(loc=9.5, scale=1.5, size=2000)  # ~$5k to $200k
        log_weights = np.random.normal(loc=6.0, scale=1.8, size=2000) # ~50kg to 5000kg
        log_densities = log_vals - log_weights

        X_normal = np.column_stack([log_vals, log_weights, log_densities])
        self.anomaly_detector = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42
        )
        self.anomaly_detector.fit(X_normal)

    def evaluate_heuristics(self, booking: BookingRequest) -> Tuple[float, List[str]]:
        """Evaluate heuristic rules and domain red-flags.
        
        Returns:
            Tuple of (heuristic_risk_score, list_of_risk_factors)
        """
        risk_score = 0.05  # Base baseline noise
        factors: List[str] = []

        declared_val = max(1.0, float(booking.declared_value))
        weight_kg = max(0.1, float(booking.weight_kg))
        val_per_kg = declared_val / weight_kg

        # 1. Cargo Density Analysis (Value-to-Weight)
        cargo_type = booking.cargo_type
        bench = CARGO_VALUE_BENCHMARKS.get(cargo_type, {"min": 5.0, "max": 300.0, "median": 40.0})

        if val_per_kg < (bench["min"] * 0.2):
            risk_score += 0.35
            factors.append(
                f"Severe Under-Invoicing: Declared ${val_per_kg:.2f}/kg for {cargo_type} "
                f"(industry min: ${bench['min']:.2f}/kg). Potential tariff evasion."
            )
        elif val_per_kg > (bench["max"] * 3.5):
            risk_score += 0.40
            factors.append(
                f"Severe Over-Invoicing: Declared ${val_per_kg:.2f}/kg for {cargo_type} "
                f"(industry max: ${bench['max']:.2f}/kg). Potential Trade-Based Money Laundering (TBML)."
            )
        elif val_per_kg < bench["min"]:
            risk_score += 0.15
            factors.append(f"Sub-benchmark valuation for {cargo_type} (${val_per_kg:.2f}/kg).")
        elif val_per_kg > bench["max"]:
            risk_score += 0.20
            factors.append(f"Above-benchmark valuation for {cargo_type} (${val_per_kg:.2f}/kg).")

        # 2. Payment Method Risk
        payment = booking.payment_method
        if payment in HIGH_RISK_PAYMENTS:
            boost = HIGH_RISK_PAYMENTS[payment]
            risk_score += boost
            factors.append(f"High-Risk Payment Channel: '{payment}' provides limited counterparty traceability.")
        elif payment.lower() in ["letter of credit", "loc", "escrow verified"]:
            risk_score -= 0.10  # Mitigating credit-backed factor

        # High COD amount
        if payment == "Cash on Delivery" and declared_val > 5000:
            risk_score += 0.15
            factors.append("Unusually high cash-on-delivery threshold (> $5,000).")

        # 3. Corridors & Jurisdictions
        orig = booking.origin_country.upper().strip()
        dest = booking.destination_country.upper().strip()

        if orig in HIGH_RISK_COUNTRIES or dest in HIGH_RISK_COUNTRIES:
            risk_score += 0.45
            factors.append(f"Sanctioned or High-Risk Jurisdiction corridor: {orig} -> {dest}.")
        
        if orig in MONITORED_TRANSIT_HUBS or dest in MONITORED_TRANSIT_HUBS:
            risk_score += 0.20
            factors.append(f"Offshore/Monitored transshipment hub involved ({orig if orig in MONITORED_TRANSIT_HUBS else dest}).")

        # 4. Shipper & Consignee Identity Checks
        s_name = booking.shipper_name.lower().strip()
        c_name = booking.consignee_name.lower().strip()

        # Circular entity: Shipper equals Consignee across cross-border shipment
        if s_name == c_name and orig != dest:
            risk_score += 0.25
            factors.append("Circular Entity: Shipper matches Consignee on international consignment.")

        # Shell company naming pattern
        if any(kw in s_name for kw in SHELL_KEYWORDS) or any(kw in c_name for kw in SHELL_KEYWORDS):
            risk_score += 0.25
            factors.append("Entity Screening: Company name matches high-risk offshore/shell pattern.")

        # 5. Outlier combination: High value with tiny weight for non-luxury
        if declared_val > 100000 and weight_kg < 5.0 and cargo_type not in ["Luxury Goods", "Pharmaceuticals"]:
            risk_score += 0.25
            factors.append("Phantom Freight Anomaly: High declared value (>$100k) with under 5kg weight.")

        return risk_score, factors

    def evaluate_ml_anomaly(self, booking: BookingRequest) -> float:
        """Evaluate ML IsolationForest anomaly score."""
        try:
            declared_val = max(1.0, float(booking.declared_value))
            weight_kg = max(0.1, float(booking.weight_kg))
            
            log_val = math.log(declared_val)
            log_wt = math.log(weight_kg)
            log_dens = log_val - log_wt

            sample = np.array([[log_val, log_wt, log_dens]])
            # score_samples returns negative anomaly score (lower is more anomalous)
            raw_score = self.anomaly_detector.score_samples(sample)[0]
            # Map raw_score (~ -0.7 to -0.3) to 0.0 - 1.0 probability
            anomaly_prob = 1.0 / (1.0 + math.exp((raw_score + 0.5) * 8.0))
            return max(0.0, min(1.0, anomaly_prob))
        except Exception:
            return 0.10

    def score(self, booking: BookingRequest) -> ScoreResponse:
        """Calculate the risk score and risk tier for a given shipment booking.

        Args:
            booking: The incoming shipment booking request.

        Returns:
            ScoreResponse: Risk score (0.0 to 1.0), risk tier, identified risk factors,
            and recommended action.
        """
        heuristic_score, risk_factors = self.evaluate_heuristics(booking)
        ml_score = self.evaluate_ml_anomaly(booking)

        if ml_score > 0.65 and "Machine Learning Anomaly" not in " ".join(risk_factors):
            risk_factors.append(f"Statistical Anomaly: Multi-dimensional density outlier detected by Isolation Forest.")

        # Combined weighted score (70% heuristics, 30% statistical anomaly)
        final_score = (heuristic_score * 0.70) + (ml_score * 0.30)
        final_score = max(0.02, min(0.99, final_score))
        final_score = round(final_score, 3)

        # Determine Tier
        if final_score >= 0.85:
            tier = "CRITICAL"
            action = "HOLD_FOR_PHYSICAL_INSPECTION"
        elif final_score >= 0.60:
            tier = "HIGH"
            action = "MANUAL_REVIEW_REQUIRED"
        elif final_score >= 0.30:
            tier = "MEDIUM"
            action = "STANDARD_DOCUMENT_CHECK"
        else:
            tier = "LOW"
            action = "AUTO_APPROVE"

        from app.explainer import explain
        explanation_text = explain(booking, final_score, tier, risk_factors)

        return ScoreResponse(
            booking_id=booking.booking_id,
            risk_score=final_score,
            risk_tier=tier,
            risk_factors=risk_factors,
            explanation=explanation_text,
            recommended_action=action,
        )


# Global singleton instance
_engine = RiskEngine()


def score(booking: BookingRequest) -> ScoreResponse:
    """Convenience wrapper for RiskEngine.score()."""
    return _engine.score(booking)
