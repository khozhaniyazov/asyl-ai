from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models import SessionPackage, Patient, Therapist, PaymentStatus
from app.schemas.schemas import (
    SessionPackageCreate,
    SessionPackageUpdate,
    SessionPackageResponse,
    PackageBalanceResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=SessionPackageResponse)
async def create_package(
    pkg: SessionPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).where(
            Patient.id == pkg.patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found or not yours")

    db_pkg = SessionPackage(
        **pkg.model_dump(),
        therapist_id=current_user.id,
    )
    db.add(db_pkg)
    await db.commit()
    await db.refresh(db_pkg)
    return db_pkg


@router.get("/", response_model=list[SessionPackageResponse])
async def list_packages(
    patient_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = select(SessionPackage).where(SessionPackage.therapist_id == current_user.id)
    if patient_id:
        query = query.where(SessionPackage.patient_id == patient_id)
    query = query.order_by(SessionPackage.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{package_id}", response_model=SessionPackageResponse)
async def get_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(SessionPackage).where(
            SessionPackage.id == package_id,
            SessionPackage.therapist_id == current_user.id,
        )
    )
    pkg = result.scalars().first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


@router.put("/{package_id}", response_model=SessionPackageResponse)
async def update_package(
    package_id: int,
    update: SessionPackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(SessionPackage).where(
            SessionPackage.id == package_id,
            SessionPackage.therapist_id == current_user.id,
        )
    )
    pkg = result.scalars().first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(pkg, field, value)

    await db.commit()
    await db.refresh(pkg)
    return pkg


@router.get("/patient/{patient_id}/balance", response_model=PackageBalanceResponse)
async def get_package_balance(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Find the active (non-exhausted, non-expired) package
    result = await db.execute(
        select(SessionPackage)
        .where(
            and_(
                SessionPackage.patient_id == patient_id,
                SessionPackage.therapist_id == current_user.id,
                SessionPackage.payment_status.in_(
                    [PaymentStatus.PAID, PaymentStatus.PARTIAL]
                ),
            )
        )
        .order_by(SessionPackage.created_at.desc())
    )
    packages = result.scalars().all()

    # Find first non-exhausted package
    active = None
    for pkg in packages:
        if not pkg.is_exhausted:
            active = pkg
            break

    if active:
        return PackageBalanceResponse(
            patient_id=patient_id,
            active_package_id=active.id,
            total_sessions=active.total_sessions,
            used_sessions=active.used_sessions,
            remaining_sessions=active.remaining_sessions,
            payment_status=active.payment_status,
        )

    return PackageBalanceResponse(patient_id=patient_id)
