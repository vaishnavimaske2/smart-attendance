from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import (
    User,
    Student,
    Class,
    Subject,
    TeacherAssignment
)

from app.schemas.teacher_students import (
    TeacherStudentsResponse,
    TeacherOptionsResponse
)

from app.core.security import (
    get_current_user
)


router = APIRouter(
    prefix="/api/teacher-students",
    tags=["Teacher Students"]
)


# ============================================================
# GET TEACHER OPTIONS
# ============================================================

@router.get(
    "/options",
    response_model=TeacherOptionsResponse
)
def get_teacher_options(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ONLY TEACHERS
    # --------------------------------------------------------

    if current_user.role != "TEACHER":

        raise HTTPException(
            status_code=403,
            detail="Only teachers can access these options"
        )


    # --------------------------------------------------------
    # GET ACTIVE TEACHER ASSIGNMENTS
    # --------------------------------------------------------

    assignments = (
        db.query(TeacherAssignment)
        .filter(
            TeacherAssignment.teacher_id
            == current_user.id,

            TeacherAssignment.is_active
            == True
        )
        .all()
    )


    # --------------------------------------------------------
    # NO ASSIGNMENTS
    # --------------------------------------------------------

    if not assignments:

        return {
            "classes": []
        }


    # --------------------------------------------------------
    # BUILD CLASS OPTIONS
    # --------------------------------------------------------

    class_data = {}


    for assignment in assignments:

        school_class = (
            db.query(Class)
            .filter(
                Class.id
                == assignment.class_id,

                Class.school_id
                == current_user.school_id
            )
            .first()
        )


        if not school_class:

            continue


        # ----------------------------------------------------
        # CREATE CLASS
        # ----------------------------------------------------

        if school_class.id not in class_data:

            class_data[school_class.id] = {

                "class_id":
                    school_class.id,

                "class_name":
                    school_class.name,

                "section":
                    school_class.section,

                "academic_year":
                    school_class.academic_year,

                "is_class_teacher":
                    False,

                "subjects": []

            }


        # ----------------------------------------------------
        # CLASS TEACHER
        # ----------------------------------------------------

        if assignment.is_class_teacher:

            class_data[
                school_class.id
            ]["is_class_teacher"] = True


        # ----------------------------------------------------
        # SUBJECT
        # ----------------------------------------------------

        if assignment.subject_id is not None:

            subject = (
                db.query(Subject)
                .filter(
                    Subject.id
                    == assignment.subject_id,

                    Subject.school_id
                    == current_user.school_id,

                    Subject.is_active
                    == True
                )
                .first()
            )


            if subject:

                existing_subject = any(

                    item["id"]
                    == subject.id

                    for item in
                    class_data[
                        school_class.id
                    ]["subjects"]

                )


                if not existing_subject:

                    class_data[
                        school_class.id
                    ]["subjects"].append({

                        "id":
                            subject.id,

                        "name":
                            subject.name

                    })


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "classes":
            list(class_data.values())

    }


# ============================================================
# GET STUDENTS FOR SELECTED CLASS + SUBJECT
# ============================================================

@router.get(
    "/",
    response_model=TeacherStudentsResponse
)
def get_teacher_students(

    class_id: int = Query(...),

    subject_id: int = Query(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )

):

    # --------------------------------------------------------
    # ONLY TEACHERS
    # --------------------------------------------------------

    if current_user.role != "TEACHER":

        raise HTTPException(
            status_code=403,
            detail="Only teachers can access students"
        )


    # --------------------------------------------------------
    # CHECK CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.id
            == class_id,

            Class.school_id
            == current_user.school_id
        )
        .first()
    )


    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found"
        )


    # --------------------------------------------------------
    # CHECK SUBJECT
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # CHECK TEACHER ASSIGNMENT
    # --------------------------------------------------------

    assignment = (
        db.query(TeacherAssignment)
        .filter(

            TeacherAssignment.teacher_id
            == current_user.id,

            TeacherAssignment.class_id
            == class_id,

            TeacherAssignment.subject_id
            == subject_id,

            TeacherAssignment.is_active
            == True
        )
        .first()
    )


    if not assignment:

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not assigned to this "
                "class and subject"
            )
        )


    # --------------------------------------------------------
    # GET STUDENTS
    # --------------------------------------------------------

    students = (
        db.query(Student)
        .filter(

            Student.school_id
            == current_user.school_id,

            Student.class_id
            == class_id,

            Student.is_active
            == True
        )
        .order_by(
            Student.roll_number
        )
        .all()
    )


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "class_name":
            school_class.name,

        "section":
            school_class.section,

        "academic_year":
            school_class.academic_year,

        "subject": {

            "id":
                subject.id,

            "name":
                subject.name

        },

        "students": [

            {

                "id":
                    student.id,

                "name":
                    student.name,

                "roll_number":
                    student.roll_number,

                "date_of_birth":
                    student.date_of_birth,

                "gender":
                    student.gender

            }

            for student in students

        ]

    }