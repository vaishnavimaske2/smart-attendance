import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  UserPlus,
  Users,
  GraduationCap,
  Camera,
  X,
  Pencil,
  UserX,
  CalendarDays,
  UserRound,
  Hash,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import { apiRequest } from "../../services/api";


// ============================================================
// TYPES
// ============================================================

interface ClassOption {
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
}

interface Student {
  id: number;
  school_id: number;
  class_id: number;
  class_name: string;
  section: string;
  name: string;
  roll_number: string;
  date_of_birth: string | null;
  gender: string | null;
  is_active: boolean;
}

interface FaceRegistration {
  photos_uploaded: number;
  photos_registered: number;
  photos_failed: number;
  registered_photos: {
    photo_number: number;
    filename: string;
    confidence: number;
  }[];
  failed_photos: {
    photo_number: number;
    filename: string;
    error: string;
  }[];
}

interface StudentCreateResponse extends Student {
  face_registration: FaceRegistration;
}


// ============================================================
// CONSTANTS
// ============================================================

const MAX_PHOTOS = 6;


// ============================================================
// COMPONENT
// ============================================================

function StudentManagement() {

  // ==========================================================
  // CLASS DATA
  // ==========================================================

  const [classes, setClasses] =
    useState<ClassOption[]>([]);

  const [selectedClassId, setSelectedClassId] =
    useState("");


  // ==========================================================
  // STUDENT DATA
  // ==========================================================

  const [students, setStudents] =
    useState<Student[]>([]);


  // ==========================================================
  // FORM DATA
  // ==========================================================

  const [name, setName] =
    useState("");

  const [rollNumber, setRollNumber] =
    useState("");

  const [dateOfBirth, setDateOfBirth] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [photos, setPhotos] =
    useState<File[]>([]);


  // ==========================================================
  // EDIT MODE
  // ==========================================================

  const [editingStudent, setEditingStudent] =
    useState<Student | null>(null);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [searchTerm, setSearchTerm] =
    useState("");


  // ==========================================================
  // LOADING
  // ==========================================================

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deactivatingId, setDeactivatingId] =
    useState<number | null>(null);


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // NEXT PART GOES BELOW
  // ==========================================================

  // ==========================================================
  // LOAD TEACHER CLASSES
  // ==========================================================

  useEffect(() => {

    async function loadClasses() {

      try {

        setLoadingOptions(true);
        setError("");

        const response =
          await apiRequest(
            "/api/students/options"
          ) as ClassOption[];

        setClasses(response || []);

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load classes."
        );

      } finally {

        setLoadingOptions(false);

      }

    }

    loadClasses();

  }, []);


  // ==========================================================
  // LOAD STUDENTS
  // ==========================================================

  async function loadStudents(
    selectedClass: ClassOption
  ) {

    try {

      setLoadingStudents(true);
      setError("");

      const response =
        await apiRequest(
          `/api/students/?class_name=${encodeURIComponent(
            selectedClass.class_name
          )}&section=${encodeURIComponent(
            selectedClass.section
          )}`
        ) as Student[];

      setStudents(response || []);

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load students."
      );

    } finally {

      setLoadingStudents(false);

    }

  }


  // ==========================================================
  // SELECTED CLASS
  // ==========================================================

  const selectedClass =
    classes.find(
      item =>
        String(item.class_id) ===
        selectedClassId
    );


  // ==========================================================
  // FILTER STUDENTS
  // ==========================================================

  const filteredStudents =
    students.filter(
      student => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        return (
          student.name
            .toLowerCase()
            .includes(search)
          ||
          student.roll_number
            .toLowerCase()
            .includes(search)
        );

      }
    );


  // ==========================================================
  // CLASS CHANGE
  // ==========================================================

  function handleClassChange(
    value: string
  ) {

    setSelectedClassId(value);

    setStudents([]);

    setEditingStudent(null);

    setName("");
    setRollNumber("");
    setDateOfBirth("");
    setGender("");
    setPhotos([]);

    setSearchTerm("");

    setError("");
    setSuccess("");


    if (!value) {
      return;
    }


    const selected =
      classes.find(
        item =>
          String(item.class_id) === value
      );


    if (selected) {

      loadStudents(selected);

    }

  }

  // ==========================================================
  // PHOTO SELECTION
  // ==========================================================

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {

    const selectedFiles =
      Array.from(
        event.target.files || []
      );

    if (selectedFiles.length === 0) {
      return;
    }

    const combinedFiles = [
      ...photos,
      ...selectedFiles,
    ];

    if (
      combinedFiles.length >
      MAX_PHOTOS
    ) {

      setError(
        `You can upload a maximum of ${MAX_PHOTOS} photos.`
      );

      setPhotos(
        combinedFiles.slice(
          0,
          MAX_PHOTOS
        )
      );

      event.target.value = "";

      return;
    }

    setPhotos(combinedFiles);

    setError("");
    setSuccess("");

    event.target.value = "";
  }


  // ==========================================================
  // REMOVE PHOTO
  // ==========================================================

  function removePhoto(
    index: number
  ) {

    setPhotos(
      previous =>
        previous.filter(
          (_, photoIndex) =>
            photoIndex !== index
        )
    );

  }


  // ==========================================================
  // CLEAR FORM
  // ==========================================================

  function clearForm() {

    setName("");
    setRollNumber("");
    setDateOfBirth("");
    setGender("");
    setPhotos([]);

    setEditingStudent(null);

    setError("");
    setSuccess("");
  }


  // ==========================================================
  // START EDITING
  // ==========================================================

  function startEditing(
    student: Student
  ) {

    setEditingStudent(student);

    setName(student.name);

    setRollNumber(
      student.roll_number
    );

    setDateOfBirth(
      student.date_of_birth || ""
    );

    setGender(
      student.gender || ""
    );

    setPhotos([]);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // ==========================================================
  // FORM VALIDATION
  // ==========================================================

  function validateStudentForm() {

    if (!selectedClass) {

      setError(
        "Please select a class."
      );

      return false;
    }

    if (!name.trim()) {

      setError(
        "Please enter the student's name."
      );

      return false;
    }

    if (!rollNumber.trim()) {

      setError(
        "Please enter the roll number."
      );

      return false;
    }

    if (
      !editingStudent &&
      photos.length === 0
    ) {

      setError(
        "Please upload at least one face photo."
      );

      return false;
    }

    if (
      photos.length >
      MAX_PHOTOS
    ) {

      setError(
        `Maximum ${MAX_PHOTOS} face photos are allowed.`
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // REGISTER STUDENT + FACE PHOTOS
  // ==========================================================

  async function registerStudent(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateStudentForm()) {
      return;
    }

    try {

      setSaving(true);

      // ------------------------------------------------------
      // CREATE FORM DATA
      // ------------------------------------------------------

      const formData =
        new FormData();

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "roll_number",
        rollNumber.trim()
      );

      formData.append(
        "class_name",
        selectedClass!.class_name
      );

      formData.append(
        "section",
        selectedClass!.section
      );


      if (dateOfBirth) {

        formData.append(
          "date_of_birth",
          dateOfBirth
        );

      }


      if (gender) {

        formData.append(
          "gender",
          gender
        );

      }


      // ------------------------------------------------------
      // ADD FACE PHOTOS
      // ------------------------------------------------------

      photos.forEach(
        (photo, index) => {

          formData.append(
            `file${index + 1}`,
            photo
          );

        }
      );


      // ------------------------------------------------------
      // SEND REQUEST
      // ------------------------------------------------------

      const response =
        await apiRequest(
          "/api/students/",
          {
            method: "POST",
            body: formData,
          }
        ) as StudentCreateResponse;


      // ------------------------------------------------------
      // FACE REGISTRATION RESULT
      // ------------------------------------------------------

      const faceResult =
        response.face_registration;


      if (
        faceResult.photos_registered ===
        faceResult.photos_uploaded
      ) {

        setSuccess(
          `${response.name} registered successfully with ${faceResult.photos_registered} face photo${faceResult.photos_registered === 1 ? "" : "s"}.`
        );

      } else {

        setSuccess(
          `${response.name} was created. ${faceResult.photos_registered} of ${faceResult.photos_uploaded} face photos were registered.`
        );

      }


      // ------------------------------------------------------
      // REFRESH STUDENT LIST
      // ------------------------------------------------------

      if (selectedClass) {

        await loadStudents(
          selectedClass
        );

      }


      // ------------------------------------------------------
      // CLEAR FORM
      // ------------------------------------------------------

      setName("");
      setRollNumber("");
      setDateOfBirth("");
      setGender("");
      setPhotos([]);


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to register student."
      );

    } finally {

      setSaving(false);

    }

  }

  // ==========================================================
  // UPDATE STUDENT
  // ==========================================================

  async function updateStudent(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingStudent) {

      setError(
        "No student selected for editing."
      );

      return;
    }

    if (!validateStudentForm()) {
      return;
    }

    try {

      setSaving(true);

      if (!selectedClass) {

        throw new Error(
          "Selected class was not found."
        );

      }

      await apiRequest(
        "/api/students/",
        {
          method: "PUT",

          body: JSON.stringify({

            class_name:
              selectedClass.class_name,

            section:
              selectedClass.section,

            roll_number:
              editingStudent.roll_number,

            name:
              name.trim(),

            date_of_birth:
              dateOfBirth || null,

            gender:
              gender || null,

          }),
        }
      );


      await loadStudents(
        selectedClass
      );


      setSuccess(
        `${name.trim()} updated successfully.`
      );


      clearForm();


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update student."
      );

    } finally {

      setSaving(false);

    }

  }


  // ==========================================================
  // DEACTIVATE STUDENT
  // ==========================================================

  async function deactivateStudent(
    student: Student
  ) {

    const confirmed =
      window.confirm(
        `Are you sure you want to deactivate ${student.name}?`
      );

    if (!confirmed) {
      return;
    }


    try {

      setDeactivatingId(
        student.id
      );

      setError("");
      setSuccess("");


      await apiRequest(
        "/api/students/deactivate",
        {
          method: "PUT",

          body: JSON.stringify({

            class_name:
              student.class_name,

            section:
              student.section,

            roll_number:
              student.roll_number,

          }),
        }
      );


      if (selectedClass) {

        await loadStudents(
          selectedClass
        );

      }


      if (
        editingStudent?.id ===
        student.id
      ) {

        clearForm();

      }


      setSuccess(
        `${student.name} has been deactivated.`
      );


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to deactivate student."
      );

    } finally {

      setDeactivatingId(
        null
      );

    }

  }


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  function clearSearch() {

    setSearchTerm("");

  }

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loadingOptions) {

    return (
      <div className="student-management-loading">

        <RefreshCw
          size={24}
          className="spin"
        />

        <span>
          Loading student management...
        </span>

      </div>
    );

  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="student-management-page">

      {/* ==================================================== */}
      {/* PAGE HEADER */}
      {/* ==================================================== */}

      <div className="student-management-hero">

        <div className="student-management-hero-icon">
          <GraduationCap size={28} />
        </div>

        <div className="student-management-hero-content">

          <span className="student-management-eyebrow">
            STUDENT MANAGEMENT
          </span>

          <h1>
            Manage Students
          </h1>

          <p>
            Register students, add face profiles,
            update details and manage your class.
          </p>

        </div>

      </div>


      {/* ==================================================== */}
      {/* ERROR MESSAGE */}
      {/* ==================================================== */}

      {error && (

        <div className="student-management-message error">

          <AlertCircle size={19} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>

      )}


      {/* ==================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ==================================================== */}

      {success && (

        <div className="student-management-message success">

          <CheckCircle2 size={19} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>

        </div>

      )}


      {/* ==================================================== */}
      {/* CLASS SELECTOR */}
      {/* ==================================================== */}

      <section className="student-management-card">

        <div className="student-management-card-header">

          <div className="student-management-section-icon">
            <GraduationCap size={21} />
          </div>

          <div>

            <h2>
              Select Class
            </h2>

            <p>
              Choose a class to view and manage its students.
            </p>

          </div>

        </div>


        <div className="student-management-class-row">

          <div className="student-management-field">

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

              {classes.map(
                (schoolClass) => (

                  <option
                    key={schoolClass.class_id}
                    value={schoolClass.class_id}
                  >

                    {schoolClass.class_name}
                    {" — Section "}
                    {schoolClass.section}
                    {" ("}
                    {schoolClass.academic_year}
                    {")"}

                  </option>

                )
              )}

            </select>

          </div>


          {selectedClass && (

            <div className="student-management-class-badge">

              <GraduationCap size={17} />

              <div>

                <strong>
                  {selectedClass.class_name}
                </strong>

                <span>
                  Section {selectedClass.section}
                  {" • "}
                  {selectedClass.academic_year}
                </span>

              </div>

            </div>

          )}

        </div>

      </section>

      {/* ==================================================== */}
      {/* STUDENT FORM */}
      {/* ==================================================== */}

      {selectedClassId && (

        <section className="student-management-card">

          {/* ------------------------------------------------ */}
          {/* FORM HEADER */}
          {/* ------------------------------------------------ */}

          <div className="student-management-card-header">

            <div className="student-management-section-icon">
              {editingStudent
                ? <Pencil size={21} />
                : <UserPlus size={21} />
              }
            </div>

            <div>

              <h2>
                {editingStudent
                  ? "Update Student"
                  : "Register Student"
                }
              </h2>

              <p>
                {editingStudent
                  ? "Update the student's information."
                  : "Enter student details and register face photos."
                }
              </p>

            </div>

          </div>


          {/* ------------------------------------------------ */}
          {/* FORM */}
          {/* ------------------------------------------------ */}

          <form
            onSubmit={
              editingStudent
                ? updateStudent
                : registerStudent
            }
            className="student-management-form"
          >

            {/* ============================================== */}
            {/* STUDENT DETAILS */}
            {/* ============================================== */}

            <div className="student-management-form-grid">


              {/* NAME */}
              <div className="student-management-field">

                <label>
                  Student Name
                </label>

                <div className="student-management-input">

                  <UserRound size={18} />

                  <input
                    type="text"
                    placeholder="Enter student name"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>


              {/* ROLL NUMBER */}
              <div className="student-management-field">

                <label>
                  Roll Number
                </label>

                <div className="student-management-input">

                  <Hash size={18} />

                  <input
                    type="text"
                    placeholder="Enter roll number"
                    value={rollNumber}
                    onChange={(event) =>
                      setRollNumber(
                        event.target.value
                      )
                    }
                    disabled={
                      !!editingStudent
                    }
                    required
                  />

                </div>

              </div>


              {/* DATE OF BIRTH */}
              <div className="student-management-field">

                <label>
                  Date of Birth
                </label>

                <div className="student-management-input">

                  <CalendarDays size={18} />

                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) =>
                      setDateOfBirth(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* GENDER */}
              <div className="student-management-field">

                <label>
                  Gender
                </label>

                <div className="student-management-input">

                  <UserRound size={18} />

                  <select
                    value={gender}
                    onChange={(event) =>
                      setGender(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* ============================================== */}
            {/* FACE REGISTRATION */}
            {/* ============================================== */}

            {!editingStudent && (

              <div className="student-face-registration">

                <div className="student-face-header">

                  <div>

                    <div className="student-face-title">

                      <Camera size={20} />

                      <h3>
                        Face Registration
                      </h3>

                    </div>

                    <p>
                      Upload 1 to 6 clear photos
                      of the same student.
                    </p>

                  </div>

                  <span className="student-photo-count">

                    {photos.length}
                    /
                    {MAX_PHOTOS}

                  </span>

                </div>


                {/* PHOTO UPLOAD */}
                <label
                  className="student-photo-upload"
                >

                  <Camera size={30} />

                  <strong>
                    Add Student Photos
                  </strong>

                  <span>
                    Click here to select photos
                  </span>

                  <small>
                    Maximum {MAX_PHOTOS} photos
                  </small>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={
                      handlePhotoChange
                    }
                    hidden
                  />

                </label>


                {/* PHOTO PREVIEW LIST */}
                {photos.length > 0 && (

                  <div className="student-photo-list">

                    {photos.map(
                      (photo, index) => (

                        <div
                          className="student-photo-item"
                          key={`${photo.name}-${index}`}
                        >

                          <div className="student-photo-number">
                            {index + 1}
                          </div>

                          <div className="student-photo-info">

                            <strong>
                              Photo {index + 1}
                            </strong>

                            <span>
                              {photo.name}
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removePhoto(index)
                            }
                            title="Remove photo"
                          >

                            <X size={17} />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            )}


            {/* ============================================== */}
            {/* FORM BUTTONS */}
            {/* ============================================== */}

            <div className="student-management-actions">

              <button
                type="submit"
                className="student-primary-button"
                disabled={saving}
              >

                {saving ? (

                  <>
                    <RefreshCw
                      size={18}
                      className="spin"
                    />

                    Saving...
                  </>

                ) : (

                  <>
                    {editingStudent
                      ? <Pencil size={18} />
                      : <UserPlus size={18} />
                    }

                    {editingStudent
                      ? "Update Student"
                      : "Register Student"
                    }
                  </>

                )}

              </button>


              {editingStudent && (

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={clearForm}
                  disabled={saving}
                >

                  <X size={18} />

                  Cancel

                </button>

              )}

            </div>

          </form>

        </section>

      )}

      {/* ==================================================== */}
      {/* STUDENT LIST */}
      {/* ==================================================== */}

      {selectedClassId && (

        <section className="student-management-card">

          {/* ------------------------------------------------ */}
          {/* LIST HEADER */}
          {/* ------------------------------------------------ */}

          <div className="student-list-header">

            <div>

              <div className="student-management-section-icon">
                <Users size={21} />
              </div>

              <div className="student-list-heading">

                <span>
                  STUDENTS
                </span>

                <h2>
                  Students in This Class
                </h2>

              </div>

            </div>


            <div className="student-list-count">

              <Users size={17} />

              {students.length}

              <span>
                {students.length === 1
                  ? "Student"
                  : "Students"
                }
              </span>

            </div>

          </div>


          {/* ------------------------------------------------ */}
          {/* SEARCH */}
          {/* ------------------------------------------------ */}

          {students.length > 0 && (

            <div className="student-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

              {searchTerm && (

                <button
                  type="button"
                  onClick={clearSearch}
                  title="Clear search"
                >

                  <X size={16} />

                </button>

              )}

            </div>

          )}


          {/* ------------------------------------------------ */}
          {/* LOADING */}
          {/* ------------------------------------------------ */}

          {loadingStudents ? (

            <div className="student-management-loading">

              <RefreshCw
                size={22}
                className="spin"
              />

              <span>
                Loading students...
              </span>

            </div>

          ) : students.length === 0 ? (

            /* ------------------------------------------------ */
            /* NO STUDENTS */
            /* ------------------------------------------------ */

            <div className="student-empty-state">

              <div className="student-empty-icon">
                <Users size={30} />
              </div>

              <h3>
                No students yet
              </h3>

              <p>
                Register the first student
                for this class.
              </p>

            </div>

          ) : filteredStudents.length === 0 ? (

            /* ------------------------------------------------ */
            /* NO SEARCH RESULTS */
            /* ------------------------------------------------ */

            <div className="student-empty-state">

              <div className="student-empty-icon">
                <Search size={30} />
              </div>

              <h3>
                No students found
              </h3>

              <p>
                Try a different name or roll number.
              </p>

              <button
                type="button"
                className="student-secondary-button"
                onClick={clearSearch}
              >

                <X size={17} />

                Clear Search

              </button>

            </div>

          ) : (

            /* ------------------------------------------------ */
            /* STUDENT ROWS */
            /* ------------------------------------------------ */

            <div className="student-management-list">

              {filteredStudents.map(
                (student) => (

                  <div
                    className="student-management-row"
                    key={student.id}
                  >

                    {/* ====================================== */}
                    {/* AVATAR */}
                    {/* ====================================== */}

                    <div className="student-management-avatar">

                      {student.name
                        .charAt(0)
                        .toUpperCase()
                      }

                    </div>


                    {/* ====================================== */}
                    {/* STUDENT NAME */}
                    {/* ====================================== */}

                    <div className="student-management-name">

                      <strong>
                        {student.name}
                      </strong>

                      <span>
                        Roll No. {student.roll_number}
                      </span>

                    </div>


                    {/* ====================================== */}
                    {/* GENDER */}
                    {/* ====================================== */}

                    <div className="student-management-detail">

                      <UserRound size={15} />

                      <span>
                        {student.gender || "—"}
                      </span>

                    </div>


                    {/* ====================================== */}
                    {/* DATE OF BIRTH */}
                    {/* ====================================== */}

                    <div className="student-management-detail">

                      <CalendarDays size={15} />

                      <span>
                        {student.date_of_birth || "—"}
                      </span>

                    </div>


                    {/* ====================================== */}
                    {/* ACTIONS */}
                    {/* ====================================== */}

                    <div className="student-row-actions">

                      <button
                        type="button"
                        title="Edit student"
                        onClick={() =>
                          startEditing(student)
                        }
                      >

                        <Pencil size={17} />

                      </button>


                      <button
                        type="button"
                        title="Deactivate student"
                        disabled={
                          deactivatingId ===
                          student.id
                        }
                        onClick={() =>
                          deactivateStudent(student)
                        }
                      >

                        {deactivatingId ===
                        student.id ? (

                          <RefreshCw
                            size={17}
                            className="spin"
                          />

                        ) : (

                          <UserX
                            size={17}
                          />

                        )}

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      )}

      {/* ==================================================== */}
      {/* END OF PAGE */}
      {/* ==================================================== */}

    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default StudentManagement;



