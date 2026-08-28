import { useEffect, useState } from "react";
import {
  UserPlus,
  BookOpen,
  X,
  Check,
} from "lucide-react";

import "./TeacherAssignments.css";


// ============================================================
// TYPES
// ============================================================

interface Teacher {
  id: number;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

interface ClassItem {
  id: number;
  name: string;
  section: string;
  academic_year: string;
  is_active?: boolean;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  school_id?: number;
  is_active?: boolean;
}


// ============================================================
// API
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// COMPONENT
// ============================================================

export default function TeacherAssignments() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [classes, setClasses] =
    useState<ClassItem[]>([]);

  const [subjects, setSubjects] =
    useState<Subject[]>([]);


  // ==========================================================
  // LOADING / MESSAGES
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [assigning, setAssigning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // TEACHER ASSIGNMENT FORM
  // ==========================================================

  const [selectedTeacher, setSelectedTeacher] =
    useState("");

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [isClassTeacher, setIsClassTeacher] =
    useState(false);

    const [classSubjects, setClassSubjects] =
  useState<Subject[]>([]);

const [loadingClassSubjects, setLoadingClassSubjects] =
  useState(false);

  const loadClassSubjects = async (
  className: string,
  section: string
) => {

  try {

    setLoadingClassSubjects(true);

    setError("");

    const token = getToken();

    if (!token) {

      throw new Error(
        "Authentication token not found. Please login again."
      );

    }

    const schoolClass =
      classes.find(
        (item) =>
          item.name === className &&
          item.section === section
      );

    if (!schoolClass) {

      setClassSubjects([]);

      return;

    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/subjects/class-options` +
        `?class_name=${encodeURIComponent(className)}` +
        `&section=${encodeURIComponent(section)}` +
        `&academic_year=${encodeURIComponent(
          schoolClass.academic_year
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },
        }
      );

    if (!response.ok) {

      const text =
        await response.text();

      let message =
        `Failed to load class subjects (${response.status})`;

      try {

        const data =
          JSON.parse(text);

        if (data?.detail) {

          message =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);

        }

      } catch {
        // Ignore invalid JSON
      }

      throw new Error(message);

    }

    const data =
      await response.json();

    setClassSubjects(
      Array.isArray(data)
        ? data
        : []
    );

  } catch (err) {

    console.error(
      "Error loading class subjects:",
      err
    );

    setClassSubjects([]);

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load class subjects."
    );

  } finally {

    setLoadingClassSubjects(false);

  }

};


  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = () => {

    return localStorage.getItem(
      "Smart Attend token"
    );

  };


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {

    loadData();

  }, []);


  const loadData = async () => {

    try {

      setLoading(true);

      setError("");


      const token = getToken();


      if (!token) {

        throw new Error(
          "Authentication token not found. Please login again."
        );

      }


      const headers = {

        Authorization:
          `Bearer ${token}`,

        Accept:
          "application/json",

      };


      // ------------------------------------------------------
      // LOAD TEACHERS
      // ------------------------------------------------------

      const teachersResponse =
        await fetch(
          `${API_BASE_URL}/api/teachers`,
          {
            method: "GET",
            headers,
          }
        );


      if (!teachersResponse.ok) {

        const text =
          await teachersResponse.text();

        let message =
          `Failed to load teachers (${teachersResponse.status})`;

        try {

          const data =
            JSON.parse(text);

          if (data?.detail) {

            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);

          }

        } catch {
          // Ignore invalid JSON
        }

        throw new Error(message);

      }


      const teachersData =
        await teachersResponse.json();


      setTeachers(
        Array.isArray(
          teachersData?.teachers
        )
          ? teachersData.teachers
          : Array.isArray(teachersData)
            ? teachersData
            : []
      );


      // ------------------------------------------------------
      // LOAD CLASSES
      // ------------------------------------------------------

      const classesResponse =
        await fetch(
          `${API_BASE_URL}/api/classes/options`,
          {
            method: "GET",
            headers,
          }
        );


      if (!classesResponse.ok) {

        const text =
          await classesResponse.text();

        let message =
          `Failed to load classes (${classesResponse.status})`;

        try {

          const data =
            JSON.parse(text);

          if (data?.detail) {

            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);

          }

        } catch {
          // Ignore invalid JSON
        }

        throw new Error(message);

      }


      const classesData =
        await classesResponse.json();


      setClasses(
        Array.isArray(classesData)
          ? classesData
          : []
      );


      // ------------------------------------------------------
      // LOAD SUBJECTS
      // ------------------------------------------------------

      const subjectsResponse =
        await fetch(
          `${API_BASE_URL}/api/subjects/options`,
          {
            method: "GET",
            headers,
          }
        );


      if (!subjectsResponse.ok) {

        const text =
          await subjectsResponse.text();

        let message =
          `Failed to load subjects (${subjectsResponse.status})`;

        try {

          const data =
            JSON.parse(text);

          if (data?.detail) {

            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);

          }

        } catch {
          // Ignore invalid JSON
        }

        throw new Error(message);

      }


      const subjectsData =
        await subjectsResponse.json();


      setSubjects(
        Array.isArray(subjectsData)
          ? subjectsData
          : []
      );


    } catch (err) {

      console.error(
        "Error loading teacher assignments:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teacher assignment data."
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // CLASS NAMES
  // ============================================================

  const classNames =
    Array.from(
      new Set(
        classes.map(
          (item) => item.name
        )
      )
    );


  // ============================================================
  // AVAILABLE SECTIONS
  // ============================================================

  const availableSections =
    classes
      .filter(
        (item) =>
          item.name === selectedClass
      )
      .map(
        (item) =>
          item.section
      );

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSection("");
    setSelectedSubject("");
  };
  // ============================================================
  // HANDLE CLASS CHANGE
  // ============================================================

  const handleSectionChange = async (
  value: string
) => {

  setSelectedSection(value);

  setSelectedSubject("");

  if (!selectedClass || !value) {

    setClassSubjects([]);

    return;

  }

  await loadClassSubjects(
    selectedClass,
    value
  );

};


  // ============================================================
  // HANDLE CLASS TEACHER CHANGE
  // ============================================================

  const handleClassTeacherChange = (
    checked: boolean
  ) => {

    setIsClassTeacher(checked);


    if (checked) {

      setSelectedSubject("");

    }

  };


  // ============================================================
  // TEACHER DISPLAY NAME
  // ============================================================

  const getTeacherName = (
    teacher: Teacher
  ) => {

    return (
      teacher.full_name ||
      teacher.name ||
      teacher.email
    );

  };
  // ============================================================
  // CLEAR FORM
  // ============================================================

  const clearForm = () => {

    setSelectedTeacher("");

    setSelectedClass("");

    setSelectedSection("");

    setSelectedSubject("");

    setIsClassTeacher(false);

    setError("");

    setSuccess("");

  };


  // ============================================================
  // ASSIGN TEACHER
  // ============================================================

  const assignTeacher = async () => {

    try {

      setAssigning(true);

      setError("");

      setSuccess("");


      const token = getToken();


      if (!token) {

        throw new Error(
          "Authentication token not found. Please login again."
        );

      }


      // --------------------------------------------------------
      // VALIDATE TEACHER
      // --------------------------------------------------------

      if (!selectedTeacher) {

        throw new Error(
          "Please select a teacher."
        );

      }


      // --------------------------------------------------------
      // VALIDATE CLASS
      // --------------------------------------------------------

      if (!selectedClass) {

        throw new Error(
          "Please select a class."
        );

      }


      // --------------------------------------------------------
      // VALIDATE SECTION
      // --------------------------------------------------------

      if (!selectedSection) {

        throw new Error(
          "Please select a section."
        );

      }


      // --------------------------------------------------------
      // SUBJECT REQUIRED FOR SUBJECT TEACHER
      // --------------------------------------------------------

      if (
        !isClassTeacher &&
        !selectedSubject
      ) {

        throw new Error(
          "Please select a subject."
        );

      }


      // --------------------------------------------------------
      // FIND TEACHER
      // --------------------------------------------------------

      const teacher =
        teachers.find(
          (item) =>
            String(item.id) ===
            selectedTeacher
        );


      if (!teacher) {

        throw new Error(
          "Selected teacher could not be found."
        );

      }


      // ========================================================
      // CLASS TEACHER ASSIGNMENT
      // ========================================================

      if (isClassTeacher) {

        const response =
          await fetch(
            `${API_BASE_URL}/api/teacher-assignments/class-teacher`,
            {
              method: "POST",

              headers: {

                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",

              },

              body:
                JSON.stringify({

                  teacher_email:
                    teacher.email,

                  assignments: [

                    {
                      class_name:
                        selectedClass,

                      section:
                        selectedSection,

                    }

                  ]

                })

            }
          );


        const responseText =
          await response.text();


        if (!response.ok) {

          let message =
            `Failed to assign class teacher (${response.status})`;


          try {

            const data =
              JSON.parse(responseText);


            if (data?.detail) {

              message =
                typeof data.detail === "string"
                  ? data.detail
                  : JSON.stringify(data.detail);

            }

          } catch {
            // Ignore invalid JSON
          }


          throw new Error(message);

        }


        setSuccess(
          `Class teacher assigned successfully! ${getTeacherName(teacher)} is now the class teacher for ${selectedClass} - Section ${selectedSection}.`
        );


        clearForm();

        return;

      }


      // ========================================================
      // SUBJECT TEACHER ASSIGNMENT
      // ========================================================

      const subject =
        subjects.find(
          (item) =>
            String(item.id) ===
            selectedSubject
        );


      if (!subject) {

        throw new Error(
          "Selected subject could not be found."
        );

      }


      const response =
        await fetch(
          `${API_BASE_URL}/api/teacher-assignments/subject-teacher`,
          {
            method: "POST",

            headers: {

              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",

              Accept:
                "application/json",

            },

            body:
              JSON.stringify({

                teacher_email:
                  teacher.email,

                assignments: [

                  {

                    class_name:
                      selectedClass,

                    section:
                      selectedSection,

                    subject_name:
                      subject.name,

                  }

                ]

              })

          }
        );


      const responseText =
        await response.text();


      if (!response.ok) {

        let message =
          `Failed to assign subject teacher (${response.status})`;


        try {

          const data =
            JSON.parse(responseText);


          if (data?.detail) {

            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);

          }

        } catch {
          // Ignore invalid JSON
        }


        throw new Error(message);

      }


      setSuccess(
        `Subject teacher assigned successfully! ${getTeacherName(teacher)} will teach ${subject.name} to ${selectedClass} - Section ${selectedSection}.`
      );


      clearForm();


    } catch (err) {

      console.error(
        "Error assigning teacher:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign teacher."
      );


    } finally {

      setAssigning(false);

    }

  };


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {

    return (

      <div className="teacher-assignments">

        <div className="teacher-assignment-empty">

          <BookOpen size={30} />

          <strong>
            Loading teacher assignments...
          </strong>

          <span>
            Please wait while the data is loaded.
          </span>

        </div>

      </div>

    );

  }
  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="teacher-assignments">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="teacher-assignment-header">

        <div>

          <span className="teacher-assignment-label">
            ADMINISTRATION
          </span>

          <h1>
            Teacher Assignments
          </h1>

          <p>
            Assign teachers to classes and subjects.
          </p>

        </div>

      </div>


      {/* ====================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ====================================================== */}

      {success && (
        <div className="teacher-assignment-message success">

          <Check size={18} />

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


      {/* ====================================================== */}
      {/* ERROR MESSAGE */}
      {/* ====================================================== */}

      {error && (
        <div className="teacher-assignment-message error">

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


      {/* ====================================================== */}
      {/* ASSIGNMENT CARD */}
      {/* ====================================================== */}

      <div className="teacher-assignment-card">

        <div className="teacher-assignment-card-header">

          <div>

            <h2>
              Assign Teacher
            </h2>

            <p>
              Select a teacher, class and section.
              Then choose whether they are a class
              teacher or subject teacher.
            </p>

          </div>

          <UserPlus size={24} />

        </div>


        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <div className="teacher-assignment-form">


          {/* ================================================= */}
          {/* TEACHER */}
          {/* ================================================= */}

          <div className="teacher-assignment-field">

  <label>
    Subject
  </label>

  <select
    value={selectedSubject}
    onChange={(event) =>
      handleSectionChange(
        event.target.value
      )
    }
    disabled={
      !selectedClass ||
      !selectedSection ||
      assigning ||
      loadingClassSubjects
    }
  >

    <option value="">
      {loadingClassSubjects
        ? "Loading subjects..."
        : "Select subject"}
    </option>

    {classSubjects.map(
      (subject) => (

        <option
          key={subject.id}
          value={subject.id}
        >
          {subject.name} ({subject.code})
        </option>

      )
    )}

  </select>

  <small>
    Only subjects assigned to this
    class and section are shown.
  </small>

</div>


          {/* ================================================= */}
          {/* CLASS */}
          {/* ================================================= */}

          <div className="teacher-assignment-field">

            <label>
              Class
            </label>

            <select
              value={selectedClass}
              onChange={(event) =>
                handleClassChange(
                  event.target.value
                )
              }
              disabled={assigning}
            >

              <option value="">
                Select class
              </option>

              {classNames.map(
                (className) => (

                  <option
                    key={className}
                    value={className}
                  >
                    {className}
                  </option>

                )
              )}

            </select>

          </div>


          {/* ================================================= */}
          {/* SECTION */}
          {/* ================================================= */}

          <div className="teacher-assignment-field">

            <label>
              Section
            </label>

            <select
              value={selectedSection}
              onChange={(event) =>
                setSelectedSection(
                  event.target.value
                )
              }
              disabled={
                !selectedClass ||
                assigning
              }
            >

              <option value="">
                Select section
              </option>

              {availableSections.map(
                (section) => (

                  <option
                    key={section}
                    value={section}
                  >
                    Section {section}
                  </option>

                )
              )}

            </select>

          </div>


          {/* ================================================= */}
          {/* CLASS TEACHER */}
          {/* ================================================= */}

          <div className="teacher-assignment-checkbox">

            <label>

              <input
                type="checkbox"
                checked={isClassTeacher}
                onChange={(event) =>
                  handleClassTeacherChange(
                    event.target.checked
                  )
                }
                disabled={assigning}
              />

              <span>
                Assign as Class Teacher
              </span>

            </label>

            <p>
              Enable this if the selected teacher
              is responsible for the whole class.
            </p>

          </div>


          {/* ================================================= */}
          {/* SUBJECT */}
          {/* ================================================= */}

          {!isClassTeacher && (

            <div className="teacher-assignment-field">

              <label>
                Subject
              </label>

              <select
                value={selectedSubject}
                onChange={(event) =>
                  setSelectedSubject(
                    event.target.value
                  )
                }
                disabled={
                  !selectedClass ||
                  !selectedSection ||
                  assigning
                }
              >

                <option value="">
                  Select subject
                </option>

                {subjects.map(
                  (subject) => (

                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name} ({subject.code})
                    </option>

                  )
                )}

              </select>

              <small>
                The subject must already be assigned
                to this class.
              </small>

            </div>

          )}


          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="teacher-assignment-actions">

            <button
              type="button"
              className="teacher-assignment-secondary"
              onClick={clearForm}
              disabled={assigning}
            >
              Clear
            </button>


            <button
              type="button"
              className="teacher-assignment-primary"
              onClick={assignTeacher}
              disabled={assigning}
            >

              {assigning ? (
                "Assigning..."
              ) : (
                <>
                  <UserPlus size={17} />

                  Assign Teacher
                </>
              )}

            </button>

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* INFORMATION */}
      {/* ====================================================== */}

      <div className="teacher-assignment-card">

        <div className="teacher-assignment-card-header">

          <div>

            <h2>
              How It Works
            </h2>

            <p>
              Teacher assignments are separated
              from subject management.
            </p>

          </div>

          <BookOpen size={24} />

        </div>


        <div className="teacher-assignment-guide">


          <div className="teacher-assignment-guide-item">

            <strong>
              Class Teacher
            </strong>

            <p>
              Select a teacher, class and section,
              then enable the Class Teacher option.
            </p>

          </div>


          <div className="teacher-assignment-guide-item">

            <strong>
              Subject Teacher
            </strong>

            <p>
              Select a teacher, class, section and
              the subject they will teach.
            </p>

          </div>


          <div className="teacher-assignment-guide-item">

            <strong>
              Important
            </strong>

            <p>
              A subject must first be assigned to
              the class from the Subjects page.
            </p>

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* NO TEACHERS */}
      {/* ====================================================== */}

      {teachers.length === 0 && (

        <div className="teacher-assignment-empty">

          <UserPlus size={30} />

          <strong>
            No teachers found
          </strong>

          <span>
            Create a teacher first from the Teachers
            page before making assignments.
          </span>

        </div>

      )}

    </div>
  );
}