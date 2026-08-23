from datetime import date

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    Student,
    Attendance,
    Class,
    TeacherAssignment
)
from app.core.security import get_current_user

from app.services.face_service import (
    get_face_embedding,
    get_multiple_face_embeddings,
    find_matching_student
)


router = APIRouter(
    prefix="/api/recognition",
    tags=["Face Recognition"]
)


# ============================================================
# TEST ROUTER
# ============================================================

@router.get("/test")
def test_recognition():

    return {
        "message": "Recognition router is working"
    }


# ============================================================
# SINGLE FACE RECOGNITION
# ============================================================

@router.post("/recognize")
async def recognize_face(

    file: UploadFile = File(...),

    # Teacher selects attendance date
    attendance_date: date = Form(...),

    db: Session = Depends(get_db),

    current_user=Depends(get_current_user)
):

    # ========================================================
    # 1. CHECK IMAGE
    # ========================================================

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    # ========================================================
    # 2. READ IMAGE
    # ========================================================

    image_data = await file.read()

    if not image_data:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    # ========================================================
    # 3. GENERATE FACE EMBEDDING
    # ========================================================

    try:

        face_data = get_face_embedding(
            image_data
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # ========================================================
    # 4. GET ACTIVE STUDENTS FROM SAME SCHOOL
    # ========================================================

    students = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.is_active == True
        )
        .all()
    )

    if not students:

        raise HTTPException(
            status_code=404,
            detail="No active students found"
        )

    # ========================================================
    # 5. FIND MATCHING STUDENT
    # ========================================================

    student, similarity = find_matching_student(
        face_data["embedding"],
        students
    )

    # ========================================================
    # 6. STUDENT NOT RECOGNIZED
    # ========================================================

    if student is None:

        return {

            "recognized": False,

            "message":
                "Face detected but student not recognized",

            "faces_detected": 1,

            "similarity":
                float(similarity),

            "attendance_date":
                str(attendance_date)
        }

    # ========================================================
    # 7. CHECK ATTENDANCE FOR SELECTED DATE
    # ========================================================

    existing_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student.id,
            Attendance.attendance_date == attendance_date
        )
        .first()
    )

    # ========================================================
    # 8. ATTENDANCE ALREADY MARKED
    # ========================================================

    if existing_attendance:

        return {

            "recognized": True,

            "attendance_marked": False,

            "message":
                "Student recognized but attendance already marked for this date",

            "student_id":
                student.id,

            "student_name":
                student.name,

            "faces_detected":
                1,

            "similarity":
                float(similarity),

            "attendance_date":
                str(attendance_date),

            "attendance_status":
                existing_attendance.status,

            "attendance_id":
                existing_attendance.id
        }

    # ========================================================
    # 9. CREATE ATTENDANCE
    # ========================================================

    attendance = Attendance(

        school_id=current_user.school_id,

        class_id=student.class_id,

        student_id=student.id,

        marked_by=current_user.id,

        attendance_date=attendance_date,

        status="PRESENT"
    )

    # ========================================================
    # 10. SAVE
    # ========================================================

    db.add(attendance)

    db.commit()

    db.refresh(attendance)

    # ========================================================
    # 11. RESPONSE
    # ========================================================

    return {

        "recognized": True,

        "attendance_marked": True,

        "message":
            "Student recognized and attendance marked successfully",

        "student_id":
            student.id,

        "student_name":
            student.name,

        "faces_detected":
            1,

        "similarity":
            float(similarity),

        "attendance_date":
            str(attendance_date),

        "attendance_status":
            attendance.status,

        "attendance_id":
            attendance.id,

        "face_location": {

            "x":
                int(face_data["bbox"][0]),

            "y":
                int(face_data["bbox"][1]),

            "width":
                int(
                    face_data["bbox"][2]
                    -
                    face_data["bbox"][0]
                ),

            "height":
                int(
                    face_data["bbox"][3]
                    -
                    face_data["bbox"][1]
                )
        }
    }


# ============================================================
# CLASSROOM MULTIPLE IMAGE FACE RECOGNITION
# ============================================================

@router.post("/recognize-class")
async def recognize_class_faces(

    # ========================================================
    # CLASS ID SELECTED BY TEACHER
    # ========================================================

    class_id: int = Form(...),

    # ========================================================
    # ATTENDANCE DATE
    # ========================================================

    attendance_date: date = Form(...),

    # ========================================================
    # SIX POSSIBLE CLASSROOM IMAGES
    # ========================================================

    file1: UploadFile = File(...),

    file2: UploadFile = File(None),

    file3: UploadFile = File(None),

    file4: UploadFile = File(None),

    file5: UploadFile = File(None),

    file6: UploadFile = File(None),

    db: Session = Depends(get_db),

    current_user=Depends(get_current_user)
):

    # ========================================================
    # 1. CHECK CLASS
    # ========================================================

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
            detail="Class not found in your school"
        )

    # ========================================================
    # 2. CHECK TEACHER AUTHORIZATION
    # ========================================================

    if current_user.role == "TEACHER":

        teacher_assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id == current_user.id,
                TeacherAssignment.class_id == class_id,
                TeacherAssignment.is_active == True
            )
            .first()
        )

        if not teacher_assignment:

            raise HTTPException(
                status_code=403,
                detail=(
                    f"You are not assigned to "
                    f"{classroom.name} - Section "
                    f"{classroom.section}"
                )
            )

    elif current_user.role != "ADMIN":

        raise HTTPException(
            status_code=403,
            detail="Not authorized to mark class attendance"
        )

    # ========================================================
    # 3. COLLECT FILES
    # ========================================================

    files = [
        file1,
        file2,
        file3,
        file4,
        file5,
        file6
    ]

    # Remove optional empty files
    files = [
        file for file in files
        if file is not None
    ]

    # ========================================================
    # 4. CHECK NUMBER OF IMAGES
    # ========================================================

    if len(files) == 0:

        raise HTTPException(
            status_code=400,
            detail="Please upload at least one classroom image"
        )

    if len(files) > 6:

        raise HTTPException(
            status_code=400,
            detail="Maximum 6 classroom images are allowed"
        )

    # ========================================================
    # 5. GET ACTIVE STUDENTS OF SELECTED CLASS ONLY
    # ========================================================

    students = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.class_id == class_id,
            Student.is_active == True
        )
        .all()
    )

    if not students:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No active students found in "
                f"{classroom.name} - Section "
                f"{classroom.section}"
            )
        )

    # ========================================================
    # 6. RESULT VARIABLES
    # ========================================================

    recognized_students = []

    unknown_faces = []

    processed_student_ids = set()

    attendance_marked = 0

    already_marked = 0

    total_faces_detected = 0

    images_processed = 0

    image_errors = []

    # ========================================================
    # 7. PROCESS EVERY CLASSROOM IMAGE
    # ========================================================

    for image_index, file in enumerate(files):

        # ----------------------------------------------------
        # CHECK FILE TYPE
        # ----------------------------------------------------

        if (
            not file.content_type
            or not file.content_type.startswith("image/")
        ):

            image_errors.append({

                "image_index": image_index,

                "filename": file.filename,

                "error": "Please upload an image file"
            })

            continue

        # ----------------------------------------------------
        # READ IMAGE
        # ----------------------------------------------------

        image_data = await file.read()

        if not image_data:

            image_errors.append({

                "image_index": image_index,

                "filename": file.filename,

                "error": "Uploaded image is empty"
            })

            continue

        # ----------------------------------------------------
        # DETECT ALL FACES
        # ----------------------------------------------------

        try:

            faces = get_multiple_face_embeddings(
                image_data
            )

        except ValueError as e:

            image_errors.append({

                "image_index": image_index,

                "filename": file.filename,

                "error": str(e)
            })

            continue

        # ----------------------------------------------------
        # IMAGE SUCCESSFULLY PROCESSED
        # ----------------------------------------------------

        images_processed += 1

        total_faces_detected += len(faces)

        # ====================================================
        # 8. PROCESS EVERY DETECTED FACE
        # ====================================================

        for face in faces:

            # ------------------------------------------------
            # FIND MATCHING STUDENT
            # ------------------------------------------------

            student, similarity = find_matching_student(
                face["embedding"],
                students
            )

            # =================================================
            # FACE NOT RECOGNIZED
            # =================================================

            if student is None:

                unknown_faces.append({

                    "image_index":
                        image_index,

                    "filename":
                        file.filename,

                    "face_index":
                        face["face_index"],

                    "confidence":
                        float(face["confidence"]),

                    "face_location": {

                        "x":
                            int(face["bbox"][0]),

                        "y":
                            int(face["bbox"][1]),

                        "width":
                            int(
                                face["bbox"][2]
                                -
                                face["bbox"][0]
                            ),

                        "height":
                            int(
                                face["bbox"][3]
                                -
                                face["bbox"][1]
                            )
                    }
                })

                continue

            # =================================================
            # EXTRA SAFETY CHECK
            # =================================================

            if student.class_id != class_id:

                continue

            # =================================================
            # DUPLICATE STUDENT PROTECTION
            # =================================================
            #
            # Example:
            #
            # Photo 1 → Aarav detected
            # Photo 2 → Aarav detected again
            #
            # Attendance is marked only once.
            # =================================================

            if student.id in processed_student_ids:

                continue

            processed_student_ids.add(student.id)

            # =================================================
            # CHECK ATTENDANCE
            # =================================================

            existing_attendance = (
                db.query(Attendance)
                .filter(
                    Attendance.student_id == student.id,
                    Attendance.class_id == class_id,
                    Attendance.school_id == current_user.school_id,
                    Attendance.attendance_date == attendance_date
                )
                .first()
            )

            # =================================================
            # ALREADY MARKED
            # =================================================

            if existing_attendance:

                already_marked += 1

                recognized_students.append({

                    "image_index":
                        image_index,

                    "filename":
                        file.filename,

                    "face_index":
                        face["face_index"],

                    "student_id":
                        student.id,

                    "student_name":
                        student.name,

                    "roll_number":
                        student.roll_number,

                    "recognized":
                        True,

                    "similarity":
                        float(similarity),

                    "attendance_marked":
                        False,

                    "attendance_already_marked":
                        True,

                    "attendance_status":
                        existing_attendance.status,

                    "attendance_date":
                        str(attendance_date),

                    "attendance_id":
                        existing_attendance.id,

                    "face_location": {

                        "x":
                            int(face["bbox"][0]),

                        "y":
                            int(face["bbox"][1]),

                        "width":
                            int(
                                face["bbox"][2]
                                -
                                face["bbox"][0]
                            ),

                        "height":
                            int(
                                face["bbox"][3]
                                -
                                face["bbox"][1]
                            )
                    }
                })

                continue

            # =================================================
            # CREATE PRESENT ATTENDANCE
            # =================================================

            attendance = Attendance(

                school_id=
                    current_user.school_id,

                class_id=
                    class_id,

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

            attendance_marked += 1

            # =================================================
            # ADD STUDENT TO RESPONSE
            # =================================================

            recognized_students.append({

                "image_index":
                    image_index,

                "filename":
                    file.filename,

                "face_index":
                    face["face_index"],

                "student_id":
                    student.id,

                "student_name":
                    student.name,

                "roll_number":
                    student.roll_number,

                "recognized":
                    True,

                "similarity":
                    float(similarity),

                "attendance_marked":
                    True,

                "attendance_already_marked":
                    False,

                "attendance_status":
                    "PRESENT",

                "attendance_date":
                    str(attendance_date),

                "face_location": {

                    "x":
                        int(face["bbox"][0]),

                    "y":
                        int(face["bbox"][1]),

                    "width":
                        int(
                            face["bbox"][2]
                            -
                            face["bbox"][0]
                        ),

                    "height":
                        int(
                            face["bbox"][3]
                            -
                            face["bbox"][1]
                        )
                }
            })

    # ========================================================
    # 9. SAVE ALL ATTENDANCE
    # ========================================================

    try:

        db.commit()

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save attendance: {str(e)}"
        )

    # ========================================================
    # 10. FINAL RESPONSE
    # ========================================================

    return {

        "message":
            "Classroom attendance processed successfully",

        "class_id":
            classroom.id,

        "class_name":
            classroom.name,

        "section":
            classroom.section,

        "academic_year":
            classroom.academic_year,

        "attendance_date":
            str(attendance_date),

        "total_images_uploaded":
            len(files),

        "images_processed":
            images_processed,

        "total_faces_detected":
            total_faces_detected,

        "recognized_students":
            len(recognized_students),

        "attendance_marked":
            attendance_marked,

        "already_marked":
            already_marked,

        "unknown_faces":
            len(unknown_faces),

        "students":
            recognized_students,

        "unknown":
            unknown_faces,

        "image_errors":
            image_errors
    }