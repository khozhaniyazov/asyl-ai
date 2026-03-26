"""Seed test data: 5 Specialists, 5 Parents, 10 Appointments, mock reviews, mock homework."""

import asyncio
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.therapist import Therapist
from app.models.therapist_profile import TherapistProfile, VerificationStatus
from app.models.parent import Parent
from app.models.patient import Patient, PatientStatus
from app.models.appointment import Appointment, AppointmentStatus, SessionType
from app.models.session import Session
from app.models.review import Review
from app.models.homework_assignment import HomeworkAssignment, HomeworkStatus


THERAPISTS = [
    {
        "email": "asel@samga.ai",
        "full_name": "Asel Nurbekova",
        "clinic_name": "Samga Speech Center",
    },
    {
        "email": "dana@samga.ai",
        "full_name": "Dana Karimova",
        "clinic_name": "Almaty Logoped",
    },
    {"email": "marat@samga.ai", "full_name": "Marat Suleimanov", "clinic_name": None},
    {
        "email": "gulnara@samga.ai",
        "full_name": "Gulnara Akhmetova",
        "clinic_name": "Astana Kids Speech",
    },
    {
        "email": "timur@samga.ai",
        "full_name": "Timur Orazov",
        "clinic_name": "Shymkent Logoped",
    },
]

PROFILES = [
    {
        "bio": "Experienced speech therapist specializing in childhood dysarthria and stuttering.",
        "specializations": ["dysarthria", "stuttering", "phonological_disorders"],
        "education": "KazNU, Defectology, 2015",
        "city": "Алматы",
        "languages": ["ru", "kk"],
        "gender": "female",
        "years_of_experience": 9,
        "price_range_min": 7000,
        "price_range_max": 12000,
        "online_available": True,
        "is_published": True,
        "session_duration": 45,
        "license_number": "KZ-LOG-2024-0001",
        "verification_status": VerificationStatus.VERIFIED,
        "age_groups": ["children", "adolescents"],
    },
    {
        "bio": "Helping children find their voice through play-based therapy.",
        "specializations": ["articulation", "language_delay", "autism_spectrum"],
        "education": "Nazarbayev University, Speech Pathology, 2018",
        "city": "Алматы",
        "languages": ["ru", "en"],
        "gender": "female",
        "years_of_experience": 6,
        "price_range_min": 8000,
        "price_range_max": 15000,
        "online_available": True,
        "is_published": True,
        "session_duration": 50,
        "license_number": "KZ-LOG-2024-0002",
        "verification_status": VerificationStatus.VERIFIED,
        "age_groups": ["children"],
    },
    {
        "bio": "Adult speech rehabilitation after stroke and TBI.",
        "specializations": ["aphasia", "dysarthria", "voice_disorders"],
        "education": "MSU, Clinical Psychology, 2012",
        "city": "Астана",
        "languages": ["ru", "kk", "en"],
        "gender": "male",
        "years_of_experience": 12,
        "price_range_min": 10000,
        "price_range_max": 20000,
        "online_available": False,
        "is_published": True,
        "session_duration": 60,
        "license_number": "KZ-LOG-2024-0003",
        "verification_status": VerificationStatus.PENDING,
        "age_groups": ["adults"],
    },
    {
        "bio": "Pediatric speech therapist with focus on early intervention.",
        "specializations": ["language_delay", "phonological_disorders", "fluency"],
        "education": "ENU, Special Education, 2016",
        "city": "Астана",
        "languages": ["kk", "ru"],
        "gender": "female",
        "years_of_experience": 8,
        "price_range_min": 6000,
        "price_range_max": 10000,
        "online_available": True,
        "is_published": True,
        "session_duration": 40,
        "license_number": None,
        "verification_status": VerificationStatus.UNVERIFIED,
        "age_groups": ["children", "adolescents"],
    },
    {
        "bio": "Bilingual therapist working with Kazakh and Russian speaking families.",
        "specializations": ["stuttering", "articulation", "bilingual_therapy"],
        "education": "SKSU, Defectology, 2017",
        "city": "Шымкент",
        "languages": ["kk", "ru"],
        "gender": "male",
        "years_of_experience": 7,
        "price_range_min": 5000,
        "price_range_max": 9000,
        "online_available": True,
        "is_published": True,
        "session_duration": 45,
        "license_number": "KZ-LOG-2024-0005",
        "verification_status": VerificationStatus.VERIFIED,
        "age_groups": ["children", "adolescents", "adults"],
    },
]

PARENTS = [
    {"phone": "+77001112233", "full_name": "Aigul Tulegenova"},
    {"phone": "+77002223344", "full_name": "Bolat Serikbaev"},
    {"phone": "+77003334455", "full_name": "Saule Mukhanova"},
    {"phone": "+77004445566", "full_name": "Yerlan Dosymov"},
    {"phone": "+77005556677", "full_name": "Madina Zhunusova"},
]

PATIENTS = [
    {
        "first_name": "Arman",
        "last_name": "Tulegenov",
        "diagnosis": "Dysarthria",
        "parent_phone": "+77001112233",
        "date_of_birth": date(2019, 3, 15),
    },
    {
        "first_name": "Aisha",
        "last_name": "Serikbaeva",
        "diagnosis": "Stuttering",
        "parent_phone": "+77002223344",
        "date_of_birth": date(2018, 7, 22),
    },
    {
        "first_name": "Nursultan",
        "last_name": "Mukhanov",
        "diagnosis": "Language delay",
        "parent_phone": "+77003334455",
        "date_of_birth": date(2020, 1, 10),
    },
    {
        "first_name": "Kamila",
        "last_name": "Dosymova",
        "diagnosis": "Phonological disorder",
        "parent_phone": "+77004445566",
        "date_of_birth": date(2017, 11, 5),
    },
    {
        "first_name": "Damir",
        "last_name": "Zhunusov",
        "diagnosis": "Articulation disorder",
        "parent_phone": "+77005556677",
        "date_of_birth": date(2019, 9, 28),
    },
    {
        "first_name": "Alina",
        "last_name": "Tulegenova",
        "diagnosis": "Fluency disorder",
        "parent_phone": "+77001112233",
        "date_of_birth": date(2021, 4, 12),
    },
    {
        "first_name": "Tamerlan",
        "last_name": "Serikbaev",
        "diagnosis": "Autism spectrum",
        "parent_phone": "+77002223344",
        "date_of_birth": date(2020, 6, 30),
    },
]

REVIEW_TEXTS = [
    "Very professional and caring therapist. My child made great progress!",
    "Excellent approach with children. Highly recommend.",
    "Good results after 3 months of sessions.",
    "Patient and understanding. My son loves the sessions.",
    "Great communication with parents about progress.",
]

HOMEWORK_INSTRUCTIONS = [
    "Practice the 'S' sound in isolation for 10 minutes daily.",
    "Read the story aloud and circle words with the target sound.",
    "Record a 2-minute video of the child naming picture cards.",
    "Practice tongue exercises from the handout 3 times daily.",
    "Play the word matching game focusing on 'R' blends.",
]


async def seed_test_data():
    # Create all tables
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)

        # --- Seed admin first ---
        result = await db.execute(
            select(Therapist).where(Therapist.email == "admin@samga.ai")
        )
        if not result.scalars().first():
            admin = Therapist(
                email="admin@samga.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                clinic_name="Samga AI",
                is_admin=True,
                onboarding_completed=True,
            )
            db.add(admin)
            await db.flush()
            print("+ Created admin user: admin@samga.ai / admin123")
        else:
            print("= Admin user already exists")

        # --- Therapists ---
        therapist_ids = []
        for t_data in THERAPISTS:
            result = await db.execute(
                select(Therapist).where(Therapist.email == t_data["email"])
            )
            existing = result.scalars().first()
            if existing:
                therapist_ids.append(existing.id)
                print(
                    f"= Therapist {t_data['email']} already exists (id={existing.id})"
                )
                continue
            t = Therapist(
                email=t_data["email"],
                hashed_password=get_password_hash("test123"),
                full_name=t_data["full_name"],
                clinic_name=t_data["clinic_name"],
                onboarding_completed=True,
            )
            db.add(t)
            await db.flush()
            therapist_ids.append(t.id)
            print(f"+ Created therapist: {t_data['email']} (id={t.id})")

        # --- Therapist Profiles ---
        for i, p_data in enumerate(PROFILES):
            tid = therapist_ids[i]
            result = await db.execute(
                select(TherapistProfile).where(TherapistProfile.therapist_id == tid)
            )
            if result.scalars().first():
                print(f"= Profile for therapist_id={tid} already exists")
                continue
            profile = TherapistProfile(therapist_id=tid, **p_data)
            db.add(profile)
            print(f"+ Created profile for therapist_id={tid}")

        await db.flush()

        # --- Parents ---
        parent_ids = []
        for p_data in PARENTS:
            result = await db.execute(
                select(Parent).where(Parent.phone == p_data["phone"])
            )
            existing = result.scalars().first()
            if existing:
                parent_ids.append(existing.id)
                print(f"= Parent {p_data['phone']} already exists (id={existing.id})")
                continue
            p = Parent(phone=p_data["phone"], full_name=p_data["full_name"])
            db.add(p)
            await db.flush()
            parent_ids.append(p.id)
            print(f"+ Created parent: {p_data['full_name']} (id={p.id})")

        # --- Patients (assigned to therapists round-robin, linked to parents) ---
        patient_ids = []
        for i, pt_data in enumerate(PATIENTS):
            tid = therapist_ids[i % len(therapist_ids)]
            pid = parent_ids[i % len(parent_ids)]
            result = await db.execute(
                select(Patient).where(
                    Patient.first_name == pt_data["first_name"],
                    Patient.last_name == pt_data["last_name"],
                    Patient.therapist_id == tid,
                )
            )
            existing = result.scalars().first()
            if existing:
                patient_ids.append(existing.id)
                print(
                    f"= Patient {pt_data['first_name']} {pt_data['last_name']} already exists"
                )
                continue
            patient = Patient(
                therapist_id=tid,
                first_name=pt_data["first_name"],
                last_name=pt_data["last_name"],
                diagnosis=pt_data["diagnosis"],
                parent_phone=pt_data["parent_phone"],
                date_of_birth=pt_data["date_of_birth"],
                status=PatientStatus.ACTIVE,
                parent_id=pid,
            )
            db.add(patient)
            await db.flush()
            patient_ids.append(patient.id)
            print(
                f"+ Created patient: {pt_data['first_name']} {pt_data['last_name']} (id={patient.id})"
            )

        # --- Appointments (10 total, spread across therapists) ---
        appt_ids = []
        for i in range(10):
            tid = therapist_ids[i % len(therapist_ids)]
            ptid = patient_ids[i % len(patient_ids)]
            day_offset = -14 + (i * 2)  # spread over past 2 weeks
            start = now + timedelta(days=day_offset, hours=10)
            end = start + timedelta(minutes=45)
            status = (
                AppointmentStatus.COMPLETED
                if day_offset < 0
                else AppointmentStatus.PLANNED
            )

            appt = Appointment(
                therapist_id=tid,
                patient_id=ptid,
                start_time=start,
                end_time=end,
                status=status,
                session_type=SessionType.IN_PERSON
                if i % 3 != 0
                else SessionType.ONLINE,
                meeting_link=f"https://meet.samga.ai/session-{i + 1}"
                if i % 3 == 0
                else None,
            )
            db.add(appt)
            await db.flush()
            appt_ids.append(appt.id)
            print(
                f"+ Created appointment id={appt.id} (therapist={tid}, patient={ptid}, status={status.value})"
            )

        # --- Sessions for completed appointments ---
        session_ids = []
        for i, appt_id in enumerate(appt_ids):
            # Only create sessions for completed appointments (first ~7)
            if i >= 7:
                break
            session = Session(
                appointment_id=appt_id,
                status="completed",
                soap_subjective=f"Patient reported improvement in target sounds. Parent notes consistent practice at home.",
                soap_objective=f"Articulation accuracy: {60 + i * 5}% on target sounds in connected speech.",
                soap_assessment=f"Progressing well. Moving from isolation to syllable level for secondary targets.",
                soap_plan=f"Continue current approach. Introduce new target sound /{'srlkzm'[i % 6]}/.",
                homework_for_parents=HOMEWORK_INSTRUCTIONS[
                    i % len(HOMEWORK_INSTRUCTIONS)
                ],
            )
            db.add(session)
            await db.flush()
            session_ids.append(session.id)
            print(f"+ Created session id={session.id} for appointment_id={appt_id}")

        # --- Reviews (one per parent-therapist pair, linked to sessions where possible) ---
        for i in range(5):
            parent_id = parent_ids[i % len(parent_ids)]
            therapist_id = therapist_ids[i % len(therapist_ids)]
            session_id = session_ids[i] if i < len(session_ids) else None

            review = Review(
                parent_id=parent_id,
                therapist_id=therapist_id,
                session_id=session_id,
                rating_overall=4 + (i % 2),  # 4 or 5
                rating_results=3 + (i % 3),
                rating_approach=4 + (i % 2),
                rating_communication=5,
                rating_punctuality=4 + (i % 2),
                text=REVIEW_TEXTS[i],
                is_verified=session_id is not None,
                is_published=True,
                therapist_reply="Thank you for your kind words!"
                if i % 2 == 0
                else None,
                therapist_reply_at=now if i % 2 == 0 else None,
            )
            db.add(review)
            print(
                f"+ Created review from parent_id={parent_id} for therapist_id={therapist_id}"
            )

        # --- Homework Assignments ---
        for i in range(5):
            ptid = patient_ids[i % len(patient_ids)]
            sid = session_ids[i] if i < len(session_ids) else None
            status = (
                HomeworkStatus.COMPLETED
                if i < 2
                else (HomeworkStatus.VERIFIED if i == 2 else HomeworkStatus.ASSIGNED)
            )

            hw = HomeworkAssignment(
                session_id=sid,
                patient_id=ptid,
                custom_instructions=HOMEWORK_INSTRUCTIONS[i],
                due_date=now + timedelta(days=7),
                status=status,
                parent_completed_at=now - timedelta(days=1)
                if status in (HomeworkStatus.COMPLETED, HomeworkStatus.VERIFIED)
                else None,
                parent_notes="Done! He practiced every day."
                if status in (HomeworkStatus.COMPLETED, HomeworkStatus.VERIFIED)
                else None,
                therapist_verified_at=now
                if status == HomeworkStatus.VERIFIED
                else None,
                therapist_feedback="Great job! Keep it up."
                if status == HomeworkStatus.VERIFIED
                else None,
            )
            db.add(hw)
            print(f"+ Created homework for patient_id={ptid} (status={status.value})")

        await db.commit()
        print("\n=== Seed complete ===")
        print(f"  Therapists: {len(therapist_ids)} + 1 admin")
        print(f"  Parents: {len(parent_ids)}")
        print(f"  Patients: {len(patient_ids)}")
        print(f"  Appointments: {len(appt_ids)}")
        print(f"  Sessions: {len(session_ids)}")
        print(f"  Reviews: 5")
        print(f"  Homework: 5")


if __name__ == "__main__":
    asyncio.run(seed_test_data())
