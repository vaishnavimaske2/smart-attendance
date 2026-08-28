import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Check,
  X,
} from "lucide-react";

import "./Subjects.css";

// ============================================================
// TYPES
// ============================================================

interface Subject {
  id: number;
  name: string;
  code: string;
  school_id?: number;
  is_active?: boolean;
  class_count?: number;
}

interface ClassItem {
  id: number;
  name: string;
  section: string;
  academic_year: string;
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

export default function Subjects() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [subjects, setSubjects] =
    useState<Subject[]>([]);

  const [classes, setClasses] =
    useState<ClassItem[]>([]);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [savingSubject, setSavingSubject] =
    useState(false);

  const [assigningSubjects, setAssigningSubjects] =
    useState(false);

  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // CREATE SUBJECT
  // ==========================================================

  const [subjectName, setSubjectName] =
    useState("");

  const [subjectCode, setSubjectCode] =
    useState("");

  // ==========================================================
  // ASSIGN SUBJECTS
  // ==========================================================

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");

  const [selectedSubjects, setSelectedSubjects] =
    useState<number[]>([]);

    // ==========================================================
  // CLASS-WISE SUBJECT VIEW
  // ==========================================================

  const [viewClass, setViewClass] =
    useState("");

  const [viewSection, setViewSection] =
    useState("");

  const [viewSubjects, setViewSubjects] =
    useState<Subject[]>([]);

  const [loadingViewSubjects, setLoadingViewSubjects] =
    useState(false);

  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = (): string | null => {

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

      // ======================================================
      // LOAD SUBJECTS + CLASSES
      // ======================================================

      const [
        subjectsResponse,
        classesResponse,
      ] = await Promise.all([

        fetch(
          `${API_BASE_URL}/api/subjects/options`,
          {
            method: "GET",
            headers,
          }
        ),

        // IMPORTANT:
        // classes.py prefix = /api/classes
        // route = /options
        //
        // Final endpoint:
        // /api/classes/options

        fetch(
          `${API_BASE_URL}/api/classes/options`,
          {
            method: "GET",
            headers,
          }
        ),

      ]);

      // ======================================================
      // SUBJECT ERROR
      // ======================================================

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

      // ======================================================
      // CLASS ERROR
      // ======================================================

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

      // ======================================================
      // PARSE
      // ======================================================

      const subjectsData =
        await subjectsResponse.json();

      const classesData =
        await classesResponse.json();

      // ======================================================
      // SET SUBJECTS
      // ======================================================

      setSubjects(

        Array.isArray(subjectsData)
          ? subjectsData
          : []

      );

      // ======================================================
      // SET CLASSES
      // ======================================================

      setClasses(

        Array.isArray(classesData)
          ? classesData
          : []

      );

    } catch (err) {

      console.error(
        "Error loading subjects:",
        err
      );

      setError(

        err instanceof Error
          ? err.message
          : "Failed to load subjects."

      );

    } finally {

      setLoading(false);

    }

  };

  // ==========================================================
  // CREATE SUBJECT
  // ==========================================================

  const createSubject = async () => {

    try {

      setSavingSubject(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {

        throw new Error(
          "Authentication token not found. Please login again."
        );

      }

      const name =
        subjectName.trim();

      const code =
        subjectCode
          .trim()
          .toUpperCase();

      if (!name) {

        throw new Error(
          "Please enter a subject name."
        );

      }

      if (!code) {

        throw new Error(
          "Please enter a subject code."
        );

      }

      // ======================================================
      // CREATE API
      // ======================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/subjects/admin`,
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

                name,
                code,

              }),

          }
        );

      const responseText =
        await response.text();

      // ======================================================
      // ERROR
      // ======================================================

      if (!response.ok) {

        let message =
          `Failed to create subject (${response.status})`;

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

      // ======================================================
      // RESPONSE
      // ======================================================

      let data: {
        message?: string;
        subject?: Subject;
      } | null = null;

      try {

        data =
          JSON.parse(responseText);

      } catch {
        // Ignore invalid JSON
      }

      setSuccess(

        data?.message ||
        "Subject created successfully."

      );

      setSubjectName("");
      setSubjectCode("");

      // Refresh data

      await loadData();

    } catch (err) {

      console.error(
        "Error creating subject:",
        err
      );

      setError(

        err instanceof Error
          ? err.message
          : "Failed to create subject."

      );

    } finally {

      setSavingSubject(false);

    }

  };

  // ==========================================================
  // CLEAR CREATE FORM
  // ==========================================================

  const clearSubjectForm = () => {

    setSubjectName("");
    setSubjectCode("");

  };

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

    );

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
  // CLASS CHANGE
  // ==========================================================

  const handleClassChange = (
    value: string
  ) => {

    setSelectedClass(value);

    setSelectedSection("");

    setSelectedSubjects([]);

  };

  // ==========================================================
  // SECTION CHANGE
  // ==========================================================

  const handleSectionChange = (
    value: string
  ) => {

    setSelectedSection(value);

    setSelectedSubjects([]);

  };

  // ==========================================================
  // LOAD CLASS-WISE SUBJECTS
  // ==========================================================

  const loadViewSubjects = async (
    className: string,
    section: string
  ) => {

    try {

      setLoadingViewSubjects(true);
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

        setViewSubjects([]);

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

      const responseText =
        await response.text();

      if (!response.ok) {

        let message =
          `Failed to load class subjects (${response.status})`;

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

      let data: unknown = [];

      try {

        data =
          JSON.parse(responseText);

      } catch {
        data = [];
      }

      setViewSubjects(
        Array.isArray(data)
          ? data as Subject[]
          : []
      );

    } catch (err) {

      console.error(
        "Error loading class-wise subjects:",
        err
      );

      setViewSubjects([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load class subjects."
      );

    } finally {

      setLoadingViewSubjects(false);

    }

  };

  // ==========================================================
  // CLASS-WISE VIEW CLASS CHANGE
  // ==========================================================

  const handleViewClassChange = (
    value: string
  ) => {

    setViewClass(value);

    setViewSection("");

    setViewSubjects([]);

  };


  // ==========================================================
  // CLASS-WISE VIEW SECTION CHANGE
  // ==========================================================

  const handleViewSectionChange = async (
    value: string
  ) => {

    setViewSection(value);

    setViewSubjects([]);

    if (!viewClass || !value) {

      return;

    }

    await loadViewSubjects(
      viewClass,
      value
    );

  };

  // ==========================================================
  // TOGGLE SUBJECT
  // ==========================================================

  const toggleSubject = (
    subjectId: number
  ) => {

    setSelectedSubjects(
      (previous) => {

        if (
          previous.includes(
            subjectId
          )
        ) {

          return previous.filter(
            (id) =>
              id !== subjectId
          );

        }

        return [
          ...previous,
          subjectId,
        ];

      }
    );

  };

  // ==========================================================
  // SELECT ALL
  // ==========================================================

  const selectAllSubjects = () => {

    setSelectedSubjects(

      subjects.map(
        (subject) =>
          subject.id
      )

    );

  };

  // ==========================================================
  // CLEAR ALL
  // ==========================================================

  const deselectAllSubjects = () => {

    setSelectedSubjects([]);

  };

  // ==========================================================
  // CLEAR ASSIGNMENT
  // ==========================================================

  const clearAssignmentForm = () => {

    setSelectedClass("");

    setSelectedSection("");

    setSelectedSubjects([]);

  };

  // ==========================================================
  // ASSIGN SUBJECTS
  // ==========================================================

  const assignSubjects = async () => {

    try {

      setAssigningSubjects(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {

        throw new Error(
          "Authentication token not found. Please login again."
        );

      }

      if (!selectedClass) {

        throw new Error(
          "Please select a class."
        );

      }

      if (!selectedSection) {

        throw new Error(
          "Please select a section."
        );

      }

      if (
        selectedSubjects.length === 0
      ) {

        throw new Error(
          "Please select at least one subject."
        );

      }

      // ======================================================
      // FIND CLASS
      // ======================================================

      const schoolClass =
        classes.find(
          (item) =>
            item.name ===
              selectedClass &&
            item.section ===
              selectedSection
        );

      if (!schoolClass) {

        throw new Error(
          "Selected class could not be found."
        );

      }

      // ======================================================
      // API REQUEST
      // ======================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/subjects/bulk`,
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

                class_name:
                  selectedClass,

                section:
                  selectedSection,

                academic_year:
                  schoolClass.academic_year,

                subject_ids:
                  selectedSubjects,

              }),

          }
        );

      const responseText =
        await response.text();

      // ======================================================
      // ERROR
      // ======================================================

      if (!response.ok) {

        let message =
          `Failed to assign subjects (${response.status})`;

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

      // ======================================================
      // SUCCESS RESPONSE
      // ======================================================

      let data: {
        message?: string;
        added_subjects?: unknown[];
        skipped_subjects?: unknown[];
      } | null = null;

      try {

        data =
          JSON.parse(responseText);

      } catch {
        // Ignore invalid JSON
      }

      let message =
        data?.message ||
        "Subjects assigned successfully.";

      if (
        Array.isArray(
          data?.added_subjects
        ) &&
        data.added_subjects.length > 0
      ) {

        message +=
          ` Added ${data.added_subjects.length} subject(s).`;

      }

      if (
        Array.isArray(
          data?.skipped_subjects
        ) &&
        data.skipped_subjects.length > 0
      ) {

        message +=
          ` Skipped ${data.skipped_subjects.length} already assigned subject(s).`;

      }

      setSuccess(message);

      clearAssignmentForm();

    } catch (err) {

      console.error(
        "Error assigning subjects:",
        err
      );

      setError(

        err instanceof Error
          ? err.message
          : "Failed to assign subjects."

      );

    } finally {

      setAssigningSubjects(false);

    }

  };

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (
      <div className="admin-subjects">

        <div className="admin-table-empty">

          <BookOpen size={32} />

          <strong>
            Loading subjects...
          </strong>

          <span>
            Please wait while the data is loaded.
          </span>

        </div>

      </div>
    );

  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="admin-subjects">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="admin-module-header">

        <div>

          <span className="admin-module-label">
            ADMINISTRATION
          </span>

          <h1>
            Subjects
          </h1>

          <p>
            Create subjects and assign them
            to your classes.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================== */}

      {success && (

        <div className="admin-form-message admin-form-message-success">

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


      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (

        <div className="admin-form-message admin-form-message-error">

          <X size={18} />

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


      {/* ================================================== */}
      {/* CREATE SUBJECT */}
      {/* ================================================== */}

      <div className="admin-subject-card">

        <div className="admin-subject-card-header">

          <div>

            <span className="admin-card-label">
              SUBJECT MANAGEMENT
            </span>

            <h2>
              Create Subject
            </h2>

            <p>
              Add a new subject to your school.
            </p>

          </div>

          <div className="admin-subject-header-icon">
            <Plus size={22} />
          </div>

        </div>


        <div className="admin-subject-form">

          {/* SUBJECT NAME */}

          <div className="admin-form-field">

            <label>
              Subject Name
            </label>

            <input
              type="text"
              value={subjectName}
              onChange={(event) =>
                setSubjectName(
                  event.target.value
                )
              }
              placeholder="Example: Mathematics"
              disabled={savingSubject}
            />

          </div>


          {/* SUBJECT CODE */}

          <div className="admin-form-field">

            <label>
              Subject Code
            </label>

            <input
              type="text"
              value={subjectCode}
              onChange={(event) =>
                setSubjectCode(
                  event.target.value.toUpperCase()
                )
              }
              placeholder="Example: MATH101"
              disabled={savingSubject}
            />

          </div>


          {/* ACTIONS */}

          <div className="admin-class-form-actions">

            <button
              type="button"
              className="admin-secondary-button"
              onClick={clearSubjectForm}
              disabled={savingSubject}
            >
              Clear
            </button>

            <button
              type="button"
              className="admin-primary-button"
              onClick={createSubject}
              disabled={
                savingSubject ||
                !subjectName.trim() ||
                !subjectCode.trim()
              }
            >

              <Plus size={17} />

              {savingSubject
                ? "Creating..."
                : "Create Subject"}

            </button>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* ASSIGN SUBJECTS TO CLASS */}
      {/* ================================================== */}

      <div className="admin-subject-card">

        <div className="admin-subject-card-header">

          <div>

            <span className="admin-card-label">
              CLASS ASSIGNMENT
            </span>

            <h2>
              Assign Subjects to Class
            </h2>

            <p>
              Select a class, section and the
              subjects that belong to it.
            </p>

          </div>

          <div className="admin-subject-header-icon">
            <BookOpen size={22} />
          </div>

        </div>


        <div className="admin-subject-form">

          {/* ================================================= */}
          {/* CLASS */}
          {/* ================================================= */}

          <div className="admin-form-field">

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
              disabled={assigningSubjects}
            >

              <option value="">
                Select Class
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

          <div className="admin-form-field">

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
                assigningSubjects
              }
            >

              <option value="">
                Select Section
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
          {/* SUBJECT SELECTION */}
          {/* ================================================= */}

          <div className="admin-form-field">

            <div className="admin-subject-selection-header">

              <label>
                Subjects
              </label>

              <div className="admin-subject-selection-actions">

                <button
                  type="button"
                  onClick={selectAllSubjects}
                  disabled={
                    subjects.length === 0 ||
                    assigningSubjects
                  }
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={deselectAllSubjects}
                  disabled={
                    selectedSubjects.length === 0 ||
                    assigningSubjects
                  }
                >
                  Clear All
                </button>

              </div>

            </div>


            {/* SUBJECT BOX */}

            <div className="admin-subject-options">

              {!selectedClass ? (

                <div className="admin-subject-selection-empty">

                  <BookOpen size={25} />

                  <strong>
                    Select a class first
                  </strong>

                  <span>
                    Choose a class to continue.
                  </span>

                </div>

              ) : !selectedSection ? (

                <div className="admin-subject-selection-empty">

                  <BookOpen size={25} />

                  <strong>
                    Select a section
                  </strong>

                  <span>
                    Choose a section to see the subjects.
                  </span>

                </div>

              ) : subjects.length === 0 ? (

                <div className="admin-subject-selection-empty">

                  <BookOpen size={25} />

                  <strong>
                    No subjects available
                  </strong>

                  <span>
                    Create a subject first.
                  </span>

                </div>

              ) : (

                subjects.map(
                  (subject) => (

                    <label
                      key={subject.id}
                      className={
                        selectedSubjects.includes(
                          subject.id
                        )
                          ? "admin-subject-option selected"
                          : "admin-subject-option"
                      }
                    >

                      <input
                        type="checkbox"
                        checked={
                          selectedSubjects.includes(
                            subject.id
                          )
                        }
                        onChange={() =>
                          toggleSubject(
                            subject.id
                          )
                        }
                        disabled={
                          assigningSubjects
                        }
                      />

                      <span className="admin-subject-option-name">

                        {subject.name}

                      </span>

                      <small>

                        {subject.code}

                      </small>

                    </label>

                  )
                )

              )}

            </div>

          </div>


          {/* ================================================= */}
          {/* ASSIGN BUTTONS */}
          {/* ================================================= */}

          <div className="admin-class-form-actions">

            <button
              type="button"
              className="admin-secondary-button"
              onClick={clearAssignmentForm}
              disabled={assigningSubjects}
            >
              Clear
            </button>


            <button
              type="button"
              className="admin-primary-button"
              onClick={assignSubjects}
              disabled={
                assigningSubjects ||
                !selectedClass ||
                !selectedSection ||
                selectedSubjects.length === 0
              }
            >

              <Check size={17} />

              {assigningSubjects
                ? "Assigning..."
                : "Assign Subjects"}

            </button>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* AVAILABLE SUBJECTS */}
      {/* ================================================== */}

      {/* ================================================== */}
      {/* CLASS-WISE SUBJECTS */}
      {/* ================================================== */}

      <div className="admin-subject-card">

        <div className="admin-subject-card-header">

          <div>

            <span className="admin-card-label">
              CLASS-WISE VIEW
            </span>

            <h2>
              Subjects by Class
            </h2>

            <p>
              Select a class and section to see the
              subjects assigned to it.
            </p>

          </div>

          <div className="admin-subject-header-icon">
            <BookOpen size={22} />
          </div>

        </div>


        {/* ================================================= */}
        {/* CLASS / SECTION SELECTORS */}
        {/* ================================================= */}

        <div className="admin-class-view-selectors">

          <div className="admin-form-field">

            <label>
              Class
            </label>

            <select
              value={viewClass}
              onChange={(event) =>
                handleViewClassChange(
                  event.target.value
                )
              }
            >

              <option value="">
                Select Class
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


          <div className="admin-form-field">

            <label>
              Section
            </label>

            <select
              value={viewSection}
              onChange={(event) =>
                handleViewSectionChange(
                  event.target.value
                )
              }
              disabled={!viewClass}
            >

              <option value="">
                Select Section
              </option>

              {classes
                .filter(
                  (item) =>
                    item.name === viewClass
                )
                .map(
                  (item) => item.section
                )
                .filter(
                  (section, index, array) =>
                    array.indexOf(section) === index
                )
                .map(
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

        </div>


        {/* ================================================= */}
        {/* CLASS-WISE SUBJECT RESULTS */}
        {/* ================================================= */}

        {!viewClass ? (

          <div className="admin-subject-selection-empty">

            <BookOpen size={28} />

            <strong>
              Select a class
            </strong>

            <span>
              Choose a class and section to view
              its assigned subjects.
            </span>

          </div>

        ) : !viewSection ? (

          <div className="admin-subject-selection-empty">

            <BookOpen size={28} />

            <strong>
              Select a section
            </strong>

            <span>
              Choose a section to view its subjects.
            </span>

          </div>

        ) : loadingViewSubjects ? (

          <div className="admin-subject-selection-empty">

            <BookOpen size={28} />

            <strong>
              Loading subjects...
            </strong>

            <span>
              Please wait while the subjects are loaded.
            </span>

          </div>

        ) : viewSubjects.length === 0 ? (

          <div className="admin-subject-selection-empty">

            <BookOpen size={28} />

            <strong>
              No subjects assigned
            </strong>

            <span>
              No subjects have been assigned to{" "}
              {viewClass} - Section {viewSection}.
            </span>

          </div>

        ) : (

          <div className="admin-class-subject-grid">

            {viewSubjects.map(
              (subject) => (

                <div
                  key={subject.id}
                  className="admin-class-subject-item"
                >

                  <div className="admin-class-subject-icon">

                    <BookOpen size={19} />

                  </div>

                  <div className="admin-class-subject-info">

                    <strong>
                      {subject.name}
                    </strong>

                    <span>
                      {subject.code}
                    </span>

                  </div>

                  <Check
                    size={18}
                    className="admin-class-subject-check"
                  />

                </div>

              )
            )}

          </div>

        )}

      </div>

      <div className="admin-subject-card">

        <div className="admin-subject-card-header">

          <div>

            <span className="admin-card-label">
              SUBJECTS
            </span>

            <h2>
              Available Subjects
            </h2>

            <p>
              Subjects currently available in
              your school.
            </p>

          </div>


          <span className="admin-subject-count">

            {subjects.length}

            {" "}

            {subjects.length === 1
              ? "Subject"
              : "Subjects"}

          </span>

        </div>


        {subjects.length === 0 ? (

          <div className="admin-table-empty">

            <BookOpen size={30} />

            <strong>
              No subjects yet
            </strong>

            <span>
              Create your first subject above.
            </span>

          </div>

        ) : (

          <div className="admin-subject-list">

            {subjects.map(
              (subject) => (

                <div
                  key={subject.id}
                  className="admin-subject-list-item"
                >

                  <div className="admin-subject-list-icon">

                    <BookOpen size={20} />

                  </div>


                  <div className="admin-subject-list-info">

                    <strong>
                      {subject.name}
                    </strong>

                    <span>
                      Code: {subject.code}
                    </span>

                  </div>


                  <div className="admin-subject-list-status">

                    <span
                      className={
                        subject.is_active === false
                          ? "admin-status-inactive"
                          : "admin-status-active"
                      }
                    >

                      {subject.is_active === false
                        ? "Inactive"
                        : "Active"}

                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );
}