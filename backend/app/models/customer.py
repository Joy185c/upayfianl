from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    customer_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. C1024

    # Profile
    display_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    region = Column(String(100), nullable=True)
    segment = Column(String(50), nullable=True)  # active, dormant, high_value, etc.

    # Financial
    balance = Column(Float, default=0.0)
    account_age_days = Column(Integer, default=0)

    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")
    campaign_exposures = relationship("CampaignExposure", back_populates="customer")
    experiment_results = relationship("ExperimentResult", back_populates="customer")
    preferences = relationship("CustomerPreference", back_populates="customer", uselist=False)
    features = relationship("CustomerFeature", back_populates="customer", uselist=False)
    predictions = relationship("CustomerPrediction", back_populates="customer", uselist=False)
    decision_traces = relationship("DecisionTrace", back_populates="customer")
    notifications = relationship("Notification", back_populates="customer")
