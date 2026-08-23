from app.services.face_service import get_multiple_face_embeddings


IMAGE_PATH = "test_class.jpg"


with open(IMAGE_PATH, "rb") as file:

    image_bytes = file.read()


try:

    faces = get_multiple_face_embeddings(
        image_bytes
    )

    print("\n================================")
    print("MULTIPLE FACE TEST")
    print("================================")

    print(
        "Total faces detected:",
        len(faces)
    )

    for face in faces:

        print("\nFace index:",
              face["face_index"])

        print(
            "Confidence:",
            face["confidence"]
        )

        print(
            "Bounding box:",
            face["bbox"]
        )

        print(
            "Embedding length:",
            len(face["embedding"])
        )

except Exception as e:

    print("\nERROR:")
    print(e)