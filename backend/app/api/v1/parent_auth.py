"""Parent OTP authentication via WhatsApp."""

import random
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.rate_limit import rate_limit_otp
from app.core.config import settings
from app.models import Parent, Patient
from app.integrations.whatsapp_service import whatsapp_service

router = APIRouter()


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    code: str


class ParentTokenResponse(BaseModel):
    access_token: str
    token_type: str


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164-ish format (+77XXXXXXXXX)."""
    p = (
        phone.strip()
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )
    if p.startswith("8"):
        p = "+7" + p[1:]
    if p.startswith("7") and len(p) == 11:
        p = "+" + p
    return p


@router.post("/request-otp")
async def request_otp(data: OTPRequest, db: AsyncSession = Depends(get_db)):
    phone = normalize_phone(data.phone)
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Rate limit OTP requests
    await rate_limit_otp(phone)

    # Find or create parent
    result = await db.execute(select(Parent).filter(Parent.phone == phone))
    parent = result.scalars().first()
    if not parent:
        # Check if any patient has this phone as parent_phone
        patient_result = await db.execute(
            select(Patient).filter(Patient.parent_phone == phone)
        )
        patients = patient_result.scalars().all()
        if not patients:
            # Also try with + prefix variations
            patient_result2 = await db.execute(
                select(Patient).filter(Patient.parent_phone.ilike(f"%{phone[-10:]}%"))
            )
            patients = patient_result2.scalars().all()

        parent = Parent(
            phone=phone,
            linked_patient_ids=",".join(str(p.id) for p in patients)
            if patients
            else "",
        )
        db.add(parent)

    # Generate 6-digit OTP with random jitter on expiry
    code = str(random.randint(100000, 999999))
    jitter = random.randint(240, 360)  # 4-6 minutes
    parent.otp_code_hash = hash_otp(code)
    parent.otp_expires_at = datetime.now(timezone.utc) + timedelta(seconds=jitter)
    parent.otp_attempts = 0  # Reset attempts on new OTP
    await db.commit()

    # Send via WhatsApp
    await whatsapp_service.send_otp(phone, code)

    return {"detail": "OTP sent via WhatsApp", "phone": phone}


@router.post("/verify-otp", response_model=ParentTokenResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    phone = normalize_phone(data.phone)
    result = await db.execute(select(Parent).filter(Parent.phone == phone))
    parent = result.scalars().first()

    if not parent or not parent.otp_code_hash or not parent.otp_expires_at:
        # Generic error to prevent enumeration
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Ensure comparison is possible (handle naive vs aware)
    now = datetime.now(timezone.utc)
    expires_at = parent.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Check attempt limit
    if parent.otp_attempts >= 3:
        raise HTTPException(
            status_code=429, detail="Too many attempts. Request a new OTP."
        )

    if hash_otp(data.code) != parent.otp_code_hash:
        parent.otp_attempts += 1
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Clear OTP
    parent.otp_code_hash = None
    parent.otp_expires_at = None
    parent.otp_attempts = 0
    await db.commit()

    # Create token with parent scope
    token = create_access_token(
        subject=f"parent:{parent.id}",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return {"access_token": token, "token_type": "bearer"}
