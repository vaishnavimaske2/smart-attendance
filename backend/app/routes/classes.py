from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Class, User

from app.schemas.classes import ClassCreate, ClassResponse

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/classes",
    tags=["Classes"]
)


@router.post(
    "/",
    response_model=ClassResponse
)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only ADMIN can create classes
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can create classes"
        )

    # Check if class already exists
    existing_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,
            Class.name == data.name,
            Class.section == data.section,
            Class.academic_year == data.academic_year
        )
        .first()
    )

    if existing_class:
        raise HTTPException(
            status_code=400,
            detail="This class already exists"
        )

    new_class = Class(
        school_id=current_user.school_id,
        name=data.name,
        section=data.section,
        academic_year=data.academic_year
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return new_class

@router.get("/options")
def get_class_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    classes = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id
        )
        .order_by(Class.name, Class.section)
        .all()
    )

    return [
        {
            "id": item.id,
            "name": item.name,
            "section": item.section,
            "academic_year": item.academic_year
        }
        for item in classes
    ]