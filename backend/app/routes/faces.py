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

from app.services.face_service import (
    get_face_embedding
)


router = APIRouter(
    prefix="/api/faces",
    tags=["Face Recognition"]
)


# ============================================================
# REGISTER STUDENT FACE
# ============================================================
#
# A teacher/admin can upload 1 to 6 photos of THE SAME student.
#
# file1 = required
# file2-file6 = optional
#
# Every image must contain exactly one face.
#
# All successful face embeddings are stored together in:
#
#     Student.face_embedding
#
# ============================================================

@router.post(
    "/register/{roll_number}"
)
async def register_face(

    roll_number: str,

    file1: UploadFile = File(...),

    file2: UploadFile | None = File(None),

    file3: UploadFile | None = File(None),

    file4: UploadFile | None = File(None),

    file5: UploadFile | None = File(None),

    file6: UploadFile | None = File(None),

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user
    )
):

    # ========================================================
    # 1. ONLY ADMIN / TEACHER
    # ========================================================

    if current_user.role not in [
        "ADMIN",
        "TEACHER"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only admin or teacher "
                "can register faces"
            )
        )


    # ========================================================
    # 2. CLEAN ROLL NUMBER
    # ========================================================

    roll_number = roll_number.strip()


    if not roll_number:

        raise HTTPException(
            status_code=400,
            detail="Roll number is required"
        )


    # ========================================================
    # 3. FIND STUDENT
    # ========================================================

    student = (
        db.query(Student)
        .filter(

            Student.school_id
            == current_user.school_id,

            Student.roll_number
            == roll_number,

            Student.is_active
            == True

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


    # ========================================================
    # 4. COLLECT UPLOADED FILES
    # ========================================================

    files = [

        file1,
        file2,
        file3,
        file4,
        file5,
        file6

    ]


    # Remove optional empty files

    files = [
        file
        for file in files
        if file is not None
    ]


    # ========================================================
    # 5. CHECK NUMBER OF PHOTOS
    # ========================================================

    if len(files) < 1:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload at least "
                "one student photo"
            )
        )


    if len(files) > 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Maximum 6 photos are allowed"
            )
        )


    # ========================================================
    # 6. PROCESS EACH PHOTO
    # ========================================================

    registered_embeddings = []

    successful_photos = []

    failed_photos = []


    for index, file in enumerate(files):

        photo_number = index + 1


        # ----------------------------------------------------
        # CHECK FILE TYPE
        # ----------------------------------------------------

        if (
            not file.content_type
            or not file.content_type.startswith(
                "image/"
            )
        ):

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Please upload an image file"

            })

            continue


        # ----------------------------------------------------
        # READ IMAGE
        # ----------------------------------------------------

        try:

            image_data = await file.read()

        except Exception as e:

            print(
                "IMAGE READ ERROR:",
                repr(e)
            )

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Unable to read uploaded image"

            })

            continue


        if not image_data:

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Uploaded image is empty"

            })

            continue


        # ----------------------------------------------------
        # GENERATE FACE EMBEDDING
        # ----------------------------------------------------

        try:

            face_data = get_face_embedding(
                image_data
            )


            # ------------------------------------------------
            # SAVE EMBEDDING
            # ------------------------------------------------

            registered_embeddings.append(
                face_data["embedding"]
            )


            successful_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "confidence":
                    round(
                        float(
                            face_data[
                                "confidence"
                            ]
                        ),
                        4
                    ),

                "face_location": {

                    "x":
                        int(
                            face_data[
                                "bbox"
                            ][0]
                        ),

                    "y":
                        int(
                            face_data[
                                "bbox"
                            ][1]
                        ),

                    "width":
                        int(
                            face_data[
                                "bbox"
                            ][2]
                            -
                            face_data[
                                "bbox"
                            ][0]
                        ),

                    "height":
                        int(
                            face_data[
                                "bbox"
                            ][3]
                            -
                            face_data[
                                "bbox"
                            ][1]
                        )
                }

            })


        except ValueError as e:

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    str(e)

            })


        except Exception as e:

            print(
                "FACE REGISTRATION ERROR:",
                repr(e)
            )

            failed_photos.append({

                "photo_number":
                    photo_number,

                "filename":
                    file.filename,

                "error":
                    "Face processing failed"

            })


    # ========================================================
    # 7. MAKE SURE AT LEAST ONE PHOTO WORKED
    # ========================================================

    if not registered_embeddings:

        raise HTTPException(

            status_code=400,

            detail={
                "message": (
                    "No usable face was found "
                    "in the uploaded photos."
                ),

                "student_name":
                    student.name,

                "roll_number":
                    student.roll_number,

                "photos_processed":
                    len(files),

                "photos_registered":
                    0,

                "photos_failed":
                    len(failed_photos),

                "failed_photos":
                    failed_photos
            }

        )


    # ========================================================
    # 8. SAVE ALL FACE EMBEDDINGS
    # ========================================================
    #
    # IMPORTANT:
    #
    # We store a LIST of embeddings because all photos
    # belong to the same student.
    #
    # Example:
    #
    # [
    #     [embedding from photo 1],
    #     [embedding from photo 2],
    #     [embedding from photo 3]
    # ]
    #
    # ========================================================

    student.face_embedding = (
        registered_embeddings
    )


    # ========================================================
    # 9. SAVE DATABASE
    # ========================================================

    try:

        db.commit()

        db.refresh(student)

    except Exception as e:

        db.rollback()

        print(
            "DATABASE ERROR DURING FACE REGISTRATION:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Face registration could not "
                "be saved"
            )
        )


    # ========================================================
    # 10. RESPONSE
    # ========================================================

    return {

        "message":
            "Student face registration completed successfully",

        "student_id":
            student.id,

        "student_name":
            student.name,

        "roll_number":
            student.roll_number,

        "photos_uploaded":
            len(files),

        "photos_registered":
            len(successful_photos),

        "photos_failed":
            len(failed_photos),

        "registered_photos":
            successful_photos,

        "failed_photos":
            failed_photos

    }