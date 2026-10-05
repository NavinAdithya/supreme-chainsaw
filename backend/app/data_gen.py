"""Data generation module for FraudShield.

Generates realistic synthetic shipment booking datasets containing both
legitimate and fraudulent patterns for demonstration, simulation, and model training.
"""

from typing import List
import random
from datetime import datetime, timedelta

from app.schemas import BookingRequest

LEGITIMATE_SHIPPERS = [
    "Samsung Electronics APAC",
    "Siemens Industrial AG",
    "Novartis Pharma Global",
    "Bosch Automotive Systems",
    "Foxconn Logistics Ltd",
    "Maersk Freight Forwarding",
    "Toyota Tsusho Corp",
    "Unilever Global Supply",
    "ArcelorMittal Steel EU",
    "Schneider Electric Hub",
    "LVMH Luxury Distribution",
    "Sony Supply Chain Solutions",
    "BASF Chemical Logistics",
]

SUSPICIOUS_SHIPPERS = [
    "Offshore Trade Holdings LLC",
    "Panama QuickCargo S.A.",
    "Apex Anonymous Forwarders",
    "Shadow Logistics FZE",
    "FastCash Import Export Ltd",
    "Universal Shell Corp",
    "Global Trade Ltd",
]

LEGITIMATE_CONSIGNEES = [
    "Apple Operations Americas",
    "Walmart Global Sourcing",
    "Pfizer European Distribution",
    "BMW North America Parts",
    "Amazon Fulfillment Centers",
    "DHL Supply Chain Hub",
    "Target Logistics Network",
    "Medtronic Global Distribution",
    "Boeing Commercial Spares",
    "Costco Wholesale Freight",
    "Carrefour Central Logistics",
]

STANDARD_COUNTRIES = ["US", "DE", "CN", "JP", "SG", "NL", "GB", "KR", "FR", "IN", "MX", "VN", "CA", "AE"]
HIGH_RISK_COUNTRIES = ["IR", "SY", "CU", "VE", "RU", "MM", "BY"]
TRANSIT_HUBS = ["CY", "VG", "KY", "PA", "BZ"]

CARGO_PROFILES = [
    {"type": "Electronics", "val_range": (20000, 250000), "wt_range": (100, 2000)},
    {"type": "Pharmaceuticals", "val_range": (50000, 400000), "wt_range": (100, 1500)},
    {"type": "Luxury Goods", "val_range": (80000, 600000), "wt_range": (50, 500)},
    {"type": "Textiles", "val_range": (10000, 80000), "wt_range": (500, 5000)},
    {"type": "Industrial Machinery", "val_range": (40000, 300000), "wt_range": (1000, 10000)},
    {"type": "Scrap Metal", "val_range": (5000, 40000), "wt_range": (3000, 25000)},
    {"type": "Chemicals", "val_range": (25000, 150000), "wt_range": (800, 6000)},
    {"type": "Automotive Parts", "val_range": (30000, 180000), "wt_range": (500, 4000)},
]

LEGITIMATE_PAYMENTS = [
    "Letter of Credit",
    "Corporate Wire Transfer",
    "Commercial Trade Credit",
]

SUSPICIOUS_PAYMENTS = [
    "Cryptocurrency",
    "Anonymous Prepaid Card",
    "Third-Party Remittance",
    "Cash on Delivery",
]


def generate_bookings(count: int = 50, fraud_ratio: float = 0.25) -> List[BookingRequest]:
    """Generate a synthetic batch of shipment booking requests with controlled fraud ratio.

    Args:
        count: Total number of booking records to synthesize.
        fraud_ratio: Proportion of simulated bookings exhibiting fraud indicators.

    Returns:
        List[BookingRequest]: Generated synthetic shipment booking objects.
    """
    bookings: List[BookingRequest] = []
    base_date = datetime.now()

    num_fraud = int(count * fraud_ratio)
    fraud_indices = set(random.sample(range(count), num_fraud))

    for idx in range(count):
        booking_id = f"BK-{random.randint(10000, 99999)}"
        days_offset = random.randint(-14, 2)
        ship_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        is_fraud = idx in fraud_indices

        if not is_fraud:
            # Generate normal legitimate commercial booking
            profile = random.choice(CARGO_PROFILES)
            cargo_type = profile["type"]
            declared_value = round(random.uniform(*profile["val_range"]), 2)
            weight_kg = round(random.uniform(*profile["wt_range"]), 1)
            
            orig = random.choice(STANDARD_COUNTRIES)
            dest = random.choice([c for c in STANDARD_COUNTRIES if c != orig])
            shipper = random.choice(LEGITIMATE_SHIPPERS)
            consignee = random.choice(LEGITIMATE_CONSIGNEES)
            payment = random.choice(LEGITIMATE_PAYMENTS)

        else:
            # Inject one of several distinct fraud archetypes
            fraud_type = random.choice(["tbml", "under_invoicing", "high_risk_corridor", "shell_shipper", "phantom"])
            
            if fraud_type == "tbml":
                # Over-invoicing: Low value cargo declared at astronomical value (Money Laundering)
                cargo_type = "Scrap Metal"
                declared_value = round(random.uniform(250000, 850000), 2)
                weight_kg = round(random.uniform(200, 800), 1)  # $500+/kg for scrap
                orig = random.choice(STANDARD_COUNTRIES)
                dest = random.choice(TRANSIT_HUBS)
                shipper = random.choice(SUSPICIOUS_SHIPPERS)
                consignee = random.choice(LEGITIMATE_CONSIGNEES)
                payment = "Third-Party Remittance"

            elif fraud_type == "under_invoicing":
                # Severe tariff evasion: High value electronics declared for next to nothing
                cargo_type = "Electronics"
                declared_value = round(random.uniform(3000, 8000), 2)
                weight_kg = round(random.uniform(1500, 4000), 1)  # $1-$2/kg for electronics
                orig = random.choice(STANDARD_COUNTRIES)
                dest = random.choice(STANDARD_COUNTRIES)
                shipper = random.choice(SUSPICIOUS_SHIPPERS)
                consignee = random.choice(LEGITIMATE_CONSIGNEES)
                payment = random.choice(SUSPICIOUS_PAYMENTS)

            elif fraud_type == "high_risk_corridor":
                # Sanctioned or monitored route with crypto
                profile = random.choice(CARGO_PROFILES)
                cargo_type = profile["type"]
                declared_value = round(random.uniform(80000, 400000), 2)
                weight_kg = round(random.uniform(500, 3000), 1)
                orig = random.choice(HIGH_RISK_COUNTRIES)
                dest = random.choice(STANDARD_COUNTRIES)
                shipper = random.choice(SUSPICIOUS_SHIPPERS)
                consignee = random.choice(LEGITIMATE_CONSIGNEES)
                payment = "Cryptocurrency"

            elif fraud_type == "shell_shipper":
                # Circular shell entity with high cash on delivery
                cargo_type = "Luxury Goods"
                declared_value = round(random.uniform(120000, 500000), 2)
                weight_kg = round(random.uniform(40, 200), 1)
                orig = random.choice(TRANSIT_HUBS)
                dest = "US"
                shell_name = random.choice(SUSPICIOUS_SHIPPERS)
                shipper = shell_name
                consignee = shell_name  # Circular cross-border entity
                payment = "Cash on Delivery"

            else:  # phantom freight
                cargo_type = "Industrial Machinery"
                declared_value = round(random.uniform(150000, 600000), 2)
                weight_kg = round(random.uniform(1.5, 4.0), 1)  # Impossible machine weight
                orig = random.choice(STANDARD_COUNTRIES)
                dest = random.choice(STANDARD_COUNTRIES)
                shipper = random.choice(SUSPICIOUS_SHIPPERS)
                consignee = random.choice(LEGITIMATE_CONSIGNEES)
                payment = "Anonymous Prepaid Card"

        bookings.append(
            BookingRequest(
                booking_id=booking_id,
                shipper_name=shipper,
                consignee_name=consignee,
                origin_country=orig,
                destination_country=dest,
                cargo_type=cargo_type,
                declared_value=declared_value,
                weight_kg=weight_kg,
                shipping_date=ship_date,
                payment_method=payment,
            )
        )

    return bookings
