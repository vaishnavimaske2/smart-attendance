from pydantic import BaseModel
from typing import List


class StudentSubjectProfile(BaseModel):
    subject_id: int
    subject_name: str


class StudentProfileResponse(BaseModel):
    id: int
    name: str
    roll_number: str
    class_id: int
    class_name: str
    section: str
    academic_year: str
    subjects: List[StudentSubjectProfile]

    class Config:
        from_attributes = True