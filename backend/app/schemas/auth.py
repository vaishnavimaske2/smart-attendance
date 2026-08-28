from pydantic import BaseModel, EmailStr, Field
from datetime import date

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    role: str
    school_id: int

class StudentLoginRequest(BaseModel):
    school_code: str
    name: str
    roll_number: str
    class_name: str
    section: str
    date_of_birth: date | None = None