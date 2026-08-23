from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User

from app.schemas.users import (
    TeacherCreate,
    TeacherResponse
)

from app.core.security import (
    get_current_user,
    hash_password
)


router = APIRouter(
    prefix="/api/teachers",
    tags=["Teachers"]
)


@router.post(
    "/",
    response_model=TeacherResponse
)
def create_teacher(
    data: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN CAN CREATE TEACHERS
    # ----------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create teachers"
        )

    # ----------------------------------------------------
    # CHECK EMAIL
    # ----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # ----------------------------------------------------
    # CREATE TEACHER
    # ----------------------------------------------------

    teacher = User(
        school_id=current_user.school_id,
        name=data.name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
        role="TEACHER",
        is_active=True
    )

    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return teacher