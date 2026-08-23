from pydantic import BaseModel, EmailStr


class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class TeacherResponse(BaseModel):
    id: int
    school_id: int
    name: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True