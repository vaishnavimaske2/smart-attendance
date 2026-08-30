from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.database.models import (
    User,
    Class,
    Subject,
    TeacherAssignment,
    ClassSubject,
)

from app.schemas.teacher_assignments import (
    ClassTeacherBulkCreate,
    SubjectTeacherBulkCreate,
    TeacherAssignmentResponse,
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/teacher-assignments",
    tags=["Teacher Assignments"],
)


# ============================================================
# HELPER
# ============================================================

def assignment_to_response(
    assignment: TeacherAssignment,
    db: Session,
):
    """
    Convert TeacherAssignment into a frontend-friendly object.
    """

    teacher = (
        db.query(User)
        .filter(User.id == assignment.teacher_id)
        .first()
    )

    school_class = (
        db.query(Class)
        .filter(Class.id == assignment.class_id)
        .first()
    )

    subject = None

    if assignment.subject_id is not None:
        subject = (
            db.query(Subject)
            .filter(Subject.id == assignment.subject_id)
            .first()
        )

    return {
        "id": assignment.id,

        "teacher_id": assignment.teacher_id,
        "teacher_name": (
            teacher.full_name
            if teacher and hasattr(teacher, "full_name")
            and teacher.full_name
            else (
                teacher.name
                if teacher and hasattr(teacher, "name")
                and teacher.name
                else (
                    teacher.email
                    if teacher
                    else "Unknown Teacher"
                )
            )
        ),
        "teacher_email": (
            teacher.email
            if teacher
            else ""
        ),

        "class_id": assignment.class_id,
        "class_name": (
            school_class.name
            if school_class
            else ""
        ),
        "section": (
            school_class.section
            if school_class
            else ""
        ),

        "subject_id": assignment.subject_id,
        "subject_name": (
            subject.name
            if subject
            else None
        ),
        "subject_code": (
            subject.code
            if subject
            else None
        ),

        "is_class_teacher": assignment.is_class_teacher,
        "is_active": assignment.is_active,
    }


# ============================================================
# 1. GET ALL TEACHER ASSIGNMENTS
# ============================================================

@router.get(
    "",
    response_model=list[TeacherAssignmentResponse],
)
def get_teacher_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can view teacher assignments",
        )

    # --------------------------------------------------------
    # GET ASSIGNMENTS
    # --------------------------------------------------------

    assignments = (
        db.query(TeacherAssignment)
        .join(
            Class,
            Class.id == TeacherAssignment.class_id,
        )
        .join(
            User,
            User.id == TeacherAssignment.teacher_id,
        )
        .filter(
            Class.school_id == current_user.school_id,
            User.school_id == current_user.school_id,
            TeacherAssignment.is_active == True,
        )
        .order_by(
            Class.name,
            Class.section,
            User.email,
        )
        .all()
    )

    return [
        assignment_to_response(
            assignment,
            db,
        )
        for assignment in assignments
    ]


# ============================================================
# 2. ASSIGN CLASS TEACHER
# ============================================================

@router.post(
    "/class-teacher",
    response_model=list[TeacherAssignmentResponse],
)
def assign_class_teacher(
    data: ClassTeacherBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can assign class teachers",
        )

    # --------------------------------------------------------
    # FIND TEACHER
    # --------------------------------------------------------

    teacher = (
        db.query(User)
        .filter(
            User.email == data.teacher_email,
            User.school_id == current_user.school_id,
            User.role == "TEACHER",
            User.is_active == True,
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found in your school",
        )

    created_assignments = []

    # --------------------------------------------------------
    # PROCESS CLASSES
    # --------------------------------------------------------

    for item in data.assignments:

        class_name = item.class_name.strip()
        section = item.section.strip().upper()

        # ----------------------------------------------------
        # FIND CLASS
        # ----------------------------------------------------

        school_class = (
            db.query(Class)
            .filter(
                Class.school_id == current_user.school_id,
                func.lower(Class.name)
                == class_name.lower(),
                func.upper(Class.section)
                == section,
            )
            .first()
        )

        if not school_class:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Class '{class_name}' "
                    f"with section '{section}' not found"
                ),
            )

        # ----------------------------------------------------
        # CHECK EXISTING CLASS TEACHER
        # ----------------------------------------------------

        existing_class_teacher = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.class_id
                == school_class.id,

                TeacherAssignment.is_class_teacher
                == True,

                TeacherAssignment.is_active
                == True,
            )
            .first()
        )

        if existing_class_teacher:

            if (
                existing_class_teacher.teacher_id
                == teacher.id
            ):
                continue

            raise HTTPException(
                status_code=400,
                detail=(
                    f"{school_class.name} - Section "
                    f"{school_class.section} "
                    f"already has a class teacher"
                ),
            )

        # ----------------------------------------------------
        # CREATE
        # ----------------------------------------------------

        assignment = TeacherAssignment(
            teacher_id=teacher.id,
            class_id=school_class.id,
            subject_id=None,
            is_class_teacher=True,
            is_active=True,
        )

        db.add(assignment)
        db.flush()

        created_assignments.append(
            assignment
        )

    db.commit()

    # --------------------------------------------------------
    # REFRESH
    # --------------------------------------------------------

    for assignment in created_assignments:
        db.refresh(assignment)

    return [
        assignment_to_response(
            assignment,
            db,
        )
        for assignment in created_assignments
    ]


# ============================================================
# 3. ASSIGN SUBJECT TEACHER
# ============================================================

@router.post(
    "/subject-teacher",
    response_model=list[TeacherAssignmentResponse],
)
def assign_subject_teacher(
    data: SubjectTeacherBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only admin can assign subject teachers",
        )

    # --------------------------------------------------------
    # FIND TEACHER
    # --------------------------------------------------------

    teacher = (
        db.query(User)
        .filter(
            User.email == data.teacher_email,
            User.school_id == current_user.school_id,
            User.role == "TEACHER",
            User.is_active == True,
        )
        .first()
    )

    if not teacher:
        raise HTTPException(
            status_code=404,
            detail="Teacher not found in your school",
        )

    created_assignments = []

    # --------------------------------------------------------
    # PROCESS ASSIGNMENTS
    # --------------------------------------------------------

    for item in data.assignments:

        class_name = item.class_name.strip()
        section = item.section.strip().upper()
        subject_name = item.subject_name.strip()

        # ----------------------------------------------------
        # FIND CLASS
        # ----------------------------------------------------

        school_class = (
            db.query(Class)
            .filter(
                Class.school_id == current_user.school_id,

                func.lower(Class.name)
                == class_name.lower(),

                func.upper(Class.section)
                == section,
            )
            .first()
        )

        if not school_class:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Class '{class_name}' "
                    f"with section '{section}' not found"
                ),
            )

        # ----------------------------------------------------
        # FIND SUBJECT
        # ----------------------------------------------------

        subject = (
            db.query(Subject)
            .filter(
                Subject.school_id
                == current_user.school_id,

                func.lower(Subject.name)
                == subject_name.lower(),

                Subject.is_active
                == True,
            )
            .first()
        )

        if not subject:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Subject '{subject_name}' "
                    f"not found in your school"
                ),
            )

        # ----------------------------------------------------
        # CHECK SUBJECT BELONGS TO CLASS
        # ----------------------------------------------------

        class_subject = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id
                == school_class.id,

                ClassSubject.subject_id
                == subject.id,

                ClassSubject.is_active
                == True,
            )
            .first()
        )

        if not class_subject:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Subject '{subject.name}' "
                    f"is not assigned to "
                    f"{school_class.name} - Section "
                    f"{school_class.section}"
                ),
            )

        # ----------------------------------------------------
        # CHECK DUPLICATE
        # ----------------------------------------------------

        existing_assignment = (
            db.query(TeacherAssignment)
            .filter(
                TeacherAssignment.teacher_id
                == teacher.id,

                TeacherAssignment.class_id
                == school_class.id,

                TeacherAssignment.subject_id
                == subject.id,

                TeacherAssignment.is_active
                == True,
            )
            .first()
        )

        if existing_assignment:
            continue

        # ----------------------------------------------------
        # CREATE
        # ----------------------------------------------------

        assignment = TeacherAssignment(
            teacher_id=teacher.id,
            class_id=school_class.id,
            subject_id=subject.id,
            is_class_teacher=False,
            is_active=True,
        )

        db.add(assignment)
        db.flush()

        created_assignments.append(
            assignment
        )

    db.commit()

    # --------------------------------------------------------
    # REFRESH
    # --------------------------------------------------------

    for assignment in created_assignments:
        db.refresh(assignment)

    return [
        assignment_to_response(
            assignment,
            db,
        )
        for assignment in created_assignments
    ]