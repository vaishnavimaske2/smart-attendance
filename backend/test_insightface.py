import cv2
import insightface
from insightface.app import FaceAnalysis


print("========================================")
print("INSIGHTFACE DIAGNOSTIC TEST")
print("========================================")

print("InsightFace version:", insightface.__version__)

# -------------------------------------------------
# LOAD ONLY DETECTION MODEL
# -------------------------------------------------

print("\nLoading detection model...")

app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection"],
    providers=["CPUExecutionProvider"]
)

# Use the standard 640x640 detector size
app.prepare(
    ctx_id=-1,
    det_size=(640, 640),
    det_thresh=0.10
)

print("Detection model loaded successfully!")


# -------------------------------------------------
# LOAD IMAGE
# -------------------------------------------------

image_path = "pranit_face.jpg"

print("\nLoading image:")
print(image_path)

image = cv2.imread(image_path)

if image is None:
    print("ERROR: Could not load image")
    exit()

print("Image shape:", image.shape)
print("Image dtype:", image.dtype)


# -------------------------------------------------
# DETECT
# -------------------------------------------------

print("\nRunning face detection...")

faces = app.get(image)

print("\n========================================")
print("RESULT")
print("========================================")

print("Number of faces detected:", len(faces))


# -------------------------------------------------
# FACE INFORMATION
# -------------------------------------------------

for i, face in enumerate(faces):

    print("\nFace:", i + 1)

    print("Bounding box:", face.bbox)

    print("Detection confidence:", face.det_score)


# -------------------------------------------------
# SAVE DETECTION IMAGE
# -------------------------------------------------

if len(faces) > 0:

    output = image.copy()

    for face in faces:

        box = face.bbox.astype(int)

        x1, y1, x2, y2 = box

        cv2.rectangle(
            output,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            3
        )

    cv2.imwrite(
        "face_detection_result.jpg",
        output
    )

    print("\nDetection image saved as:")
    print("face_detection_result.jpg")

else:

    print("\nNO FACE DETECTED")


print("\n========================================")
print("TEST COMPLETE")
print("========================================")