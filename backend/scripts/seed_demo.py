"""Seed script to create a realistic demo account for Sandar.

Creates a therapist with patients, appointments, sessions with SOAP notes,
homework templates, homework assignments, sound progress records,
session packages, and availability schedule.

Usage:
    cd backend
    python scripts/seed_demo.py

Demo credentials:
    Email:    demo@sandar.kz
    Password: Demo1234
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone, time, date
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    Therapist,
    Patient,
    PatientStatus,
    Appointment,
    AppointmentStatus,
    SessionType,
    Session,
    Parent,
    SessionPackage,
    PaymentStatus,
    HomeworkTemplate,
    HomeworkCategory,
    HomeworkAssignment,
    HomeworkStatus,
    SoundProgressRecord,
    SoundStage,
    TherapistAvailability,
    Subscription,
)


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if demo account already exists
        result = await db.execute(
            select(Therapist).where(Therapist.email == "demo@sandar.kz")
        )
        if result.scalars().first():
            print("Demo account already exists. Skipping seed.")
            return

        now = datetime.now(timezone.utc)
        today = date.today()

        # =============================================
        # 1. CREATE THERAPIST
        # =============================================
        therapist = Therapist(
            email="demo@sandar.kz",
            hashed_password=get_password_hash("Demo1234"),
            full_name="Дана Каримова",
            clinic_name="SpeechCare Almaty",
            default_session_duration=45,
            default_price=Decimal("7500.00"),
            onboarding_completed=True,
        )
        db.add(therapist)
        await db.flush()
        print(f"Created therapist: {therapist.full_name} (ID: {therapist.id})")

        # =============================================
        # 2. CREATE SUBSCRIPTION
        # =============================================
        sub = Subscription(
            therapist_id=therapist.id,
            plan="standard",
            status="active",
            started_at=now - timedelta(days=14),
            expires_at=now + timedelta(days=16),
        )
        db.add(sub)

        # =============================================
        # 3. CREATE PARENTS
        # =============================================
        parents_data = [
            {"phone": "+77011111111", "full_name": "Айгуль Нурланова"},
            {"phone": "+77022222222", "full_name": "Марат Сабитов"},
            {"phone": "+77033333333", "full_name": "Жанна Ахметова"},
            {"phone": "+77044444444", "full_name": "Бахыт Касымов"},
        ]
        parents = []
        for pd in parents_data:
            parent = Parent(phone=pd["phone"], full_name=pd["full_name"])
            db.add(parent)
            parents.append(parent)
        await db.flush()
        print(f"Created {len(parents)} parents")

        # =============================================
        # 4. CREATE PATIENTS
        # =============================================
        patients_data = [
            {
                "first_name": "Артём",
                "last_name": "Нурланов",
                "diagnosis": "Дислалия, нарушение звукопроизношения [Р], [Л]",
                "parent_phone": "+77011111111",
                "parent": parents[0],
                "date_of_birth": date(2019, 3, 15),
            },
            {
                "first_name": "Амина",
                "last_name": "Сабитова",
                "diagnosis": "Задержка речевого развития (ЗРР)",
                "parent_phone": "+77022222222",
                "parent": parents[1],
                "date_of_birth": date(2020, 7, 22),
            },
            {
                "first_name": "Даниял",
                "last_name": "Ахметов",
                "diagnosis": "Дизартрия, нарушение звуков [С], [Ш], [Ж]",
                "parent_phone": "+77033333333",
                "parent": parents[2],
                "date_of_birth": date(2018, 11, 5),
            },
            {
                "first_name": "Аяна",
                "last_name": "Касымова",
                "diagnosis": "Заикание, клоническая форма",
                "parent_phone": "+77044444444",
                "parent": parents[3],
                "date_of_birth": date(2017, 1, 30),
            },
            {
                "first_name": "Тимур",
                "last_name": "Нурланов",
                "diagnosis": "Дислалия, нарушение звукопроизношения [Р]",
                "parent_phone": "+77011111111",
                "parent": parents[0],
                "date_of_birth": date(2021, 5, 10),
            },
        ]
        patients = []
        for pd in patients_data:
            patient = Patient(
                therapist_id=therapist.id,
                first_name=pd["first_name"],
                last_name=pd["last_name"],
                diagnosis=pd["diagnosis"],
                parent_phone=pd["parent_phone"],
                parent_id=pd["parent"].id,
                date_of_birth=pd["date_of_birth"],
                status=PatientStatus.ACTIVE,
            )
            db.add(patient)
            patients.append(patient)
        await db.flush()
        print(f"Created {len(patients)} patients")

        # =============================================
        # 5. CREATE SESSION PACKAGES
        # =============================================
        packages_data = [
            {
                "patient": patients[0],
                "total": 12,
                "used": 8,
                "price": 7500,
                "status": PaymentStatus.PAID,
            },
            {
                "patient": patients[1],
                "total": 8,
                "used": 3,
                "price": 7500,
                "status": PaymentStatus.PAID,
            },
            {
                "patient": patients[2],
                "total": 12,
                "used": 12,
                "price": 7000,
                "status": PaymentStatus.PAID,
            },
            {
                "patient": patients[3],
                "total": 8,
                "used": 5,
                "price": 8000,
                "status": PaymentStatus.PARTIAL,
            },
            {
                "patient": patients[4],
                "total": 4,
                "used": 1,
                "price": 7500,
                "status": PaymentStatus.PENDING,
            },
        ]
        packages = []
        for pkd in packages_data:
            pkg = SessionPackage(
                patient_id=pkd["patient"].id,
                therapist_id=therapist.id,
                total_sessions=pkd["total"],
                used_sessions=pkd["used"],
                price_per_session=Decimal(str(pkd["price"])),
                total_price=Decimal(str(pkd["price"] * pkd["total"])),
                payment_status=pkd["status"],
                purchased_at=now - timedelta(days=30),
            )
            db.add(pkg)
            packages.append(pkg)
        await db.flush()
        print(f"Created {len(packages)} session packages")

        # =============================================
        # 6. CREATE PAST APPOINTMENTS + SESSIONS
        # =============================================
        soap_notes = [
            {
                "subjective": "Мама отмечает, что ребёнок стал чаще пытаться произносить звук [Р] в быту.",
                "objective": "Звук [Р] поставлен по подражанию. В изолированном произношении — стабильный. В слогах — нестабильный.",
                "assessment": "Положительная динамика. Звук находится на этапе автоматизации в слогах.",
                "plan": "Продолжить автоматизацию [Р] в прямых и обратных слогах. Домашнее задание: 10 минут в день.",
            },
            {
                "subjective": "Родитель сообщает об улучшении активного словаря. Ребёнок начал использовать двухсловные фразы.",
                "objective": "Активный словарь: ~80 слов. Понимание обращённой речи соответствует возрасту.",
                "assessment": "ЗРР средней степени. Положительная динамика в экспрессивной речи.",
                "plan": "Работа над расширением фразовой речи. Игровые упражнения на глаголы действия.",
            },
            {
                "subjective": "Ребёнок мотивирован, активно выполнял упражнения. Домашнее задание выполнено частично.",
                "objective": "Звук [С] — автоматизирован в словах. [Ш] — на этапе слогов. [Ж] — постановка.",
                "assessment": "Стабильный прогресс по всем целевым звукам.",
                "plan": "Автоматизация [С] в предложениях. [Ш] — переход к словам. [Ж] — продолжить постановку.",
            },
            {
                "subjective": "Мама отмечает снижение частоты запинок в домашней обстановке.",
                "objective": "В кабинете: темп речи замедлен, запинки единичные. Использует приёмы плавной речи.",
                "assessment": "Положительная динамика. Ребёнок осознанно применяет технику расслабления.",
                "plan": "Закрепление навыков плавной речи в диалоге. Ролевые игры.",
            },
        ]

        sessions_created = []
        for i, patient in enumerate(patients[:4]):
            for j in range(3):
                days_ago = 21 - (j * 7)
                appt_time = now - timedelta(days=days_ago, hours=2)
                appt = Appointment(
                    therapist_id=therapist.id,
                    patient_id=patient.id,
                    start_time=appt_time,
                    end_time=appt_time + timedelta(minutes=45),
                    status=AppointmentStatus.COMPLETED,
                    session_type=SessionType.IN_PERSON,
                    session_number=j + 1,
                    package_id=packages[i].id,
                )
                db.add(appt)
                await db.flush()

                soap = soap_notes[i]
                session = Session(
                    appointment_id=appt.id,
                    status="completed",
                    soap_subjective=soap["subjective"],
                    soap_objective=soap["objective"],
                    soap_assessment=soap["assessment"],
                    soap_plan=soap["plan"],
                    homework_for_parents=f"Выполнять упражнения по 10-15 минут ежедневно.",
                )
                db.add(session)
                await db.flush()
                sessions_created.append(session)

        print(f"Created {len(sessions_created)} past sessions with SOAP notes")

        # =============================================
        # 7. CREATE UPCOMING APPOINTMENTS
        # =============================================
        upcoming = []
        for i, patient in enumerate(patients):
            days_ahead = i + 1
            appt_time = now + timedelta(days=days_ahead, hours=3)
            appt = Appointment(
                therapist_id=therapist.id,
                patient_id=patient.id,
                start_time=appt_time,
                end_time=appt_time + timedelta(minutes=45),
                status=AppointmentStatus.PLANNED,
                session_type=SessionType.IN_PERSON,
                package_id=packages[i].id,
            )
            db.add(appt)
            upcoming.append(appt)
        await db.flush()
        print(f"Created {len(upcoming)} upcoming appointments")

        # =============================================
        # 8. CREATE HOMEWORK TEMPLATES
        # =============================================
        templates_data = [
            {
                "title": "Автоматизация звука [Р]",
                "description": "Упражнения для закрепления звука Р в слогах и словах",
                "category": HomeworkCategory.ARTICULATION,
                "instructions": "1. Произнесите звук [Р] 10 раз изолированно\n2. Повторите слоги: ра-ро-ру-ры по 5 раз\n3. Назовите картинки со звуком [Р]: рыба, рука, ракета, роза\n4. Повторите чистоговорки 3 раза",
                "target_sounds": "Р",
                "age_range": "4-7",
            },
            {
                "title": "Автоматизация звука [Л]",
                "description": "Упражнения для закрепления звука Л",
                "category": HomeworkCategory.ARTICULATION,
                "instructions": "1. Произнесите звук [Л] 10 раз\n2. Повторите слоги: ла-ло-лу-лы\n3. Назовите слова: лампа, лодка, луна, лыжи\n4. Составьте предложения с этими словами",
                "target_sounds": "Л",
                "age_range": "4-7",
            },
            {
                "title": "Развитие фразовой речи",
                "description": "Упражнения для расширения фразовой речи у детей с ЗРР",
                "category": HomeworkCategory.GRAMMAR,
                "instructions": "1. Рассмотрите картинки и задайте вопросы: Кто? Что делает?\n2. Составляйте простые предложения из 2-3 слов\n3. Играйте в 'Что делает мишка?' с игрушками\n4. Читайте короткие сказки, задавая вопросы по ходу",
                "target_sounds": None,
                "age_range": "2-4",
            },
            {
                "title": "Дыхательная гимнастика",
                "description": "Упражнения для формирования правильного речевого дыхания",
                "category": HomeworkCategory.FLUENCY,
                "instructions": "1. 'Задуй свечу' — плавный длительный выдох (5 раз)\n2. 'Кораблик' — дуть на бумажный кораблик в воде\n3. 'Снежинка' — сдуть ватку с ладони\n4. Произносить гласные на длинном выдохе: а-а-а, о-о-о",
                "target_sounds": None,
                "age_range": "3-8",
            },
            {
                "title": "Артикуляционная гимнастика",
                "description": "Базовый комплекс упражнений для подготовки артикуляционного аппарата",
                "category": HomeworkCategory.ARTICULATION,
                "instructions": "Выполнять перед зеркалом, каждое упражнение по 10 раз:\n1. 'Улыбка' — широко улыбнуться\n2. 'Трубочка' — вытянуть губы\n3. 'Лопатка' — широкий язык на нижней губе\n4. 'Чашечка' — поднять края языка\n5. 'Лошадка' — цокать языком",
                "target_sounds": "Р,Л,Ш,С",
                "age_range": "3-8",
            },
        ]
        templates = []
        for td in templates_data:
            tmpl = HomeworkTemplate(
                therapist_id=therapist.id,
                title=td["title"],
                description=td["description"],
                category=td["category"],
                instructions=td["instructions"],
                target_sounds=td["target_sounds"],
                age_range=td["age_range"],
            )
            db.add(tmpl)
            templates.append(tmpl)
        await db.flush()
        print(f"Created {len(templates)} homework templates")

        # =============================================
        # 9. CREATE HOMEWORK ASSIGNMENTS
        # =============================================
        hw_assignments = []
        for i, session in enumerate(sessions_created[:5]):
            patient_idx = i % len(patients[:4])
            hw = HomeworkAssignment(
                session_id=session.id,
                patient_id=patients[patient_idx].id,
                template_id=templates[i % len(templates)].id,
                custom_instructions=templates[i % len(templates)].instructions,
                due_date=now + timedelta(days=3),
                status=HomeworkStatus.ASSIGNED if i < 3 else HomeworkStatus.COMPLETED,
            )
            db.add(hw)
            hw_assignments.append(hw)
        await db.flush()
        print(f"Created {len(hw_assignments)} homework assignments")

        # =============================================
        # 10. CREATE SOUND PROGRESS RECORDS
        # =============================================
        sound_data = [
            # Artёm — working on Р and Л
            {
                "patient": patients[0],
                "sound": "Р",
                "stages": [
                    (SoundStage.ISOLATION, 21),
                    (SoundStage.SYLLABLES, 14),
                    (SoundStage.WORDS, 7),
                ],
            },
            {
                "patient": patients[0],
                "sound": "Л",
                "stages": [
                    (SoundStage.ISOLATION, 21),
                    (SoundStage.SYLLABLES, 14),
                    (SoundStage.SYLLABLES, 7),
                ],
            },
            # Daniyal — working on С, Ш, Ж
            {
                "patient": patients[2],
                "sound": "С",
                "stages": [
                    (SoundStage.SYLLABLES, 21),
                    (SoundStage.WORDS, 14),
                    (SoundStage.PHRASES, 7),
                ],
            },
            {
                "patient": patients[2],
                "sound": "Ш",
                "stages": [
                    (SoundStage.ISOLATION, 21),
                    (SoundStage.SYLLABLES, 14),
                    (SoundStage.SYLLABLES, 7),
                ],
            },
            {
                "patient": patients[2],
                "sound": "Ж",
                "stages": [
                    (SoundStage.NOT_STARTED, 21),
                    (SoundStage.ISOLATION, 14),
                    (SoundStage.ISOLATION, 7),
                ],
            },
        ]
        progress_count = 0
        for sd in sound_data:
            for stage, days_ago in sd["stages"]:
                session_idx = min(progress_count, len(sessions_created) - 1)
                rec = SoundProgressRecord(
                    patient_id=sd["patient"].id,
                    session_id=sessions_created[session_idx].id,
                    sound=sd["sound"],
                    stage=stage,
                    assessed_at=now - timedelta(days=days_ago),
                )
                db.add(rec)
                progress_count += 1
        await db.flush()
        print(f"Created {progress_count} sound progress records")

        # =============================================
        # 11. CREATE AVAILABILITY SCHEDULE
        # =============================================
        # Monday-Friday, 9:00-13:00 and 14:00-18:00
        for day in range(5):  # Mon-Fri
            for start_h, end_h in [(9, 13), (14, 18)]:
                slot = TherapistAvailability(
                    therapist_id=therapist.id,
                    day_of_week=day,
                    start_time=time(start_h, 0),
                    end_time=time(end_h, 0),
                    is_active=True,
                )
                db.add(slot)
        await db.flush()
        print("Created availability schedule (Mon-Fri, 9-13 & 14-18)")

        # =============================================
        # COMMIT
        # =============================================
        await db.commit()

        print("\n" + "=" * 50)
        print("Demo account created successfully!")
        print("=" * 50)
        print(f"Email:    demo@sandar.kz")
        print(f"Password: Demo1234")
        print(f"Patients: {len(patients)}")
        print(f"Sessions: {len(sessions_created)} (with SOAP notes)")
        print(f"Upcoming: {len(upcoming)} appointments")
        print(f"Templates: {len(templates)} homework templates")
        print(f"Packages: {len(packages)} session packages")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
