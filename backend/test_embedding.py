import cv2
from insightface.app import FaceAnalysis

print("Loading InsightFace...")

# Load InsightFace
app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(
    ctx_id=0,
    det_size=(640, 640),
    det_thresh=0.2
)

print("InsightFace loaded successfully!")

# Load image
image = cv2.imread("test_face.jpg")

if image is None:
    print("❌ Could not load test_face.jpg")
    exit()

print("Image shape:", image.shape)

# Detect faces
faces = app.get(image)

print("Number of faces:", len(faces))

if len(faces) == 0:
    print("❌ No face detected")
    exit()

print("✅ Face detected!")

# Take first face
face = faces[0]

# Get embedding
embedding = face.embedding

print("Embedding generated successfully!")
print("Embedding shape:", embedding.shape)
print("Embedding length:", len(embedding))

# Print first few values
print("First 10 embedding values:")
print(embedding[:10])

# Detection confidence
print("Detection confidence:", face.det_score)

print("✅ FACE EMBEDDING TEST PASSED!")