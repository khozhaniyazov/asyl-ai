"""PDF report generation — progress reports, PMPK reports."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import io

from app.core.database import get_db
from app.models import (
    Patient,
    Appointment,
    AppointmentStatus,
    Session,
    SoundProgressRecord,
    HomeworkAssignment,
    SessionPackage,
    TreatmentPlan,
    TreatmentGoal,
    Therapist,
)
from app.api.deps import get_current_user

router = APIRouter()


def _generate_html_report(title: str, sections: list[dict]) -> str:
    """Generate an HTML report that can be printed to PDF by the browser."""
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }}
h1 {{ font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e3a5f; }}
h2 {{ font-size: 16px; color: #2563eb; margin-top: 24px; }}
h3 {{ font-size: 14px; color: #374151; margin-top: 16px; }}
table {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
th, td {{ border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; font-size: 13px; }}
th {{ background: #f3f4f6; font-weight: 600; }}
.meta {{ color: #6b7280; font-size: 12px; margin-bottom: 20px; }}
.section {{ margin-bottom: 24px; }}
.badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }}
.badge-green {{ background: #dcfce7; color: #166534; }}
.badge-yellow {{ background: #fef9c3; color: #854d0e; }}
.badge-blue {{ background: #dbeafe; color: #1e40af; }}
.badge-gray {{ background: #f3f4f6; color: #374151; }}
.progress-bar {{ height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }}
.progress-fill {{ height: 100%; border-radius: 4px; }}
@media print {{ body {{ padding: 20px; }} }}
</style>
</head>
<body>
<h1>{title}</h1>
<p class="meta">Дата формирования: {datetime.now().strftime("%d.%m.%Y %H:%M")}</p>
"""
    for section in sections:
        html += f'<div class="section"><h2>{section["title"]}</h2>{section["content"]}</div>'
    html += "</body></html>"
    return html


@router.get("/progress/{patient_id}")
async def generate_progress_report(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Generate a progress report for a patient (HTML, printable to PDF)."""
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Gather data
    appts_result = await db.execute(
        select(Appointment)
        .where(
            Appointment.patient_id == patient_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
        .order_by(Appointment.start_time)
    )
    appointments = appts_result.scalars().all()

    progress_result = await db.execute(
        select(SoundProgressRecord)
        .where(SoundProgressRecord.patient_id == patient_id)
        .order_by(SoundProgressRecord.assessed_at.desc())
    )
    progress = progress_result.scalars().all()

    hw_result = await db.execute(
        select(HomeworkAssignment)
        .where(HomeworkAssignment.patient_id == patient_id)
        .order_by(HomeworkAssignment.created_at.desc())
    )
    homework = hw_result.scalars().all()

    plans_result = await db.execute(
        select(TreatmentPlan).where(TreatmentPlan.patient_id == patient_id)
    )
    plans = plans_result.scalars().all()

    full_name = f"{patient.first_name} {patient.last_name}"
    sections = []

    # Patient info
    sections.append(
        {
            "title": "Информация о пациенте",
            "content": f"""
        <table>
            <tr><th>ФИО</th><td>{full_name}</td></tr>
            <tr><th>Диагноз</th><td>{patient.diagnosis or "—"}</td></tr>
            <tr><th>Дата рождения</th><td>{patient.date_of_birth.isoformat() if patient.date_of_birth else "—"}</td></tr>
            <tr><th>Статус</th><td>{patient.status.value if patient.status else "active"}</td></tr>
            <tr><th>Специалист</th><td>{current_user.full_name}</td></tr>
            <tr><th>Всего сеансов</th><td>{len(appointments)}</td></tr>
        </table>
        """,
        }
    )

    # Sound progress
    if progress:
        # Group by sound, latest per sound
        sound_map = {}
        for p in progress:
            if p.sound not in sound_map:
                sound_map[p.sound] = p

        stages = [
            "not_started",
            "isolation",
            "syllables",
            "words",
            "phrases",
            "connected_speech",
            "automated",
        ]
        stage_labels = {
            "not_started": "Не начат",
            "isolation": "Изоляция",
            "syllables": "Слоги",
            "words": "Слова",
            "phrases": "Фразы",
            "connected_speech": "Связная речь",
            "automated": "Автоматизирован",
        }
        stage_colors = {
            "not_started": "#9ca3af",
            "isolation": "#ef4444",
            "syllables": "#f97316",
            "words": "#eab308",
            "phrases": "#84cc16",
            "connected_speech": "#22c55e",
            "automated": "#10b981",
        }

        rows = ""
        for sound, rec in sorted(sound_map.items()):
            stage = rec.stage.value if rec.stage else "not_started"
            idx = stages.index(stage) if stage in stages else 0
            pct = int((idx + 1) / len(stages) * 100)
            color = stage_colors.get(stage, "#9ca3af")
            rows += f"""<tr>
                <td><strong>{sound}</strong></td>
                <td>{stage_labels.get(stage, stage)}</td>
                <td>{rec.accuracy_percent or "—"}%</td>
                <td><div class="progress-bar"><div class="progress-fill" style="width:{pct}%;background:{color}"></div></div></td>
            </tr>"""

        sections.append(
            {
                "title": "Прогресс звуков",
                "content": f"<table><tr><th>Звук</th><th>Этап</th><th>Точность</th><th>Прогресс</th></tr>{rows}</table>",
            }
        )

    # Treatment plans
    if plans:
        for plan in plans:
            goals_result = await db.execute(
                select(TreatmentGoal).where(TreatmentGoal.plan_id == plan.id)
            )
            goals = goals_result.scalars().all()
            goal_rows = ""
            for g in goals:
                status_class = (
                    "badge-green"
                    if g.status.value == "achieved"
                    else "badge-blue"
                    if g.status.value == "in_progress"
                    else "badge-gray"
                )
                goal_rows += f"<tr><td>{g.description}</td><td>{g.target_sound or '—'}</td><td><span class='badge {status_class}'>{g.status.value}</span></td></tr>"

            sections.append(
                {
                    "title": f"План лечения: {plan.diagnosis or 'Без названия'}",
                    "content": f"<table><tr><th>Цель</th><th>Звук</th><th>Статус</th></tr>{goal_rows}</table>"
                    if goal_rows
                    else "<p>Целей пока нет</p>",
                }
            )

    # Homework summary
    if homework:
        completed = len(
            [h for h in homework if h.status.value in ("completed", "verified")]
        )
        total = len(homework)
        sections.append(
            {
                "title": "Домашние задания",
                "content": f"<p>Всего назначено: {total} | Выполнено: {completed} | Процент выполнения: {round(completed / total * 100) if total > 0 else 0}%</p>",
            }
        )

    html = _generate_html_report(f"Отчёт о прогрессе — {full_name}", sections)

    return StreamingResponse(
        iter([html]),
        media_type="text/html",
        headers={"Content-Disposition": f"inline; filename=progress_{patient_id}.html"},
    )


@router.get("/pmpk/{patient_id}")
async def generate_pmpk_report(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Generate a PMPK commission report (HTML, printable to PDF)."""
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    appts_result = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
    )
    total_sessions = len(appts_result.scalars().all())

    progress_result = await db.execute(
        select(SoundProgressRecord)
        .where(SoundProgressRecord.patient_id == patient_id)
        .order_by(SoundProgressRecord.assessed_at.desc())
    )
    progress = progress_result.scalars().all()

    sessions_result = await db.execute(
        select(Session)
        .join(Appointment)
        .where(Appointment.patient_id == patient_id, Session.status == "completed")
        .order_by(Session.created_at.desc())
        .limit(3)
    )
    recent_sessions = sessions_result.scalars().all()

    full_name = f"{patient.first_name} {patient.last_name}"
    sections = []

    sections.append(
        {
            "title": "Сведения о ребёнке",
            "content": f"""
        <table>
            <tr><th>ФИО ребёнка</th><td>{full_name}</td></tr>
            <tr><th>Дата рождения</th><td>{patient.date_of_birth.isoformat() if patient.date_of_birth else "—"}</td></tr>
            <tr><th>Логопедическое заключение</th><td>{patient.diagnosis or "—"}</td></tr>
            <tr><th>Логопед</th><td>{current_user.full_name}</td></tr>
            <tr><th>Количество проведённых занятий</th><td>{total_sessions}</td></tr>
        </table>
        """,
        }
    )

    if progress:
        sound_map = {}
        for p in progress:
            if p.sound not in sound_map:
                sound_map[p.sound] = p
        stage_labels = {
            "not_started": "Не начат",
            "isolation": "Изоляция",
            "syllables": "Слоги",
            "words": "Слова",
            "phrases": "Фразы",
            "connected_speech": "Связная речь",
            "automated": "Автоматизирован",
        }
        rows = "".join(
            f"<tr><td>{s}</td><td>{stage_labels.get(r.stage.value, r.stage.value)}</td><td>{r.accuracy_percent or '—'}%</td><td>{r.notes or '—'}</td></tr>"
            for s, r in sorted(sound_map.items())
        )
        sections.append(
            {
                "title": "Состояние звукопроизношения",
                "content": f"<table><tr><th>Звук</th><th>Этап</th><th>Точность</th><th>Примечания</th></tr>{rows}</table>",
            }
        )

    if recent_sessions:
        notes = ""
        for s in recent_sessions:
            notes += (
                f"<h3>{s.created_at.strftime('%d.%m.%Y') if s.created_at else '—'}</h3>"
            )
            if s.soap_assessment:
                notes += f"<p><strong>Оценка:</strong> {s.soap_assessment}</p>"
            if s.soap_plan:
                notes += f"<p><strong>План:</strong> {s.soap_plan}</p>"
        sections.append({"title": "Последние заключения", "content": notes})

    sections.append(
        {
            "title": "Рекомендации",
            "content": "<p>_____________________________________________</p><p>_____________________________________________</p><p>_____________________________________________</p>",
        }
    )

    sections.append(
        {
            "title": "",
            "content": f"""
        <br><br>
        <table style="border:none">
            <tr style="border:none"><td style="border:none">Логопед: {current_user.full_name}</td><td style="border:none;text-align:right">Подпись: _______________</td></tr>
            <tr style="border:none"><td style="border:none">Дата: {datetime.now().strftime("%d.%m.%Y")}</td><td style="border:none"></td></tr>
        </table>
        """,
        }
    )

    html = _generate_html_report(f"Логопедическое заключение — {full_name}", sections)

    return StreamingResponse(
        iter([html]),
        media_type="text/html",
        headers={"Content-Disposition": f"inline; filename=pmpk_{patient_id}.html"},
    )
