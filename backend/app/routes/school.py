from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import School, User

from app.schemas.school import SchoolRegister

from app.core.security import hash_password


router = APIRouter(
    prefix="/api/schools",
    tags=["Schools"]
)


@router.post("/register")
def register_school(
    data: SchoolRegister,
    db: Session = Depends(get_db)
):

    # ========================================================
    # CLEAN INPUT
    # ========================================================

    school_name = data.school_name.strip()

    school_code = (
        data.school_code
        .strip()
        .upper()
    )

    location = (
        data.location.strip()
        if data.location
        else None
    )

    admin_name = data.admin_name.strip()

    admin_email = (
        str(data.admin_email)
        .strip()
        .lower()
    )


    # ========================================================
    # PASSWORD CONFIRMATION
    # ========================================================

    if data.admin_password != data.confirm_password:

        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )


    # ========================================================
    # CHECK SCHOOL CODE
    # ========================================================

    existing_school = (
        db.query(School)
        .filter(
            School.school_code == school_code
        )
        .first()
    )

    if existing_school:

        raise HTTPException(
            status_code=400,
            detail="School code already exists"
        )


    # ========================================================
    # CHECK ADMIN EMAIL
    # ========================================================

    existing_user = (
        db.query(User)
        .filter(
            User.email == admin_email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    # ========================================================
    # CREATE SCHOOL
    # ========================================================

    new_school = School(
        name=school_name,
        school_code=school_code,
        location=location
    )

    db.add(new_school)

    # Get school.id before commit
    db.flush()


    # ========================================================
    # CREATE ADMIN
    # ========================================================

    new_admin = User(
        school_id=new_school.id,
        name=admin_name,
        email=admin_email,
        password_hash=hash_password(
            data.admin_password
        ),
        role="ADMIN",
        is_active=True
    )

    db.add(new_admin)


    # ========================================================
    # SAVE BOTH TOGETHER
    # ========================================================

    try:

        db.commit()

        db.refresh(new_school)
        db.refresh(new_admin)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to register school"
        )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": "School registered successfully",

        "school": {
            "id": new_school.id,
            "name": new_school.name,
            "school_code": new_school.school_code,
            "location": new_school.location
        },

        "admin": {
            "id": new_admin.id,
            "name": new_admin.name,
            "email": new_admin.email,
            "role": new_admin.role
        }
    }