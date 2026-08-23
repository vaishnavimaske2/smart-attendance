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

    # Check if school code already exists
    existing_school = (
        db.query(School)
        .filter(School.school_code == data.school_code)
        .first()
    )

    if existing_school:
        raise HTTPException(
            status_code=400,
            detail="School code already exists"
        )

    # Check if admin email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == data.admin_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create school
    new_school = School(
        name=data.school_name,
        school_code=data.school_code,
        location=data.location
    )

    db.add(new_school)
    db.commit()
    db.refresh(new_school)

    # Create admin
    new_admin = User(
        school_id=new_school.id,
        name=data.admin_name,
        email=data.admin_email,
        password_hash=hash_password(data.admin_password),
        role="ADMIN"
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "School registered successfully",
        "school_id": new_school.id,
        "admin_id": new_admin.id
    }