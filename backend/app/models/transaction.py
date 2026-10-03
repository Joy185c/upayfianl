from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    # Transaction details
    type = Column(String(50), nullable=False)  # send_money, recharge, merchant_payment, bill_payment, cash_out, add_money
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    # Counterparty
    counterparty_name = Column(String(200), nullable=True)
    counterparty_id = Column(String(100), nullable=True)

    # Additional
    note = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    status = Column(String(50), default="completed")  # completed, pending, failed

    # Merchant details (if applicable)
    merchant_name = Column(String(200), nullable=True)
    merchant_id = Column(String(100), nullable=True)

    # Bill details
    bill_category = Column(String(100), nullable=True)
    bill_account_id = Column(String(100), nullable=True)

    # Operator details (for recharge)
    operator = Column(String(100), nullable=True)
    mobile_number = Column(String(20), nullable=True)

    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    customer = relationship("Customer", back_populates="transactions")
