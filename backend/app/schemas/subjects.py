from pydantic import BaseModel
from typing import List


# ============================================================
# SUBJECT OPTION
# ============================================================

class SubjectOption(BaseModel):
    id: int
    name: str
    code: str


# ============================================================
# BULK CLASS SUBJECT ASSIGNMENT
# ============================================================

class BulkSubjectCreate(BaseModel):

    class_name: str

    section: str

    academic_year: str

    subject_ids: List[int]


# ============================================================
# SUBJECT RESPONSE
# ============================================================

class SubjectResponse(BaseModel):

    id: int
    school_id: int
    name: str
    code: str
    is_active: bool

    class Config:
        from_attributes = True