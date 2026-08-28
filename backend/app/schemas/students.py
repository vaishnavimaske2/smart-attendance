from datetime import date

from pydantic import BaseModel


# ============================================================
# FACE PHOTO RESULT
# ============================================================

class FacePhotoResult(BaseModel):

    photo_number: int

    filename: str

    confidence: float


# ============================================================
# FAILED FACE PHOTO
# ============================================================

class FailedFacePhoto(BaseModel):

    photo_number: int

    filename: str

    error: str


# ============================================================
# FACE REGISTRATION RESULT
# ============================================================

class FaceRegistrationResult(BaseModel):

    photos_uploaded: int

    photos_registered: int

    photos_failed: int

    registered_photos: list[
        FacePhotoResult
    ]

    failed_photos: list[
        FailedFacePhoto
    ]


# ============================================================
# CREATE STUDENT
# ============================================================

class StudentCreate(BaseModel):

    name: str

    roll_number: str

    date_of_birth: date | None = None

    gender: str | None = None

    # Example:
    # TY BCA
    # SY BCA
    class_name: str

    # Example:
    # A
    # B
    section: str


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
# DEACTIVATE / ACTIVATE STUDENT
# ============================================================

class StudentDeactivate(BaseModel):

    class_name: str

    section: str

    roll_number: str


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

    face_registration: FaceRegistrationResult | None = None

    class Config:
        from_attributes = True