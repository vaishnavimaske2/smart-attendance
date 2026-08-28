from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import (
    User,
    Class,
    Student,
    Attendance,
    TeacherAssignment
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@router.get("/stats")
def get_dashboard_stats(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # ONLY ADMIN AND TEACHERS
    # --------------------------------------------------------

    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.id == class_id,
            Class.school_id == current_user.school_id
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail="Class not found"
        )

    # --------------------------------------------------------
    # TEACHER AUTHORIZATION
    # --------------------------------------------------------

    if current_user.role == "TEACHER":

        assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id == current_user.id,
                TeacherAssignment.class_id == class_id,
                TeacherAssignment.is_active == True
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"You are not assigned to "
                    f"{school_class.name} - "
                    f"Section {school_class.section}"
                )
            )

    # --------------------------------------------------------
    # TOTAL ACTIVE STUDENTS
    # --------------------------------------------------------

    total_students = (
        db.query(func.count(Student.id))
        .filter(
            Student.school_id == current_user.school_id,
            Student.class_id == class_id,
            Student.is_active == True
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # TODAY
    # --------------------------------------------------------

    today = date.today()

    # --------------------------------------------------------
    # PRESENT TODAY
    # --------------------------------------------------------

    present_today = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.school_id == current_user.school_id,
            Attendance.class_id == class_id,
            Attendance.attendance_date == today,
            Attendance.status == "PRESENT"
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # ABSENT TODAY
    # --------------------------------------------------------

    absent_today = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.school_id == current_user.school_id,
            Attendance.class_id == class_id,
            Attendance.attendance_date == today,
            Attendance.status == "ABSENT"
        )
        .scalar()
    ) or 0

    # --------------------------------------------------------
    # ATTENDANCE RATE
    # --------------------------------------------------------

    marked_students = present_today + absent_today

    if marked_students > 0:

        attendance_rate = round(
            (present_today / marked_students) * 100,
            2
        )

    else:

        attendance_rate = 0

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "class_id": school_class.id,
        "class_name": school_class.name,
        "section": school_class.section,
        "academic_year": school_class.academic_year,
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_rate": attendance_rate
    }