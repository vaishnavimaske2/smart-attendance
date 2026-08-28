import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  RotateCcw,
  X,
  ImagePlus,
} from "lucide-react";

import { apiRequest } from "../../services/api";


interface Subject {
  subject_id: number;
  subject_name: string;
}


interface TeacherClass {
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
  is_class_teacher: boolean;
  subjects: Subject[];
}


interface TeacherProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  classes: TeacherClass[];
}


interface RecognizedStudent {
  student_id: number;
  name: string;
  roll_number: string;
  similarity: number;
  status: string;
}


interface AttendanceResponse {
  message: string;
  class_name: string;
  section: string;
  subject_name: string;
  attendance_date: string;
  faces_detected: number;
  students_recognized: number;
  students_already_marked: number;
  students: RecognizedStudent[];
}


function TakeAttendance() {

  // ==========================================================
  // TEACHER PROFILE
  // ==========================================================

  const [profile, setProfile] =
    useState<TeacherProfile | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);


  // ==========================================================
  // CLASS / SUBJECT
  // ==========================================================

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [selectedSubjectId, setSelectedSubjectId] =
    useState("");


  // ==========================================================
  // PHOTOS
  // ==========================================================

  const [photos, setPhotos] =
    useState<File[]>([]);

  const [previews, setPreviews] =
    useState<string[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);


  // ==========================================================
  // ATTENDANCE RESULT
  // ==========================================================

  const [result, setResult] =
    useState<AttendanceResponse | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD TEACHER PROFILE
  // ==========================================================

  useEffect(() => {

    async function loadTeacherProfile() {

      try {

        const response =
          await apiRequest(
            "/api/teacher-profile/me"
          );

        setProfile(response);

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load teacher information."
        );

      } finally {

        setLoadingProfile(false);

      }

    }

    loadTeacherProfile();

  }, []);


  // ==========================================================
  // CLEANUP PREVIEW URLS
  // ==========================================================

  useEffect(() => {

    return () => {

      previews.forEach(
        (preview) =>
          URL.revokeObjectURL(preview)
      );

    };

  }, [previews]);


  // ==========================================================
  // SELECTED CLASS
  // ==========================================================

  const selectedClass =
    profile?.classes.find(
      (item) =>
        String(item.class_id)
        === selectedClassId
    );


  // ==========================================================
  // AVAILABLE SUBJECTS
  // ==========================================================

  const availableSubjects =
    selectedClass?.subjects || [];


  // ==========================================================
  // CLASS CHANGE
  // ==========================================================

  function handleClassChange(
    value: string
  ) {

    setSelectedClassId(value);

    setSelectedSubjectId("");

    setResult(null);

    setError("");

  }


  // ==========================================================
  // ADD PHOTOS
  // ==========================================================

  function handlePhotoSelection(
    files: FileList | null
  ) {

    if (!files) {
      return;
    }


    setError("");

    setResult(null);


    const selectedFiles =
      Array.from(files);


    // --------------------------------------------------------
    // VALIDATE FILE TYPES
    // --------------------------------------------------------

    const invalidFile =
      selectedFiles.find(
        (file) =>
          !file.type.startsWith("image/")
      );


    if (invalidFile) {

      setError(
        `"${invalidFile.name}" is not a valid image.`
      );

      return;

    }


    // --------------------------------------------------------
    // MAXIMUM 6 PHOTOS
    // --------------------------------------------------------

    const remainingSlots =
      6 - photos.length;


    if (remainingSlots <= 0) {

      setError(
        "You can upload a maximum of 6 photos."
      );

      return;

    }


    const filesToAdd =
      selectedFiles.slice(
        0,
        remainingSlots
      );


    if (
      selectedFiles.length
      > remainingSlots
    ) {

      setError(
        `Only ${remainingSlots} more photo${
          remainingSlots === 1
            ? ""
            : "s"
        } can be added. Maximum is 6.`
      );

    }


    // --------------------------------------------------------
    // CREATE PREVIEWS
    // --------------------------------------------------------

    const newPreviews =
      filesToAdd.map(
        (file) =>
          URL.createObjectURL(file)
      );


    setPhotos(
      (previous) => [
        ...previous,
        ...filesToAdd,
      ]
    );


    setPreviews(
      (previous) => [
        ...previous,
        ...newPreviews,
      ]
    );


    // --------------------------------------------------------
    // RESET INPUT
    // --------------------------------------------------------

    if (fileInputRef.current) {

      fileInputRef.current.value =
        "";

    }

  }


  // ==========================================================
  // REMOVE PHOTO
  // ==========================================================

  function removePhoto(
    index: number
  ) {

    URL.revokeObjectURL(
      previews[index]
    );


    setPhotos(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );


    setPreviews(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );


    setResult(null);

  }


  // ==========================================================
  // RESET ALL PHOTOS
  // ==========================================================

  function resetPhotos() {

    previews.forEach(
      (preview) =>
        URL.revokeObjectURL(preview)
    );


    setPhotos([]);

    setPreviews([]);

    setResult(null);

    setError("");


    if (fileInputRef.current) {

      fileInputRef.current.value =
        "";

    }

  }


  // ==========================================================
  // RECOGNIZE & MARK
  // ==========================================================

  async function handleRecognize() {

    if (!selectedClass) {

      setError(
        "Please select a class."
      );

      return;

    }


    if (!selectedSubjectId) {

      setError(
        "Please select a subject."
      );

      return;

    }


    if (photos.length === 0) {

      setError(
        "Please upload at least one classroom photo."
      );

      return;

    }


    const selectedSubject =
      availableSubjects.find(
        (subject) =>
          String(subject.subject_id)
          === selectedSubjectId
      );


    if (!selectedSubject) {

      setError(
        "Selected subject could not be found."
      );

      return;

    }


    try {

      setProcessing(true);

      setError("");

      setResult(null);


      // ------------------------------------------------------
      // FORM DATA
      // ------------------------------------------------------

      const formData =
        new FormData();


      photos.forEach(
        (photo) => {

          formData.append(
            "files",
            photo
          );

        }
      );


      // ------------------------------------------------------
      // QUERY PARAMETERS
      // ------------------------------------------------------

      const query =
        new URLSearchParams({

          class_name:
            selectedClass.class_name,

          section:
            selectedClass.section,

          subject_name:
            selectedSubject.subject_name,

        });


      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response =
        await apiRequest(
          `/api/attendance/recognize-multiple?${query.toString()}`,
          {
            method: "POST",
            body: formData,
          }
        );


      setResult(response);

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Face recognition failed."
      );

    } finally {

      setProcessing(false);

    }

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingProfile) {

    return (

      <div className="teacher-attendance-loading">

        Loading your assigned classes...

      </div>

    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="teacher-attendance-page">


      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="teacher-attendance-header">

        <div>

          <span>
            ATTENDANCE
          </span>

          <h1>
            Take Attendance
          </h1>

          <p>
            Select your class and subject, then upload
            classroom photos for face recognition.
          </p>

        </div>

      </div>


      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (

        <div className="teacher-attendance-error">

          <AlertCircle size={19} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ==================================================== */}
      {/* CLASS & SUBJECT */}
      {/* ==================================================== */}

      <section className="teacher-attendance-card">

        <div className="teacher-attendance-card-title">

          <GraduationCap size={21} />

          <div>

            <h2>
              Class & Subject
            </h2>

            <p>
              Choose from your assigned classes and subjects.
            </p>

          </div>

        </div>


        <div className="teacher-attendance-selection-grid">


          {/* CLASS */}

          <div className="teacher-attendance-field">

            <label>
              Class & Section
            </label>

            <select
              value={selectedClassId}
              onChange={(event) =>
                handleClassChange(
                  event.target.value
                )
              }
            >

              <option value="">
                Select class
              </option>


              {profile?.classes.map(
                (schoolClass) => (

                  <option
                    key={schoolClass.class_id}
                    value={schoolClass.class_id}
                  >

                    {schoolClass.class_name}
                    {" — Section "}
                    {schoolClass.section}

                  </option>

                )
              )}

            </select>

          </div>


          {/* SUBJECT */}

          <div className="teacher-attendance-field">

            <label>
              Subject
            </label>

            <select
              value={selectedSubjectId}
              onChange={(event) =>
                setSelectedSubjectId(
                  event.target.value
                )
              }
              disabled={
                !selectedClass
              }
            >

              <option value="">
                Select subject
              </option>


              {availableSubjects.map(
                (subject) => (

                  <option
                    key={subject.subject_id}
                    value={subject.subject_id}
                  >

                    {subject.subject_name}

                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </section>


      {/* ==================================================== */}
      {/* CLASSROOM PHOTOS */}
      {/* ==================================================== */}

      <section className="teacher-attendance-card">

        <div className="teacher-attendance-card-title">

          <Camera size={21} />

          <div>

            <h2>
              Classroom Photos
            </h2>

            <p>
              Upload up to 6 photos from different
              angles for better recognition of small faces.
            </p>

          </div>

        </div>


        {/* PHOTO GRID */}

        <div className="teacher-photo-grid">

          {previews.map(
            (preview, index) => (

              <div
                className="teacher-photo-item"
                key={`${preview}-${index}`}
              >

                <img
                  src={preview}
                  alt={
                    `Classroom photo ${index + 1}`
                  }
                />


                <div className="teacher-photo-number">

                  Photo {index + 1}

                </div>


                <button
                  type="button"
                  className="teacher-remove-photo"
                  onClick={() =>
                    removePhoto(index)
                  }
                  aria-label={
                    `Remove photo ${index + 1}`
                  }
                >

                  <X size={16} />

                </button>

              </div>

            )
          )}


          {/* ADD PHOTO */}

          {photos.length < 6 && (

            <button
              type="button"
              className="teacher-add-photo"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >

              <ImagePlus size={27} />

              <strong>
                Add Photo
              </strong>

              <span>
                {photos.length}
                {" / 6 selected"}
              </span>

            </button>

          )}

        </div>


        {/* FILE INPUT */}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) =>
            handlePhotoSelection(
              event.target.files
            )
          }
        />


        {/* PHOTO FOOTER */}

        <div className="teacher-photo-footer">

          <span>

            {photos.length} / 6 photos selected

          </span>


          {photos.length > 0 && (

            <button
              type="button"
              onClick={resetPhotos}
            >

              <RotateCcw size={14} />

              Clear All

            </button>

          )}

        </div>

      </section>


      {/* ==================================================== */}
      {/* RECOGNIZE BUTTON */}
      {/* ==================================================== */}

      <button
        type="button"
        className="teacher-recognize-button"
        disabled={
          processing ||
          !selectedClass ||
          !selectedSubjectId ||
          photos.length === 0
        }
        onClick={handleRecognize}
      >

        <Camera size={19} />

        {processing
          ? "Recognizing Faces..."
          : "Recognize & Mark Attendance"
        }

      </button>

      {/* ==================================================== */}
      {/* ATTENDANCE RESULT */}
      {/* ==================================================== */}

      {result && (

        <section className="teacher-attendance-result">


          {/* ================================================= */}
          {/* RESULT HEADER */}
          {/* ================================================= */}

          <div className="teacher-result-header">

            <div>

              <span>
                ATTENDANCE RESULT
              </span>

              <h2>
                {result.class_name}
                {" — Section "}
                {result.section}
              </h2>

              <p>
                {result.subject_name}
                {" • "}
                {result.attendance_date}
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* RESULT SUMMARY */}
          {/* ================================================= */}

          <div className="teacher-result-summary">


            {/* FACES DETECTED */}

            <div>

              <Users size={20} />

              <div>

                <span>
                  Faces Detected
                </span>

                <strong>
                  {result.faces_detected}
                </strong>

              </div>

            </div>


            {/* RECOGNIZED */}

            <div>

              <CheckCircle2 size={20} />

              <div>

                <span>
                  Recognized
                </span>

                <strong>
                  {result.students_recognized}
                </strong>

              </div>

            </div>


            {/* ALREADY MARKED */}

            <div>

              <AlertCircle size={20} />

              <div>

                <span>
                  Already Marked
                </span>

                <strong>
                  {result.students_already_marked}
                </strong>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* RECOGNIZED STUDENTS */}
          {/* ================================================= */}

          <div className="teacher-result-students">

            <div className="teacher-result-students-title">

              <h3>
                Recognized Students
              </h3>

              <span>
                {result.students.length} records
              </span>

            </div>


            {result.students.length === 0 ? (

              <div className="teacher-no-students">

                <AlertCircle size={20} />

                <p>
                  No registered students were recognized
                  in the uploaded photos.
                </p>

              </div>

            ) : (

              result.students.map(
                (student) => (

                  <div
                    className="teacher-recognized-student"
                    key={student.student_id}
                  >


                    {/* STUDENT AVATAR */}

                    <div className="teacher-student-avatar">

                      {student.name
                        .charAt(0)
                        .toUpperCase()
                      }

                    </div>


                    {/* STUDENT INFORMATION */}

                    <div className="teacher-student-result-info">

                      <strong>
                        {student.name}
                      </strong>

                      <span>
                        Roll No. {student.roll_number}
                      </span>

                    </div>


                    {/* SIMILARITY */}

                    <span className="teacher-student-similarity">

                      {(
                        student.similarity * 100
                      ).toFixed(1)}
                      %

                    </span>


                    {/* STATUS */}

                    <span
                      className={
                        `teacher-attendance-status ${
                          student.status.toLowerCase()
                        }`
                      }
                    >

                      {student.status}

                    </span>

                  </div>

                )
              )

            )}

          </div>


          {/* ================================================= */}
          {/* TAKE ANOTHER ATTENDANCE */}
          {/* ================================================= */}

          <button
            type="button"
            className="teacher-new-attendance-button"
            onClick={resetPhotos}
          >

            <RotateCcw size={17} />

            Take Another Attendance

          </button>

        </section>

      )}

    </div>

  );

}


export default TakeAttendance;