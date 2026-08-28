from pydantic import BaseModel, EmailStr, Field


class SchoolRegister(BaseModel):

    school_name: str = Field(
        min_length=2,
        max_length=150
    )

    school_code: str = Field(
        min_length=2,
        max_length=50
    )

    location: str | None = Field(
        default=None,
        max_length=200
    )

    admin_name: str = Field(
        min_length=2,
        max_length=150
    )

    admin_email: EmailStr

    admin_password: str = Field(
        min_length=6,
        max_length=100
    )

    confirm_password: str = Field(
        min_length=6,
        max_length=100
    )