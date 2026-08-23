import cv2
import numpy as np

from insightface.model_zoo import get_model


print("Loading SCRFD directly...")

model_path = r"C:\Users\win10\.insightface\models\buffalo_l\det_10g.onnx"

model = get_model(
    model_path,
    providers=["CPUExecutionProvider"]
)

model.prepare(
    ctx_id=-1,
    input_size=(640, 640),
    det_thresh=0.1
)

print("SCRFD loaded successfully!")


# Load image
img = cv2.imread("test_face.jpg")

if img is None:
    print("ERROR: Could not load image")
    exit()

print("Image shape:", img.shape)


# Direct SCRFD detection
bboxes, kpss = model.detect(
    img,
    max_num=0,
    metric="default"
)

print("Bounding boxes:")
print(bboxes)

print("Key points:")
print(kpss)


if bboxes is None or len(bboxes) == 0:
    print("❌ SCRFD detected ZERO faces")
else:
    print("✅ SCRFD detected face(s):", len(bboxes))

    for i, box in enumerate(bboxes):
        print("Face", i + 1)
        print("Bounding box:", box[:4])
        print("Confidence:", box[4])