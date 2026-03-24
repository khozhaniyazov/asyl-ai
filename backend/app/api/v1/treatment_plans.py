"""Treatment plans + goal bank API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from app.core.database import get_db
from app.models import (
    TreatmentPlan,
    TreatmentGoal,
    GoalTemplate,
    PlanStatus,
    GoalStatus,
    GoalType,
    Patient,
    Therapist,
)
from app.api.deps import get_current_user

router = APIRouter()


# --- Schemas ---


class PlanCreate(BaseModel):
    patient_id: int
    diagnosis: Optional[str] = None
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    notes: Optional[str] = None


class PlanUpdate(BaseModel):
    diagnosis: Optional[str] = None
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    status: Optional[PlanStatus] = None
    notes: Optional[str] = None


class GoalCreate(BaseModel):
    type: GoalType
    description: str
    target_sound: Optional[str] = None
    measurable_criteria: Optional[str] = None
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    description: Optional[str] = None
    target_sound: Optional[str] = None
    measurable_criteria: Optional[str] = None
    status: Optional[GoalStatus] = None
    target_date: Optional[date] = None


class GoalTemplateCreate(BaseModel):
    category: Optional[str] = None
    description: str
    measurable_criteria: Optional[str] = None


# --- Treatment Plans ---


@router.post("/plans")
async def create_plan(
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(
            Patient.id == data.patient_id, Patient.therapist_id == current_user.id
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found")

    plan = TreatmentPlan(therapist_id=current_user.id, **data.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return _plan_to_dict(plan, goals=[])


@router.get("/plans")
async def list_plans(
    patient_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = (
        select(TreatmentPlan)
        .options(selectinload(TreatmentPlan.goals))
        .where(TreatmentPlan.therapist_id == current_user.id)
    )
    if patient_id:
        query = query.where(TreatmentPlan.patient_id == patient_id)
    query = query.order_by(TreatmentPlan.created_at.desc())
    result = await db.execute(query)
    return [_plan_to_dict(p) for p in result.scalars().all()]


@router.get("/plans/{plan_id}")
async def get_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TreatmentPlan)
        .options(selectinload(TreatmentPlan.goals))
        .where(
            TreatmentPlan.id == plan_id, TreatmentPlan.therapist_id == current_user.id
        )
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _plan_to_dict(plan)


@router.put("/plans/{plan_id}")
async def update_plan(
    plan_id: int,
    data: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TreatmentPlan).where(
            TreatmentPlan.id == plan_id, TreatmentPlan.therapist_id == current_user.id
        )
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)
    await db.commit()
    await db.refresh(plan)
    return _plan_to_dict(plan)


# --- Goals ---


@router.post("/plans/{plan_id}/goals")
async def add_goal(
    plan_id: int,
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TreatmentPlan).where(
            TreatmentPlan.id == plan_id, TreatmentPlan.therapist_id == current_user.id
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Plan not found")

    goal = TreatmentGoal(plan_id=plan_id, **data.model_dump())
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return _goal_to_dict(goal)


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TreatmentGoal)
        .join(TreatmentPlan)
        .where(
            TreatmentGoal.id == goal_id, TreatmentPlan.therapist_id == current_user.id
        )
    )
    goal = result.scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
    if data.status == GoalStatus.ACHIEVED and not goal.achieved_at:
        from datetime import timezone

        goal.achieved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(goal)
    return _goal_to_dict(goal)


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TreatmentGoal)
        .join(TreatmentPlan)
        .where(
            TreatmentGoal.id == goal_id, TreatmentPlan.therapist_id == current_user.id
        )
    )
    goal = result.scalars().first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"detail": "Goal deleted"}


# --- Goal Templates ---


@router.get("/goal-templates")
async def list_goal_templates(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = select(GoalTemplate).where(
        (GoalTemplate.therapist_id == current_user.id)
        | (GoalTemplate.therapist_id == None)
    )
    if category:
        query = query.where(GoalTemplate.category == category)
    result = await db.execute(query.order_by(GoalTemplate.created_at.desc()))
    return [
        {
            "id": t.id,
            "category": t.category,
            "description": t.description,
            "measurable_criteria": t.measurable_criteria,
        }
        for t in result.scalars().all()
    ]


@router.post("/goal-templates")
async def create_goal_template(
    data: GoalTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    tmpl = GoalTemplate(therapist_id=current_user.id, **data.model_dump())
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return {
        "id": tmpl.id,
        "category": tmpl.category,
        "description": tmpl.description,
        "measurable_criteria": tmpl.measurable_criteria,
    }


@router.delete("/goal-templates/{template_id}")
async def delete_goal_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(GoalTemplate).where(
            GoalTemplate.id == template_id, GoalTemplate.therapist_id == current_user.id
        )
    )
    tmpl = result.scalars().first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(tmpl)
    await db.commit()
    return {"detail": "Template deleted"}


# --- Helpers ---


def _plan_to_dict(plan: TreatmentPlan, goals=None) -> dict:
    return {
        "id": plan.id,
        "patient_id": plan.patient_id,
        "therapist_id": plan.therapist_id,
        "diagnosis": plan.diagnosis,
        "start_date": plan.start_date.isoformat() if plan.start_date else None,
        "target_end_date": plan.target_end_date.isoformat()
        if plan.target_end_date
        else None,
        "status": plan.status.value if plan.status else "active",
        "notes": plan.notes,
        "goals": [_goal_to_dict(g) for g in goals]
        if goals is not None
        else [_goal_to_dict(g) for g in (plan.goals or [])],
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
    }


def _goal_to_dict(goal: TreatmentGoal) -> dict:
    return {
        "id": goal.id,
        "plan_id": goal.plan_id,
        "type": goal.type.value if goal.type else None,
        "description": goal.description,
        "target_sound": goal.target_sound,
        "measurable_criteria": goal.measurable_criteria,
        "status": goal.status.value if goal.status else "not_started",
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "achieved_at": goal.achieved_at.isoformat() if goal.achieved_at else None,
    }
