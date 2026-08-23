from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    ClassSubject
)

from app.schemas.student_profile import (
    StudentProfileResponse
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/student-profile",
    tags=["Student Profile"]
)


# ============================================================
# GET STUDENT PROFILE BY ROLL NUMBER
# ============================================================

@router.get(
    "/{roll_number}",
    response_model=StudentProfileResponse
)
def get_student_profile(
    roll_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # AUTHORIZED USERS
    # --------------------------------------------------------
    # For now, ADMIN and TEACHER can view student profiles.
    # Later we can add STUDENT login separately.

    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view student profiles"
        )

    # --------------------------------------------------------
    # CLEAN ROLL NUMBER
    # --------------------------------------------------------

    roll_number = roll_number.strip()

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.roll_number == roll_number,
            Student.is_active == True
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=f"Student with roll number '{roll_number}' not found"
        )

    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.id == student.class_id,
            Class.school_id == current_user.school_id
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail="Student class not found"
        )

    # --------------------------------------------------------
    # GET SUBJECTS FOR CLASS
    # --------------------------------------------------------

    class_subjects = (
        db.query(ClassSubject)
        .filter(
            ClassSubject.class_id == school_class.id,
            ClassSubject.is_active == True
        )
        .all()
    )

    subjects = []

    for class_subject in class_subjects:

        subject = (
            db.query(Subject)
            .filter(
                Subject.id == class_subject.subject_id,
                Subject.school_id == current_user.school_id,
                Subject.is_active == True
            )
            .first()
        )

        if subject:
            subjects.append({
                "subject_id": subject.id,
                "subject_name": subject.name
            })

    # --------------------------------------------------------
    # RETURN PROFILE
    # --------------------------------------------------------

    return {
        "id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "class_id": school_class.id,
        "class_name": school_class.name,
        "section": school_class.section,
        "academic_year": school_class.academic_year,
        "subjects": subjects
    }