from pydantic import BaseModel, EmailStr


class SchoolRegister(BaseModel):
    school_name: str
    school_code: str
    location: str | None = None

    admin_name: str
    admin_email: EmailStr
    admin_password: str