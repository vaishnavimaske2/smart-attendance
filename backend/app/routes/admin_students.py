from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class
)

from app.core.security import (
    get_current_user
)

from app.schemas.students import (
    StudentCreate,
    StudentUpdate,
    StudentDeactivate,
    StudentResponse
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/admin/students",
    tags=["Admin Students"]
)


# ============================================================
# ADMIN CHECK
# ============================================================

def require_admin(
    current_user: User
):

    if current_user.role != "ADMIN":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )

    return current_user


# ============================================================
# FIND CLASS
# ============================================================

def find_school_class(
    db: Session,
    school_id: int,
    class_name: str,
    section: str
):

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id == school_id,
            Class.name.ilike(
                class_name.strip()
            ),
            Class.section.ilike(
                section.strip()
            )
        )
        .first()
    )

    return school_class


# ============================================================
# BUILD STUDENT RESPONSE
# ============================================================

def build_student_response(
    student: Student,
    school_class: Class
):

    return {

        "id": student.id,

        "school_id": student.school_id,

        "class_id": student.class_id,

        "class_name": school_class.name,

        "section": (
            student.section
            or school_class.section
        ),

        "name": student.name,

        "roll_number": student.roll_number,

        "date_of_birth": student.date_of_birth,

        "gender": student.gender,

        "is_active": student.is_active,

        "face_registration": None

    }


# ============================================================
# GET ALL STUDENTS
# ============================================================

@router.get(
    "",
    response_model=list[StudentResponse]
)
def get_students(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    # --------------------------------------------------------
    # CURRENT SCHOOL
    # --------------------------------------------------------

    school_id = current_user.school_id


    # --------------------------------------------------------
    # GET STUDENTS
    # --------------------------------------------------------

    students = (
        db.query(
            Student,
            Class
        )
        .join(
            Class,
            Student.class_id == Class.id
        )
        .filter(
            Student.school_id == school_id,
            Class.school_id == school_id
        )
        .order_by(
            Student.name.asc()
        )
        .all()
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    result = []


    for student, school_class in students:

        result.append(
            build_student_response(
                student,
                school_class
            )
        )


    return result


# ============================================================
# GET STUDENT BY ROLL NUMBER
# ============================================================

@router.get(
    "/by-roll",
    response_model=StudentResponse
)
def get_student_by_roll(

    class_name: str,

    section: str,

    roll_number: str,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    school_id = current_user.school_id


    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    class_name = class_name.strip()

    section = section.strip().upper()

    roll_number = roll_number.strip()


    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = find_school_class(
        db,
        school_id,
        class_name,
        section
    )


    if school_class is None:

        raise HTTPException(
            status_code=404,
            detail="Class and section not found"
        )


    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == school_class.id,
            Student.roll_number == roll_number
        )
        .first()
    )


    if student is None:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    return build_student_response(
        student,
        school_class
    )


# ============================================================
# CREATE STUDENT
# ============================================================

@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_student(

    data: StudentCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    school_id = current_user.school_id


    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    name = data.name.strip()

    roll_number = data.roll_number.strip()

    class_name = data.class_name.strip()

    section = data.section.strip().upper()


    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Student name cannot be empty"
        )


    if not roll_number:

        raise HTTPException(
            status_code=400,
            detail="Roll number cannot be empty"
        )


    if not class_name:

        raise HTTPException(
            status_code=400,
            detail="Class name cannot be empty"
        )


    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section cannot be empty"
        )


    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = find_school_class(
        db,
        school_id,
        class_name,
        section
    )


    if school_class is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "Class and section not found "
                "in your school"
            )
        )


    # --------------------------------------------------------
    # CHECK DUPLICATE ROLL NUMBER
    # --------------------------------------------------------

    existing_student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == school_class.id,
            Student.roll_number == roll_number
        )
        .first()
    )


    if existing_student:

        raise HTTPException(
            status_code=409,
            detail=(
                "A student with this roll number "
                "already exists in this class"
            )
        )


    # --------------------------------------------------------
    # CREATE STUDENT
    # --------------------------------------------------------

    student = Student(

        school_id=school_id,

        class_id=school_class.id,

        name=name,

        roll_number=roll_number,

        date_of_birth=data.date_of_birth,

        gender=(
            data.gender.strip()
            if data.gender
            else None
        ),

        section=section,

        is_active=True

    )


    db.add(student)

    db.commit()

    db.refresh(student)


    return build_student_response(
        student,
        school_class
    )


# ============================================================
# UPDATE STUDENT
#
# Student is located using:
# school_id + class_name + section + roll_number
# ============================================================

@router.put(
    "/by-roll",
    response_model=StudentResponse
)
def update_student(

    data: StudentUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    school_id = current_user.school_id


    # --------------------------------------------------------
    # CLEAN CURRENT STUDENT DETAILS
    # --------------------------------------------------------

    class_name = data.class_name.strip()

    section = data.section.strip().upper()

    roll_number = data.roll_number.strip()


    # --------------------------------------------------------
    # FIND CURRENT CLASS
    # --------------------------------------------------------

    current_class = find_school_class(
        db,
        school_id,
        class_name,
        section
    )


    if current_class is None:

        raise HTTPException(
            status_code=404,
            detail="Class and section not found"
        )


    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == current_class.id,
            Student.roll_number == roll_number
        )
        .first()
    )


    if student is None:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    # --------------------------------------------------------
    # UPDATE NAME
    # --------------------------------------------------------

    if data.name is not None:

        cleaned_name = data.name.strip()


        if not cleaned_name:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Student name cannot be empty"
                )
            )


        student.name = cleaned_name


    # --------------------------------------------------------
    # UPDATE DATE OF BIRTH
    # --------------------------------------------------------

    student.date_of_birth = (
        data.date_of_birth
    )


    # --------------------------------------------------------
    # UPDATE GENDER
    # --------------------------------------------------------

    student.gender = (

        data.gender.strip()

        if data.gender

        else None

    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()

    db.refresh(student)


    return build_student_response(
        student,
        current_class
    )


# ============================================================
# CHANGE ROLL NUMBER / MOVE STUDENT
#
# This endpoint allows the administrator to change:
#
# - class
# - section
# - roll number
# - name
# - DOB
# - gender
#
# It uses the ORIGINAL student details to find the student.
# ============================================================

@router.put(
    "/by-roll/details",
    response_model=StudentResponse
)
def update_student_details(

    current_class_name: str,

    current_section: str,

    current_roll_number: str,

    data: StudentUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    school_id = current_user.school_id


    # --------------------------------------------------------
    # CLEAN CURRENT DETAILS
    # --------------------------------------------------------

    current_class_name = (
        current_class_name.strip()
    )

    current_section = (
        current_section.strip().upper()
    )

    current_roll_number = (
        current_roll_number.strip()
    )


    # --------------------------------------------------------
    # FIND CURRENT CLASS
    # --------------------------------------------------------

    current_class = find_school_class(
        db,
        school_id,
        current_class_name,
        current_section
    )


    if current_class is None:

        raise HTTPException(
            status_code=404,
            detail="Current class and section not found"
        )


    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == current_class.id,
            Student.roll_number == current_roll_number
        )
        .first()
    )


    if student is None:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    # --------------------------------------------------------
    # NEW DETAILS
    # --------------------------------------------------------

    new_class_name = data.class_name.strip()

    new_section = data.section.strip().upper()

    new_roll_number = data.roll_number.strip()


    # --------------------------------------------------------
    # FIND NEW CLASS
    # --------------------------------------------------------

    new_class = find_school_class(
        db,
        school_id,
        new_class_name,
        new_section
    )


    if new_class is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "New class and section "
                "not found in your school"
            )
        )


    # --------------------------------------------------------
    # CHECK DUPLICATE
    # --------------------------------------------------------

    duplicate_student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == new_class.id,
            Student.roll_number == new_roll_number,
            Student.id != student.id
        )
        .first()
    )


    if duplicate_student:

        raise HTTPException(
            status_code=409,
            detail=(
                "A student with this roll number "
                "already exists in the new class"
            )
        )


    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    student.class_id = new_class.id

    student.section = new_section

    student.roll_number = new_roll_number


    if data.name is not None:

        cleaned_name = data.name.strip()


        if not cleaned_name:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Student name cannot be empty"
                )
            )


        student.name = cleaned_name


    student.date_of_birth = (
        data.date_of_birth
    )


    student.gender = (

        data.gender.strip()

        if data.gender

        else None

    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()

    db.refresh(student)


    return build_student_response(
        student,
        new_class
    )


# ============================================================
# ACTIVATE / DEACTIVATE STUDENT
#
# Uses:
# class_name + section + roll_number
#
# Current status is toggled.
# ============================================================

@router.patch(
    "/by-roll",
    response_model=StudentResponse
)
def toggle_student_status(

    data: StudentDeactivate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ADMIN CHECK
    # --------------------------------------------------------

    require_admin(current_user)


    school_id = current_user.school_id


    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    class_name = data.class_name.strip()

    section = data.section.strip().upper()

    roll_number = data.roll_number.strip()


    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = find_school_class(
        db,
        school_id,
        class_name,
        section
    )


    if school_class is None:

        raise HTTPException(
            status_code=404,
            detail="Class and section not found"
        )


    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.class_id == school_class.id,
            Student.roll_number == roll_number
        )
        .first()
    )


    if student is None:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    # --------------------------------------------------------
    # TOGGLE STATUS
    # --------------------------------------------------------

    # --------------------------------------------------------
    # TOGGLE STATUS
    # --------------------------------------------------------

    current_status = bool(student.is_active)

    student.is_active = not current_status

    db.add(student)

    db.commit()

    db.refresh(student)


    return build_student_response(
        student,
        school_class
    )