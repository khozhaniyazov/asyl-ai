from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Numeric,
    Enum,
    Text,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    commission_amount = Column(Numeric(10, 2), nullable=False)
    net_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    therapist = relationship("Therapist", back_populates="payouts")
    bank_account = relationship("BankAccount")


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(
        Integer, ForeignKey("therapists.id"), nullable=False, unique=True
    )
    bank_name = Column(String, nullable=False)
    account_holder = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    kaspi_phone = Column(String, nullable=True)
    is_verified = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    therapist = relationship("Therapist", back_populates="bank_account")
