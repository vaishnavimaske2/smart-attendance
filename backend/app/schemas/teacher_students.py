from datetime import date
from typing import List

from pydantic import BaseModel


# ============================================================
# SUBJECT OPTION
# ============================================================

class TeacherSubjectOption(BaseModel):

    id: int

    name: str


# ============================================================
# CLASS OPTION
# ============================================================

class TeacherClassOption(BaseModel):

    class_id: int

    class_name: str

    section: str

    academic_year: str

    is_class_teacher: bool

    subjects: List[
        TeacherSubjectOption
    ]


# ============================================================
# TEACHER OPTIONS RESPONSE
# ============================================================

class TeacherOptionsResponse(BaseModel):

    classes: List[
        TeacherClassOption
    ]


# ============================================================
# STUDENT
# ============================================================

class TeacherStudentItem(BaseModel):

    id: int

    name: str

    roll_number: str

    date_of_birth: date | None

    gender: str | None


# ============================================================
# SELECTED SUBJECT
# ============================================================

class SelectedSubject(BaseModel):

    id: int

    name: str


# ============================================================
# STUDENT LIST RESPONSE
# ============================================================

class TeacherStudentsResponse(BaseModel):

    class_name: str

    section: str

    academic_year: str

    subject: SelectedSubject

    students: List[
        TeacherStudentItem
    ]