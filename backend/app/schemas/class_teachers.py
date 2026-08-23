from pydantic import BaseModel


class ClassTeacherResponse(BaseModel):
    class_id: int
    class_name: str
    section: str
    academic_year: str

    teacher_id: int | None = None
    teacher_name: str | None = None
    teacher_email: str | None = None