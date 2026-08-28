from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Student, Class
from app.schemas.auth import LoginRequest, LoginResponse, StudentLoginRequest
from app.core.security import (
    verify_password,
    create_access_token,
    get_current_user
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    # User does not exist
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    # Verify password
    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token({
        "sub": str(user.id),
        "school_id": user.school_id,
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "school_id": user.school_id
    }
    
@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "school_id": current_user.school_id,
        "is_active": current_user.is_active
    }
    
@router.post("/student-login")
def student_login(
    data: StudentLoginRequest,
    db: Session = Depends(get_db)
):

    # ========================================================
    # CLEAN INPUT
    # ========================================================

    student_name = data.name.strip()

    roll_number = data.roll_number.strip()

    class_name = data.class_name.strip()

    section = data.section.strip().upper()


    # ========================================================
    # FIND CLASS
    # ========================================================

    school_class = (
        db.query(Class)
        .filter(
            Class.name.ilike(
                class_name
            ),
            Class.section.ilike(
                section
            )
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=401,
            detail="Invalid student details"
        )


    # ========================================================
    # FIND STUDENT
    # ========================================================

    student = (
        db.query(Student)
        .filter(
            Student.class_id == school_class.id,
            Student.roll_number == roll_number,
            Student.section == school_class.section,
            Student.is_active == True
        )
        .first()
    )


    if not student:

        raise HTTPException(
            status_code=401,
            detail="Invalid student details"
        )


    # ========================================================
    # CHECK NAME
    # ========================================================

    if (
        student.name.strip().lower()
        != student_name.lower()
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid student details"
        )


    # ========================================================
    # CHECK DATE OF BIRTH
    # ========================================================

    if student.date_of_birth is not None:

        if data.date_of_birth is None:

            raise HTTPException(
                status_code=401,
                detail="Date of birth is required"
            )

        if (
            data.date_of_birth
            != student.date_of_birth
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid student details"
            )


    # ========================================================
    # CREATE STUDENT TOKEN
    # ========================================================

    access_token = create_access_token({
        "sub": str(student.id),
        "school_id": student.school_id,
        "role": "STUDENT"
    })


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "access_token": access_token,
        "token_type": "bearer",

        "student_id": student.id,

        "name": student.name,

        "roll_number": student.roll_number,

        "class_id": student.class_id,

        "class_name": school_class.name,

        "section": school_class.section,

        "school_id": student.school_id,

        "role": "STUDENT"
    }