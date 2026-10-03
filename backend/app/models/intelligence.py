from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CustomerPreference(Base):
    __tablename__ = "customer_preferences"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)

    # Communication preferences
    merchant_offer_allowed = Column(Boolean, default=True)
    recharge_offer_allowed = Column(Boolean, default=True)
    bill_reminder_allowed = Column(Boolean, default=True)
    promotional_allowed = Column(Boolean, default=True)
    marketing_consent = Column(Boolean, default=True)

    # Frequency preference
    offer_frequency = Column(String(50), default="balanced")  # less, balanced, more

    # Channel preferences
    preferred_channel = Column(String(50), default="push")  # push, sms, email, in_app

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="preferences")


class CustomerFeature(Base):
    """Pre-computed ML features for a customer"""
    __tablename__ = "customer_features"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)

    # Transaction features
    transactions_7d = Column(Integer, default=0)
    transactions_30d = Column(Integer, default=0)
    transactions_90d = Column(Integer, default=0)
    avg_transaction_value_30d = Column(Float, default=0.0)
    total_transaction_value_30d = Column(Float, default=0.0)
    days_since_last_transaction = Column(Integer, default=999)

    # Service features
    recharge_count_30d = Column(Integer, default=0)
    merchant_payment_count_30d = Column(Integer, default=0)
    bill_payment_count_30d = Column(Integer, default=0)
    send_money_count_30d = Column(Integer, default=0)
    cashout_count_30d = Column(Integer, default=0)

    # Campaign features
    offers_received_7d = Column(Integer, default=0)
    offers_received_30d = Column(Integer, default=0)
    campaign_response_rate_30d = Column(Float, default=0.0)
    campaign_redemption_rate_30d = Column(Float, default=0.0)
    same_category_offer_count = Column(Integer, default=0)
    days_since_last_offer = Column(Integer, default=999)

    # Behavioral features
    activity_trend = Column(Float, default=0.0)  # positive = increasing, negative = decreasing
    preferred_hour = Column(Integer, nullable=True)  # 0-23
    preferred_day_of_week = Column(Integer, nullable=True)  # 0-6

    # Engagement
    most_used_service = Column(String(100), nullable=True)
    merchant_payment_pct = Column(Float, default=0.0)
    recharge_pct = Column(Float, default=0.0)
    bill_payment_pct = Column(Float, default=0.0)
    send_money_pct = Column(Float, default=0.0)

    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="features")


class CustomerPrediction(Base):
    """ML model predictions for a customer"""
    __tablename__ = "customer_predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)

    # Response prediction
    response_probability = Column(Float, nullable=True)
    response_probability_no_offer = Column(Float, nullable=True)

    # Uplift
    uplift_score = Column(Float, nullable=True)
    uplift_segment = Column(String(50), nullable=True)  # persuadable, sure_thing, lost_cause, sleeping_dog

    # Lifecycle
    lifecycle_stage = Column(String(50), nullable=True)  # acquisition, activation, retention, winback
    next_likely_behavior = Column(String(100), nullable=True)

    # Fatigue
    fatigue_score = Column(Float, nullable=True)
    fatigue_level = Column(String(20), nullable=True)  # low, medium, high

    # Next Best Offer
    recommended_offer = Column(String(100), nullable=True)
    recommended_channel = Column(String(50), nullable=True)
    recommended_time = Column(String(50), nullable=True)
    nbo_confidence = Column(Float, nullable=True)
    expected_value = Column(Float, nullable=True)

    # Decision
    decision = Column(String(100), nullable=True)
    decision_rationale = Column(Text, nullable=True)

    predicted_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="predictions")


class DecisionTrace(Base):
    """Full decision trace for explainability"""
    __tablename__ = "decision_traces"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    # Trace steps
    raw_data_summary = Column(JSON, nullable=True)
    features_used = Column(JSON, nullable=True)
    response_score = Column(Float, nullable=True)
    response_score_no_offer = Column(Float, nullable=True)
    uplift_score = Column(Float, nullable=True)
    uplift_segment = Column(String(50), nullable=True)
    lifecycle_stage = Column(String(50), nullable=True)
    fatigue_score = Column(Float, nullable=True)
    fatigue_level = Column(String(20), nullable=True)
    eligibility_checks = Column(JSON, nullable=True)
    business_constraints = Column(JSON, nullable=True)
    expected_value = Column(Float, nullable=True)
    final_decision = Column(String(100), nullable=True)
    decision_reasoning = Column(Text, nullable=True)

    context = Column(String(100), nullable=True)  # which campaign/trigger
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="decision_traces")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, offer, reminder, alert
    is_read = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="notifications")
