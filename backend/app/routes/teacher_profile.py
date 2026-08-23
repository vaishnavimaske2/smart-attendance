from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import (
    User,
    Class,
    Subject,
    TeacherAssignment
)

from app.schemas.teacher_profile import (
    TeacherProfileResponse
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/teacher-profile",
    tags=["Teacher Profile"]
)


# ============================================================
# GET LOGGED-IN TEACHER PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=TeacherProfileResponse
)
def get_teacher_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY TEACHERS
    # ----------------------------------------------------

    if current_user.role != "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can access this profile"
        )

    # ----------------------------------------------------
    # GET ACTIVE ASSIGNMENTS
    # ----------------------------------------------------

    assignments = (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id == current_user.id,
            TeacherAssignment.is_active == True
        )
        .all()
    )

    # ----------------------------------------------------
    # GROUP ASSIGNMENTS BY CLASS
    # ----------------------------------------------------

    class_data = {}

    for assignment in assignments:

        school_class = (
            db.query(Class)
            .filter(
                Class.id == assignment.class_id,
                Class.school_id == current_user.school_id
            )
            .first()
        )

        if not school_class:
            continue

        # ------------------------------------------------
        # CREATE CLASS ENTRY
        # ------------------------------------------------

        if school_class.id not in class_data:

            class_data[school_class.id] = {
                "class_id": school_class.id,
                "class_name": school_class.name,
                "section": school_class.section,
                "academic_year": school_class.academic_year,
                "is_class_teacher": False,
                "subjects": []
            }

        # ------------------------------------------------
        # CLASS TEACHER
        # ------------------------------------------------

        if assignment.is_class_teacher:

            class_data[
                school_class.id
            ]["is_class_teacher"] = True

        # ------------------------------------------------
        # SUBJECT
        # ------------------------------------------------

        # TeacherAssignment may contain subject_id
        # only for subject assignments.
        if assignment.subject_id is not None:

            subject = (
                db.query(Subject)
                .filter(
                    Subject.id == assignment.subject_id,
                    Subject.school_id == current_user.school_id,
                    Subject.is_active == True
                )
                .first()
            )

            if subject:

                # ----------------------------------------
                # AVOID DUPLICATE SUBJECTS
                # ----------------------------------------

                existing_subject = any(
                    item["subject_id"] == subject.id
                    for item in class_data[
                        school_class.id
                    ]["subjects"]
                )

                if not existing_subject:

                    class_data[
                        school_class.id
                    ]["subjects"].append({
                        "subject_id": subject.id,
                        "subject_name": subject.name,
                        "is_class_teacher": assignment.is_class_teacher
                    })

    # ----------------------------------------------------
    # RETURN PROFILE
    # ----------------------------------------------------

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "classes": list(class_data.values())
    }