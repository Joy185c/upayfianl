"""
Synthetic Data Generator for Upay ImpactIQ Platform
Generates realistic MFS customer data with behavioral patterns
that enable meaningful ML model training and inference.
"""
import json
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# Seed for reproducibility
random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
NOW = datetime(2026, 10, 1, 12, 0, 0)
REGIONS = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Mymensingh", "Rangpur"]
OPERATORS = ["Grameenphone", "Robi", "Banglalink", "Teletalk", "Airtel"]
MERCHANTS = [
    "ABC Restaurant", "Pathao Food", "Shajgoj", "Daraz", "Chaldal",
    "Meena Bazar", "Agora", "Unimart", "Star Kabab", "Pizza Hut BD",
    "Foodpanda", "Shohoz", "Bongo", "Robi Top-Up", "Shohoj",
    "KFC Bangladesh", "Nando's BD", "Coffee World", "Halal Grill", "City Clinic"
]
BILL_CATEGORIES = ["electricity", "gas", "water", "internet", "education", "tv"]
BILL_PROVIDERS = {
    "electricity": ["DESCO", "DPDC", "REB"],
    "gas": ["Titas Gas", "Karnaphuli Gas"],
    "water": ["WASA"],
    "internet": ["BDCOM", "Link3", "AmberIT", "Carnival"],
    "education": ["NSTU", "BUET", "DU", "Private University"],
    "tv": ["Maasranga Cable", "Star Cable", "Cable Vision"]
}

OFFER_TYPES = [
    "merchant_cashback",
    "recharge_cashback",
    "bill_payment_discount",
    "send_money_offer",
    "no_promotional_action"
]

CHANNELS = ["push", "sms", "in_app", "email"]

# ─────────────────────────────────────────────────────────────────────────────
# CUSTOMER CLUSTER PROFILES
# ─────────────────────────────────────────────────────────────────────────────
CLUSTER_PROFILES = {
    "new": {
        "weight": 0.08,
        "account_age_days": (1, 30),
        "balance": (500, 5000),
        "transactions_30d": (1, 5),
        "merchant_heavy": False,
        "recharge_heavy": False,
        "segment": "new",
        "lifecycle_stage": "acquisition",
        "offer_sensitivity": 0.7,
        "fatigue_base": 0.05,
    },
    "active": {
        "weight": 0.25,
        "account_age_days": (90, 730),
        "balance": (1000, 20000),
        "transactions_30d": (8, 20),
        "merchant_heavy": False,
        "recharge_heavy": False,
        "segment": "active",
        "lifecycle_stage": "retention",
        "offer_sensitivity": 0.5,
        "fatigue_base": 0.2,
    },
    "high_value": {
        "weight": 0.10,
        "account_age_days": (365, 1460),
        "balance": (20000, 200000),
        "transactions_30d": (15, 40),
        "merchant_heavy": True,
        "recharge_heavy": False,
        "segment": "high_value",
        "lifecycle_stage": "retention",
        "offer_sensitivity": 0.3,
        "fatigue_base": 0.25,
    },
    "merchant_heavy": {
        "weight": 0.12,
        "account_age_days": (180, 900),
        "balance": (2000, 30000),
        "transactions_30d": (10, 30),
        "merchant_heavy": True,
        "recharge_heavy": False,
        "segment": "merchant_heavy",
        "lifecycle_stage": "retention",
        "offer_sensitivity": 0.65,
        "fatigue_base": 0.15,
    },
    "recharge_heavy": {
        "weight": 0.12,
        "account_age_days": (90, 730),
        "balance": (300, 5000),
        "transactions_30d": (6, 20),
        "merchant_heavy": False,
        "recharge_heavy": True,
        "segment": "recharge_heavy",
        "lifecycle_stage": "retention",
        "offer_sensitivity": 0.7,
        "fatigue_base": 0.2,
    },
    "dormant": {
        "weight": 0.13,
        "account_age_days": (365, 1460),
        "balance": (100, 3000),
        "transactions_30d": (0, 2),
        "merchant_heavy": False,
        "recharge_heavy": False,
        "segment": "dormant",
        "lifecycle_stage": "winback",
        "offer_sensitivity": 0.4,
        "fatigue_base": 0.05,
    },
    "winback": {
        "weight": 0.08,
        "account_age_days": (180, 900),
        "balance": (200, 4000),
        "transactions_30d": (1, 5),
        "merchant_heavy": False,
        "recharge_heavy": False,
        "segment": "winback",
        "lifecycle_stage": "winback",
        "offer_sensitivity": 0.75,
        "fatigue_base": 0.08,
    },
    "offer_sensitive": {
        "weight": 0.07,
        "account_age_days": (90, 730),
        "balance": (500, 10000),
        "transactions_30d": (5, 18),
        "merchant_heavy": False,
        "recharge_heavy": True,
        "segment": "offer_sensitive",
        "lifecycle_stage": "activation",
        "offer_sensitivity": 0.9,
        "fatigue_base": 0.1,
    },
    "offer_fatigued": {
        "weight": 0.05,
        "account_age_days": (180, 900),
        "balance": (1000, 15000),
        "transactions_30d": (5, 15),
        "merchant_heavy": False,
        "recharge_heavy": False,
        "segment": "offer_fatigued",
        "lifecycle_stage": "retention",
        "offer_sensitivity": 0.15,
        "fatigue_base": 0.85,
    },
}

FIRST_NAMES = [
    "Rahim", "Karim", "Ruhul", "Jamal", "Faisal", "Sakib", "Yuvaraj", "Mehedi",
    "Tanvir", "Imran", "Nazrul", "Rafiq", "Bashir", "Omar", "Siddiq",
    "Fatima", "Nusrat", "Taslima", "Shirin", "Roksana", "Mitu", "Jharna",
    "Naima", "Sharmin", "Dilruba", "Hasina", "Moriam", "Sumaiya", "Shamima", "Lina",
    "Kabir", "Salim", "Hasan", "Ahsan", "Mosarof", "Jubayer", "Rakib", "Pavel",
]
LAST_NAMES = [
    "Ahmed", "Khan", "Rahman", "Islam", "Hossain", "Ali", "Chowdhury",
    "Begum", "Akter", "Mollah", "Sarker", "Mondal", "Sheikh", "Mia", "Roy",
]


def random_date(days_back_min: int, days_back_max: int) -> datetime:
    """Generate a random datetime within the given range from NOW."""
    delta = random.randint(days_back_min * 24 * 60, days_back_max * 24 * 60)
    return NOW - timedelta(minutes=delta)


def weighted_choice(profiles: Dict) -> str:
    """Choose a cluster based on weights."""
    clusters = list(profiles.keys())
    weights = [profiles[c]["weight"] for c in clusters]
    return random.choices(clusters, weights=weights, k=1)[0]


def generate_customer(idx: int, cluster_name: str) -> Dict:
    """Generate a single customer record."""
    profile = CLUSTER_PROFILES[cluster_name]
    age_min, age_max = profile["account_age_days"]
    balance_min, balance_max = profile["balance"]

    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)

    account_age = random.randint(age_min, age_max)
    balance = round(random.uniform(balance_min, balance_max), 2)

    # Preferred activity hour (e.g. evening users)
    if cluster_name in ("merchant_heavy", "high_value"):
        preferred_hour = random.choice([18, 19, 20, 21, 12, 13])
    elif cluster_name == "recharge_heavy":
        preferred_hour = random.choice([8, 9, 19, 20, 21])
    else:
        preferred_hour = random.randint(8, 22)

    return {
        "customer_id": f"C{1000 + idx}",
        "display_name": f"{first} {last}",
        "phone_number": f"01{random.randint(3,9)}{random.randint(10000000, 99999999)}",
        "region": random.choice(REGIONS),
        "segment": cluster_name,
        "lifecycle_stage": profile["lifecycle_stage"],
        "balance": balance,
        "account_age_days": account_age,
        "preferred_hour": preferred_hour,
        "preferred_channel": random.choice(CHANNELS),
        "offer_sensitivity": profile["offer_sensitivity"] + random.uniform(-0.1, 0.1),
        "fatigue_base": profile["fatigue_base"] + random.uniform(-0.05, 0.05),
        "is_merchant_heavy": profile["merchant_heavy"],
        "is_recharge_heavy": profile["recharge_heavy"],
    }


def generate_transactions(customer: Dict, num_transactions: int) -> List[Dict]:
    """Generate realistic transactions for a customer."""
    transactions = []
    balance = customer["balance"]
    cluster = customer["segment"]

    for i in range(num_transactions):
        # Pick transaction type based on cluster
        if customer["is_merchant_heavy"]:
            tx_type = random.choices(
                ["merchant_payment", "recharge", "send_money", "bill_payment", "add_money", "cash_out"],
                weights=[0.45, 0.15, 0.15, 0.15, 0.05, 0.05]
            )[0]
        elif customer["is_recharge_heavy"]:
            tx_type = random.choices(
                ["recharge", "merchant_payment", "send_money", "bill_payment", "add_money", "cash_out"],
                weights=[0.40, 0.20, 0.15, 0.15, 0.05, 0.05]
            )[0]
        elif cluster == "dormant":
            tx_type = random.choices(
                ["add_money", "send_money", "recharge", "merchant_payment"],
                weights=[0.30, 0.30, 0.30, 0.10]
            )[0]
        else:
            tx_type = random.choices(
                ["merchant_payment", "recharge", "send_money", "bill_payment", "add_money", "cash_out"],
                weights=[0.28, 0.22, 0.20, 0.18, 0.07, 0.05]
            )[0]

        # Amount
        if tx_type == "merchant_payment":
            amount = round(random.uniform(100, 2000), 0)
        elif tx_type == "recharge":
            amount = random.choice([50, 100, 150, 200, 300, 500])
        elif tx_type == "send_money":
            amount = round(random.uniform(100, 5000), 0)
        elif tx_type == "bill_payment":
            amount = round(random.uniform(200, 3000), 0)
        elif tx_type == "add_money":
            amount = round(random.uniform(500, 20000), 0)
        else:  # cash_out
            amount = round(random.uniform(500, 10000), 0)

        fee = round(amount * 0.01, 2) if tx_type not in ("add_money",) else 0
        total_amount = amount + fee if tx_type not in ("add_money",) else amount

        # Timestamp — spread across last 90 days with preference for preferred_hour
        days_back = random.randint(0, 90)
        hour = customer["preferred_hour"] + random.randint(-2, 2)
        hour = max(0, min(23, hour))
        timestamp = NOW - timedelta(days=days_back, hours=random.randint(0, 2), minutes=random.randint(0, 59))
        timestamp = timestamp.replace(hour=hour)

        # Counterparty details
        extra = {}
        if tx_type == "merchant_payment":
            extra["merchant_name"] = random.choice(MERCHANTS)
            extra["merchant_id"] = f"M{random.randint(100, 999)}"
            extra["counterparty_name"] = extra["merchant_name"]
        elif tx_type == "recharge":
            extra["operator"] = random.choice(OPERATORS)
            extra["mobile_number"] = customer["phone_number"]
            extra["counterparty_name"] = extra["operator"]
        elif tx_type == "send_money":
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            extra["counterparty_name"] = name
            extra["counterparty_id"] = f"C{random.randint(1000, 9999)}"
        elif tx_type == "bill_payment":
            cat = random.choice(BILL_CATEGORIES)
            extra["bill_category"] = cat
            extra["counterparty_name"] = random.choice(BILL_PROVIDERS.get(cat, ["Provider"]))
            extra["bill_account_id"] = f"BA{random.randint(100000, 999999)}"

        tx = {
            "transaction_id": f"TX{customer['customer_id'][1:]}{i:04d}",
            "type": tx_type,
            "amount": amount,
            "fee": fee,
            "total_amount": total_amount,
            "status": "completed",
            "timestamp": timestamp.isoformat(),
            **extra
        }
        transactions.append(tx)

    return sorted(transactions, key=lambda x: x["timestamp"], reverse=True)


def compute_features(customer: Dict, transactions: List[Dict]) -> Dict:
    """Compute ML features from raw transaction data."""
    now = NOW
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    ninety_days_ago = now - timedelta(days=90)

    def parse_ts(ts_str):
        return datetime.fromisoformat(ts_str)

    txs_7 = [t for t in transactions if parse_ts(t["timestamp"]) >= seven_days_ago]
    txs_30 = [t for t in transactions if parse_ts(t["timestamp"]) >= thirty_days_ago]
    txs_90 = [t for t in transactions if parse_ts(t["timestamp"]) >= ninety_days_ago]

    def count_type(txs, tx_type):
        return sum(1 for t in txs if t["type"] == tx_type)

    total_val_30 = sum(t["amount"] for t in txs_30) if txs_30 else 0
    avg_val_30 = total_val_30 / len(txs_30) if txs_30 else 0

    last_tx = transactions[0] if transactions else None
    days_since_last = 0
    if last_tx:
        delta = now - parse_ts(last_tx["timestamp"])
        days_since_last = delta.days

    merchant_30 = count_type(txs_30, "merchant_payment")
    recharge_30 = count_type(txs_30, "recharge")
    bill_30 = count_type(txs_30, "bill_payment")
    send_30 = count_type(txs_30, "send_money")
    cashout_30 = count_type(txs_30, "cash_out")

    total_30 = len(txs_30)
    def pct(n): return round(n / total_30, 3) if total_30 > 0 else 0

    # Activity trend: compare last 15 days vs prior 15 days
    fifteen_ago = now - timedelta(days=15)
    recent_15 = len([t for t in txs_30 if parse_ts(t["timestamp"]) >= fifteen_ago])
    prior_15 = len(txs_30) - recent_15
    if prior_15 > 0:
        trend = (recent_15 - prior_15) / prior_15
    elif recent_15 > 0:
        trend = 1.0
    else:
        trend = -1.0

    # Most used service
    type_counts = {
        "merchant_payment": merchant_30,
        "recharge": recharge_30,
        "bill_payment": bill_30,
        "send_money": send_30,
        "cash_out": cashout_30,
    }
    most_used = max(type_counts, key=type_counts.get) if any(type_counts.values()) else "none"

    return {
        "transactions_7d": len(txs_7),
        "transactions_30d": total_30,
        "transactions_90d": len(txs_90),
        "avg_transaction_value_30d": round(avg_val_30, 2),
        "total_transaction_value_30d": round(total_val_30, 2),
        "days_since_last_transaction": days_since_last,
        "recharge_count_30d": recharge_30,
        "merchant_payment_count_30d": merchant_30,
        "bill_payment_count_30d": bill_30,
        "send_money_count_30d": send_30,
        "cashout_count_30d": cashout_30,
        "activity_trend": round(trend, 3),
        "preferred_hour": customer["preferred_hour"],
        "most_used_service": most_used,
        "merchant_payment_pct": pct(merchant_30),
        "recharge_pct": pct(recharge_30),
        "bill_payment_pct": pct(bill_30),
        "send_money_pct": pct(send_30),
    }


def generate_campaign_history(customer: Dict) -> List[Dict]:
    """Generate campaign exposure history."""
    cluster = customer["segment"]
    history = []

    # High-fatigue customers received many offers
    if cluster == "offer_fatigued":
        n_offers = random.randint(8, 15)
    elif cluster in ("offer_sensitive", "active", "high_value"):
        n_offers = random.randint(2, 5)
    elif cluster in ("dormant", "new"):
        n_offers = random.randint(0, 2)
    else:
        n_offers = random.randint(1, 4)

    campaigns = [f"CMP{100 + i}" for i in range(20)]

    for i in range(n_offers):
        days_back = random.randint(1, 60)
        offer = random.choice(OFFER_TYPES[:-1])
        exposed_at = (NOW - timedelta(days=days_back)).isoformat()

        # Response probability based on sensitivity
        sensitivity = customer["offer_sensitivity"]
        responded = random.random() < sensitivity
        redeemed = responded and random.random() < 0.7

        status = "redeemed" if redeemed else ("responded" if responded else "exposed")

        history.append({
            "campaign_id": random.choice(campaigns),
            "offer_type": offer,
            "channel": random.choice(CHANNELS),
            "status": status,
            "timestamp": exposed_at,
        })

    return sorted(history, key=lambda x: x["timestamp"], reverse=True)


def compute_campaign_features(campaign_history: List[Dict]) -> Dict:
    """Compute campaign-related features."""
    now = NOW
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    def parse_ts(ts_str):
        return datetime.fromisoformat(ts_str)

    hist_7 = [h for h in campaign_history if parse_ts(h["timestamp"]) >= seven_days_ago]
    hist_30 = [h for h in campaign_history if parse_ts(h["timestamp"]) >= thirty_days_ago]

    responded_30 = [h for h in hist_30 if h["status"] in ("responded", "redeemed")]
    redeemed_30 = [h for h in hist_30 if h["status"] == "redeemed"]

    response_rate = len(responded_30) / len(hist_30) if hist_30 else 0
    redemption_rate = len(redeemed_30) / len(hist_30) if hist_30 else 0

    # Same-category offer count (using last 5 offers of same type)
    if campaign_history:
        latest_type = campaign_history[0]["offer_type"]
        same_cat = sum(1 for h in hist_30 if h["offer_type"] == latest_type)
    else:
        same_cat = 0
        latest_type = None

    days_since_last = 999
    if campaign_history:
        delta = now - parse_ts(campaign_history[0]["timestamp"])
        days_since_last = delta.days

    return {
        "offers_received_7d": len(hist_7),
        "offers_received_30d": len(hist_30),
        "campaign_response_rate_30d": round(response_rate, 3),
        "campaign_redemption_rate_30d": round(redemption_rate, 3),
        "same_category_offer_count": same_cat,
        "days_since_last_offer": days_since_last,
    }


def compute_fatigue_score(campaign_features: Dict, customer: Dict) -> Dict:
    """Estimate fatigue score."""
    base = customer["fatigue_base"]
    offers_7d = campaign_features["offers_received_7d"]
    offers_30d = campaign_features["offers_received_30d"]
    same_cat = campaign_features["same_category_offer_count"]
    response_rate = campaign_features["campaign_response_rate_30d"]

    # Increase fatigue with more offers, same-category spam, low response
    fatigue = base
    fatigue += min(offers_7d * 0.08, 0.3)
    fatigue += min(offers_30d * 0.02, 0.2)
    fatigue += min(same_cat * 0.05, 0.15)
    fatigue -= response_rate * 0.2  # responding = less fatigue
    fatigue = max(0.0, min(1.0, fatigue + random.uniform(-0.03, 0.03)))

    if fatigue < 0.35:
        level = "low"
    elif fatigue < 0.65:
        level = "medium"
    else:
        level = "high"

    return {"fatigue_score": round(fatigue, 3), "fatigue_level": level}


def compute_response_probabilities(customer: Dict, features: Dict, fatigue: Dict) -> Dict:
    """
    Estimate response probabilities for the uplift model.
    P(response | offer) vs P(response | no offer)
    Uses a hand-crafted but realistic formula based on behavioral features.
    """
    sensitivity = customer["offer_sensitivity"]
    fatigue_score = fatigue["fatigue_score"]
    tx_30 = features["transactions_30d"]
    days_since_last = features["days_since_last_transaction"]

    # Base response probability without offer (purely behavioral)
    base_no_offer = 0.2 + (tx_30 / 40) * 0.3
    base_no_offer *= (1 - (days_since_last / 90) * 0.5)
    base_no_offer = max(0.05, min(0.7, base_no_offer + random.gauss(0, 0.03)))

    # Response with offer boosts it by sensitivity, reduced by fatigue
    offer_boost = sensitivity * 0.6 * (1 - fatigue_score * 0.5)
    p_with_offer = base_no_offer + offer_boost
    p_with_offer = max(0.0, min(0.98, p_with_offer + random.gauss(0, 0.03)))

    uplift = p_with_offer - base_no_offer

    return {
        "response_probability": round(p_with_offer, 3),
        "response_probability_no_offer": round(base_no_offer, 3),
        "uplift_score": round(uplift, 3),
    }


def compute_uplift_segment(uplift_score: float, response_prob: float, response_prob_no_offer: float) -> str:
    """Classify customer into uplift segments."""
    if uplift_score >= 0.15 and response_prob < 0.85:
        return "persuadable"
    elif response_prob >= 0.75 and response_prob_no_offer >= 0.60:
        return "sure_thing"
    elif response_prob < 0.25 and uplift_score < 0.05:
        return "lost_cause"
    elif response_prob_no_offer >= 0.60 and uplift_score < 0.05:
        return "sleeping_dog"
    else:
        return "persuadable"


def compute_next_best_offer(
    customer: Dict,
    features: Dict,
    fatigue: Dict,
    responses: Dict
) -> Dict:
    """Determine the next best offer/action."""
    fatigue_level = fatigue["fatigue_level"]
    uplift = responses["uplift_score"]
    lifecycle = customer["lifecycle_stage"]

    # No promo if high fatigue
    if fatigue_level == "high" and uplift < 0.15:
        return {
            "recommended_offer": "no_promotional_action",
            "recommended_channel": customer["preferred_channel"],
            "recommended_time": f"{customer['preferred_hour']}:00",
            "nbo_confidence": round(0.7 + random.uniform(0, 0.2), 3),
            "expected_value": 0.0,
            "decision_reasoning": "High fatigue risk detected. Suppressing promotional action to protect customer experience."
        }

    # Score each offer type
    merchant_pct = features["merchant_payment_pct"]
    recharge_pct = features["recharge_pct"]
    bill_pct = features["bill_payment_pct"]

    offer_scores = {
        "merchant_cashback": merchant_pct * 2.0 + (0.5 if lifecycle == "retention" else 0),
        "recharge_cashback": recharge_pct * 2.0 + (0.3 if customer["is_recharge_heavy"] else 0),
        "bill_payment_discount": bill_pct * 1.5,
        "send_money_offer": features.get("send_money_pct", 0) * 1.2,
    }

    # Lifecycle boosts
    if lifecycle == "winback":
        offer_scores["merchant_cashback"] += 0.3
        offer_scores["recharge_cashback"] += 0.3
    elif lifecycle == "acquisition":
        offer_scores["send_money_offer"] += 0.4

    # Sort by score
    best_offer = max(offer_scores, key=offer_scores.get)
    best_score = offer_scores[best_offer]

    # If best score is too low, use reminder instead
    if best_score < 0.15 and lifecycle not in ("winback",):
        best_offer = "activity_reminder"

    expected_value = round(best_score * uplift * 500, 2)

    reasoning_map = {
        "merchant_cashback": "Frequent merchant payment activity indicates high relevance for merchant cashback offer.",
        "recharge_cashback": "Regular recharge behavior makes recharge cashback the highest-impact offer.",
        "bill_payment_discount": "Bill payment history suggests a bill discount offer is well-timed.",
        "send_money_offer": "Send money activity pattern indicates relevance for transfer offer.",
        "activity_reminder": "Low activity trend detected. Sending engagement reminder.",
    }

    return {
        "recommended_offer": best_offer,
        "recommended_channel": customer["preferred_channel"],
        "recommended_time": f"{customer['preferred_hour']}:00",
        "nbo_confidence": round(min(0.95, 0.5 + best_score + uplift * 0.3), 3),
        "expected_value": expected_value,
        "decision_reasoning": reasoning_map.get(best_offer, "Selected based on behavioral features.")
    }


def generate_preferences(customer: Dict) -> Dict:
    """Generate communication preferences."""
    fatigued = customer["segment"] == "offer_fatigued"
    return {
        "merchant_offer_allowed": not (fatigued and random.random() < 0.5),
        "recharge_offer_allowed": not (fatigued and random.random() < 0.3),
        "bill_reminder_allowed": True,
        "promotional_allowed": not fatigued,
        "marketing_consent": not (fatigued and random.random() < 0.2),
        "offer_frequency": "less" if fatigued else random.choice(["less", "balanced", "balanced", "more"]),
        "preferred_channel": customer["preferred_channel"],
    }


def generate_experiment_result(customer: Dict, experiment_id: str) -> Optional[Dict]:
    """Assign customer to experiment variant."""
    # Only include ~30% of customers in experiments
    if random.random() > 0.30:
        return None

    variant = random.choice(["control", "treatment_a", "treatment_b"])
    offer_type = None if variant == "control" else random.choice(["merchant_cashback_10", "merchant_cashback_5"])

    responded = False
    redeemed = False
    if variant == "control":
        responded = random.random() < customer["offer_sensitivity"] * 0.3
    else:
        responded = random.random() < customer["offer_sensitivity"] * 0.8
    redeemed = responded and random.random() < 0.7

    return {
        "experiment_id": experiment_id,
        "variant": variant,
        "offer_type": offer_type,
        "responded": responded,
        "redeemed": redeemed,
        "transaction_value": round(random.uniform(200, 1500), 2) if responded else None,
        "cost": 50.0 if (variant != "control" and redeemed) else 0.0,
        "exposed_at": (NOW - timedelta(days=random.randint(5, 30))).isoformat(),
    }


def generate_notifications(customer: Dict, features: Dict, nbo: Dict) -> List[Dict]:
    """Generate 2-5 notifications for a customer."""
    notifs = []

    if nbo["recommended_offer"] not in ("no_promotional_action",):
        offer_map = {
            "merchant_cashback": ("🎁 Merchant Cashback Available!", "A merchant cashback benefit relevant to your recent activity is available."),
            "recharge_cashback": ("📱 Recharge Offer Available!", "A recharge cashback offer is available for you this week."),
            "bill_payment_discount": ("💡 Bill Payment Discount!", "Save on your next bill payment with an exclusive offer."),
            "send_money_offer": ("💸 Send Money Offer!", "Get a special benefit on your next money transfer."),
            "activity_reminder": ("👋 We miss you!", "You haven't transacted recently. Come back and explore your benefits."),
        }
        title, msg = offer_map.get(nbo["recommended_offer"], ("New Benefit", "A new benefit is available for you."))
        notifs.append({
            "title": title,
            "message": msg,
            "type": "offer",
            "is_ai_generated": True,
        })

    if features["days_since_last_transaction"] > 14:
        notifs.append({
            "title": "👋 Activity Reminder",
            "message": "You haven't made a transaction recently. Your account is ready whenever you need it.",
            "type": "reminder",
            "is_ai_generated": True,
        })

    notifs.append({
        "title": "🔔 Transaction Complete",
        "message": f"Your recent transaction was processed successfully.",
        "type": "info",
        "is_ai_generated": False,
    })

    return notifs


def generate_full_dataset(n_customers: int = 1000) -> Dict:
    """Generate the full synthetic dataset."""
    print(f"Generating {n_customers} customers...")
    customers_data = []
    experiment_id = "EXP01"

    for i in range(n_customers):
        if i % 100 == 0:
            print(f"  Processing customer {i}/{n_customers}...")

        # Select cluster
        cluster = weighted_choice(CLUSTER_PROFILES)
        profile = CLUSTER_PROFILES[cluster]

        # Generate customer
        customer = generate_customer(i + 1, cluster)

        # Generate transactions
        tx_min, tx_max = profile["transactions_30d"]
        # 90-day total = roughly 3x 30-day + some variance
        n_transactions = random.randint(tx_min * 2, tx_max * 3 + 5)
        transactions = generate_transactions(customer, n_transactions)

        # Compute features
        tx_features = compute_features(customer, transactions)
        campaign_history = generate_campaign_history(customer)
        campaign_features = compute_campaign_features(campaign_history)

        # Merge features
        all_features = {**tx_features, **campaign_features}

        # AI predictions
        fatigue = compute_fatigue_score(campaign_features, customer)
        responses = compute_response_probabilities(customer, all_features, fatigue)
        uplift_segment = compute_uplift_segment(
            responses["uplift_score"],
            responses["response_probability"],
            responses["response_probability_no_offer"]
        )

        # Next best offer
        nbo = compute_next_best_offer(customer, all_features, fatigue, responses)

        # Preferences
        preferences = generate_preferences(customer)

        # Experiment
        exp_result = generate_experiment_result(customer, experiment_id)

        # Notifications
        notifications = generate_notifications(customer, all_features, nbo)

        # Next likely behavior
        next_behavior_map = {
            "merchant_payment": "Merchant Payment",
            "recharge": "Mobile Recharge",
            "bill_payment": "Bill Payment",
            "send_money": "Send Money",
            "cash_out": "Cash Out",
            "none": "Account Reactivation",
        }
        next_behavior = next_behavior_map.get(all_features.get("most_used_service", "none"), "Merchant Payment")

        # Decision trace
        decision_trace = {
            "raw_data_summary": {
                "customer_id": customer["customer_id"],
                "segment": customer["segment"],
                "account_age_days": customer["account_age_days"],
                "balance": customer["balance"],
                "total_transactions_loaded": len(transactions),
            },
            "features_used": all_features,
            "response_score": responses["response_probability"],
            "response_score_no_offer": responses["response_probability_no_offer"],
            "uplift_score": responses["uplift_score"],
            "uplift_segment": uplift_segment,
            "lifecycle_stage": customer["lifecycle_stage"],
            "fatigue_score": fatigue["fatigue_score"],
            "fatigue_level": fatigue["fatigue_level"],
            "eligibility_checks": {
                "marketing_consent": preferences["marketing_consent"],
                "promotional_allowed": preferences["promotional_allowed"],
                "sufficient_activity": all_features["transactions_30d"] > 0,
            },
            "business_constraints": {
                "max_fatigue_threshold": 0.65,
                "min_uplift_threshold": 0.05,
                "campaign_budget_available": True,
            },
            "expected_value": nbo["expected_value"],
            "final_decision": nbo["recommended_offer"],
            "decision_reasoning": nbo["decision_reasoning"],
        }

        customers_data.append({
            "customer": customer,
            "transactions": transactions,
            "features": all_features,
            "campaign_history": campaign_history,
            "experiment_result": exp_result,
            "preferences": preferences,
            "predictions": {
                **responses,
                "uplift_segment": uplift_segment,
                "lifecycle_stage": customer["lifecycle_stage"],
                "next_likely_behavior": next_behavior,
                **fatigue,
                **nbo,
            },
            "decision_trace": decision_trace,
            "notifications": notifications,
        })

    print(f"Done! Generated {n_customers} customers with {sum(len(c['transactions']) for c in customers_data)} transactions.")
    return {
        "generated_at": NOW.isoformat(),
        "n_customers": n_customers,
        "customers": customers_data,
    }


if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    dataset = generate_full_dataset(n)
    output_path = "data/synthetic_dataset.json"
    import os
    os.makedirs("data", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Saved to {output_path}")
