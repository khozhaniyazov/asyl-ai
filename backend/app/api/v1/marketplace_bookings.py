"""Marketplace bookings — parent creates, pays deposit, therapist confirms."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, timezone

from app.core.database import get_db
from app.models import (
    MarketplaceBooking,
    BookingStatus,
    BookingType,
    Therapist,
    Parent,
    Appointment,
    AppointmentStatus,
    RequestedBy,
    TherapistProfile,
)
from app.schemas.schemas import (
    MarketplaceBookingCreate,
    MarketplaceBookingResponse,
)
from app.api.deps import get_current_user
from app.api.v1.parent_portal import get_current_parent
from app.integrations.mock_services import KaspiMock

router = APIRouter()


# --- Parent endpoints ---


@router.post("/", response_model=MarketplaceBookingResponse)
async def create_booking(
    data: MarketplaceBookingCreate,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: create a marketplace booking request."""
    # Verify therapist exists and has a published profile
    result = await db.execute(
        select(TherapistProfile).where(
            TherapistProfile.therapist_id == data.therapist_id,
            TherapistProfile.is_published == True,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    booking = MarketplaceBooking(
        parent_id=parent.id,
        therapist_id=data.therapist_id,
        type=data.type,
        requested_slot=data.requested_slot,
        notes=data.notes,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("/my", response_model=list[MarketplaceBookingResponse])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: list own marketplace bookings."""
    result = await db.execute(
        select(MarketplaceBooking)
        .where(MarketplaceBooking.parent_id == parent.id)
        .order_by(MarketplaceBooking.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{booking_id}/pay")
async def pay_booking_deposit(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: generate Kaspi payment link for booking deposit."""
    result = await db.execute(
        select(MarketplaceBooking).where(
            MarketplaceBooking.id == booking_id,
            MarketplaceBooking.parent_id == parent.id,
        )
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.deposit_paid:
        raise HTTPException(status_code=400, detail="Deposit already paid")

    # Get therapist profile for pricing
    profile_result = await db.execute(
        select(TherapistProfile).where(
            TherapistProfile.therapist_id == booking.therapist_id
        )
    )
    profile = profile_result.scalars().first()
    deposit = int(profile.price_range_min or 5000) if profile else 5000

    link = await KaspiMock.generate_payment_link(deposit, booking.id)
    booking.kaspi_link = link
    booking.deposit_amount = deposit
    await db.commit()
    return {"kaspi_link": link, "deposit_amount": deposit}


@router.post("/{booking_id}/cancel", response_model=MarketplaceBookingResponse)
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: cancel a booking."""
    result = await db.execute(
        select(MarketplaceBooking).where(
            MarketplaceBooking.id == booking_id,
            MarketplaceBooking.parent_id == parent.id,
        )
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="Booking already finalized")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)
    return booking


# --- Therapist endpoints ---


@router.get("/incoming", response_model=list[MarketplaceBookingResponse])
async def get_incoming_bookings(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: list incoming marketplace booking requests."""
    query = select(MarketplaceBooking).where(
        MarketplaceBooking.therapist_id == current_user.id
    )
    if status:
        query = query.where(MarketplaceBooking.status == status)
    query = query.order_by(MarketplaceBooking.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{booking_id}/confirm", response_model=MarketplaceBookingResponse)
async def confirm_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: confirm booking → creates an Appointment in the PM system."""
    result = await db.execute(
        select(MarketplaceBooking).where(
            MarketplaceBooking.id == booking_id,
            MarketplaceBooking.therapist_id == current_user.id,
        )
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not pending")

    # Get session duration from profile
    profile_result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = profile_result.scalars().first()
    duration = profile.session_duration if profile and profile.session_duration else 45

    # Ensure start_time is timezone-aware
    start_time = booking.requested_slot
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    # Create appointment in PM system
    session_type = SessionType.ONLINE if booking.type == BookingType.REGULAR else SessionType.IN_PERSON
    # Default to diagnostic being in-person, regular can be online if profile allows
    if profile and profile.online_available and booking.type == BookingType.REGULAR:
        session_type = SessionType.ONLINE
    
    appointment = Appointment(
        therapist_id=current_user.id,
        start_time=start_time,
        end_time=start_time + timedelta(minutes=duration),
        status=AppointmentStatus.PLANNED,
        requested_by=RequestedBy.PARENT,
        session_type=session_type,
        meeting_link=f"https://meet.asyl-ai.kz/{booking_id}-{current_user.id}" if session_type == SessionType.ONLINE else None
    )
    db.add(appointment)
    await db.flush()

    booking.status = BookingStatus.CONFIRMED
    booking.appointment_id = appointment.id
    booking.deposit_paid = True  # mark as paid on confirmation

    await db.commit()
    await db.refresh(booking)
    return booking


@router.put("/{booking_id}/reject", response_model=MarketplaceBookingResponse)
async def reject_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: reject a booking request."""
    result = await db.execute(
        select(MarketplaceBooking).where(
            MarketplaceBooking.id == booking_id,
            MarketplaceBooking.therapist_id == current_user.id,
        )
    )
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not pending")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)
    return booking
