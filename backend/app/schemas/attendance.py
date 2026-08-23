from datetime import date
from typing import Literal, List

from pydantic import BaseModel


# ============================================================
# MANUAL ATTENDANCE
# ============================================================

class AttendanceCreate(BaseModel):
    student_id: int
    class_id: int
    subject_id: int | None = None
    attendance_date: date
    status: Literal[
        "PRESENT",
        "ABSENT",
        "LATE",
        "EXCUSED"
    ]


# ============================================================
# ATTENDANCE RESPONSE
# ============================================================

class AttendanceResponse(BaseModel):
    id: int
    school_id: int
    class_id: int
    subject_id: int | None
    student_id: int
    marked_by: int
    attendance_date: date
    status: str

    class Config:
        from_attributes = True


# ============================================================
# ATTENDANCE SUMMARY
# ============================================================

class AttendanceSummary(BaseModel):
    student_id: int
    student_name: str
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    attendance_percentage: float


# ============================================================
# RECOGNIZED STUDENT
# ============================================================

class RecognizedStudent(BaseModel):
    student_id: int
    name: str
    roll_number: str
    similarity: float
    status: str


# ============================================================
# RECOGNITION RESPONSE
# ============================================================

class FaceAttendanceResponse(BaseModel):
    message: str
    class_name: str
    section: str
    subject_name: str
    attendance_date: date
    faces_detected: int
    students_recognized: int
    students_already_marked: int
    students: List[RecognizedStudent]