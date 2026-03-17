from fastapi import APIRouter
from . import appointments, sessions, patients, auth

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(patients.router, prefix="/patients", tags=["patients"])
