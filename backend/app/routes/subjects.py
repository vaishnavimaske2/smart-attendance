from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database.database import get_db

from app.database.models import (
    User,
    Subject,
    Class,
    ClassSubject
)

from app.schemas.subjects import (
    BulkSubjectCreate,
    SubjectResponse
)

from app.core.security import get_current_user


router = APIRouter(
    prefix="/api/subjects",
    tags=["Subjects"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class SubjectRequest(BaseModel):
    name: str
    code: str


# ============================================================
# ADMIN CHECK
# ============================================================

def require_admin(current_user: User):

    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required."
        )


# ============================================================
# GET ALL SUBJECTS — ADMIN
# ============================================================

@router.get("/admin")
def get_admin_subjects(

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    subjects = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id
        )
        .order_by(
            Subject.name,
            Subject.code
        )
        .all()
    )

    result = []

    for subject in subjects:

        class_count = (
            db.query(ClassSubject)
            .join(
                Class,
                Class.id ==
                ClassSubject.class_id
            )
            .filter(
                ClassSubject.subject_id ==
                subject.id,

                Class.school_id ==
                current_user.school_id,

                ClassSubject.is_active ==
                True
            )
            .count()
        )

        result.append({

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "is_active":
                subject.is_active,

            "school_id":
                subject.school_id,

            "class_count":
                class_count

        })

    return result


# ============================================================
# CREATE SUBJECT — ADMIN
# ============================================================

@router.post("/admin")
def create_subject(

    subject_data: SubjectRequest,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    name = subject_data.name.strip()

    code = (
        subject_data.code
        .strip()
        .upper()
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Subject name is required."
        )

    if not code:

        raise HTTPException(
            status_code=400,
            detail="Subject code is required."
        )

    # --------------------------------------------------------
    # CHECK DUPLICATE NAME
    # --------------------------------------------------------

    existing_name = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id,

            func.lower(
                Subject.name
            ) ==
            name.lower()
        )
        .first()
    )

    if existing_name:

        raise HTTPException(
            status_code=400,
            detail=
                "A subject with this name already exists."
        )

    # --------------------------------------------------------
    # CHECK DUPLICATE CODE
    # --------------------------------------------------------

    existing_code = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id,

            func.lower(
                Subject.code
            ) ==
            code.lower()
        )
        .first()
    )

    if existing_code:

        raise HTTPException(
            status_code=400,
            detail=
                "A subject with this code already exists."
        )

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    subject = Subject(

        school_id =
            current_user.school_id,

        name =
            name,

        code =
            code,

        is_active =
            True
    )

    db.add(subject)

    db.commit()

    db.refresh(subject)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message":
            "Subject created successfully.",

        "subject": {

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "is_active":
                subject.is_active,

            "school_id":
                subject.school_id,

            "class_count":
                0
        }
    }


# ============================================================
# UPDATE SUBJECT — ADMIN
# ============================================================

@router.put("/admin/{subject_id}")
def update_subject(

    subject_id: int,

    subject_data: SubjectRequest,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    name = subject_data.name.strip()

    code = (
        subject_data.code
        .strip()
        .upper()
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Subject name is required."
        )

    if not code:

        raise HTTPException(
            status_code=400,
            detail="Subject code is required."
        )

    # --------------------------------------------------------
    # FIND SUBJECT
    # --------------------------------------------------------

    subject = (
        db.query(Subject)
        .filter(
            Subject.id ==
            subject_id,

            Subject.school_id ==
            current_user.school_id
        )
        .first()
    )

    if not subject:

        raise HTTPException(
            status_code=404,
            detail="Subject not found."
        )

    # --------------------------------------------------------
    # DUPLICATE NAME
    # --------------------------------------------------------

    duplicate_name = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id,

            Subject.id !=
            subject_id,

            func.lower(
                Subject.name
            ) ==
            name.lower()
        )
        .first()
    )

    if duplicate_name:

        raise HTTPException(
            status_code=400,
            detail=
                "A subject with this name already exists."
        )

    # --------------------------------------------------------
    # DUPLICATE CODE
    # --------------------------------------------------------

    duplicate_code = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id,

            Subject.id !=
            subject_id,

            func.lower(
                Subject.code
            ) ==
            code.lower()
        )
        .first()
    )

    if duplicate_code:

        raise HTTPException(
            status_code=400,
            detail=
                "A subject with this code already exists."
        )

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    subject.name = name

    subject.code = code

    db.commit()

    db.refresh(subject)

    # --------------------------------------------------------
    # CLASS COUNT
    # --------------------------------------------------------

    class_count = (
        db.query(ClassSubject)
        .join(
            Class,
            Class.id ==
            ClassSubject.class_id
        )
        .filter(
            ClassSubject.subject_id ==
            subject.id,

            Class.school_id ==
            current_user.school_id,

            ClassSubject.is_active ==
            True
        )
        .count()
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message":
            "Subject updated successfully.",

        "subject": {

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "is_active":
                subject.is_active,

            "school_id":
                subject.school_id,

            "class_count":
                class_count
        }
    }


# ============================================================
# TOGGLE SUBJECT STATUS — ADMIN
# ============================================================

@router.patch(
    "/admin/{subject_id}/status"
)
def toggle_subject_status(

    subject_id: int,

    is_active: bool,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    subject = (
        db.query(Subject)
        .filter(
            Subject.id ==
            subject_id,

            Subject.school_id ==
            current_user.school_id
        )
        .first()
    )

    if not subject:

        raise HTTPException(
            status_code=404,
            detail="Subject not found."
        )

    subject.is_active = is_active

    db.commit()

    db.refresh(subject)

    return {

        "message":
            (
                "Subject activated successfully."
                if is_active
                else
                "Subject deactivated successfully."
            ),

        "subject": {

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "is_active":
                subject.is_active,

            "school_id":
                subject.school_id
        }
    }


# ============================================================
# SUBJECT OPTIONS
# ============================================================

@router.get("/options")
def get_subject_options(

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    if current_user.role not in [
        "ADMIN",
        "TEACHER"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    subjects = (
        db.query(Subject)
        .filter(
            Subject.school_id ==
            current_user.school_id,

            Subject.is_active ==
            True
        )
        .order_by(
            Subject.name
        )
        .all()
    )

    return [

        {
            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code
        }

        for subject in subjects

    ]

# ============================================================
# SUBJECT OPTIONS FOR SPECIFIC CLASS
# ============================================================

@router.get("/class-options")
def get_class_subject_options(

    class_name: str,
    section: str,
    academic_year: str,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    require_admin(current_user)

    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    class_name = class_name.strip()

    section = (
        section
        .strip()
        .upper()
    )

    academic_year = (
        academic_year
        .strip()
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not class_name:

        raise HTTPException(
            status_code=400,
            detail="Class name is required."
        )

    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section is required."
        )

    if not academic_year:

        raise HTTPException(
            status_code=400,
            detail="Academic year is required."
        )

    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(

            Class.school_id ==
            current_user.school_id,

            func.lower(
                Class.name
            ) ==
            class_name.lower(),

            func.upper(
                Class.section
            ) ==
            section,

            Class.academic_year ==
            academic_year,

            Class.is_active ==
            True

        )
        .first()
    )

    if not school_class:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Class '{class_name}' "
                f"section '{section}' "
                f"for academic year "
                f"'{academic_year}' "
                "not found."
            )
        )

    # --------------------------------------------------------
    # FIND SUBJECTS ASSIGNED TO CLASS
    # --------------------------------------------------------

    subjects = (
        db.query(Subject)
        .join(
            ClassSubject,
            ClassSubject.subject_id ==
            Subject.id
        )
        .filter(

            ClassSubject.class_id ==
            school_class.id,

            ClassSubject.is_active ==
            True,

            Subject.school_id ==
            current_user.school_id,

            Subject.is_active ==
            True

        )
        .order_by(
            Subject.name,
            Subject.code
        )
        .all()
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return [

        {
            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "school_id":
                subject.school_id,

            "is_active":
                subject.is_active

        }

        for subject in subjects

    ]
    
# ============================================================
# BULK ASSIGN SUBJECTS TO CLASS
# ============================================================

@router.post("/bulk")
def create_subjects_bulk(

    data: BulkSubjectCreate,

    db: Session =
        Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    # --------------------------------------------------------
    # ONLY ADMIN
    # --------------------------------------------------------

    require_admin(current_user)

    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    class_name = (
        data.class_name
        .strip()
    )

    section = (
        data.section
        .strip()
        .upper()
    )

    academic_year = (
        data.academic_year
        .strip()
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not class_name:

        raise HTTPException(
            status_code=400,
            detail="Class name is required."
        )

    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section is required."
        )

    if not academic_year:

        raise HTTPException(
            status_code=400,
            detail="Academic year is required."
        )

    if not data.subject_ids:

        raise HTTPException(
            status_code=400,
            detail=
                "Please select at least one subject."
        )

    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id ==
            current_user.school_id,

            func.lower(
                Class.name
            ) ==
            class_name.lower(),

            func.upper(
                Class.section
            ) ==
            section,

            Class.academic_year ==
            academic_year
        )
        .first()
    )

    if not school_class:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Class '{class_name}' "
                f"section '{section}' "
                f"for academic year "
                f"'{academic_year}' "
                "not found in your school."
            )
        )

    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    subject_ids = list(
        set(data.subject_ids)
    )

    # --------------------------------------------------------
    # FIND SUBJECTS
    # --------------------------------------------------------

    subjects = (
        db.query(Subject)
        .filter(
            Subject.id.in_(
                subject_ids
            ),

            Subject.school_id ==
            current_user.school_id,

            Subject.is_active ==
            True
        )
        .all()
    )

    found_subject_ids = {
        subject.id
        for subject in subjects
    }

    missing_subject_ids = [

        subject_id

        for subject_id in subject_ids

        if subject_id
        not in found_subject_ids

    ]

    if missing_subject_ids:

        raise HTTPException(
            status_code=404,
            detail=(
                "Subject(s) not found: "
                f"{missing_subject_ids}"
            )
        )

    # --------------------------------------------------------
    # PROCESS
    # --------------------------------------------------------

    added_subjects = []

    skipped_subjects = []

    for subject in subjects:

        existing_assignment = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id ==
                school_class.id,

                ClassSubject.subject_id ==
                subject.id
            )
            .first()
        )

        if existing_assignment:

            # ----------------------------------------------
            # REACTIVATE IF INACTIVE
            # ----------------------------------------------

            if not existing_assignment.is_active:

                existing_assignment.is_active = True

                added_subjects.append({

                    "id":
                        subject.id,

                    "name":
                        subject.name,

                    "code":
                        subject.code
                })

            else:

                skipped_subjects.append({

                    "id":
                        subject.id,

                    "name":
                        subject.name,

                    "code":
                        subject.code,

                    "reason":
                        "Already assigned to this class"
                })

            continue

        # ----------------------------------------------
        # CREATE ASSIGNMENT
        # ----------------------------------------------

        class_subject = ClassSubject(

            class_id =
                school_class.id,

            subject_id =
                subject.id,

            is_active =
                True
        )

        db.add(class_subject)

        added_subjects.append({

            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code
        })

    db.commit()

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "message":
            "Subjects assigned successfully.",

        "class":
            school_class.name,

        "section":
            school_class.section,

        "academic_year":
            school_class.academic_year,

        "added_subjects":
            added_subjects,

        "skipped_subjects":
            skipped_subjects
    }
    
# ============================================================
# CLASS-WISE SUBJECT OPTIONS
# ============================================================

@router.get("/class-options")
def get_class_subject_options(

    class_name: str,
    section: str,
    academic_year: str,

    db: Session = Depends(get_db),

    current_user: User =
        Depends(get_current_user)
):

    if current_user.role not in [
        "ADMIN",
        "TEACHER"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    class_name = class_name.strip()

    section = section.strip().upper()

    academic_year = academic_year.strip()

    if not class_name:

        raise HTTPException(
            status_code=400,
            detail="Class name is required."
        )

    if not section:

        raise HTTPException(
            status_code=400,
            detail="Section is required."
        )

    if not academic_year:

        raise HTTPException(
            status_code=400,
            detail="Academic year is required."
        )

    # --------------------------------------------------------
    # FIND CLASS
    # --------------------------------------------------------

    school_class = (
        db.query(Class)
        .filter(
            Class.school_id ==
            current_user.school_id,

            func.lower(
                Class.name
            ) ==
            class_name.lower(),

            func.upper(
                Class.section
            ) ==
            section,

            Class.academic_year ==
            academic_year,

            Class.is_active ==
            True
        )
        .first()
    )

    if not school_class:

        raise HTTPException(
            status_code=404,
            detail="Class not found."
        )

    # --------------------------------------------------------
    # GET ASSIGNED SUBJECTS
    # --------------------------------------------------------

    assignments = (
        db.query(
            Subject
        )
        .join(
            ClassSubject,
            ClassSubject.subject_id ==
            Subject.id
        )
        .filter(
            ClassSubject.class_id ==
            school_class.id,

            ClassSubject.is_active ==
            True,

            Subject.school_id ==
            current_user.school_id,

            Subject.is_active ==
            True
        )
        .order_by(
            Subject.name
        )
        .all()
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return [

        {
            "id":
                subject.id,

            "name":
                subject.name,

            "code":
                subject.code,

            "is_active":
                subject.is_active

        }

        for subject in assignments

    ]