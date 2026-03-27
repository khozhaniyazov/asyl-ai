"""Subscription billing API."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models import Therapist, Subscription
from app.api.deps import get_current_user
from app.integrations.kaspi_service import kaspi_service

router = APIRouter()

PLANS = {
    "free": {"name": "Free", "price": 0, "max_patients": 3, "max_sessions_month": 10},
    "standard": {
        "name": "Standard",
        "price": 9900,
        "max_patients": -1,
        "max_sessions_month": -1,
    },
    "premium": {
        "name": "Premium",
        "price": 19900,
        "max_patients": -1,
        "max_sessions_month": -1,
    },
}


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    expires_at: str | None
    days_remaining: int | None
    plan_details: dict


class SubscribeRequest(BaseModel):
    plan: str  # standard or premium


@router.get("/status", response_model=SubscriptionResponse)
async def get_billing_status(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Subscription).filter(Subscription.therapist_id == current_user.id)
    )
    sub = result.scalars().first()

    if not sub:
        # Create trial subscription
        sub = Subscription(
            therapist_id=current_user.id,
            plan="trial",
            status="active",
            expires_at=datetime.now(timezone.utc) + timedelta(days=14),
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    days_remaining = None
    if sub.expires_at:
        delta = sub.expires_at - datetime.now(timezone.utc)
        days_remaining = max(0, delta.days)
        if days_remaining == 0 and sub.status == "active" and sub.plan != "free":
            sub.status = "expired"
            await db.commit()

    plan_info = PLANS.get(sub.plan, PLANS.get("free", {}))

    return {
        "plan": sub.plan,
        "status": sub.status,
        "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
        "days_remaining": days_remaining,
        "plan_details": plan_info,
    }


@router.post("/subscribe")
async def subscribe(
    data: SubscribeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    if data.plan not in ("standard", "premium"):
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan_info = PLANS[data.plan]
    payment_link = await kaspi_service.generate_payment_link(
        amount=plan_info["price"],
        appointment_id=current_user.id * 10000,  # unique ID for subscription
        description=f"Sandar {plan_info['name']} - подписка на месяц",
    )

    return {
        "payment_url": payment_link,
        "plan": data.plan,
        "amount": plan_info["price"],
    }


@router.post("/activate")
async def activate_subscription(
    plan: str = "standard",
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Called after payment confirmation (webhook or manual)."""
    result = await db.execute(
        select(Subscription).filter(Subscription.therapist_id == current_user.id)
    )
    sub = result.scalars().first()

    if not sub:
        sub = Subscription(therapist_id=current_user.id)
        db.add(sub)

    sub.plan = plan
    sub.status = "active"
    sub.started_at = datetime.now(timezone.utc)
    sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    await db.commit()

    return {"detail": "Subscription activated", "plan": plan}
