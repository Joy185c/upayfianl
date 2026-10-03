import json
import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.campaign import Campaign, CampaignExposure
from app.models.experiment import Experiment, ExperimentResult
from app.models.intelligence import (
    CustomerPreference,
    CustomerFeature,
    CustomerPrediction,
    DecisionTrace,
    Notification,
)
from app.core.auth import get_password_hash
from app.core.database import Base

# Ensure models are created
Base.metadata.create_all(bind=engine)

def seed_database(json_path: str = "data/synthetic_dataset.json"):
    if not os.path.exists(json_path):
        print(f"File {json_path} not found.")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Customer).first():
            print("Database already contains customers. Skipping seed.")
            return

        # 1. Create Admin & Authority users
        admin_user = User(
            email="admin@upay.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        authority_user = User(
            email="authority@upay.com",
            hashed_password=get_password_hash("auth123"),
            role="authority"
        )
        db.add_all([admin_user, authority_user])
        db.commit()

        # 2. Seed customers and related data
        print("Seeding customers...")
        customers_data = data.get("customers", [])
        
        batch_size = 100
        total_customers = len(customers_data)
        
        for i in range(0, total_customers, batch_size):
            batch = customers_data[i:i + batch_size]
            for cust_obj in batch:
                c_data = cust_obj["customer"]
                
                # Create user for customer
                c_user = User(
                    email=f"{c_data['customer_id'].lower()}@upay.com",
                    hashed_password=get_password_hash("pass123"),
                    role="customer"
                )
                db.add(c_user)
                db.flush() # Get user ID
                
                # Create Customer
                customer = Customer(
                    user_id=c_user.id,
                    customer_id=c_data["customer_id"],
                    display_name=c_data["display_name"],
                    phone_number=c_data["phone_number"],
                    region=c_data["region"],
                    segment=c_data["segment"],
                    balance=c_data["balance"],
                    account_age_days=c_data["account_age_days"],
                )
                db.add(customer)
                db.flush()
                
                # Transactions
                for tx in cust_obj.get("transactions", []):
                    db.add(Transaction(
                        customer_id=customer.id,
                        transaction_id=tx["transaction_id"],
                        type=tx["type"],
                        amount=tx["amount"],
                        fee=tx["fee"],
                        total_amount=tx["total_amount"],
                        counterparty_name=tx.get("counterparty_name"),
                        counterparty_id=tx.get("counterparty_id"),
                        merchant_name=tx.get("merchant_name"),
                        merchant_id=tx.get("merchant_id"),
                        bill_category=tx.get("bill_category"),
                        bill_account_id=tx.get("bill_account_id"),
                        operator=tx.get("operator"),
                        mobile_number=tx.get("mobile_number"),
                        status=tx["status"],
                        timestamp=datetime.fromisoformat(tx["timestamp"])
                    ))
                
                # Preferences
                pref_data = cust_obj.get("preferences", {})
                db.add(CustomerPreference(
                    customer_id=customer.id,
                    merchant_offer_allowed=pref_data.get("merchant_offer_allowed", True),
                    recharge_offer_allowed=pref_data.get("recharge_offer_allowed", True),
                    bill_reminder_allowed=pref_data.get("bill_reminder_allowed", True),
                    promotional_allowed=pref_data.get("promotional_allowed", True),
                    marketing_consent=pref_data.get("marketing_consent", True),
                    offer_frequency=pref_data.get("offer_frequency", "balanced"),
                    preferred_channel=pref_data.get("preferred_channel", "push"),
                ))
                
                # Features
                feat_data = cust_obj.get("features", {})
                db.add(CustomerFeature(
                    customer_id=customer.id,
                    transactions_7d=feat_data.get("transactions_7d", 0),
                    transactions_30d=feat_data.get("transactions_30d", 0),
                    transactions_90d=feat_data.get("transactions_90d", 0),
                    avg_transaction_value_30d=feat_data.get("avg_transaction_value_30d", 0),
                    total_transaction_value_30d=feat_data.get("total_transaction_value_30d", 0),
                    days_since_last_transaction=feat_data.get("days_since_last_transaction", 999),
                    recharge_count_30d=feat_data.get("recharge_count_30d", 0),
                    merchant_payment_count_30d=feat_data.get("merchant_payment_count_30d", 0),
                    bill_payment_count_30d=feat_data.get("bill_payment_count_30d", 0),
                    send_money_count_30d=feat_data.get("send_money_count_30d", 0),
                    cashout_count_30d=feat_data.get("cashout_count_30d", 0),
                    offers_received_7d=feat_data.get("offers_received_7d", 0),
                    offers_received_30d=feat_data.get("offers_received_30d", 0),
                    campaign_response_rate_30d=feat_data.get("campaign_response_rate_30d", 0),
                    campaign_redemption_rate_30d=feat_data.get("campaign_redemption_rate_30d", 0),
                    same_category_offer_count=feat_data.get("same_category_offer_count", 0),
                    days_since_last_offer=feat_data.get("days_since_last_offer", 999),
                    activity_trend=feat_data.get("activity_trend", 0),
                    preferred_hour=feat_data.get("preferred_hour"),
                    most_used_service=feat_data.get("most_used_service"),
                    merchant_payment_pct=feat_data.get("merchant_payment_pct", 0),
                    recharge_pct=feat_data.get("recharge_pct", 0),
                    bill_payment_pct=feat_data.get("bill_payment_pct", 0),
                    send_money_pct=feat_data.get("send_money_pct", 0),
                ))
                
                # Predictions
                pred_data = cust_obj.get("predictions", {})
                db.add(CustomerPrediction(
                    customer_id=customer.id,
                    response_probability=pred_data.get("response_probability"),
                    response_probability_no_offer=pred_data.get("response_probability_no_offer"),
                    uplift_score=pred_data.get("uplift_score"),
                    uplift_segment=pred_data.get("uplift_segment"),
                    lifecycle_stage=pred_data.get("lifecycle_stage"),
                    next_likely_behavior=pred_data.get("next_likely_behavior"),
                    fatigue_score=pred_data.get("fatigue_score"),
                    fatigue_level=pred_data.get("fatigue_level"),
                    recommended_offer=pred_data.get("recommended_offer"),
                    recommended_channel=pred_data.get("recommended_channel"),
                    recommended_time=pred_data.get("recommended_time"),
                    nbo_confidence=pred_data.get("nbo_confidence"),
                    expected_value=pred_data.get("expected_value"),
                    decision_rationale=pred_data.get("decision_reasoning"),
                ))
                
                # Decision Trace
                dt_data = cust_obj.get("decision_trace", {})
                db.add(DecisionTrace(
                    customer_id=customer.id,
                    raw_data_summary=dt_data.get("raw_data_summary"),
                    features_used=dt_data.get("features_used"),
                    response_score=dt_data.get("response_score"),
                    response_score_no_offer=dt_data.get("response_score_no_offer"),
                    uplift_score=dt_data.get("uplift_score"),
                    uplift_segment=dt_data.get("uplift_segment"),
                    lifecycle_stage=dt_data.get("lifecycle_stage"),
                    fatigue_score=dt_data.get("fatigue_score"),
                    fatigue_level=dt_data.get("fatigue_level"),
                    eligibility_checks=dt_data.get("eligibility_checks"),
                    business_constraints=dt_data.get("business_constraints"),
                    expected_value=dt_data.get("expected_value"),
                    final_decision=dt_data.get("final_decision"),
                    decision_reasoning=dt_data.get("decision_reasoning"),
                ))
                
                # Notifications
                for notif in cust_obj.get("notifications", []):
                    db.add(Notification(
                        customer_id=customer.id,
                        title=notif["title"],
                        message=notif["message"],
                        type=notif["type"],
                        is_ai_generated=notif.get("is_ai_generated", False),
                    ))
                    
            db.commit()
            print(f"Seeded {min(i+batch_size, total_customers)} / {total_customers} customers...")
            
        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
