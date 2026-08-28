from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.core.security import (
    get_current_user,
    hash_password
)


router = APIRouter(
    prefix="/api/teachers",
    tags=["Teachers"]
)


# ============================================================
# ADMIN CHECK
# ============================================================

def require_admin(
    current_user: User
):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=403,
            detail="Only administrators can manage teachers"
        )

    return current_user


# ============================================================
# GET ALL TEACHERS
# ============================================================

@router.get("")
def get_teachers(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # CHECK ADMIN
    # --------------------------------------------------------

    require_admin(current_user)


    # --------------------------------------------------------
    # GET TEACHERS FROM CURRENT SCHOOL ONLY
    # --------------------------------------------------------

    teachers = (
        db.query(User)
        .filter(
            User.school_id == current_user.school_id,
            User.role == "TEACHER"
        )
        .order_by(
            User.name.asc()
        )
        .all()
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "total_teachers":
            len(teachers),

        "teachers": [

            {
                "id":
                    teacher.id,

                "name":
                    teacher.name,

                "email":
                    teacher.email,

                "role":
                    teacher.role,

                "is_active":
                    teacher.is_active,

                "school_id":
                    teacher.school_id
            }

            for teacher in teachers

        ]
    }
    
# ============================================================
# CREATE TEACHER
# ============================================================

@router.post("")
def create_teacher(

    name: str,
    email: str,
    password: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # CHECK ADMIN
    # --------------------------------------------------------

    require_admin(current_user)


    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    name = name.strip()

    email = email.strip().lower()

    password = password.strip()


    # --------------------------------------------------------
    # VALIDATE NAME
    # --------------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Teacher name is required"
        )


    # --------------------------------------------------------
    # VALIDATE EMAIL
    # --------------------------------------------------------

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Teacher email is required"
        )


    # --------------------------------------------------------
    # VALIDATE PASSWORD
    # --------------------------------------------------------

    if not password:

        raise HTTPException(
            status_code=400,
            detail="Teacher password is required"
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Teacher password must be "
                "at least 6 characters"
            )
        )


    # --------------------------------------------------------
    # CHECK EMAIL
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )


    # --------------------------------------------------------
    # CREATE TEACHER
    # --------------------------------------------------------

    teacher = User(

        school_id=
            current_user.school_id,

        name=
            name,

        email=
            email,

        password_hash=
            hash_password(password),

        role=
            "TEACHER",

        is_active=
            True
    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.add(teacher)

    db.commit()

    db.refresh(teacher)


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message":
            "Teacher created successfully",

        "teacher": {

            "id":
                teacher.id,

            "name":
                teacher.name,

            "email":
                teacher.email,

            "role":
                teacher.role,

            "is_active":
                teacher.is_active,

            "school_id":
                teacher.school_id
        }
    }
# ============================================================
# UPDATE TEACHER STATUS
# ============================================================
# 
@router.patch("/{teacher_id}/status")
def update_teacher_status(

    teacher_id: int,

    is_active: bool,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # CHECK ADMIN
    # --------------------------------------------------------

    require_admin(current_user)


    # --------------------------------------------------------
    # FIND TEACHER IN CURRENT SCHOOL
    # --------------------------------------------------------

    teacher = (
        db.query(User)
        .filter(
            User.id == teacher_id,

            User.school_id
            == current_user.school_id,

            User.role == "TEACHER"
        )
        .first()
    )


    if not teacher:

        raise HTTPException(
            status_code=404,
            detail="Teacher not found"
        )


    # --------------------------------------------------------
    # UPDATE STATUS
    # --------------------------------------------------------

    teacher.is_active = is_active


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()

    db.refresh(teacher)


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message":
            (
                "Teacher activated successfully"
                if teacher.is_active
                else
                "Teacher deactivated successfully"
            ),

        "teacher": {

            "id":
                teacher.id,

            "name":
                teacher.name,

            "email":
                teacher.email,

            "role":
                teacher.role,

            "is_active":
                teacher.is_active,

            "school_id":
                teacher.school_id
        }
    }