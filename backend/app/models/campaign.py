from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Offer details
    offer_type = Column(String(100), nullable=False)  # recharge_cashback, merchant_cashback, etc.
    offer_value = Column(Float, nullable=True)  # e.g. 10 (for 10%)
    offer_unit = Column(String(20), default="percent")  # percent, bdt

    # Targeting
    target_segment = Column(String(100), nullable=True)
    channel = Column(String(50), default="push")  # push, sms, email, in_app

    # Budget
    budget = Column(Float, nullable=True)
    offer_cost_per_user = Column(Float, nullable=True)
    capacity = Column(Integer, nullable=True)

    # Timing
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(String(50), default="draft")  # draft, active, paused, completed

    # AI Analysis results (cached)
    eligible_count = Column(Integer, nullable=True)
    predicted_responders = Column(Integer, nullable=True)
    high_uplift_count = Column(Integer, nullable=True)
    high_fatigue_count = Column(Integer, nullable=True)
    recommended_target_count = Column(Integer, nullable=True)
    estimated_incremental_value = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    exposures = relationship("CampaignExposure", back_populates="campaign")


class CampaignExposure(Base):
    __tablename__ = "campaign_exposures"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    offer_type = Column(String(100), nullable=True)
    channel = Column(String(50), nullable=True)
    status = Column(String(50), default="exposed")  # exposed, responded, redeemed

    exposed_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="exposures")
    customer = relationship("Customer", back_populates="campaign_exposures")
