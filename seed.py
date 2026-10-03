#!/usr/bin/env python3
"""
Seed script for Upay ImpactIQ Platform
Populates the database (SQLite or PostgreSQL/Supabase) with demo data.

Usage:
    # Local (SQLite):
    python seed.py

    # Production (Supabase):
    DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" python seed.py

    # Or set in .env:
    # DATABASE_URL=postgresql://...
    # Then: python seed.py
"""

import sys
import os
import random
from datetime import datetime, timedelta, timezone

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.campaign import Campaign, CampaignExposure
from app.models.experiment import Experiment, ExperimentResult
from app.models.intelligence import (
    CustomerPreference, CustomerFeature, CustomerPrediction,
    DecisionTrace, Notification
)
from app.core.auth import get_password_hash

from faker import Faker

fake = Faker("en_US")
random.seed(42)

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def days_ago(n):
    return utcnow() - timedelta(days=n)

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────
NUM_CUSTOMERS       = 50    # number of demo customers (C1001 … C1050)
NUM_TRANSACTIONS    = 800   # transactions to generate
NUM_CAMPAIGNS       = 6
NUM_EXPERIMENTS     = 3

SEGMENTS = ["active", "dormant", "high_value", "new", "churned", "at_risk"]
REGIONS  = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur"]
TX_TYPES = ["send_money", "recharge", "merchant_payment", "bill_payment", "cash_out", "add_money"]
CHANNELS = ["push", "sms", "email", "in_app"]
OFFER_TYPES = ["recharge_cashback", "merchant_cashback", "bill_payment_discount",
               "send_money_bonus", "cashback_flat", "referral_bonus"]

def seed():
    print("🌱  Creating tables…")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── 0. Check if already seeded ────────────────────────────────────────
        if db.query(User).count() > 0:
            print("✅  Database already seeded. Skipping. (drop tables manually to re-seed)")
            return

        print("👤  Creating authority user…")
        authority_user = User(
            email="authority@upay.com",
            hashed_password=get_password_hash("auth123"),
            role="authority",
            is_active=True,
        )
        db.add(authority_user)
        db.flush()

        print(f"👥  Creating {NUM_CUSTOMERS} customers…")
        customers = []
        for i in range(1, NUM_CUSTOMERS + 1):
            cid = f"C{1000 + i}"
            email = f"c{1000 + i}@upay.com"
            segment = random.choice(SEGMENTS)
            account_age = random.randint(30, 1200)

            u = User(
                email=email,
                hashed_password=get_password_hash("pass123"),
                role="customer",
                is_active=True,
            )
            db.add(u)
            db.flush()

            c = Customer(
                user_id=u.id,
                customer_id=cid,
                display_name=fake.name(),
                phone_number=f"017{random.randint(10000000, 99999999)}",
                region=random.choice(REGIONS),
                segment=segment,
                balance=round(random.uniform(50, 50000), 2),
                account_age_days=account_age,
                is_active=True,
            )
            db.add(c)
            db.flush()
            customers.append(c)

            # Preferences
            pref = CustomerPreference(
                customer_id=c.id,
                merchant_offer_allowed=random.choice([True, True, True, False]),
                recharge_offer_allowed=random.choice([True, True, False]),
                bill_reminder_allowed=random.choice([True, True, True, False]),
                promotional_allowed=random.choice([True, True, False]),
                marketing_consent=random.choice([True, True, True, False]),
                offer_frequency=random.choice(["less", "balanced", "balanced", "more"]),
                preferred_channel=random.choice(CHANNELS),
            )
            db.add(pref)

        db.commit()

        print(f"💳  Generating {NUM_TRANSACTIONS} transactions…")
        for _ in range(NUM_TRANSACTIONS):
            c = random.choice(customers)
            tx_type = random.choice(TX_TYPES)
            amount = round(random.uniform(10, 5000), 2)
            fee = round(amount * 0.015, 2) if tx_type in ["send_money", "cash_out"] else 0.0
            ts = days_ago(random.randint(0, 90))

            tx = Transaction(
                transaction_id=f"TXN{fake.unique.random_number(digits=10)}",
                customer_id=c.id,
                type=tx_type,
                amount=amount,
                fee=fee,
                total_amount=amount + fee,
                counterparty_name=fake.name() if tx_type in ["send_money"] else None,
                note=random.choice([None, "Thanks", "Payment", ""]),
                category=tx_type.replace("_", " ").title(),
                status="completed",
                merchant_name=fake.company() if tx_type == "merchant_payment" else None,
                operator=random.choice(["Grameenphone", "Robi", "Banglalink", "Teletalk"]) if tx_type == "recharge" else None,
                mobile_number=f"017{random.randint(10000000, 99999999)}" if tx_type == "recharge" else None,
                bill_category=random.choice(["electricity", "gas", "water", "internet"]) if tx_type == "bill_payment" else None,
                timestamp=ts,
            )
            db.add(tx)

        db.commit()

        print("📊  Computing customer features & predictions…")
        for c in customers:
            # Features (simplified computation from transaction patterns)
            c_txns = [t for t in db.query(Transaction).filter(Transaction.customer_id == c.id).all()]
            now = utcnow()

            def count_txns_in_days(n):
                cutoff = now - timedelta(days=n)
                return sum(1 for t in c_txns if t.timestamp and (t.timestamp.replace(tzinfo=None) if getattr(t.timestamp, 'tzinfo', None) else t.timestamp) >= cutoff)

            def avg_value_in_days(n):
                cutoff = now - timedelta(days=n)
                vals = [t.amount for t in c_txns if t.timestamp and (t.timestamp.replace(tzinfo=None) if getattr(t.timestamp, 'tzinfo', None) else t.timestamp) >= cutoff]
                return round(sum(vals) / len(vals), 2) if vals else 0.0

            tx_30d = count_txns_in_days(30)
            type_counts = {}
            for tx in c_txns:
                type_counts[tx.type] = type_counts.get(tx.type, 0) + 1
            total_tx = len(c_txns) or 1

            feature = CustomerFeature(
                customer_id=c.id,
                transactions_7d=count_txns_in_days(7),
                transactions_30d=tx_30d,
                transactions_90d=count_txns_in_days(90),
                avg_transaction_value_30d=avg_value_in_days(30),
                total_transaction_value_30d=round(avg_value_in_days(30) * tx_30d, 2),
                days_since_last_transaction=random.randint(0, 30),
                recharge_count_30d=type_counts.get("recharge", 0),
                merchant_payment_count_30d=type_counts.get("merchant_payment", 0),
                bill_payment_count_30d=type_counts.get("bill_payment", 0),
                send_money_count_30d=type_counts.get("send_money", 0),
                cashout_count_30d=type_counts.get("cash_out", 0),
                offers_received_7d=random.randint(0, 3),
                offers_received_30d=random.randint(0, 10),
                campaign_response_rate_30d=round(random.uniform(0, 0.5), 3),
                campaign_redemption_rate_30d=round(random.uniform(0, 0.3), 3),
                same_category_offer_count=random.randint(0, 5),
                days_since_last_offer=random.randint(0, 60),
                activity_trend=round(random.uniform(-0.5, 0.5), 3),
                preferred_hour=random.randint(8, 22),
                preferred_day_of_week=random.randint(0, 6),
                merchant_payment_pct=round(type_counts.get("merchant_payment", 0) / total_tx, 3),
                recharge_pct=round(type_counts.get("recharge", 0) / total_tx, 3),
                bill_payment_pct=round(type_counts.get("bill_payment", 0) / total_tx, 3),
                send_money_pct=round(type_counts.get("send_money", 0) / total_tx, 3),
            )
            db.add(feature)

            resp_prob = round(random.uniform(0.05, 0.85), 3)
            resp_prob_no = round(resp_prob * random.uniform(0.3, 0.7), 3)
            uplift = round(resp_prob - resp_prob_no, 3)
            uplift_seg = (
                "persuadable" if uplift > 0.2 else
                "sure_thing" if resp_prob > 0.7 else
                "sleeping_dog" if uplift < 0 else
                "lost_cause"
            )
            fatigue = round(random.uniform(0, 1), 3)

            pred = CustomerPrediction(
                customer_id=c.id,
                response_probability=resp_prob,
                response_probability_no_offer=resp_prob_no,
                uplift_score=uplift,
                uplift_segment=uplift_seg,
                lifecycle_stage=random.choice(["acquisition", "activation", "retention", "winback"]),
                next_likely_behavior=random.choice(["recharge", "merchant_payment", "bill_payment", "send_money"]),
                fatigue_score=fatigue,
                fatigue_level="low" if fatigue < 0.33 else "medium" if fatigue < 0.66 else "high",
                recommended_offer=random.choice(OFFER_TYPES),
                recommended_channel=random.choice(CHANNELS),
                recommended_time=f"{random.randint(9, 21):02d}:00",
                nbo_confidence=round(random.uniform(0.5, 0.95), 3),
                expected_value=round(random.uniform(5, 200), 2),
                decision=random.choice(["send_offer", "hold", "suppress"]),
                decision_rationale="Demo: Computed from pre-seeded ML features.",
            )
            db.add(pred)

            # 2-3 notifications per customer
            for _ in range(random.randint(1, 3)):
                notif_type = random.choice(["offer", "info", "reminder", "alert"])
                notif = Notification(
                    customer_id=c.id,
                    title=random.choice([
                        "Exclusive Offer Just For You!",
                        "Cashback Alert",
                        "Bill Payment Reminder",
                        "Your Monthly Summary",
                        "New Merchant Deal",
                        "Recharge & Earn",
                    ]),
                    message=fake.sentence(nb_words=12),
                    type=notif_type,
                    is_read=random.choice([True, False]),
                    is_ai_generated=random.choice([True, False]),
                )
                db.add(notif)

        db.commit()

        print(f"📣  Creating {NUM_CAMPAIGNS} campaigns…")
        campaigns = []
        for i in range(1, NUM_CAMPAIGNS + 1):
            offer_type = random.choice(OFFER_TYPES)
            cmp = Campaign(
                campaign_id=f"CMP{100 + i}",
                name=f"Demo Campaign #{i} – {offer_type.replace('_', ' ').title()}",
                description=fake.sentence(nb_words=10),
                offer_type=offer_type,
                offer_value=round(random.uniform(5, 20), 1),
                offer_unit=random.choice(["percent", "bdt"]),
                target_segment=random.choice(SEGMENTS),
                channel=random.choice(CHANNELS),
                budget=round(random.uniform(50000, 500000), 2),
                offer_cost_per_user=round(random.uniform(5, 50), 2),
                capacity=random.randint(500, 5000),
                start_date=days_ago(random.randint(5, 30)),
                end_date=days_ago(random.randint(-30, -1)),
                status=random.choice(["active", "active", "completed", "draft"]),
                eligible_count=random.randint(100, 5000),
                predicted_responders=random.randint(50, 1000),
                high_uplift_count=random.randint(20, 500),
                high_fatigue_count=random.randint(10, 200),
                recommended_target_count=random.randint(40, 800),
                estimated_incremental_value=round(random.uniform(10000, 500000), 2),
            )
            db.add(cmp)
            db.flush()
            campaigns.append(cmp)

            # Expose some customers to this campaign
            exposed = random.sample(customers, min(random.randint(5, 20), len(customers)))
            for ec in exposed:
                status = random.choice(["exposed", "exposed", "responded", "redeemed"])
                exp = CampaignExposure(
                    campaign_id=cmp.id,
                    customer_id=ec.id,
                    offer_type=offer_type,
                    channel=random.choice(CHANNELS),
                    status=status,
                    exposed_at=days_ago(random.randint(1, 20)),
                    responded_at=days_ago(random.randint(0, 5)) if status in ["responded", "redeemed"] else None,
                    redeemed_at=days_ago(random.randint(0, 3)) if status == "redeemed" else None,
                )
                db.add(exp)

        db.commit()

        print(f"🧪  Creating {NUM_EXPERIMENTS} A/B experiments…")
        for i in range(1, NUM_EXPERIMENTS + 1):
            exp = Experiment(
                experiment_id=f"EXP{200 + i}",
                name=f"A/B Test #{i} – {random.choice(OFFER_TYPES).replace('_', ' ').title()}",
                description=fake.sentence(nb_words=8),
                control_description="No Offer (Control)",
                treatment_a_description=f"{random.randint(5, 15)}% Cashback",
                treatment_b_description=f"BDT {random.randint(10, 50)} Flat Bonus",
                total_audience=random.randint(500, 3000),
                control_size=random.randint(100, 500),
                treatment_a_size=random.randint(100, 500),
                treatment_b_size=random.randint(100, 500),
                start_date=days_ago(random.randint(10, 45)),
                end_date=days_ago(random.randint(-15, 5)),
                status=random.choice(["running", "running", "completed"]),
                control_response_rate=round(random.uniform(0.05, 0.2), 4),
                treatment_a_response_rate=round(random.uniform(0.1, 0.4), 4),
                treatment_b_response_rate=round(random.uniform(0.08, 0.35), 4),
                observed_difference=round(random.uniform(0.02, 0.15), 4),
                is_significant=random.choice([True, True, False]),
                p_value=round(random.uniform(0.01, 0.1), 4),
            )
            db.add(exp)
            db.flush()

            for ec in random.sample(customers, min(20, len(customers))):
                variant = random.choice(["control", "treatment_a", "treatment_b"])
                responded = random.choice([True, False, False])
                er = ExperimentResult(
                    experiment_id=exp.id,
                    customer_id=ec.id,
                    variant=variant,
                    offer_type=random.choice(OFFER_TYPES),
                    exposed_at=days_ago(random.randint(2, 30)),
                    responded=responded,
                    redeemed=responded and random.choice([True, False]),
                    transaction_value=round(random.uniform(50, 2000), 2) if responded else None,
                    cost=round(random.uniform(5, 50), 2) if variant != "control" else 0.0,
                )
                db.add(er)

        db.commit()
        print("\n✅  Seed complete!")
        print(f"   Authority login: authority@upay.com / auth123")
        print(f"   Customer login:  c1001@upay.com  / pass123  (also c1002 … c{1000 + NUM_CUSTOMERS})")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
