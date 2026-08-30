import { useEffect, useState } from "react";

import {
  UserPlus,
  BookOpen,
  X,
  Check,
  RefreshCw,
} from "lucide-react";

import "./TeacherAssignments.css";


// ============================================================
// API
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


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

interface TeacherAssignment {
  id: number;

  teacher_id: number;
  teacher_name: string;
  teacher_email: string;

  class_id: number;
  class_name: string;
  section: string;

  subject_id: number | null;
  subject_name: string | null;
  subject_code: string | null;

  is_class_teacher: boolean;
  is_active: boolean;
}


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

  const [classSubjects, setClassSubjects] =
    useState<Subject[]>([]);

  const [assignments, setAssignments] =
    useState<TeacherAssignment[]>([]);


  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingClassSubjects, setLoadingClassSubjects] =
    useState(false);

  const [loadingAssignments, setLoadingAssignments] =
    useState(false);

  const [assigning, setAssigning] =
    useState(false);


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // FORM
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


  // ==========================================================
  // ASSIGNMENT FILTERS
  // ==========================================================

  const [assignmentSearch, setAssignmentSearch] =
    useState("");

  const [assignmentClassFilter, setAssignmentClassFilter] =
    useState("");

  const [assignmentTypeFilter, setAssignmentTypeFilter] =
    useState("");


  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = (): string | null => {

    return localStorage.getItem(
      "Smart Attend token"
    );

  };


  // ==========================================================
  // ERROR PARSER
  // ==========================================================

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {

    const text =
      await response.text();

    if (!text) {
      return fallback;
    }

    try {

      const data =
        JSON.parse(text);

      if (data?.detail) {

        if (
          typeof data.detail === "string"
        ) {

          return data.detail;

        }

        return JSON.stringify(
          data.detail
        );

      }

    } catch {
      // Ignore invalid JSON
    }

    return fallback;
  };


  // ==========================================================
  // LOAD TEACHERS
  // ==========================================================

  const loadTeachers = async () => {

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/teachers`,
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

      throw new Error(
        await getErrorMessage(
          response,
          `Failed to load teachers (${response.status})`
        )
      );

    }

    const data =
      await response.json();

    setTeachers(
      Array.isArray(
        data?.teachers
      )
        ? data.teachers
        : Array.isArray(data)
          ? data
          : []
    );

  };


  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  const loadClasses = async () => {

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/classes/options`,
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

      throw new Error(
        await getErrorMessage(
          response,
          `Failed to load classes (${response.status})`
        )
      );

    }

    const data =
      await response.json();

    setClasses(
      Array.isArray(data)
        ? data
        : []
    );

  };


  // ==========================================================
  // LOAD ASSIGNMENTS
  // ==========================================================

  const loadAssignments = async () => {

    try {

      setLoadingAssignments(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/teacher-assignments`,
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

        throw new Error(
          await getErrorMessage(
            response,
            `Failed to load teacher assignments (${response.status})`
          )
        );

      }

      const data =
        await response.json();

      setAssignments(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Error loading assignments:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load teacher assignments."
      );

    } finally {

      setLoadingAssignments(false);

    }

  };


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  const loadData = async () => {

    try {

      setLoading(true);

      setError("");

      await Promise.all([
        loadTeachers(),
        loadClasses(),
        loadAssignments(),
      ]);

    } catch (err) {

      console.error(
        "Error loading teacher assignment data:",
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


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadData();

  }, []);


  // ==========================================================
  // CLASS NAMES
  // ==========================================================

  const classNames =
    Array.from(
      new Set(
        classes.map(
          (item) =>
            item.name
        )
      )
    ).sort();


  // ==========================================================
  // AVAILABLE SECTIONS
  // ==========================================================

  const availableSections =
    classes
      .filter(
        (item) =>
          item.name ===
          selectedClass
      )
      .map(
        (item) =>
          item.section
      );


  // ==========================================================
  // GET TEACHER NAME
  // ==========================================================

  const getTeacherName = (
    teacher: Teacher
  ): string => {

    return (
      teacher.full_name ||
      teacher.name ||
      teacher.email
    );

  };


  // ==========================================================
  // LOAD SUBJECTS FOR CLASS
  // ==========================================================

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

      const params =
        new URLSearchParams({
          class_name:
            className,

          section:
            section,

          academic_year:
            schoolClass.academic_year,
        });

      const response =
        await fetch(
          `${API_BASE_URL}/api/subjects/class-options?${params.toString()}`,
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

        throw new Error(
          await getErrorMessage(
            response,
            `Failed to load subjects (${response.status})`
          )
        );

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
  // HANDLE CLASS CHANGE
  // ==========================================================

  const handleClassChange = (
    value: string
  ) => {

    setSelectedClass(value);

    setSelectedSection("");

    setSelectedSubject("");

    setClassSubjects([]);

  };


  // ==========================================================
  // HANDLE SECTION CHANGE
  // ==========================================================

  const handleSectionChange = async (
    value: string
  ) => {

    setSelectedSection(value);

    setSelectedSubject("");

    setClassSubjects([]);

    if (
      !selectedClass ||
      !value
    ) {

      return;

    }

    await loadClassSubjects(
      selectedClass,
      value
    );

  };


  // ==========================================================
  // HANDLE CLASS TEACHER
  // ==========================================================

  const handleClassTeacherChange = (
    checked: boolean
  ) => {

    setIsClassTeacher(checked);

    if (checked) {

      setSelectedSubject("");

    }

  };


  // ==========================================================
  // CLEAR FORM
  // ==========================================================

  const clearForm = () => {

    setSelectedTeacher("");

    setSelectedClass("");

    setSelectedSection("");

    setSelectedSubject("");

    setClassSubjects([]);

    setIsClassTeacher(false);

  };


  // ==========================================================
  // ASSIGN TEACHER
  // ==========================================================

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


      // ------------------------------------------------------
      // VALIDATE TEACHER
      // ------------------------------------------------------

      if (!selectedTeacher) {

        throw new Error(
          "Please select a teacher."
        );

      }


      // ------------------------------------------------------
      // VALIDATE CLASS
      // ------------------------------------------------------

      if (!selectedClass) {

        throw new Error(
          "Please select a class."
        );

      }


      // ------------------------------------------------------
      // VALIDATE SECTION
      // ------------------------------------------------------

      if (!selectedSection) {

        throw new Error(
          "Please select a section."
        );

      }


      // ------------------------------------------------------
      // VALIDATE SUBJECT
      // ------------------------------------------------------

      if (
        !isClassTeacher &&
        !selectedSubject
      ) {

        throw new Error(
          "Please select a subject."
        );

      }


      // ------------------------------------------------------
      // FIND TEACHER
      // ------------------------------------------------------

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


      // ======================================================
      // CLASS TEACHER
      // ======================================================

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
                    },
                  ],
                }),
            }
          );


        if (!response.ok) {

          throw new Error(
            await getErrorMessage(
              response,
              `Failed to assign class teacher (${response.status})`
            )
          );

        }


        const createdAssignments =
          await response.json();


        const assignedTeacherName =
          getTeacherName(teacher);


        setSuccess(
          `${assignedTeacherName} has been successfully assigned as Class Teacher for ${selectedClass} - Section ${selectedSection}.`
        );


        console.log(
          "Class teacher assignment:",
          createdAssignments
        );


        clearForm();

        await loadAssignments();

        return;

      }


      // ======================================================
      // SUBJECT TEACHER
      // ======================================================

      const subject =
        classSubjects.find(
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
                  },
                ],
              }),
          }
        );


      if (!response.ok) {

        throw new Error(
          await getErrorMessage(
            response,
            `Failed to assign subject teacher (${response.status})`
          )
        );

      }


      const createdAssignments =
        await response.json();


      const assignedTeacherName =
        getTeacherName(teacher);


      setSuccess(
        `${assignedTeacherName} has been successfully assigned to teach ${subject.name} for ${selectedClass} - Section ${selectedSection}.`
      );


      console.log(
        "Subject teacher assignment:",
        createdAssignments
      );


      clearForm();

      await loadAssignments();

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


  // ==========================================================
  // FILTER ASSIGNMENTS
  // ==========================================================

  const filteredAssignments =
    assignments.filter(
      (assignment) => {

        const search =
          assignmentSearch
            .trim()
            .toLowerCase();

        const matchesSearch =
          !search ||
          assignment.teacher_name
            .toLowerCase()
            .includes(search) ||
          assignment.teacher_email
            .toLowerCase()
            .includes(search) ||
          assignment.class_name
            .toLowerCase()
            .includes(search) ||
          assignment.section
            .toLowerCase()
            .includes(search) ||
          (
            assignment.subject_name || ""
          )
            .toLowerCase()
            .includes(search);


        const matchesClass =
          !assignmentClassFilter ||
          assignment.class_name ===
            assignmentClassFilter;


        const assignmentType =
          assignment.is_class_teacher
            ? "class"
            : "subject";


        const matchesType =
          !assignmentTypeFilter ||
          assignmentType ===
            assignmentTypeFilter;


        return (
          matchesSearch &&
          matchesClass &&
          matchesType
        );

      }
    );


  // ==========================================================
  // LOADING STATE
  // ==========================================================

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


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="teacher-assignments">


      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {success && (

        <div className="teacher-assignment-message success">

          <Check size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={16} />
          </button>

        </div>

      )}


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (

        <div className="teacher-assignment-message error">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>

      )}


      {/* ================================================== */}
      {/* ASSIGNMENT CARD */}
      {/* ================================================== */}

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
              Teacher
            </label>

            <select
              value={selectedTeacher}
              onChange={(event) =>
                setSelectedTeacher(
                  event.target.value
                )
              }
              disabled={assigning}
            >

              <option value="">
                Select teacher
              </option>

              {teachers.map(
                (teacher) => (

                  <option
                    key={teacher.id}
                    value={teacher.id}
                  >
                    {getTeacherName(teacher)}
                    {" — "}
                    {teacher.email}
                  </option>

                )
              )}

            </select>

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
                handleSectionChange(
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
                      {subject.name}
                      {" "}
                      ({subject.code})
                    </option>

                  )
                )}

              </select>

              <small>
                Only subjects assigned to this
                class and section are shown.
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


      {/* ================================================== */}
      {/* EXISTING ASSIGNMENTS */}
      {/* ================================================== */}

      <div className="teacher-assignment-card">

        <div className="teacher-assignment-card-header">

          <div>

            <h2>
              Current Teacher Assignments
            </h2>

            <p>
              View which teacher is assigned to
              each class, section and subject.
            </p>

          </div>

          <button
            type="button"
            onClick={loadAssignments}
            disabled={loadingAssignments}
            title="Refresh assignments"
          >
            <RefreshCw
              size={20}
              className={
                loadingAssignments
                  ? "spinning"
                  : ""
              }
            />
          </button>

        </div>


        {/* ================================================== */}
        {/* FILTERS */}
        {/* ================================================== */}

        {assignments.length > 0 && (

          <div className="teacher-assignment-form">

            <div className="teacher-assignment-field">

              <label>
                Search
              </label>

              <input
                type="text"
                placeholder="Teacher, email, class or subject"
                value={assignmentSearch}
                onChange={(event) =>
                  setAssignmentSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="teacher-assignment-field">

              <label>
                Class
              </label>

              <select
                value={assignmentClassFilter}
                onChange={(event) =>
                  setAssignmentClassFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Classes
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


            <div className="teacher-assignment-field">

              <label>
                Assignment Type
              </label>

              <select
                value={assignmentTypeFilter}
                onChange={(event) =>
                  setAssignmentTypeFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  All Types
                </option>

                <option value="class">
                  Class Teachers
                </option>

                <option value="subject">
                  Subject Teachers
                </option>

              </select>

            </div>

          </div>

        )}


        {/* ================================================== */}
        {/* TABLE */}
        {/* ================================================== */}

        {filteredAssignments.length > 0 ? (

          <div className="teacher-assignment-table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Teacher
                  </th>

                  <th>
                    Class
                  </th>

                  <th>
                    Section
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Assignment Type
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredAssignments.map(
                  (assignment) => (

                    <tr
                      key={
                        assignment.id
                      }
                    >

                      {/* TEACHER */}

                      <td>

                        <strong>
                          {
                            assignment.teacher_name
                          }
                        </strong>

                        <br />

                        <small>
                          {
                            assignment.teacher_email
                          }
                        </small>

                      </td>


                      {/* CLASS */}

                      <td>
                        {
                          assignment.class_name
                        }
                      </td>


                      {/* SECTION */}

                      <td>
                        Section{" "}
                        {
                          assignment.section
                        }
                      </td>


                      {/* SUBJECT */}

                      <td>

                        {assignment.is_class_teacher
                          ? "—"
                          : (
                            <>
                              {
                                assignment.subject_name
                              }

                              {assignment.subject_code && (
                                <>
                                  {" "}
                                  (
                                  {
                                    assignment.subject_code
                                  }
                                  )
                                </>
                              )}
                            </>
                          )}

                      </td>


                      {/* TYPE */}

                      <td>

                        <span
                          className={
                            assignment.is_class_teacher
                              ? "teacher-assignment-type class-teacher"
                              : "teacher-assignment-type subject-teacher"
                          }
                        >

                          {assignment.is_class_teacher
                            ? "Class Teacher"
                            : "Subject Teacher"}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="teacher-assignment-empty">

            <BookOpen size={30} />

            <strong>
              {assignments.length === 0
                ? "No teacher assignments yet"
                : "No assignments match your filters"}
            </strong>

            <span>
              {assignments.length === 0
                ? "Assign a teacher above to see the assignment here."
                : "Try changing your search or filters."}
            </span>

          </div>

        )}

      </div>


      {/* ================================================== */}
      {/* INFORMATION */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* NO TEACHERS */}
      {/* ================================================== */}

      {teachers.length === 0 && (

        <div className="teacher-assignment-empty">

          <UserPlus size={30} />

          <strong>
            No teachers found
          </strong>

          <span>
            Create a teacher first from the
            Teachers page before making
            assignments.
          </span>

        </div>

      )}

    </div>

  );

}