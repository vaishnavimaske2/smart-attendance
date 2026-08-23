from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import User, Subject, Class, ClassSubject

from app.schemas.subjects import BulkSubjectCreate

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/subjects",
    tags=["Subjects"]
)

@router.get("/options")
def get_subject_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    subjects = (
        db.query(Subject)
        .filter(
            Subject.school_id == current_user.school_id,
            Subject.is_active == True
        )
        .order_by(Subject.name)
        .all()
    )

    return [
        {
            "id": subject.id,
            "name": subject.name,
            "code": subject.code
        }
        for subject in subjects
    ]
    
    
@router.post("/bulk")
def create_subjects_bulk(
    data: BulkSubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN CAN ASSIGN SUBJECTS
    # ----------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can assign subjects"
        )

    # ----------------------------------------------------
    # CLEAN INPUT
    # ----------------------------------------------------

    class_name = data.class_name.strip()
    section = data.section.strip().upper()
    academic_year = data.academic_year.strip()

    # ----------------------------------------------------
    # FIND CLASS
    # ----------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,
            func.lower(Class.name) == class_name.lower(),
            func.upper(Class.section) == section,
            Class.academic_year == academic_year
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Class '{class_name}' section '{section}' "
                f"for academic year '{academic_year}' "
                "not found in your school"
            )
        )

    # ----------------------------------------------------
    # CHECK SUBJECT IDS
    # ----------------------------------------------------

    if not data.subject_ids:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one subject"
        )

    # Remove duplicate IDs
    subject_ids = list(set(data.subject_ids))

    # ----------------------------------------------------
    # FIND SUBJECTS
    # ----------------------------------------------------

    subjects = (
        db.query(Subject)
        .filter(
            Subject.id.in_(subject_ids),
            Subject.school_id == current_user.school_id,
            Subject.is_active == True
        )
        .all()
    )

    found_subject_ids = {subject.id for subject in subjects}

    missing_subject_ids = [
        subject_id
        for subject_id in subject_ids
        if subject_id not in found_subject_ids
    ]

    if missing_subject_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Subject(s) not found: {missing_subject_ids}"
        )

    # ----------------------------------------------------
    # PROCESS SUBJECTS
    # ----------------------------------------------------

    added_subjects = []
    skipped_subjects = []

    for subject in subjects:

        # Check whether already assigned
        existing_assignment = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id == school_class.id,
                ClassSubject.subject_id == subject.id
            )
            .first()
        )

        if existing_assignment:

            skipped_subjects.append({
                "id": subject.id,
                "name": subject.name,
                "code": subject.code,
                "reason": "Already assigned to this class"
            })

            continue

        # Create assignment
        class_subject = ClassSubject(
            class_id=school_class.id,
            subject_id=subject.id,
            is_active=True
        )

        db.add(class_subject)

        added_subjects.append({
            "id": subject.id,
            "name": subject.name,
            "code": subject.code
        })

    db.commit()

    # ----------------------------------------------------
    # RESPONSE
    # ----------------------------------------------------

    return {
        "message": "Subjects assigned successfully",

        "class": school_class.name,

        "section": school_class.section,

        "academic_year": school_class.academic_year,

        "added_subjects": added_subjects,

        "skipped_subjects": skipped_subjects
    }