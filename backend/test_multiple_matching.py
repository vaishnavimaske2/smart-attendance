from app.services.face_service import (
    get_multiple_face_embeddings,
    find_multiple_matching_students
)

from app.database.database import get_db
from app.database.models import Student


# ============================================================
# IMAGE
# ============================================================

IMAGE_PATH = "test_class_7.jpg"


# ============================================================
# READ IMAGE
# ============================================================

with open(IMAGE_PATH, "rb") as file:
    image_bytes = file.read()


# ============================================================
# DATABASE SESSION
# ============================================================

db = next(get_db())


try:

    # --------------------------------------------------------
    # Get active students
    # --------------------------------------------------------

    students = (
        db.query(Student)
        .filter(Student.is_active == True)
        .all()
    )

    print("\n======================================")
    print("REGISTERED STUDENTS")
    print("======================================")

    for student in students:
        print(
            student.id,
            "-",
            student.name
        )


    # --------------------------------------------------------
    # Detect multiple faces
    # --------------------------------------------------------

    face_results = get_multiple_face_embeddings(
        image_bytes
    )

    print("\n======================================")
    print("MULTIPLE FACE MATCHING TEST")
    print("======================================")

    print(
        "Faces detected:",
        len(face_results)
    )


    # --------------------------------------------------------
    # Match every face
    # --------------------------------------------------------

    matches = find_multiple_matching_students(
        face_results,
        students
    )


    # --------------------------------------------------------
    # Display results
    # --------------------------------------------------------

    for result in matches:

        print("\n--------------------------------------")

        print(
            "Face index:",
            result["face_index"]
        )

        print(
            "Detection confidence:",
            result["confidence"]
        )

        print(
            "Similarity:",
            result["similarity"]
        )


        student = result["student"]


        if student is not None:

            print(
                "MATCHED STUDENT:",
                student.id,
                "-",
                student.name
            )

        else:

            print(
                "NO MATCH - Unknown face"
            )


finally:

    db.close()