from pydantic import BaseModel


class ClassSubjectCreate(BaseModel):
    class_name: str
    section: str
    subject_name: str


class ClassSubjectResponse(BaseModel):
    id: int
    class_id: int
    subject_id: int
    is_active: bool

    class Config:
        from_attributes = True