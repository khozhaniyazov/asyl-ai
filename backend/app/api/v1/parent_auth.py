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


@router.post("/request-otp")
async def request_otp(data: OTPRequest, db: AsyncSession = Depends(get_db)):
    phone = data.phone.strip().replace(" ", "").replace("-", "")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

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

    # Generate OTP
    code = str(random.randint(1000, 9999))
    parent.otp_code_hash = hash_otp(code)
    parent.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    await db.commit()

    # Send via WhatsApp
    await whatsapp_service.send_otp(phone, code)

    return {"detail": "OTP sent via WhatsApp", "phone": phone}


@router.post("/verify-otp", response_model=ParentTokenResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    phone = data.phone.strip().replace(" ", "").replace("-", "")
    result = await db.execute(select(Parent).filter(Parent.phone == phone))
    parent = result.scalars().first()

    if not parent:
        raise HTTPException(
            status_code=404, detail="Phone not found. Request OTP first."
        )

    if not parent.otp_code_hash or not parent.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP requested")

    if datetime.now(timezone.utc) > parent.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if hash_otp(data.code) != parent.otp_code_hash:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Clear OTP
    parent.otp_code_hash = None
    parent.otp_expires_at = None
    await db.commit()

    # Create token with parent scope
    token = create_access_token(
        subject=f"parent:{parent.id}",
        expires_delta=timedelta(days=30),
    )
    return {"access_token": token, "token_type": "bearer"}
