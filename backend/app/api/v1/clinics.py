"""Clinic management API — create clinic, invite therapists, manage roles."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models import Clinic, ClinicMembership, ClinicRole, Therapist
from app.api.deps import get_current_user

router = APIRouter()


class ClinicCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None


class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class InviteTherapist(BaseModel):
    therapist_email: str
    role: ClinicRole = ClinicRole.THERAPIST


@router.post("/")
async def create_clinic(
    data: ClinicCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    clinic = Clinic(owner_therapist_id=current_user.id, **data.model_dump())
    db.add(clinic)
    await db.flush()
    # Auto-add owner as member
    membership = ClinicMembership(
        clinic_id=clinic.id, therapist_id=current_user.id, role=ClinicRole.OWNER
    )
    db.add(membership)
    await db.commit()
    await db.refresh(clinic)
    return _clinic_to_dict(clinic, [membership])


@router.get("/my")
async def get_my_clinics(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(ClinicMembership, Clinic)
        .join(Clinic, ClinicMembership.clinic_id == Clinic.id)
        .where(ClinicMembership.therapist_id == current_user.id)
    )
    rows = result.all()
    clinics = []
    for membership, clinic in rows:
        # Get all members for this clinic
        members_result = await db.execute(
            select(ClinicMembership, Therapist)
            .join(Therapist, ClinicMembership.therapist_id == Therapist.id)
            .where(ClinicMembership.clinic_id == clinic.id)
        )
        members = [
            {
                "id": m.id,
                "therapist_id": t.id,
                "therapist_name": t.full_name,
                "therapist_email": t.email,
                "role": m.role.value,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            }
            for m, t in members_result.all()
        ]
        clinics.append(
            {
                "id": clinic.id,
                "name": clinic.name,
                "address": clinic.address,
                "phone": clinic.phone,
                "my_role": membership.role.value,
                "members": members,
                "created_at": clinic.created_at.isoformat()
                if clinic.created_at
                else None,
            }
        )
    return clinics


@router.put("/{clinic_id}")
async def update_clinic(
    clinic_id: int,
    data: ClinicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify ownership or admin
    result = await db.execute(
        select(ClinicMembership).where(
            ClinicMembership.clinic_id == clinic_id,
            ClinicMembership.therapist_id == current_user.id,
            ClinicMembership.role.in_([ClinicRole.OWNER, ClinicRole.ADMIN]),
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
    clinic = result.scalars().first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(clinic, k, v)
    await db.commit()
    await db.refresh(clinic)
    return {
        "id": clinic.id,
        "name": clinic.name,
        "address": clinic.address,
        "phone": clinic.phone,
    }


@router.post("/{clinic_id}/invite")
async def invite_therapist(
    clinic_id: int,
    data: InviteTherapist,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify ownership or admin
    result = await db.execute(
        select(ClinicMembership).where(
            ClinicMembership.clinic_id == clinic_id,
            ClinicMembership.therapist_id == current_user.id,
            ClinicMembership.role.in_([ClinicRole.OWNER, ClinicRole.ADMIN]),
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find therapist by email
    result = await db.execute(
        select(Therapist).where(Therapist.email == data.therapist_email)
    )
    therapist = result.scalars().first()
    if not therapist:
        raise HTTPException(
            status_code=404, detail="Therapist not found with that email"
        )

    # Check not already a member
    result = await db.execute(
        select(ClinicMembership).where(
            ClinicMembership.clinic_id == clinic_id,
            ClinicMembership.therapist_id == therapist.id,
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Already a member")

    membership = ClinicMembership(
        clinic_id=clinic_id, therapist_id=therapist.id, role=data.role
    )
    db.add(membership)
    await db.commit()
    return {"detail": f"Invited {therapist.full_name}", "therapist_id": therapist.id}


@router.delete("/{clinic_id}/members/{membership_id}")
async def remove_member(
    clinic_id: int,
    membership_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify ownership or admin
    result = await db.execute(
        select(ClinicMembership).where(
            ClinicMembership.clinic_id == clinic_id,
            ClinicMembership.therapist_id == current_user.id,
            ClinicMembership.role.in_([ClinicRole.OWNER, ClinicRole.ADMIN]),
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(ClinicMembership).where(ClinicMembership.id == membership_id)
    )
    membership = result.scalars().first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    if membership.role == ClinicRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove clinic owner")

    await db.delete(membership)
    await db.commit()
    return {"detail": "Member removed"}


def _clinic_to_dict(clinic, memberships):
    return {
        "id": clinic.id,
        "name": clinic.name,
        "address": clinic.address,
        "phone": clinic.phone,
        "members": [
            {"id": m.id, "therapist_id": m.therapist_id, "role": m.role.value}
            for m in memberships
        ],
        "created_at": clinic.created_at.isoformat() if clinic.created_at else None,
    }
