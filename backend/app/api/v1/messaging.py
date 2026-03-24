"""In-app messaging API — therapist <-> parent."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Conversation, Message, SenderType, Therapist, Parent
from app.api.deps import get_current_user
from app.api.v1.parent_portal import get_current_parent

router = APIRouter()


class MessageCreate(BaseModel):
    text: Optional[str] = None
    media_url: Optional[str] = None


# --- Therapist endpoints ---


@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation, Parent)
        .join(Parent, Conversation.parent_id == Parent.id)
        .where(Conversation.therapist_id == current_user.id)
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    rows = result.all()

    convos = []
    for conv, parent in rows:
        # Count unread
        unread_result = await db.execute(
            select(func.count(Message.id)).where(
                Message.conversation_id == conv.id,
                Message.sender_type == SenderType.PARENT,
                Message.read_at == None,
            )
        )
        unread = unread_result.scalar() or 0

        convos.append(
            {
                "id": conv.id,
                "parent_id": parent.id,
                "parent_name": parent.full_name or parent.phone,
                "parent_phone": parent.phone,
                "last_message_at": conv.last_message_at.isoformat()
                if conv.last_message_at
                else None,
                "unread_count": unread,
            }
        )
    return convos


@router.post("/conversations/{parent_id}")
async def get_or_create_conversation(
    parent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.therapist_id == current_user.id,
            Conversation.parent_id == parent_id,
        )
    )
    conv = result.scalars().first()
    if not conv:
        conv = Conversation(therapist_id=current_user.id, parent_id=parent_id)
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
    return {
        "id": conv.id,
        "parent_id": conv.parent_id,
        "therapist_id": conv.therapist_id,
    }


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()

    # Mark parent messages as read
    for msg in messages:
        if msg.sender_type == SenderType.PARENT and not msg.read_at:
            msg.read_at = datetime.now(timezone.utc)
    await db.commit()

    return [
        {
            "id": m.id,
            "sender_type": m.sender_type.value,
            "sender_id": m.sender_id,
            "text": m.text,
            "media_url": m.media_url,
            "read_at": m.read_at.isoformat() if m.read_at else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in reversed(messages)  # return in chronological order
    ]


@router.post("/conversations/{conversation_id}/messages")
async def send_message_therapist(
    conversation_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.therapist_id == current_user.id,
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.THERAPIST,
        sender_id=current_user.id,
        text=data.text,
        media_url=data.media_url,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)
    return {
        "id": msg.id,
        "sender_type": msg.sender_type.value,
        "text": msg.text,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


# --- Parent endpoints ---


@router.get("/parent/conversations")
async def parent_list_conversations(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(
        select(Conversation, Therapist)
        .join(Therapist, Conversation.therapist_id == Therapist.id)
        .where(Conversation.parent_id == parent.id)
        .order_by(Conversation.last_message_at.desc().nullslast())
    )
    return [
        {
            "id": conv.id,
            "therapist_id": therapist.id,
            "therapist_name": therapist.full_name,
            "last_message_at": conv.last_message_at.isoformat()
            if conv.last_message_at
            else None,
        }
        for conv, therapist in result.all()
    ]


@router.get("/parent/conversations/{conversation_id}/messages")
async def parent_get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.parent_id == parent.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()

    # Mark therapist messages as read
    for msg in messages:
        if msg.sender_type == SenderType.THERAPIST and not msg.read_at:
            msg.read_at = datetime.now(timezone.utc)
    await db.commit()

    return [
        {
            "id": m.id,
            "sender_type": m.sender_type.value,
            "text": m.text,
            "media_url": m.media_url,
            "read_at": m.read_at.isoformat() if m.read_at else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in reversed(messages)
    ]


@router.post("/parent/conversations/{conversation_id}/messages")
async def parent_send_message(
    conversation_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.parent_id == parent.id,
        )
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.PARENT,
        sender_id=parent.id,
        text=data.text,
        media_url=data.media_url,
    )
    db.add(msg)
    conv.last_message_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)
    return {
        "id": msg.id,
        "sender_type": msg.sender_type.value,
        "text": msg.text,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
