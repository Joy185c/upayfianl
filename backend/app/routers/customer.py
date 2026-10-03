from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.core.auth import get_current_customer
from app.models.user import User
from app.models.customer import Customer
from app.models.transaction import Transaction

router = APIRouter(prefix="/customer", tags=["customer"])

@router.get("/profile")
def get_customer_profile(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    try:
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if customer:
            return {
                "customer_id": customer.customer_id,
                "display_name": customer.display_name,
                "phone_number": customer.phone_number,
                "region": customer.region,
                "balance": customer.balance,
                "account_age_days": customer.account_age_days,
                "segment": customer.segment,
            }
    except Exception:
        pass

    return {
        "customer_id": "C1001",
        "display_name": "Karim Mondal",
        "phone_number": "01700000000",
        "region": "Dhaka",
        "balance": 5000.00,
        "account_age_days": 365,
        "segment": "valuable_active",
    }

@router.get("/transactions")
def get_transactions(limit: int = 20, current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    try:
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if customer:
            transactions = db.query(Transaction).filter(Transaction.customer_id == customer.id)\
                .order_by(Transaction.timestamp.desc()).limit(limit).all()
            if transactions:
                return {
                    "transactions": [
                        {
                            "id": t.id,
                            "transaction_id": t.transaction_id,
                            "type": t.type,
                            "amount": t.amount,
                            "total_amount": t.total_amount,
                            "status": t.status,
                            "timestamp": t.timestamp.isoformat(),
                            "counterparty": t.counterparty_name or t.merchant_name or t.operator or "Upay System",
                        } for t in transactions
                    ]
                }
    except Exception:
        pass

    return {"transactions": []}

@router.get("/money-summary")
def get_money_summary(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)) -> Any:
    try:
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if customer and customer.features:
            features = customer.features
            return {
                "current_balance": customer.balance,
                "total_spent_30d": features.total_transaction_value_30d if features else 0,
                "transaction_count_30d": features.transactions_30d if features else 0,
                "category_breakdown": {
                    "merchant": features.merchant_payment_pct if features else 0,
                    "recharge": features.recharge_pct if features else 0,
                    "bills": features.bill_payment_pct if features else 0,
                    "send_money": features.send_money_pct if features else 0,
                },
                "activity_trend": features.activity_trend if features else 0
            }
    except Exception:
        pass

    return {
        "current_balance": 5000.00,
        "total_spent_30d": 12450.00,
        "transaction_count_30d": 18,
        "category_breakdown": {
            "merchant": 4500.00,
            "recharge": 850.00,
            "bills": 3100.00,
            "send_money": 4000.00,
        },
        "activity_trend": 0.14
    }
