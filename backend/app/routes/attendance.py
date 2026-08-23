from datetime import date

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    ClassSubject,
    TeacherAssignment,
    Attendance
)

from app.core.security import get_current_user

from app.services.face_service import (
    get_multiple_face_embeddings,
    find_matching_student
)

from app.schemas.attendance import (
    FaceAttendanceResponse
)


router = APIRouter(
    prefix="/api/attendance",
    tags=["Attendance"]
)


# ============================================================
# RECOGNIZE CLASSROOM AND MARK ATTENDANCE
# ============================================================

@router.post(
    "/recognize",
    response_model=FaceAttendanceResponse
)
async def recognize_and_mark_attendance(

    class_name: str,
    section: str,
    subject_name: str,

    file: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):

    # ========================================================
    # 1. ONLY TEACHERS
    # ========================================================

    if current_user.role != "TEACHER":

        raise HTTPException(
            status_code=403,
            detail="Only teachers can mark attendance"
        )

    # ========================================================
    # 2. CLEAN INPUT
    # ========================================================

    class_name = class_name.strip()

    section = section.strip().upper()

    subject_name = subject_name.strip()

    # ========================================================
    # 3. CHECK IMAGE
    # ========================================================

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    image_data = await file.read()

    if not image_data:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    # ========================================================
    # 4. FIND CLASS
    # ========================================================

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,

            func.lower(Class.name)
            == class_name.lower(),

            func.upper(Class.section)
            == section
        )
        .first()
    )

    if not school_class:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Class '{class_name}' "
                f"with section '{section}' not found"
            )
        )

    # ========================================================
    # 5. FIND SUBJECT
    # ========================================================

    subject = (
        db.query(Subject)
        .filter(
            Subject.school_id == current_user.school_id,

            func.lower(Subject.name)
            == subject_name.lower(),

            Subject.is_active == True
        )
        .first()
    )

    if not subject:

        raise HTTPException(
            status_code=404,
            detail=f"Subject '{subject_name}' not found"
        )

    # ========================================================
    # 6. CHECK SUBJECT BELONGS TO CLASS
    # ========================================================

    class_subject = (
        db.query(ClassSubject)
        .filter(
            ClassSubject.class_id == school_class.id,

            ClassSubject.subject_id == subject.id,

            ClassSubject.is_active == True
        )
        .first()
    )

    if not class_subject:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Subject '{subject.name}' "
                f"is not assigned to "
                f"{school_class.name} - "
                f"Section {school_class.section}"
            )
        )

    # ========================================================
    # 7. CHECK TEACHER ASSIGNMENT
    # ========================================================

    teacher_assignment = (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id
            == current_user.id,

            TeacherAssignment.class_id
            == school_class.id,

            TeacherAssignment.subject_id
            == subject.id,

            TeacherAssignment.is_active == True
        )
        .first()
    )

    if not teacher_assignment:

        raise HTTPException(
            status_code=403,
            detail=(
                f"You are not assigned to teach "
                f"{subject.name} in "
                f"{school_class.name} - "
                f"Section {school_class.section}"
            )
        )

    # ========================================================
    # 8. GET ACTIVE STUDENTS OF THIS CLASS
    # ========================================================

    students = (
        db.query(Student)
        .filter(
            Student.school_id
            == current_user.school_id,

            Student.class_id
            == school_class.id,

            Student.is_active == True
        )
        .all()
    )

    if not students:

        raise HTTPException(
            status_code=404,
            detail="No active students found in this class"
        )

    # ========================================================
    # 9. CHECK REGISTERED FACES
    # ========================================================

    registered_students = [

        student

        for student in students

        if student.face_embedding is not None

    ]

    if not registered_students:

        raise HTTPException(
            status_code=400,
            detail=(
                "No students in this class "
                "have registered faces"
            )
        )

    # ========================================================
    # 10. DETECT ALL FACES
    # ========================================================

    try:

        face_results = get_multiple_face_embeddings(
            image_data
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print(
            "FACE DETECTION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Face detection failed"
        )

    # ========================================================
    # 11. CURRENT DATE
    # ========================================================

    attendance_date = date.today()

    # ========================================================
    # 12. MATCH EACH FACE
    # ========================================================

    recognized_students = []

    already_marked = 0

    matched_student_ids = set()

    for face in face_results:

        student, similarity = find_matching_student(

            face["embedding"],

            registered_students

        )

        # ----------------------------------------------------
        # UNKNOWN FACE
        # ----------------------------------------------------

        if student is None:

            continue

        # ----------------------------------------------------
        # PREVENT SAME STUDENT FROM BEING MATCHED TWICE
        # ----------------------------------------------------

        if student.id in matched_student_ids:

            continue

        matched_student_ids.add(
            student.id
        )

        # ====================================================
        # 13. CHECK EXISTING ATTENDANCE
        # ====================================================

        existing_attendance = (
            db.query(Attendance)
            .filter(

                Attendance.school_id
                == current_user.school_id,

                Attendance.class_id
                == school_class.id,

                Attendance.subject_id
                == subject.id,

                Attendance.student_id
                == student.id,

                Attendance.attendance_date
                == attendance_date
            )
            .first()
        )

        # ----------------------------------------------------
        # ALREADY MARKED
        # ----------------------------------------------------

        if existing_attendance:

            already_marked += 1

            recognized_students.append({

                "student_id":
                    student.id,

                "name":
                    student.name,

                "roll_number":
                    student.roll_number,

                "similarity":
                    round(
                        similarity,
                        4
                    ),

                "status":
                    "ALREADY_MARKED"
            })

            continue

        # ====================================================
        # 14. CREATE ATTENDANCE
        # ====================================================

        attendance = Attendance(

            school_id=
                current_user.school_id,

            class_id=
                school_class.id,

            subject_id=
                subject.id,

            student_id=
                student.id,

            marked_by=
                current_user.id,

            attendance_date=
                attendance_date,

            status=
                "PRESENT"
        )

        db.add(attendance)

        recognized_students.append({

            "student_id":
                student.id,

            "name":
                student.name,

            "roll_number":
                student.roll_number,

            "similarity":
                round(
                    similarity,
                    4
                ),

            "status":
                "PRESENT"
        })

    # ========================================================
    # 15. SAVE ALL ATTENDANCE
    # ========================================================

    db.commit()

    # ========================================================
    # 16. RETURN RESULT
    # ========================================================

    return {

        "message":
            "Face recognition attendance processed successfully",

        "class_name":
            school_class.name,

        "section":
            school_class.section,

        "subject_name":
            subject.name,

        "attendance_date":
            attendance_date,

        "faces_detected":
            len(face_results),

        "students_recognized":
            len(recognized_students),

        "students_already_marked":
            already_marked,

        "students":
            recognized_students
    }