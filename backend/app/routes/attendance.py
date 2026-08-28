from datetime import date
from typing import List
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

from app.core.security import get_current_user, get_current_student

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
    
# ============================================================
# STUDENT ATTENDANCE SUMMARY
# ============================================================

@router.get(
    "/student/summary"
)
def get_student_attendance_summary(
    db: Session = Depends(get_db),
    current_student: Student = Depends(
        get_current_student
    )
):

    # ========================================================
    # GET ALL ATTENDANCE RECORDS FOR THIS STUDENT
    # ========================================================

    records = (
        db.query(Attendance)
        .filter(
            Attendance.school_id
            == current_student.school_id,

            Attendance.student_id
            == current_student.id
        )
        .all()
    )


    # ========================================================
    # CALCULATE COUNTS
    # ========================================================

    total_days = len(records)

    present_days = sum(
        1
        for record in records
        if record.status == "PRESENT"
    )

    absent_days = sum(
        1
        for record in records
        if record.status == "ABSENT"
    )

    late_days = sum(
        1
        for record in records
        if record.status == "LATE"
    )

    excused_days = sum(
        1
        for record in records
        if record.status == "EXCUSED"
    )


    # ========================================================
    # ATTENDANCE PERCENTAGE
    # ========================================================

    if total_days > 0:

        attendance_percentage = round(
            (
                present_days
                + late_days
            )
            / total_days
            * 100,
            2
        )

    else:

        attendance_percentage = 0.0


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "student_id":
            current_student.id,

        "student_name":
            current_student.name,

        "total_days":
            total_days,

        "present_days":
            present_days,

        "absent_days":
            absent_days,

        "late_days":
            late_days,

        "excused_days":
            excused_days,

        "attendance_percentage":
            attendance_percentage
    }
    
# ============================================================
# STUDENT SUBJECT-WISE ATTENDANCE
# ============================================================

@router.get(
    "/student/subjects"
)
def get_student_subject_attendance(
    db: Session = Depends(get_db),
    current_student: Student = Depends(
        get_current_student
    )
):

    # ========================================================
    # GET ATTENDANCE + SUBJECT
    # ========================================================

    records = (
        db.query(
            Attendance,
            Subject
        )
        .join(
            Subject,
            Attendance.subject_id
            == Subject.id
        )
        .filter(

            Attendance.school_id
            == current_student.school_id,

            Attendance.student_id
            == current_student.id,

            Subject.is_active == True
        )
        .all()
    )


    # ========================================================
    # GROUP BY SUBJECT
    # ========================================================

    subject_data = {}


    for attendance, subject in records:

        if subject.id not in subject_data:

            subject_data[subject.id] = {

                "subject_id":
                    subject.id,

                "subject_name":
                    subject.name,

                "total_days":
                    0,

                "present_days":
                    0,

                "absent_days":
                    0,

                "late_days":
                    0,

                "excused_days":
                    0
            }


        data = subject_data[subject.id]


        data["total_days"] += 1


        if attendance.status == "PRESENT":

            data["present_days"] += 1


        elif attendance.status == "ABSENT":

            data["absent_days"] += 1


        elif attendance.status == "LATE":

            data["late_days"] += 1


        elif attendance.status == "EXCUSED":

            data["excused_days"] += 1


    # ========================================================
    # CALCULATE PERCENTAGES
    # ========================================================

    subjects = []


    for data in subject_data.values():

        total_days = data["total_days"]


        if total_days > 0:

            percentage = round(
                (
                    data["present_days"]
                    + data["late_days"]
                )
                / total_days
                * 100,
                2
            )

        else:

            percentage = 0.0


        subjects.append({

            "subject_id":
                data["subject_id"],

            "subject_name":
                data["subject_name"],

            "total_days":
                total_days,

            "present_days":
                data["present_days"],

            "absent_days":
                data["absent_days"],

            "late_days":
                data["late_days"],

            "excused_days":
                data["excused_days"],

            "attendance_percentage":
                percentage
        })


    # ========================================================
    # SORT SUBJECTS BY NAME
    # ========================================================

    subjects.sort(
        key=lambda item:
            item["subject_name"].lower()
    )


    return {
        "student_id":
            current_student.id,

        "subjects":
            subjects
    }
    
# ============================================================
# RECOGNIZE MULTIPLE CLASSROOM PHOTOS
# ============================================================

@router.post(
    "/recognize-multiple",
    response_model=FaceAttendanceResponse
)
async def recognize_multiple_classroom_photos(

    class_name: str,
    section: str,
    subject_name: str,

    files: List[UploadFile] = File(...),

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
    # 2. MAXIMUM SIX PHOTOS
    # ========================================================

    if not files:

        raise HTTPException(
            status_code=400,
            detail="Please upload at least one classroom photo"
        )

    if len(files) > 6:

        raise HTTPException(
            status_code=400,
            detail="You can upload a maximum of 6 photos"
        )

    # ========================================================
    # 3. CLEAN INPUT
    # ========================================================

    class_name = class_name.strip()

    section = section.strip().upper()

    subject_name = subject_name.strip()

    # ========================================================
    # 4. FIND CLASS
    # ========================================================

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id
            == current_user.school_id,

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
            Subject.school_id
            == current_user.school_id,

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
            ClassSubject.class_id
            == school_class.id,

            ClassSubject.subject_id
            == subject.id,

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
    # 8. GET ACTIVE STUDENTS
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
    # 9. REGISTERED FACE STUDENTS
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
    # 10. PROCESS ALL PHOTOS
    # ========================================================

    all_face_results = []

    photo_errors = []

    for photo_index, file in enumerate(files, start=1):

        # ----------------------------------------------------
        # CHECK FILE TYPE
        # ----------------------------------------------------

        if (
            not file.content_type
            or not file.content_type.startswith("image/")
        ):

            photo_errors.append(
                f"Photo {photo_index}: "
                "not a valid image"
            )

            continue

        # ----------------------------------------------------
        # READ IMAGE
        # ----------------------------------------------------

        image_data = await file.read()

        if not image_data:

            photo_errors.append(
                f"Photo {photo_index}: "
                "image is empty"
            )

            continue

        # ----------------------------------------------------
        # FACE DETECTION
        # ----------------------------------------------------

        try:

            face_results = (
                get_multiple_face_embeddings(
                    image_data
                )
            )

            all_face_results.extend(
                face_results
            )

        except ValueError as e:

            photo_errors.append(
                f"Photo {photo_index}: {str(e)}"
            )

        except Exception as e:

            print(
                f"FACE DETECTION ERROR "
                f"PHOTO {photo_index}:",
                repr(e)
            )

            photo_errors.append(
                f"Photo {photo_index}: "
                "face detection failed"
            )

    # ========================================================
    # 11. CHECK WHETHER ANY FACE WAS FOUND
    # ========================================================

    if not all_face_results:

        detail = (
            "No recognizable faces were detected "
            "in the uploaded photos."
        )

        if photo_errors:

            detail += (
                " "
                + " | ".join(photo_errors)
            )

        raise HTTPException(
            status_code=400,
            detail=detail
        )

    # ========================================================
    # 12. CURRENT DATE
    # ========================================================

    attendance_date = date.today()

    # ========================================================
    # 13. MATCH ALL DETECTED FACES
    # ========================================================

    recognized_students = []

    already_marked = 0

    matched_student_ids = set()

    for face in all_face_results:

        student, similarity = (
            find_matching_student(
                face["embedding"],
                registered_students
            )
        )

        # ----------------------------------------------------
        # UNKNOWN FACE
        # ----------------------------------------------------

        if student is None:

            continue

        # ----------------------------------------------------
        # STUDENT ALREADY RECOGNIZED IN ANOTHER PHOTO
        # ----------------------------------------------------

        if student.id in matched_student_ids:

            continue

        matched_student_ids.add(
            student.id
        )

        # ====================================================
        # CHECK EXISTING ATTENDANCE
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
        # CREATE ATTENDANCE
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
    # 14. SAVE
    # ========================================================

    db.commit()

    # ========================================================
    # 15. RETURN RESULT
    # ========================================================

    return {

        "message":
            "Multiple classroom photos processed successfully",

        "class_name":
            school_class.name,

        "section":
            school_class.section,

        "subject_name":
            subject.name,

        "attendance_date":
            attendance_date,

        "faces_detected":
            len(all_face_results),

        "students_recognized":
            len(recognized_students),

        "students_already_marked":
            already_marked,

        "students":
            recognized_students
    }
    
# ============================================================
# STUDENT ATTENDANCE HISTORY
# ============================================================

@router.get(
    "/student/history"
)
def get_student_attendance_history(
    subject_id: int | None = None,
    status: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,

    db: Session = Depends(get_db),

    current_student: Student = Depends(
        get_current_student
    )
):

    # --------------------------------------------------------
    # VALIDATE DATE RANGE
    # --------------------------------------------------------

    if (
        from_date is not None
        and to_date is not None
        and from_date > to_date
    ):

        raise HTTPException(
            status_code=400,
            detail="From date cannot be after To date"
        )

    # --------------------------------------------------------
    # BASE QUERY
    # --------------------------------------------------------

    query = (
        db.query(
            Attendance,
            Subject
        )
        .outerjoin(
            Subject,
            Attendance.subject_id == Subject.id
        )
        .filter(
            Attendance.school_id
            == current_student.school_id,

            Attendance.student_id
            == current_student.id
        )
    )

    # --------------------------------------------------------
    # SUBJECT FILTER
    # --------------------------------------------------------

    if subject_id is not None:

        query = query.filter(
            Attendance.subject_id
            == subject_id
        )

    # --------------------------------------------------------
    # STATUS FILTER
    # --------------------------------------------------------

    if status:

        status = status.strip().upper()

        allowed_statuses = {
            "PRESENT",
            "ABSENT",
            "LATE",
            "EXCUSED"
        }

        if status not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid attendance status. "
                    "Use PRESENT, ABSENT, LATE or EXCUSED."
                )
            )

        query = query.filter(
            Attendance.status
            == status
        )

    # --------------------------------------------------------
    # FROM DATE FILTER
    # --------------------------------------------------------

    if from_date is not None:

        query = query.filter(
            Attendance.attendance_date
            >= from_date
        )

    # --------------------------------------------------------
    # TO DATE FILTER
    # --------------------------------------------------------

    if to_date is not None:

        query = query.filter(
            Attendance.attendance_date
            <= to_date
        )

    # --------------------------------------------------------
    # GET RECORDS
    # --------------------------------------------------------

    records = (
        query
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # FORMAT HISTORY
    # --------------------------------------------------------

    history = []

    for attendance, subject in records:

        history.append({

            "id": attendance.id,

            "attendance_date":
                attendance.attendance_date,

            "subject_id":
                attendance.subject_id,

            "subject_name":
                (
                    subject.name
                    if subject
                    else "General Attendance"
                ),

            "status":
                attendance.status
        })

    # --------------------------------------------------------
    # CALCULATE SUMMARY
    # --------------------------------------------------------

    total = len(history)

    present = sum(
        1
        for item in history
        if item["status"] == "PRESENT"
    )

    absent = sum(
        1
        for item in history
        if item["status"] == "ABSENT"
    )

    late = sum(
        1
        for item in history
        if item["status"] == "LATE"
    )

    excused = sum(
        1
        for item in history
        if item["status"] == "EXCUSED"
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "student_id":
            current_student.id,

        "total_records":
            total,

        "present":
            present,

        "absent":
            absent,

        "late":
            late,

        "excused":
            excused,

        "records":
            history
    }