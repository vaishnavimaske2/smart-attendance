from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Student
from app.core.security import get_current_user

from app.services.face_service import get_face_embedding


router = APIRouter(
    prefix="/api/faces",
    tags=["Face Recognition"]
)


# ============================================================
# REGISTER STUDENT FACE
# ============================================================

@router.post("/register/{roll_number}")
async def register_face(
    roll_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------------
    # ONLY ADMIN / TEACHER
    # --------------------------------------------------------

    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin or teacher can register faces"
        )

    # --------------------------------------------------------
    # CLEAN ROLL NUMBER
    # --------------------------------------------------------

    roll_number = roll_number.strip()

    # --------------------------------------------------------
    # FIND STUDENT
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.school_id == current_user.school_id,
            Student.roll_number == roll_number,
            Student.is_active == True
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Active student with roll number "
                f"'{roll_number}' not found"
            )
        )

    # --------------------------------------------------------
    # CHECK IMAGE
    # --------------------------------------------------------

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    # --------------------------------------------------------
    # READ IMAGE
    # --------------------------------------------------------

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    # --------------------------------------------------------
    # GENERATE FACE EMBEDDING
    # --------------------------------------------------------

    try:

        face_data = get_face_embedding(
            image_data
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print(
            "FACE REGISTRATION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Face processing failed"
        )

    # --------------------------------------------------------
    # SAVE EMBEDDING
    # --------------------------------------------------------

    student.face_embedding = face_data["embedding"]

    db.commit()
    db.refresh(student)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "message": "Face registered successfully",
        "student_id": student.id,
        "student_name": student.name,
        "roll_number": student.roll_number,
        "faces_detected": 1,
        "confidence": face_data["confidence"],
        "face_location": {
            "x": int(face_data["bbox"][0]),
            "y": int(face_data["bbox"][1]),
            "width": int(
                face_data["bbox"][2]
                - face_data["bbox"][0]
            ),
            "height": int(
                face_data["bbox"][3]
                - face_data["bbox"][1]
            )
        }
    }