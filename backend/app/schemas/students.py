from datetime import date
from pydantic import BaseModel


# ============================================================
# CREATE STUDENT
# ============================================================

class StudentCreate(BaseModel):
    name: str
    roll_number: str
    date_of_birth: date | None = None
    gender: str | None = None

    # Example: TY BCA, SY BCA
    class_name: str

    # Example: A, B
    section: str


# ============================================================
# STUDENT RESPONSE
# ============================================================

class StudentResponse(BaseModel):
    id: int
    school_id: int
    class_id: int
    class_name: str
    section: str
    name: str
    roll_number: str
    date_of_birth: date | None
    gender: str | None
    is_active: bool

    class Config:
        from_attributes = True


# ============================================================
# UPDATE STUDENT
# ============================================================

class StudentUpdate(BaseModel):
    class_name: str
    section: str
    roll_number: str

    name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None


# ============================================================
# DEACTIVATE STUDENT
# ============================================================

class StudentDeactivate(BaseModel):
    class_name: str
    section: str
    roll_number: str