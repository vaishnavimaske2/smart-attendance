from pydantic import BaseModel
from typing import List, Optional


# ============================================================
# CLASS TEACHER
# ============================================================

class ClassTeacherItem(BaseModel):
    class_name: str
    section: str


class ClassTeacherBulkCreate(BaseModel):
    teacher_email: str
    assignments: List[ClassTeacherItem]


# ============================================================
# SUBJECT TEACHER
# ============================================================

class SubjectTeacherItem(BaseModel):
    class_name: str
    section: str
    subject_name: str


class SubjectTeacherBulkCreate(BaseModel):
    teacher_email: str
    assignments: List[SubjectTeacherItem]


# ============================================================
# ASSIGNMENT RESPONSE
# ============================================================

class TeacherAssignmentResponse(BaseModel):

    id: int

    teacher_id: int
    teacher_name: str
    teacher_email: str

    class_id: int
    class_name: str
    section: str

    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None

    is_class_teacher: bool
    is_active: bool

    class Config:
        from_attributes = True