from fastapi import (
    APIRouter, 
    Depends, 
    HTTPException,
    UploadFile,
    File,
    Form
)
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.database.database import get_db
from app.database.models import (
    User,
    Student,
    Class,
    TeacherAssignment
)

from app.schemas.students import (
    StudentCreate,
    StudentResponse,
    StudentUpdate,
    StudentDeactivate
)

from app.core.security import get_current_user

from app.services.face_service import get_face_embedding

router = APIRouter(
    prefix="/api/students",
    tags=["Students"]
)

@router.get("/options")
def get_student_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY TEACHERS
    # ----------------------------------------------------

    if current_user.role != "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can view student options"
        )

    # ----------------------------------------------------
    # FIND CLASSES WHERE TEACHER IS CLASS TEACHER
    # ----------------------------------------------------

    assignments = (
        db.query(TeacherAssignment, Class)
        .join(
            Class,
            TeacherAssignment.class_id == Class.id
        )
        .filter(
            TeacherAssignment.teacher_id == current_user.id,
            TeacherAssignment.is_class_teacher == True,
            TeacherAssignment.is_active == True,
            Class.school_id == current_user.school_id
        )
        .all()
    )

    return [
        {
            "class_id": school_class.id,
            "class_name": school_class.name,
            "section": school_class.section,
            "academic_year": school_class.academic_year
        }
        for assignment, school_class in assignments
    ]

# ============================================================
# CREATE STUDENT + REGISTER FACE
# ============================================================

@router.post(
    "/",
    response_model=StudentResponse
)
async def create_student(

    name: str = Form(...),
    roll_number: str = Form(...),
    date_of_birth: date | None = Form(None),
    gender: str | None = Form(None),
    class_name: str = Form(...),
    section: str = Form(...),

    file1: UploadFile | None = File(None),
    file2: UploadFile | None = File(None),
    file3: UploadFile | None = File(None),
    file4: UploadFile | None = File(None),
    file5: UploadFile | None = File(None),
    file6: UploadFile | None = File(None),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    # ========================================================
    # 1. ONLY TEACHERS
    # ========================================================

    if current_user.role != "TEACHER":

        raise HTTPException(
            status_code=403,
            detail="Only teachers can create students"
        )


    # ========================================================
    # 2. CLEAN INPUT
    # ========================================================

    name = name.strip()
    roll_number = roll_number.strip()
    class_name = class_name.strip()
    section = section.strip().upper()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Student name is required"
        )

    if not roll_number:
        raise HTTPException(
            status_code=400,
            detail="Roll number is required"
        )


    # ========================================================
    # 3. FIND CLASS
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
                f"Class '{class_name}' with section "
                f"'{section}' not found"
            )
        )


    # ========================================================
    # 4. CHECK CLASS TEACHER
    # ========================================================

    teacher_assignment = (
        db.query(TeacherAssignment)
        .filter(

            TeacherAssignment.teacher_id
            == current_user.id,

            TeacherAssignment.class_id
            == school_class.id,

            TeacherAssignment.is_class_teacher
            == True,

            TeacherAssignment.is_active
            == True
        )
        .first()
    )


    if not teacher_assignment:

        raise HTTPException(
            status_code=403,
            detail=(
                f"You are not the class teacher of "
                f"{school_class.name} - Section "
                f"{school_class.section}"
            )
        )


    # ========================================================
    # 5. CHECK DUPLICATE ROLL NUMBER
    # ========================================================

    existing_student = (
        db.query(Student)
        .filter(

            Student.school_id
            == current_user.school_id,

            Student.class_id
            == school_class.id,

            Student.roll_number
            == roll_number
        )
        .first()
    )


    if existing_student:

        raise HTTPException(
            status_code=400,
            detail=(
                "Roll number already exists in "
                "this class"
            )
        )


    # ========================================================
    # 6. COLLECT PHOTOS
    # ========================================================

    files = [
        file1,
        file2,
        file3,
        file4,
        file5,
        file6
    ]

    files = [
        file
        for file in files
        if file is not None
    ]


    if len(files) > 6:

        raise HTTPException(
            status_code=400,
            detail="Maximum 6 photos are allowed"
        )


    # ========================================================
    # 7. CREATE STUDENT
    # ========================================================

    student = Student(

        school_id=
            current_user.school_id,

        class_id=
            school_class.id,

        name=
            name,

        roll_number=
            roll_number,

        date_of_birth=
            date_of_birth,

        gender=
            gender.strip()
            if gender
            else None,

        section=
            school_class.section,

        is_active=
            True
    )


    db.add(student)

    # Get student.id before committing
    db.flush()


    # ========================================================
    # 8. PROCESS FACE PHOTOS
    # ========================================================

    registered_embeddings = []

    successful_photos = []

    failed_photos = []


    for index, file in enumerate(files):

        photo_number = index + 1


        # ----------------------------------------------------
        # FILE TYPE
        # ----------------------------------------------------

        if (
            not file.content_type
            or not file.content_type.startswith(
                "image/"
            )
        ):

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Please upload an image file"
            })

            continue


        # ----------------------------------------------------
        # READ FILE
        # ----------------------------------------------------

        image_data = await file.read()


        if not image_data:

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Uploaded image is empty"
            })

            continue


        # ----------------------------------------------------
        # GENERATE EMBEDDING
        # ----------------------------------------------------

        try:

            face_data = get_face_embedding(
                image_data
            )


            registered_embeddings.append(
                face_data["embedding"]
            )


            successful_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "confidence":
                    round(
                        float(
                            face_data[
                                "confidence"
                            ]
                        ),
                        4
                    )
            })


        except ValueError as e:

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    str(e)
            })


        except Exception as e:

            print(
                "FACE REGISTRATION ERROR:",
                repr(e)
            )

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Face processing failed"
            })


    # ========================================================
    # 9. SAVE EMBEDDINGS
    # ========================================================

    if registered_embeddings:

        student.face_embedding = (
            registered_embeddings
        )


    # ========================================================
    # 10. COMMIT EVERYTHING
    # ========================================================

    try:

        db.commit()

        db.refresh(student)

    except Exception as e:

        db.rollback()

        print(
            "CREATE STUDENT ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create student"
        )


    # ========================================================
    # 11. RESPONSE
    # ========================================================

    return {

        "id":
            student.id,

        "school_id":
            student.school_id,

        "class_id":
            student.class_id,

        "class_name":
            school_class.name,

        "section":
            school_class.section,

        "name":
            student.name,

        "roll_number":
            student.roll_number,

        "date_of_birth":
            student.date_of_birth,

        "gender":
            student.gender,

        "is_active":
            student.is_active,

        "face_registration": {

            "photos_uploaded":
                len(files),

            "photos_registered":
                len(successful_photos),

            "photos_failed":
                len(failed_photos),

            "registered_photos":
                successful_photos,

            "failed_photos":
                failed_photos
        }
    }
    
# ============================================================
# GET STUDENTS
# ============================================================

@router.get("/")
def get_students(
    class_name: str,
    section: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN AND TEACHERS CAN VIEW STUDENTS
    # ----------------------------------------------------

    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view students"
        )

    # ----------------------------------------------------
    # CLEAN INPUT
    # ----------------------------------------------------

    class_name = class_name.strip()
    section = section.strip().upper()

    # ----------------------------------------------------
    # FIND CLASS
    # ----------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,
            func.lower(Class.name) == class_name.lower(),
            func.upper(Class.section) == section
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail=f"Class '{class_name}' with section '{section}' not found"
        )

    # ----------------------------------------------------
    # TEACHER AUTHORIZATION
    # ----------------------------------------------------

    if current_user.role == "TEACHER":

        teacher_assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id == current_user.id,
                TeacherAssignment.class_id == school_class.id,
                TeacherAssignment.is_active == True
            )
            .first()
        )

        if not teacher_assignment:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"You are not assigned to "
                    f"{school_class.name} - Section {school_class.section}"
                )
            )

    # ----------------------------------------------------
    # GET STUDENTS
    # ----------------------------------------------------

    students = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.class_id == school_class.id,
            Student.is_active == True
        )
        .order_by(Student.roll_number)
        .all()
    )

    # ----------------------------------------------------
    # RETURN STUDENTS
    # ----------------------------------------------------

    return [
        {
            "id": student.id,
            "school_id": student.school_id,
            "class_id": student.class_id,
            "class_name": school_class.name,
            "section": school_class.section,
            "name": student.name,
            "roll_number": student.roll_number,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "is_active": student.is_active
        }
        for student in students
    ]
    
# ============================================================
# UPDATE STUDENT
# ============================================================

@router.put("/")
def update_student(
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # ----------------------------------------------------
    # ONLY ADMIN AND TEACHERS
    # ----------------------------------------------------

    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update students"
        )

    # ----------------------------------------------------
    # CLEAN INPUT
    # ----------------------------------------------------

    class_name = data.class_name.strip()
    section = data.section.strip().upper()
    roll_number = data.roll_number.strip()

    # ----------------------------------------------------
    # FIND CLASS
    # ----------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == current_user.school_id,
            func.lower(Class.name) == class_name.lower(),
            func.upper(Class.section) == section
        )
        .first()
    )

    if not school_class:
        raise HTTPException(
            status_code=404,
            detail=f"Class '{class_name}' with section '{section}' not found"
        )

    # ----------------------------------------------------
    # FIND STUDENT
    # ----------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.class_id == school_class.id,
            Student.roll_number == roll_number,
            Student.is_active == True
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Student with roll number '{roll_number}' "
                f"not found in {class_name} - Section {section}"
            )
        )

    # ----------------------------------------------------
    # TEACHER AUTHORIZATION
    # ----------------------------------------------------

    if current_user.role == "TEACHER":

        teacher_assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id == current_user.id,
                TeacherAssignment.class_id == school_class.id,
                TeacherAssignment.is_active == True
            )
            .first()
        )

        if not teacher_assignment:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"You are not assigned to "
                    f"{school_class.name} - Section {school_class.section}"
                )
            )

    # ----------------------------------------------------
    # UPDATE DATA
    # ----------------------------------------------------

    if data.name is not None:
        student.name = data.name.strip()

    if data.date_of_birth is not None:
        student.date_of_birth = data.date_of_birth

    if data.gender is not None:
        student.gender = data.gender.strip()

    db.commit()
    db.refresh(student)

    # ----------------------------------------------------
    # RESPONSE
    # ----------------------------------------------------

    return {
        "message": "Student updated successfully",
        "student": {
            "id": student.id,
            "school_id": student.school_id,
            "class_id": student.class_id,
            "class_name": school_class.name,
            "section": school_class.section,
            "name": student.name,
            "roll_number": student.roll_number,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "is_active": student.is_active
        }
    }

# ============================================================
# DEACTIVATE STUDENT
# ============================================================

@router.put("/deactivate")
def deactivate_student(
    data: StudentDeactivate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        # ----------------------------------------------------
        # AUTHORIZATION
        # ----------------------------------------------------

        if current_user.role not in ["ADMIN", "TEACHER"]:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to deactivate students"
            )

        # ----------------------------------------------------
        # CLEAN INPUT
        # ----------------------------------------------------

        class_name = data.class_name.strip()
        section = data.section.strip().upper()
        roll_number = data.roll_number.strip()

        # ----------------------------------------------------
        # FIND CLASS
        # ----------------------------------------------------

        school_class = (
            db.query(Class)
            .filter(
                Class.school_id == current_user.school_id,
                func.lower(Class.name) == class_name.lower(),
                func.upper(Class.section) == section
            )
            .first()
        )

        if not school_class:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Class '{class_name}' with section "
                    f"'{section}' not found"
                )
            )

        # ----------------------------------------------------
        # FIND STUDENT
        # ----------------------------------------------------

        student = (
            db.query(Student)
            .filter(
                Student.school_id == current_user.school_id,
                Student.class_id == school_class.id,
                Student.roll_number == roll_number,
                Student.is_active == True
            )
            .first()
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Student with roll number '{roll_number}' "
                    f"not found in {class_name} - Section {section}"
                )
            )

        # ----------------------------------------------------
        # TEACHER AUTHORIZATION
        # ----------------------------------------------------

        if current_user.role == "TEACHER":

            teacher_assignment = (
                db.query(TeacherAssignment)
                .filter(
                    TeacherAssignment.teacher_id == current_user.id,
                    TeacherAssignment.class_id == school_class.id,
                    TeacherAssignment.is_active == True
                )
                .first()
            )

            if not teacher_assignment:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"You are not assigned to "
                        f"{school_class.name} - "
                        f"Section {school_class.section}"
                    )
                )

        # ----------------------------------------------------
        # DEACTIVATE
        # ----------------------------------------------------

        student.is_active = False

        db.commit()

        return {
            "message": "Student deactivated successfully",
            "student": {
                "id": student.id,
                "name": student.name,
                "roll_number": student.roll_number,
                "class_name": school_class.name,
                "section": school_class.section,
                "is_active": student.is_active
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("DEACTIVATE STUDENT ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Failed to deactivate student: {str(e)}"
        )