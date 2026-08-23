from pydantic import BaseModel
from typing import List


class TeacherSubjectProfile(BaseModel):
    subject_id: int
    subject_name: str
    is_class_teacher: bool


class TeacherClassProfile(BaseModel):
    class_id: int
    class_name: str
    section: str
    academic_year: str
    is_class_teacher: bool
    subjects: List[TeacherSubjectProfile]


class TeacherProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    classes: List[TeacherClassProfile]