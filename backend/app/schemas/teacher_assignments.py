from pydantic import BaseModel
from typing import List


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
# RESPONSE
# ============================================================

class TeacherAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    class_id: int
    subject_id: int | None
    is_class_teacher: bool
    is_active: bool

    class Config:
        from_attributes = True