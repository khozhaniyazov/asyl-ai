from fastapi import APIRouter
from . import (
    appointments,
    sessions,
    patients,
    auth,
    parent_auth,
    parent_portal,
    billing,
    progress,
)

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(
    appointments.router, prefix="/appointments", tags=["appointments"]
)
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(patients.router, prefix="/patients", tags=["patients"])
router.include_router(parent_auth.router, prefix="/parent", tags=["parent"])
router.include_router(parent_portal.router, prefix="/parent", tags=["parent"])
router.include_router(billing.router, prefix="/billing", tags=["billing"])
router.include_router(progress.router, prefix="/progress", tags=["progress"])
