from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.database import get_db
from app.core.auth import get_current_customer
from app.models.user import User
from app.models.customer import Customer
from app.models.intelligence import Notification, CustomerPrediction

router = APIRouter(prefix="/impactiq", tags=["impactiq"])

@router.get("/insights")
def get_personal_insights(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer or not customer.features:
        return {"insights": []}
    
    f = customer.features
    insights = []
    
    # 1. Most used service insight
    if f.most_used_service and f.most_used_service != "none":
        service_map = {
            "merchant_payment": "Merchant payments are",
            "recharge": "Mobile recharge is",
            "bill_payment": "Bill payments are",
            "send_money": "Sending money is",
            "cash_out": "Cash out is"
        }
        name = service_map.get(f.most_used_service, "Certain services are")
        insights.append(f"{name} your most-used service this month.")
        
    # 2. Activity trend insight
    if f.activity_trend > 0.1:
        insights.append(f"Your activity increased by {int(f.activity_trend * 100)}% compared with last month.")
    elif f.activity_trend < -0.2:
        insights.append("You've been less active this month compared to the last.")
        
    # 3. Timing insight
    if f.preferred_hour:
        # Convert hour to rough time of day
        hour = f.preferred_hour
        time_str = "morning"
        if 12 <= hour < 17: time_str = "afternoon"
        elif 17 <= hour < 21: time_str = "evening"
        elif hour >= 21 or hour < 4: time_str = "night"
        
        if hour > 12: hour_str = f"{hour-12} PM"
        elif hour == 12: hour_str = "12 PM"
        elif hour == 0: hour_str = "12 AM"
        else: hour_str = f"{hour} AM"
        
        insights.append(f"You usually transact in the {time_str} (around {hour_str}).")
        
    return {"insights": insights}

@router.get("/next-best-action")
def get_next_best_action(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer or not customer.predictions:
        return {"action": "no_promotional_action", "reasoning": "Not enough data for recommendations."}
        
    pred = customer.predictions
    return {
        "action": pred.recommended_offer,
        "reasoning": pred.decision_rationale,
        "expected_value": pred.expected_value
    }

@router.get("/benefits")
def get_recommended_benefits(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer or not customer.predictions:
        return {"benefits": []}
        
    pred = customer.predictions
    if pred.recommended_offer in ("no_promotional_action", "activity_reminder"):
        return {"benefits": []}
        
    # Format the recommendation as a benefit card
    benefit = {
        "title": pred.recommended_offer.replace("_", " ").title(),
        "type": pred.recommended_offer,
        "is_recommended": True,
        "confidence": pred.nbo_confidence,
        "why_this": [
            pred.decision_rationale,
            f"You are eligible based on {customer.segment} profile.",
            "Similar offers were relevant to your activity."
        ]
    }
    
    return {"benefits": [benefit]}

@router.get("/reminders")
def get_smart_reminders(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        return {"reminders": []}
        
    # Find AI-generated notifications of type 'reminder'
    reminders = db.query(Notification)\
        .filter(Notification.customer_id == customer.id)\
        .filter(Notification.type == "reminder")\
        .order_by(Notification.created_at.desc())\
        .limit(2)\
        .all()
        
    return {
        "reminders": [{"title": r.title, "message": r.message, "is_read": r.is_read} for r in reminders]
    }

@router.get("/fatigue")
def get_fatigue_status(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer or not customer.predictions:
        return {"fatigue_level": "low"}
        
    return {
        "fatigue_level": customer.predictions.fatigue_level,
        "score": customer.predictions.fatigue_score
    }
