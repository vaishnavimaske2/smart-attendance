from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    Student,
    Attendance,
    Class
)
from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/attendance-report",
    tags=["Attendance Report"]
)


@router.get("/class")
def get_class_attendance(
    class_id: int,
    attendance_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -----------------------------------------
    # 1. Check class
    # -----------------------------------------

    classroom = (
        db.query(Class)
        .filter(
            Class.id == class_id,
            Class.school_id == current_user.school_id
        )
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Class not found"
        )

    # -----------------------------------------
    # 2. Get all students of this class
    # -----------------------------------------

    students = (
        db.query(Student)
        .filter(
            Student.class_id == class_id,
            Student.school_id == current_user.school_id,
            Student.is_active == True
        )
        .order_by(Student.roll_number)
        .all()
    )

    # -----------------------------------------
    # 3. Get attendance for selected date
    # -----------------------------------------

    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.class_id == class_id,
            Attendance.school_id == current_user.school_id,
            Attendance.attendance_date == attendance_date
        )
        .all()
    )

    # -----------------------------------------
    # 4. Create attendance lookup
    # -----------------------------------------

    attendance_map = {
        attendance.student_id: attendance
        for attendance in attendance_records
    }

    # -----------------------------------------
    # 5. Prepare student report
    # -----------------------------------------

    report = []

    present_count = 0
    absent_count = 0

    for student in students:

        attendance = attendance_map.get(student.id)

        if attendance:

            status = attendance.status.upper()

            if status == "PRESENT":
                present_count += 1

        else:

            status = "ABSENT"
            absent_count += 1

        report.append({
            "student_id": student.id,
            "student_name": student.name,
            "roll_number": student.roll_number,
            "status": status
        })

    # -----------------------------------------
    # 6. Return report
    # -----------------------------------------

    return {
        "message": "Class attendance report generated successfully",
        "class_id": classroom.id,
        "class_name": classroom.name,
        "section": classroom.section,
        "attendance_date": attendance_date,
        "total_students": len(students),
        "present_students": present_count,
        "absent_students": absent_count,
        "students": report
    }