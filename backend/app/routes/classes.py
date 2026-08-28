from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import User, Class, Student
from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/classes",
    tags=["Classes"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ClassRequest(BaseModel):
    name: str
    section: str


# ============================================================
# ADMIN CHECK
# ============================================================

def require_admin(current_user: User):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=403,
            detail="Administrator access required."
        )


# ============================================================
# GET ALL CLASSES — ADMIN
# ============================================================

@router.get("/admin")
def get_admin_classes(

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    classes = (
        db.query(Class)
        .filter(
            Class.school_id ==
            current_user.school_id
        )
        .order_by(
            Class.name,
            Class.section
        )
        .all()
    )

    result = []

    for school_class in classes:

        student_count = (
            db.query(func.count(Student.id))
            .filter(
                Student.class_id ==
                school_class.id,

                Student.school_id ==
                current_user.school_id
            )
            .scalar()
        )

        result.append({

            "id":
                school_class.id,

            "name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "is_active":
                school_class.is_active,

            "school_id":
                school_class.school_id,

            "student_count":
                student_count or 0
        })

    return result


# ============================================================
# CREATE CLASS — ADMIN
# ============================================================

@router.post("/admin")
def create_class(

    class_data: ClassRequest,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    name = class_data.name.strip()

    section = (
        class_data.section
        .strip()
        .upper()
    )


    if not name:

        raise HTTPException(
            status_code=400,
            detail="Class name is required."
        )


    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section is required."
        )


    # --------------------------------------------------------
    # ACADEMIC YEAR
    # --------------------------------------------------------

    current_year = datetime.now().year

    academic_year = (
        f"{current_year}-{current_year + 1}"
    )


    # --------------------------------------------------------
    # CHECK DUPLICATE
    # --------------------------------------------------------

    existing_class = (
        db.query(Class)
        .filter(
            Class.school_id ==
            current_user.school_id,

            Class.name ==
            name,

            Class.section ==
            section
        )
        .first()
    )


    if existing_class:

        raise HTTPException(
            status_code=400,
            detail=(
                "This class and section "
                "already exists."
            )
        )


    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    school_class = Class(

        school_id =
            current_user.school_id,

        name =
            name,

        section =
            section,

        academic_year =
            academic_year,

        is_active =
            True
    )


    db.add(school_class)

    db.commit()

    db.refresh(school_class)


    return {

        "message":
            "Class created successfully.",

        "class": {

            "id":
                school_class.id,

            "name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "is_active":
                school_class.is_active,

            "school_id":
                school_class.school_id,

            "student_count":
                0
        }
    }


# ============================================================
# UPDATE CLASS — ADMIN
# ============================================================

@router.put("/admin/{class_id}")
def update_class(

    class_id: int,

    class_data: ClassRequest,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    name = class_data.name.strip()

    section = (
        class_data.section
        .strip()
        .upper()
    )


    if not name:

        raise HTTPException(
            status_code=400,
            detail="Class name is required."
        )


    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section is required."
        )


    school_class = (
        db.query(Class)
        .filter(
            Class.id == class_id,

            Class.school_id ==
            current_user.school_id
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found."
        )


    duplicate = (
        db.query(Class)
        .filter(
            Class.school_id ==
            current_user.school_id,

            Class.name ==
            name,

            Class.section ==
            section,

            Class.id != class_id
        )
        .first()
    )


    if duplicate:

        raise HTTPException(
            status_code=400,
            detail=(
                "This class and section "
                "already exists."
            )
        )


    school_class.name = name

    school_class.section = section


    db.commit()

    db.refresh(school_class)


    student_count = (
        db.query(func.count(Student.id))
        .filter(
            Student.class_id ==
            school_class.id,

            Student.school_id ==
            current_user.school_id
        )
        .scalar()
    )


    return {

        "message":
            "Class updated successfully.",

        "class": {

            "id":
                school_class.id,

            "name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "is_active":
                school_class.is_active,

            "school_id":
                school_class.school_id,

            "student_count":
                student_count or 0
        }
    }


# ============================================================
# TOGGLE CLASS STATUS — ADMIN
# ============================================================

@router.patch("/admin/{class_id}/status")
def toggle_class_status(

    class_id: int,

    is_active: bool,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)


    school_class = (
        db.query(Class)
        .filter(
            Class.id == class_id,

            Class.school_id ==
            current_user.school_id
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found."
        )


    school_class.is_active = is_active


    db.commit()

    db.refresh(school_class)


    student_count = (
        db.query(func.count(Student.id))
        .filter(
            Student.class_id ==
            school_class.id,

            Student.school_id ==
            current_user.school_id
        )
        .scalar()
    )


    return {

        "message":
            (
                "Class activated successfully."
                if is_active
                else
                "Class deactivated successfully."
            ),

        "class": {

            "id":
                school_class.id,

            "name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "is_active":
                school_class.is_active,

            "school_id":
                school_class.school_id,

            "student_count":
                student_count or 0
        }
    }


# ============================================================
# CLASS OPTIONS
# ============================================================

@router.get("/options")
def get_class_options(

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    if current_user.role == "ADMIN":

        classes = (
            db.query(Class)
            .filter(
                Class.school_id ==
                current_user.school_id,

                Class.is_active == True
            )
            .order_by(
                Class.name,
                Class.section
            )
            .all()
        )

    elif current_user.role == "TEACHER":

        from app.database.models import TeacherAssignment

        classes = (
            db.query(Class)
            .join(
                TeacherAssignment,
                TeacherAssignment.class_id ==
                Class.id
            )
            .filter(
                Class.school_id ==
                current_user.school_id,

                Class.is_active == True,

                TeacherAssignment.teacher_id ==
                current_user.id,

                TeacherAssignment.is_active == True
            )
            .distinct()
            .order_by(
                Class.name,
                Class.section
            )
            .all()
        )

    else:

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )


    return [

        {
            "id":
                school_class.id,

            "name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "is_active":
                school_class.is_active
        }

        for school_class in classes

    ]