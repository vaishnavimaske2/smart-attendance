from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    Attendance
)

from app.core.security import (
    get_current_user
)


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"]
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
            detail="Administrator access required"
        )

    return current_user


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_admin_dashboard(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # ========================================================
    # CHECK ADMIN
    # ========================================================

    require_admin(current_user)


    # ========================================================
    # CURRENT SCHOOL
    # ========================================================

    school_id = current_user.school_id


    # ========================================================
    # TODAY
    # ========================================================

    today = date.today()


    # ========================================================
    # TOTAL TEACHERS
    # ========================================================

    total_teachers = (
        db.query(User)
        .filter(
            User.school_id == school_id,
            User.role == "TEACHER"
        )
        .count()
    )


    # ========================================================
    # TOTAL ACTIVE TEACHERS
    # ========================================================

    active_teachers = (
        db.query(User)
        .filter(
            User.school_id == school_id,
            User.role == "TEACHER",
            User.is_active == True
        )
        .count()
    )


    # ========================================================
    # TOTAL STUDENTS
    # ========================================================

    total_students = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.is_active == True
        )
        .count()
    )


    # ========================================================
    # TOTAL CLASSES
    # ========================================================

    total_classes = (
        db.query(Class)
        .filter(
            Class.school_id == school_id
        )
        .count()
    )


    # ========================================================
    # TOTAL SUBJECTS
    # ========================================================

    total_subjects = (
        db.query(Subject)
        .filter(
            Subject.school_id == school_id,
            Subject.is_active == True
        )
        .count()
    )


    # ========================================================
    # TODAY'S ATTENDANCE RECORDS
    # ========================================================

    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.school_id == school_id,
            Attendance.attendance_date == today
        )
        .order_by(
            Attendance.created_at.asc(),
            Attendance.id.asc()
        )
        .all()
    )


    # ========================================================
    # UNIQUE STUDENT ATTENDANCE
    #
    # Because Attendance can contain subject-wise records,
    # one student may have multiple records on the same day.
    #
    # We therefore calculate the dashboard using unique
    # students instead of raw attendance rows.
    # ========================================================

    student_statuses = {}


    for record in attendance_records:

        student_id = record.student_id

        status = (
            record.status.strip().upper()
            if record.status
            else ""
        )


        if student_id not in student_statuses:

            student_statuses[student_id] = set()


        student_statuses[student_id].add(
            status
        )


    # ========================================================
    # ATTENDANCE COUNTS
    # ========================================================

    present_count = 0

    absent_count = 0

    late_count = 0


    # ========================================================
    # CALCULATE ONE STATUS PER STUDENT
    #
    # Priority:
    #
    # PRESENT
    #     ↓
    # LATE
    #     ↓
    # ABSENT
    #
    # This prevents multiple subject records from counting
    # the same student multiple times.
    # ========================================================

    for statuses in student_statuses.values():

        if "PRESENT" in statuses:

            present_count += 1

        elif "LATE" in statuses:

            late_count += 1

        elif "ABSENT" in statuses:

            absent_count += 1


    # ========================================================
    # MARKED ATTENDANCE
    #
    # Number of unique students for whom an attendance
    # record exists today.
    # ========================================================

    marked_attendance = len(
        student_statuses
    )


    # ========================================================
    # UNMARKED STUDENTS
    #
    # Any active student who does not have an attendance
    # record today is considered absent for the dashboard.
    # ========================================================

    unmarked_students = max(
        total_students - marked_attendance,
        0
    )


    # ========================================================
    # TOTAL ABSENT
    #
    # Explicitly absent students
    # +
    # students with no attendance record today.
    # ========================================================

    absent_count = (
        absent_count
        + unmarked_students
    )


    # ========================================================
    # SAFETY CHECK
    # ========================================================

    absent_count = min(
        absent_count,
        total_students
    )


    # ========================================================
    # ATTENDANCE PERCENTAGE
    #
    # Present + Late are treated as attended.
    # The percentage is based on ALL active students,
    # not just students who have been marked.
    # ========================================================

    if total_students > 0:

        attendance_percentage = round(
            (
                (
                    present_count
                    + late_count
                )
                / total_students
            ) * 100,
            2
        )

    else:

        attendance_percentage = 0


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "message":
            "Admin dashboard data retrieved successfully",

        "attendance_date":
            today,

        "total_teachers":
            total_teachers,

        "active_teachers":
            active_teachers,

        "total_students":
            total_students,

        "total_classes":
            total_classes,

        "total_subjects":
            total_subjects,

        "present":
            present_count,

        "absent":
            absent_count,

        "late":
            late_count,

        "marked_attendance":
            marked_attendance,

        "attendance_percentage":
            attendance_percentage

    }