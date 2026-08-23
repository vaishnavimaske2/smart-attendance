from pydantic import BaseModel


class ClassCreate(BaseModel):
    name: str
    section: str
    academic_year: str


class ClassResponse(BaseModel):
    id: int
    school_id: int
    name: str
    section: str
    academic_year: str

    class Config:
        from_attributes = True
