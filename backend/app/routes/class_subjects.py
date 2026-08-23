from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import (
    User,
    Class,
    Subject,
    ClassSubject
)

from app.schemas.class_subjects import (
    ClassSubjectCreate,
    ClassSubjectResponse
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/class-subjects",
    tags=["Class Subjects"]
)


@router.post(
    "/",
    response_model=ClassSubjectResponse
)
def create_class_subject(
    data: ClassSubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN CAN CREATE CLASS-SUBJECT MAPPING
    # ----------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can assign subjects to classes"
        )

    # ----------------------------------------------------
    # FIND CLASS
    # ----------------------------------------------------

    class_name = data.class_name.strip()
    section = data.section.strip().upper()

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,
            func.lower(Class.name) == class_name.lower(),
            func.upper(Class.section) == section
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Class '{class_name}' with section "
                f"'{section}' not found in your school"
            )
        )

    # ----------------------------------------------------
    # FIND SUBJECT
    # ----------------------------------------------------

    subject_name = data.subject_name.strip()

    subject = (
        db.query(Subject)
        .filter(
            Subject.school_id == current_user.school_id,
            func.lower(Subject.name) == subject_name.lower()
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Subject '{subject_name}' "
                "not found in your school"
            )
        )

    # ----------------------------------------------------
    # CHECK DUPLICATE
    # ----------------------------------------------------

    existing_mapping = (
        db.query(ClassSubject)
        .filter(
            ClassSubject.class_id == school_class.id,
            ClassSubject.subject_id == subject.id
        )
        .first()
    )

    if existing_mapping:
        raise HTTPException(
            status_code=400,
            detail="This subject is already assigned to this class"
        )

    # ----------------------------------------------------
    # CREATE MAPPING
    # ----------------------------------------------------

    class_subject = ClassSubject(
        class_id=school_class.id,
        subject_id=subject.id,
        is_active=True
    )

    db.add(class_subject)
    db.commit()
    db.refresh(class_subject)

    return class_subject