import cv2
import numpy as np

from insightface.app import FaceAnalysis


# ============================================================
# CONFIGURATION
# ============================================================

# Recognition threshold
# Keep this at 0.65 for now.
# We can tune it later after testing more classroom images.
MATCH_THRESHOLD = 0.65

# Minimum face size that we consider useful for recognition.
# Very tiny faces usually do not contain enough information.
MIN_FACE_SIZE = 25

# Maximum image dimension used for processing.
MAX_PROCESSING_SIZE = 3000

# Upscaling factors for small classroom faces.
UPSCALE_FACTORS = [1.0, 1.5, 2.0]


# ============================================================
# LOAD INSIGHTFACE
# ============================================================

print("Loading InsightFace...")

face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

face_app.prepare(
    ctx_id=0,
    det_size=(640, 640),
    det_thresh=0.15
)

print("InsightFace loaded successfully!")


# ============================================================
# IMAGE DECODING
# ============================================================

def decode_image(image_bytes: bytes):

    """
    Convert uploaded image bytes into an OpenCV image.
    """

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise ValueError(
            "Could not decode the uploaded image"
        )

    return image


# ============================================================
# RESIZE IMAGE
# ============================================================

def resize_for_processing(
    image,
    scale
):
    """
    Resize image for multi-scale face detection.

    The image is enlarged for small-face detection.
    """

    height, width = image.shape[:2]

    new_width = int(width * scale)
    new_height = int(height * scale)

    # Prevent extremely large images
    if max(new_width, new_height) > MAX_PROCESSING_SIZE:

        ratio = (
            MAX_PROCESSING_SIZE /
            max(new_width, new_height)
        )

        new_width = int(new_width * ratio)
        new_height = int(new_height * ratio)

    if new_width == width and new_height == height:

        return image, 1.0

    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_CUBIC
    )

    actual_scale = new_width / width

    return resized, actual_scale


# ============================================================
# IOU - INTERSECTION OVER UNION
# ============================================================

def calculate_iou(
    box1,
    box2
):
    """
    Calculate Intersection over Union between
    two bounding boxes.

    Box format:
        [x1, y1, x2, y2]
    """

    x1 = max(
        box1[0],
        box2[0]
    )

    y1 = max(
        box1[1],
        box2[1]
    )

    x2 = min(
        box1[2],
        box2[2]
    )

    y2 = min(
        box1[3],
        box2[3]
    )

    intersection_width = max(
        0,
        x2 - x1
    )

    intersection_height = max(
        0,
        y2 - y1
    )

    intersection_area = (
        intersection_width *
        intersection_height
    )

    if intersection_area <= 0:
        return 0.0

    area1 = (
        max(0, box1[2] - box1[0]) *
        max(0, box1[3] - box1[1])
    )

    area2 = (
        max(0, box2[2] - box2[0]) *
        max(0, box2[3] - box2[1])
    )

    union_area = (
        area1 +
        area2 -
        intersection_area
    )

    if union_area <= 0:
        return 0.0

    return intersection_area / union_area


# ============================================================
# MULTI-SCALE FACE DETECTION
# ============================================================

def detect_faces_multiscale(image):
    """
    Detect faces using multiple image scales.

    This helps when faces are small in classroom photos.

    Returns:
        List of InsightFace face objects with bounding
        boxes converted back to original image coordinates.
    """

    all_faces = []

    original_height, original_width = image.shape[:2]

    for scale in UPSCALE_FACTORS:

        # ----------------------------------------------------
        # Resize image
        # ----------------------------------------------------

        processed_image, actual_scale = (
            resize_for_processing(
                image,
                scale
            )
        )

        # ----------------------------------------------------
        # Detect faces
        # ----------------------------------------------------

        try:

            detected_faces = face_app.get(
                processed_image
            )

        except Exception as e:

            print(
                f"Face detection failed at scale "
                f"{scale}: {e}"
            )

            continue

        # ----------------------------------------------------
        # Convert bounding boxes back to original scale
        # ----------------------------------------------------

        for face in detected_faces:

            bbox = face.bbox.copy()

            if actual_scale != 1.0:

                bbox = bbox / actual_scale

            # Keep bbox inside original image
            bbox[0] = max(
                0,
                min(
                    bbox[0],
                    original_width - 1
                )
            )

            bbox[1] = max(
                0,
                min(
                    bbox[1],
                    original_height - 1
                )
            )

            bbox[2] = max(
                0,
                min(
                    bbox[2],
                    original_width
                )
            )

            bbox[3] = max(
                0,
                min(
                    bbox[3],
                    original_height
                )
            )

            # Store original coordinates
            face._original_bbox = bbox

            # Store scale used
            face._detection_scale = actual_scale

            all_faces.append(face)

    return all_faces


# ============================================================
# REMOVE DUPLICATE FACE DETECTIONS
# ============================================================

def remove_duplicate_faces(
    faces,
    iou_threshold=0.45
):
    """
    Multi-scale detection can detect the same face
    several times.

    This function removes duplicate detections.

    The detection with the larger face area / better
    confidence is preferred.
    """

    if not faces:
        return []

    # --------------------------------------------------------
    # Sort by face area first
    # --------------------------------------------------------

    def face_score(face):

        bbox = face._original_bbox

        width = max(
            0,
            bbox[2] - bbox[0]
        )

        height = max(
            0,
            bbox[3] - bbox[1]
        )

        area = width * height

        confidence = float(
            face.det_score
        )

        return (
            area,
            confidence
        )

    faces = sorted(
        faces,
        key=face_score,
        reverse=True
    )

    selected_faces = []

    # --------------------------------------------------------
    # Compare each detection
    # --------------------------------------------------------

    for face in faces:

        current_bbox = (
            face._original_bbox
        )

        duplicate = False

        for selected in selected_faces:

            selected_bbox = (
                selected._original_bbox
            )

            iou = calculate_iou(
                current_bbox,
                selected_bbox
            )

            if iou >= iou_threshold:

                duplicate = True

                break

        if not duplicate:

            selected_faces.append(
                face
            )

    return selected_faces


# ============================================================
# GET SINGLE FACE EMBEDDING
# ============================================================

def get_face_embedding(
    image_bytes: bytes
):
    """
    Recognize one face from an image.

    Used by /recognize endpoint.

    The image must contain exactly one useful face.
    """

    image = decode_image(
        image_bytes
    )

    # --------------------------------------------------------
    # Multi-scale detection
    # --------------------------------------------------------

    faces = detect_faces_multiscale(
        image
    )

    faces = remove_duplicate_faces(
        faces
    )

    # --------------------------------------------------------
    # No face
    # --------------------------------------------------------

    if len(faces) == 0:

        raise ValueError(
            "No face detected in the image"
        )

    # --------------------------------------------------------
    # Multiple faces
    # --------------------------------------------------------

    if len(faces) > 1:

        raise ValueError(
            "Multiple faces detected. Please upload "
            "an image containing only one face."
        )

    face = faces[0]

    # --------------------------------------------------------
    # Get embedding
    # --------------------------------------------------------

    embedding = face.normed_embedding

    # --------------------------------------------------------
    # Get original bounding box
    # --------------------------------------------------------

    bbox = face._original_bbox

    confidence = float(
        face.det_score
    )

    return {

        "embedding":
            embedding.tolist(),

        "bbox":
            bbox.tolist(),

        "confidence":
            confidence
    }


# ============================================================
# FIND BEST MATCHING STUDENT
# ============================================================

def find_matching_student(
    embedding,
    students,
    threshold=MATCH_THRESHOLD
):
    """
    Compare one detected face against all registered students.

    Each student can have either:

    1. One old embedding:
       [0.1, 0.2, 0.3, ...]

    OR

    2. Multiple embeddings:
       [
           [0.1, 0.2, 0.3, ...],
           [0.2, 0.3, 0.4, ...],
           [0.3, 0.4, 0.5, ...]
       ]

    The best similarity across all photos is used.
    """

    best_student = None

    best_similarity = -1.0

    # --------------------------------------------------------
    # NORMALIZE INPUT EMBEDDING
    # --------------------------------------------------------

    input_embedding = np.array(
        embedding,
        dtype=np.float32
    )

    input_norm = np.linalg.norm(
        input_embedding
    )

    if input_norm == 0:

        return None, 0.0

    input_embedding = (
        input_embedding /
        input_norm
    )

    # --------------------------------------------------------
    # CHECK EVERY STUDENT
    # --------------------------------------------------------

    for student in students:

        if student.face_embedding is None:
            continue

        try:

            stored_embeddings = (
                student.face_embedding
            )

            # =================================================
            # OLD FORMAT
            # =================================================
            #
            # One embedding:
            #
            # [0.1, 0.2, 0.3, ...]
            #
            # =================================================

            if (
                isinstance(
                    stored_embeddings,
                    list
                )
                and
                stored_embeddings
                and
                isinstance(
                    stored_embeddings[0],
                    (int, float)
                )
            ):

                stored_embeddings = [
                    stored_embeddings
                ]

            # =================================================
            # NEW FORMAT
            # =================================================
            #
            # Multiple embeddings:
            #
            # [
            #   [...],
            #   [...],
            #   [...]
            # ]
            #
            # =================================================

            for stored_embedding in stored_embeddings:

                student_embedding = np.array(
                    stored_embedding,
                    dtype=np.float32
                )

                student_norm = np.linalg.norm(
                    student_embedding
                )

                if student_norm == 0:
                    continue

                student_embedding = (
                    student_embedding /
                    student_norm
                )

                # ------------------------------------------------
                # COSINE SIMILARITY
                # ------------------------------------------------

                similarity = float(
                    np.dot(
                        input_embedding,
                        student_embedding
                    )
                )

                # ------------------------------------------------
                # KEEP BEST PHOTO MATCH
                # ------------------------------------------------

                if similarity > best_similarity:

                    best_similarity = similarity

                    best_student = student

        except Exception as e:

            print(
                "STUDENT EMBEDDING ERROR:",
                repr(e)
            )

            continue

    # --------------------------------------------------------
    # REJECT WEAK MATCH
    # --------------------------------------------------------

    if best_similarity < threshold:

        return None, best_similarity

    return (
        best_student,
        best_similarity
    )


# ============================================================
# GET MULTIPLE FACE EMBEDDINGS
# ============================================================

def get_multiple_face_embeddings(
    image_bytes: bytes
):
    """
    Detect all faces in a classroom image.

    Multi-scale detection is used to improve detection
    of smaller faces.

    Returns:

        [
            {
                face_index,
                embedding,
                bbox,
                confidence
            }
        ]
    """

    image = decode_image(
        image_bytes
    )

    # --------------------------------------------------------
    # Multi-scale detection
    # --------------------------------------------------------

    faces = detect_faces_multiscale(
        image
    )

    # --------------------------------------------------------
    # Remove duplicate detections
    # --------------------------------------------------------

    faces = remove_duplicate_faces(
        faces
    )

    # --------------------------------------------------------
    # No faces
    # --------------------------------------------------------

    if len(faces) == 0:

        raise ValueError(
            "No faces detected in the image"
        )

    results = []

    # --------------------------------------------------------
    # Process every face
    # --------------------------------------------------------

    for index, face in enumerate(faces):

        bbox = face._original_bbox

        width = (
            bbox[2] -
            bbox[0]
        )

        height = (
            bbox[3] -
            bbox[1]
        )

        # ----------------------------------------------------
        # Ignore extremely tiny detections
        # ----------------------------------------------------

        if (
            width < MIN_FACE_SIZE
            or
            height < MIN_FACE_SIZE
        ):

            print(
                f"Skipping extremely small face: "
                f"{width:.1f} x {height:.1f}"
            )

            continue

        # ----------------------------------------------------
        # Embedding
        # ----------------------------------------------------

        embedding = face.normed_embedding

        confidence = float(
            face.det_score
        )

        results.append({

            "face_index":
                len(results),

            "embedding":
                embedding.tolist(),

            "bbox":
                bbox.tolist(),

            "confidence":
                confidence
        })

    # --------------------------------------------------------
    # All detections were too small
    # --------------------------------------------------------

    if len(results) == 0:

        raise ValueError(
            "Faces were detected, but they are too small "
            "for reliable recognition."
        )

    return results


# ============================================================
# MATCH MULTIPLE FACES
# ============================================================

def find_multiple_matching_students(
    face_results,
    students,
    threshold=MATCH_THRESHOLD
):
    """
    Match every detected face against registered students.

    Prevents the same student from being matched to
    multiple faces.
    """

    results = []

    matched_student_ids = set()

    # --------------------------------------------------------
    # Process every face
    # --------------------------------------------------------

    for face_data in face_results:

        student, similarity = (
            find_matching_student(
                face_data["embedding"],
                students,
                threshold=threshold
            )
        )

        # ----------------------------------------------------
        # Prevent duplicate student matching
        # ----------------------------------------------------

        if (
            student is not None
            and
            student.id in matched_student_ids
        ):

            student = None

        # ----------------------------------------------------
        # Remember matched student
        # ----------------------------------------------------

        if student is not None:

            matched_student_ids.add(
                student.id
            )

        # ----------------------------------------------------
        # Store result
        # ----------------------------------------------------

        results.append({

            "face_index":
                face_data["face_index"],

            "confidence":
                face_data["confidence"],

            "bbox":
                face_data["bbox"],

            "student":
                student,

            "similarity":
                similarity
        })

    return results