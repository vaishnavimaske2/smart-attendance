from pydantic import BaseModel
from typing import List, Optional
from datetime import date


# ============================================================
# SUBJECT
# ============================================================

class StudentProfileSubject(BaseModel):

    subject_id: int
    subject_name: str


# ============================================================
# STUDENT PROFILE RESPONSE
# ============================================================

class StudentProfileResponse(BaseModel):

    id: int

    name: str

    roll_number: str

    class_id: int

    class_name: str

    section: str

    academic_year: str

    date_of_birth: Optional[date] = None

    gender: Optional[str] = None

    subjects: List[StudentProfileSubject]

    class Config:
        from_attributes = True