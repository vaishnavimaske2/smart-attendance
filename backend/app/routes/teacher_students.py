from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    ClassSubject,
    TeacherAssignment
)

from app.schemas.teacher_students import (
    TeacherStudentsResponse,
    TeacherOptionsResponse
)

from app.core.security import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/teacher-students",
    tags=["Teacher Students"]
)