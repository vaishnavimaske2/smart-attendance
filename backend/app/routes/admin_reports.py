from datetime import date, timedelta
from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from openpyxl import Workbook

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    ClassSubject,
    Attendance
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/admin-reports",
    tags=["Admin Reports"]
)


# ============================================================
# ADMIN CHECK
# ============================================================

def check_admin(
    current_user: User
):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=403,
            detail="Only admins can access admin reports"
        )


# ============================================================
# GET ADMIN REPORT OPTIONS
# ============================================================

@router.get("/options")
def get_admin_report_options(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    check_admin(
        current_user
    )


    # --------------------------------------------------------
    # GET ALL ACTIVE CLASSES
    # --------------------------------------------------------

    classes = (
        db.query(Class)
        .filter(
            Class.school_id
            == current_user.school_id,

            Class.is_active
            == True
        )
        .order_by(
            Class.name,
            Class.section
        )
        .all()
    )


    result = []


    # --------------------------------------------------------
    # BUILD CLASS + SECTION + SUBJECT OPTIONS
    # --------------------------------------------------------

    for school_class in classes:

        class_subjects = (
            db.query(
                Subject
            )
            .join(
                ClassSubject,
                ClassSubject.subject_id
                == Subject.id
            )
            .filter(

                ClassSubject.class_id
                == school_class.id,

                ClassSubject.is_active
                == True,

                Subject.school_id
                == current_user.school_id,

                Subject.is_active
                == True
            )
            .order_by(
                Subject.name
            )
            .all()
        )


        result.append({

            "class_id":
                school_class.id,

            "class_name":
                school_class.name,

            "section":
                school_class.section,

            "academic_year":
                school_class.academic_year,

            "subjects": [

                {
                    "id":
                        subject.id,

                    "name":
                        subject.name,

                    "code":
                        subject.code
                }

                for subject
                in class_subjects

            ]

        })


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "classes": result
    }


# ============================================================
# GET ADMIN CLASS ATTENDANCE REPORT
# ============================================================

@router.get("/class")
def get_admin_class_report(

    class_id: int = Query(...),

    attendance_date: date = Query(...),

    subject_id: int | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    check_admin(
        current_user
    )


    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(

            Class.id
            == class_id,

            Class.school_id
            == current_user.school_id,

            Class.is_active
            == True
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found"
        )


    # --------------------------------------------------------
    # GET STUDENTS
    # --------------------------------------------------------

    students = (
        db.query(Student)
        .filter(

            Student.class_id
            == class_id,

            Student.school_id
            == current_user.school_id,

            Student.is_active
            == True
        )
        .order_by(
            Student.roll_number
        )
        .all()
    )


    # --------------------------------------------------------
    # ATTENDANCE QUERY
    # --------------------------------------------------------

    attendance_query = (
        db.query(Attendance)
        .filter(

            Attendance.class_id
            == class_id,

            Attendance.school_id
            == current_user.school_id,

            Attendance.attendance_date
            == attendance_date
        )
    )


    # --------------------------------------------------------
    # SUBJECT FILTER
    # --------------------------------------------------------

    if subject_id is not None:

        attendance_query = (
            attendance_query
            .filter(
                Attendance.subject_id
                == subject_id
            )
        )


    attendance_records = (
        attendance_query.all()
    )


    # --------------------------------------------------------
    # ATTENDANCE LOOKUP
    # --------------------------------------------------------

    attendance_map = {

        attendance.student_id:
            attendance

        for attendance
        in attendance_records

    }


    # --------------------------------------------------------
    # BUILD REPORT
    # --------------------------------------------------------

    report = []

    present_count = 0
    absent_count = 0


    for student in students:

        attendance = (
            attendance_map.get(
                student.id
            )
        )


        if attendance:

            status = (
                attendance.status
                .upper()
            )

        else:

            status = "ABSENT"


        if status == "PRESENT":

            present_count += 1

        elif status == "ABSENT":

            absent_count += 1


        report.append({

            "student_id":
                student.id,

            "student_name":
                student.name,

            "roll_number":
                student.roll_number,

            "status":
                status

        })


    # --------------------------------------------------------
    # SUBJECT INFORMATION
    # --------------------------------------------------------

    subject_data = None


    if subject_id is not None:

        subject = (
            db.query(Subject)
            .filter(

                Subject.id
                == subject_id,

                Subject.school_id
                == current_user.school_id,

                Subject.is_active
                == True
            )
            .first()
        )


        if not subject:

            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )


        subject_data = {

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code

        }


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "message":
            "Admin attendance report generated successfully",

        "class_id":
            school_class.id,

        "class_name":
            school_class.name,

        "section":
            school_class.section,

        "academic_year":
            school_class.academic_year,

        "subject":
            subject_data,

        "attendance_date":
            attendance_date,

        "total_students":
            len(students),

        "present_students":
            present_count,

        "absent_students":
            absent_count,

        "students":
            report

    }


# ============================================================
# EXPORT ATTENDANCE EXCEL
# ============================================================

@router.get("/export")
def export_admin_attendance_excel(

    class_id: int = Query(...),

    subject_id: int | None = Query(
        default=None
    ),

    period: str = Query(
        default="whole"
    ),

    from_date: date | None = Query(
        default=None
    ),

    to_date: date | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    check_admin(
        current_user
    )


    # --------------------------------------------------------
    # VALIDATE PERIOD
    # --------------------------------------------------------

    allowed_periods = {
        "weekly",
        "monthly",
        "whole",
        "custom"
    }


    if period not in allowed_periods:

        raise HTTPException(
            status_code=400,
            detail="Invalid export period"
        )


    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(

            Class.id
            == class_id,

            Class.school_id
            == current_user.school_id,

            Class.is_active
            == True
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found"
        )


    # --------------------------------------------------------
    # FIND SUBJECT
    # --------------------------------------------------------

    subject = None


    if subject_id is not None:

        subject = (
            db.query(Subject)
            .filter(

                Subject.id
                == subject_id,

                Subject.school_id
                == current_user.school_id,

                Subject.is_active
                == True
            )
            .first()
        )


        if not subject:

            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )


        # ----------------------------------------------------
        # VERIFY SUBJECT BELONGS TO CLASS
        # ----------------------------------------------------

        class_subject = (
            db.query(ClassSubject)
            .filter(

                ClassSubject.class_id
                == school_class.id,

                ClassSubject.subject_id
                == subject.id,

                ClassSubject.is_active
                == True
            )
            .first()
        )


        if not class_subject:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected subject is not "
                    "assigned to this class"
                )
            )


    # ========================================================
    # DETERMINE DATE RANGE
    # ========================================================

    today = date.today()

    start_date = None
    end_date = today


    if period == "weekly":

        # Monday -> today

        start_date = (
            today
            - timedelta(
                days=today.weekday()
            )
        )


    elif period == "monthly":

        start_date = date(
            today.year,
            today.month,
            1
        )


    elif period == "custom":

        if (
            from_date is None
            or to_date is None
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "From Date and To Date "
                    "are required for custom period"
                )
            )


        if from_date > to_date:

            raise HTTPException(
                status_code=400,
                detail=(
                    "From Date cannot be "
                    "after To Date"
                )
            )


        start_date = from_date
        end_date = to_date


    elif period == "whole":

        # No date restriction

        start_date = None
        end_date = None


    # ========================================================
    # GET STUDENTS
    # ========================================================

    students = (
        db.query(Student)
        .filter(

            Student.class_id
            == school_class.id,

            Student.school_id
            == current_user.school_id,

            Student.is_active
            == True
        )
        .order_by(
            Student.roll_number
        )
        .all()
    )


    # ========================================================
    # ATTENDANCE QUERY
    # ========================================================

    attendance_query = (
        db.query(Attendance)
        .filter(

            Attendance.class_id
            == school_class.id,

            Attendance.school_id
            == current_user.school_id
        )
    )


    # --------------------------------------------------------
    # SUBJECT
    # --------------------------------------------------------

    if subject_id is not None:

        attendance_query = (
            attendance_query
            .filter(
                Attendance.subject_id
                == subject_id
            )
        )


    # --------------------------------------------------------
    # DATE RANGE
    # --------------------------------------------------------

    if start_date is not None:

        attendance_query = (
            attendance_query
            .filter(
                Attendance.attendance_date
                >= start_date
            )
        )


    if end_date is not None:

        attendance_query = (
            attendance_query
            .filter(
                Attendance.attendance_date
                <= end_date
            )
        )


    attendance_records = (
        attendance_query
        .order_by(
            Attendance.attendance_date,
            Attendance.student_id
        )
        .all()
    )


    # ========================================================
    # CREATE EXCEL WORKBOOK
    # ========================================================

    workbook = Workbook()

    worksheet = (
        workbook.active
    )

    worksheet.title = "Attendance"


    # ========================================================
    # HEADER INFORMATION
    # ========================================================

    worksheet.append([
        "Class",
        school_class.name
    ])

    worksheet.append([
        "Section",
        school_class.section
    ])

    worksheet.append([
        "Academic Year",
        school_class.academic_year
    ])


    worksheet.append([
        "Subject",
        subject.name
        if subject
        else "All Subjects"
    ])


    worksheet.append([
        "Period",
        period
    ])


    if period == "custom":

        worksheet.append([
            "From Date",
            str(from_date)
        ])

        worksheet.append([
            "To Date",
            str(to_date)
        ])


    worksheet.append([])


    # ========================================================
    # TABLE HEADER
    # ========================================================

    worksheet.append([

        "Date",

        "Roll Number",

        "Student Name",

        "Subject",

        "Status"

    ])


    # ========================================================
    # ADD ATTENDANCE RECORDS
    # ========================================================

    student_map = {

        student.id:
            student

        for student
        in students

    }


    subject_map = {}


    if subject_id is None:

        subjects = (
            db.query(Subject)
            .filter(
                Subject.school_id
                == current_user.school_id
            )
            .all()
        )


        subject_map = {

            item.id:
                item.name

            for item in subjects

        }


    for attendance in attendance_records:

        student = (
            student_map.get(
                attendance.student_id
            )
        )


        if not student:

            continue


        attendance_subject_name = (
            subject.name
            if subject
            else subject_map.get(
                attendance.subject_id,
                "Unknown"
            )
        )


        worksheet.append([

            str(
                attendance.attendance_date
            ),

            student.roll_number,

            student.name,

            attendance_subject_name,

            attendance.status.upper()

        ])


    # ========================================================
    # IF NO RECORDS
    # ========================================================

    if not attendance_records:

        worksheet.append([

            "",

            "",

            "No attendance records found",

            "",

            ""

        ])


    # ========================================================
    # COLUMN WIDTHS
    # ========================================================

    worksheet.column_dimensions["A"].width = 18
    worksheet.column_dimensions["B"].width = 15
    worksheet.column_dimensions["C"].width = 30
    worksheet.column_dimensions["D"].width = 30
    worksheet.column_dimensions["E"].width = 15


    # ========================================================
    # SAVE TO MEMORY
    # ========================================================

    output = BytesIO()

    workbook.save(
        output
    )

    output.seek(0)


    # ========================================================
    # FILE NAME
    # ========================================================

    subject_name = (
        subject.name
        if subject
        else "all_subjects"
    )


    filename = (
        f"attendance_"
        f"{school_class.name}_"
        f"{school_class.section}_"
        f"{subject_name}_"
        f"{period}.xlsx"
    )


    # ========================================================
    # RETURN FILE
    # ========================================================

    return StreamingResponse(

        output,

        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),

        headers={

            "Content-Disposition":
                f'attachment; filename="{filename}"'

        }

    )