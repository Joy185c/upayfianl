from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Variants
    control_description = Column(String(255), default="No Offer")
    treatment_a_description = Column(String(255), nullable=True)
    treatment_b_description = Column(String(255), nullable=True)

    # Audience
    total_audience = Column(Integer, nullable=True)
    control_size = Column(Integer, nullable=True)
    treatment_a_size = Column(Integer, nullable=True)
    treatment_b_size = Column(Integer, nullable=True)

    # Timing
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)

    status = Column(String(50), default="draft")  # draft, running, completed

    # Analysis results (cached)
    control_response_rate = Column(Float, nullable=True)
    treatment_a_response_rate = Column(Float, nullable=True)
    treatment_b_response_rate = Column(Float, nullable=True)
    observed_difference = Column(Float, nullable=True)
    is_significant = Column(Boolean, nullable=True)
    p_value = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    results = relationship("ExperimentResult", back_populates="experiment")


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    variant = Column(String(20), nullable=False)  # control, treatment_a, treatment_b
    offer_type = Column(String(100), nullable=True)

    exposed_at = Column(DateTime(timezone=True), nullable=True)
    responded = Column(Boolean, default=False)
    redeemed = Column(Boolean, default=False)
    transaction_value = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)

    experiment = relationship("Experiment", back_populates="results")
    customer = relationship("Customer", back_populates="experiment_results")
