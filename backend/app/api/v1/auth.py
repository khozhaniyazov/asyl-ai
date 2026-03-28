from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    validate_password_strength,
)
from app.core.rate_limit import rate_limit_login
from app.models import Therapist
from app.schemas.schemas import (
    TherapistCreate,
    TherapistResponse,
    Token,
    OnboardingUpdate,
)
from app.api.deps import get_current_user

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set httpOnly cookie with the access token."""
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="sandar_token",
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear the auth cookie."""
    response.delete_cookie(key="sandar_token", path="/")


@router.post("/register", response_model=TherapistResponse)
async def register(user_in: TherapistCreate, db: AsyncSession = Depends(get_db)):
    # Validate password strength
    is_valid, msg = validate_password_strength(user_in.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    result = await db.execute(
        select(Therapist).filter(Therapist.email == user_in.email)
    )
    if result.scalars().first():
        # Generic error to prevent user enumeration
        raise HTTPException(
            status_code=400,
            detail="Registration failed. Please check your details and try again.",
        )
    user = Therapist(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        clinic_name=user_in.clinic_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _authenticate(email: str, password: str, db: AsyncSession) -> dict:
    """Shared authentication logic for both form and JSON login."""
    result = await db.execute(select(Therapist).filter(Therapist.email == email))
    user = result.scalars().first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(user.id, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Login via application/x-www-form-urlencoded (OAuth2 standard)."""
    await rate_limit_login(request)
    result = await _authenticate(form_data.username, form_data.password, db)
    _set_auth_cookie(response, result["access_token"])
    return result


@router.post("/login/json", response_model=Token)
async def login_json(
    request: Request,
    response: Response,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login via JSON body (for convenience)."""
    await rate_limit_login(request)
    result = await _authenticate(data.username, data.password, db)
    _set_auth_cookie(response, result["access_token"])
    return result


@router.post("/logout")
async def logout(response: Response):
    """Clear auth cookie."""
    _clear_auth_cookie(response)
    return {"detail": "Logged out"}


@router.get("/me", response_model=TherapistResponse)
async def read_users_me(current_user: Therapist = Depends(get_current_user)):
    return current_user


@router.put("/onboarding", response_model=TherapistResponse)
async def complete_onboarding(
    data: OnboardingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Save onboarding preferences and mark onboarding as completed."""
    current_user.default_session_duration = data.default_session_duration
    current_user.default_price = data.default_price
    current_user.onboarding_completed = True
    await db.commit()
    await db.refresh(current_user)
    return current_user
