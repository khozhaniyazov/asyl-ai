from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import HomeworkTemplate, Therapist
from app.schemas.schemas import (
    HomeworkTemplateCreate,
    HomeworkTemplateUpdate,
    HomeworkTemplateResponse,
)
from app.api.deps import get_current_user
from typing import Optional

router = APIRouter()


@router.post("/", response_model=HomeworkTemplateResponse)
async def create_template(
    template: HomeworkTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    db_template = HomeworkTemplate(
        **template.model_dump(),
        therapist_id=current_user.id,
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.get("/", response_model=list[HomeworkTemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = select(HomeworkTemplate).where(
        HomeworkTemplate.therapist_id == current_user.id
    )
    if category:
        query = query.where(HomeworkTemplate.category == category)
    if search:
        term = f"%{search}%"
        query = query.where(
            HomeworkTemplate.title.ilike(term)
            | HomeworkTemplate.description.ilike(term)
            | HomeworkTemplate.target_sounds.ilike(term)
        )
    query = query.order_by(HomeworkTemplate.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{template_id}", response_model=HomeworkTemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkTemplate).where(
            HomeworkTemplate.id == template_id,
            HomeworkTemplate.therapist_id == current_user.id,
        )
    )
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=HomeworkTemplateResponse)
async def update_template(
    template_id: int,
    update: HomeworkTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkTemplate).where(
            HomeworkTemplate.id == template_id,
            HomeworkTemplate.therapist_id == current_user.id,
        )
    )
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkTemplate).where(
            HomeworkTemplate.id == template_id,
            HomeworkTemplate.therapist_id == current_user.id,
        )
    )
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(template)
    await db.commit()
    return {"detail": "Template deleted"}
