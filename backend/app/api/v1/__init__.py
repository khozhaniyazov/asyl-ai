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
    packages,
    homework_templates,
    homework_assignments,
    sound_progress,
    availability,
    schedule_requests,
    cancellations,
    waitlist,
    # v3: marketplace
    marketplace_profiles,
    marketplace_reviews,
    marketplace_bookings,
    finance,
    # B+C: new features
    treatment_plans,
    messaging,
    analytics,
    data_export,
    reports,
    clinics,
    payouts,
    admin,
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
router.include_router(packages.router, prefix="/packages", tags=["packages"])
router.include_router(
    homework_templates.router, prefix="/homework/templates", tags=["homework"]
)
router.include_router(
    homework_assignments.router, prefix="/homework/assignments", tags=["homework"]
)
router.include_router(
    sound_progress.router, prefix="/sound-progress", tags=["sound-progress"]
)
router.include_router(
    availability.router, prefix="/availability", tags=["availability"]
)
router.include_router(
    schedule_requests.router, prefix="/schedule-requests", tags=["schedule-requests"]
)
router.include_router(
    cancellations.router, prefix="/cancellations", tags=["cancellations"]
)
router.include_router(waitlist.router, prefix="/waitlist", tags=["waitlist"])
# v3: marketplace
router.include_router(
    marketplace_profiles.router, prefix="/marketplace/profiles", tags=["marketplace"]
)
router.include_router(
    marketplace_reviews.router, prefix="/marketplace/reviews", tags=["marketplace"]
)
router.include_router(
    marketplace_bookings.router, prefix="/marketplace/bookings", tags=["marketplace"]
)
router.include_router(finance.router, prefix="/finance", tags=["finance"])
# B+C: new features
router.include_router(
    treatment_plans.router, prefix="/treatment", tags=["treatment-plans"]
)
router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(data_export.router, prefix="/export", tags=["export"])
router.include_router(reports.router, prefix="/reports", tags=["reports"])
router.include_router(clinics.router, prefix="/clinics", tags=["clinics"])
router.include_router(payouts.router, prefix="/payouts", tags=["payouts"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
