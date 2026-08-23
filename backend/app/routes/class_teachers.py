from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    User,
    Class,
    TeacherAssignment
)

from app.schemas.class_teachers import ClassTeacherResponse
from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/admin/class-teachers",
    tags=["Admin - Class Teachers"]
)


# ============================================================
# VIEW ALL CLASS TEACHERS
# ============================================================

@router.get(
    "/",
    response_model=list[ClassTeacherResponse]
)
def get_class_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN CAN VIEW CLASS TEACHERS
    # ----------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can view class teachers"
        )

    # ----------------------------------------------------
    # GET ALL ACTIVE CLASSES
    # ----------------------------------------------------

    classes = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id
        )
        .order_by(
            Class.name,
            Class.section
        )
        .all()
    )

    result = []

    # ----------------------------------------------------
    # FIND CLASS TEACHER FOR EACH CLASS
    # ----------------------------------------------------

    for school_class in classes:

        assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.class_id == school_class.id,
                TeacherAssignment.is_class_teacher == True,
                TeacherAssignment.is_active == True
            )
            .first()
        )

        teacher_id = None
        teacher_name = None
        teacher_email = None

        if assignment:

            teacher = (
                db.query(User)
                .filter(
                    User.id == assignment.teacher_id,
                    User.school_id == current_user.school_id,
                    User.role == "TEACHER",
                    User.is_active == True
                )
                .first()
            )

            if teacher:
                teacher_id = teacher.id
                teacher_name = teacher.name
                teacher_email = teacher.email

        result.append({
            "class_id": school_class.id,
            "class_name": school_class.name,
            "section": school_class.section,
            "academic_year": school_class.academic_year,
            "teacher_id": teacher_id,
            "teacher_name": teacher_name,
            "teacher_email": teacher_email
        })

    return result