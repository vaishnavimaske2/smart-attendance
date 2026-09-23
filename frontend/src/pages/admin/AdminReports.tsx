import {
  useEffect,
  useState,
} from "react";

import "./AdminReports.css";
// ============================================================
// TYPES
// ============================================================

interface ClassOption {
  id: number;
  name: string;
  section: string;
  academic_year: string;
  is_active: boolean;
}


interface SubjectOption {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}


// ============================================================
// API BASE URL
// ============================================================

const API_BASE_URL = "";


// ============================================================
// ADMIN REPORTS
// ============================================================

function AdminReports() {

  // ----------------------------------------------------------
  // CLASS OPTIONS
  // ----------------------------------------------------------

  const [
    classes,
    setClasses
  ] = useState<ClassOption[]>([]);


  // ----------------------------------------------------------
  // SUBJECT OPTIONS
  // ----------------------------------------------------------

  const [
    subjects,
    setSubjects
  ] = useState<SubjectOption[]>([]);


  // ----------------------------------------------------------
  // SELECTED CLASS
  // ----------------------------------------------------------

  const [
    selectedClassId,
    setSelectedClassId
  ] = useState("");


  // ----------------------------------------------------------
  // SELECTED SECTION
  // ----------------------------------------------------------

  const [
    selectedSection,
    setSelectedSection
  ] = useState("");


  // ----------------------------------------------------------
  // SELECTED ACADEMIC YEAR
  // ----------------------------------------------------------

  const [
    selectedAcademicYear,
    setSelectedAcademicYear
  ] = useState("");


  // ----------------------------------------------------------
  // SELECTED SUBJECT
  // ----------------------------------------------------------

  const [
    selectedSubjectId,
    setSelectedSubjectId
  ] = useState("");


  // ----------------------------------------------------------
  // PERIOD
  // ----------------------------------------------------------

  const [
    period,
    setPeriod
  ] = useState("whole");


  // ----------------------------------------------------------
  // FROM DATE
  // ----------------------------------------------------------

  const [
    fromDate,
    setFromDate
  ] = useState("");


  // ----------------------------------------------------------
  // TO DATE
  // ----------------------------------------------------------

  const [
    toDate,
    setToDate
  ] = useState("");


  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  const [
    loadingClasses,
    setLoadingClasses
  ] = useState(false);


  const [
    loadingSubjects,
    setLoadingSubjects
  ] = useState(false);


  const [
    exporting,
    setExporting
  ] = useState(false);


  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  const [
    error,
    setError
  ] = useState("");


  // ==========================================================
  // TOKEN
  // ==========================================================

  function getToken() {

    return localStorage.getItem(
      "Smart Attend token"
    );

  }


  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  useEffect(() => {

    loadClasses();

  }, []);


  async function loadClasses() {

    setLoadingClasses(true);

    setError("");

    try {

      const token =
        getToken();


      const response =
        await fetch(
          `${API_BASE_URL}/api/classes/options`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          "Unable to load classes."
        );

      }


      const data =
        await response.json();


      setClasses(data);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load classes."
      );

    } finally {

      setLoadingClasses(false);

    }

  }


  // ==========================================================
  // SELECTED CLASS OBJECT
  // ==========================================================

  const selectedClass =
    classes.find(
      (schoolClass) =>
        String(schoolClass.id)
        === selectedClassId
    );

  // ==========================================================
  // HANDLE SECTION CHANGE
  // ==========================================================

  function handleSectionChange(
    value: string
  ) {

    setSelectedSection(value);

    setSelectedSubjectId("");

    setSubjects([]);

    setError("");


    const schoolClass =
      classes.find(
        (item) =>
          item.name ===
            selectedClass?.name
          &&
          item.section ===
            value
      );


    if (schoolClass) {

      setSelectedClassId(
        String(schoolClass.id)
      );

      setSelectedAcademicYear(
        schoolClass.academic_year
      );

    }

  }


  // ==========================================================
  // LOAD SUBJECTS
  // ==========================================================

  useEffect(() => {

    if (
      !selectedClassId ||
      !selectedSection ||
      !selectedAcademicYear
    ) {

      setSubjects([]);

      return;

    }


    loadSubjects();

  }, [
    selectedClassId,
    selectedSection,
    selectedAcademicYear
  ]);


  async function loadSubjects() {

    setLoadingSubjects(true);

    setError("");

    try {

      const token =
        getToken();


      const params =
        new URLSearchParams({

          class_name:
            selectedClass?.name || "",

          section:
            selectedSection,

          academic_year:
            selectedAcademicYear,

        });


      const response =
        await fetch(
          `${API_BASE_URL}/api/subjects/class-options?${params.toString()}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (!response.ok) {

        const errorData =
          await response.json()
            .catch(() => null);


        throw new Error(
          errorData?.detail ||
          "Unable to load subjects."
        );

      }


      const data =
        await response.json();


      setSubjects(data);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subjects."
      );

    } finally {

      setLoadingSubjects(false);

    }

  }


  // ==========================================================
  // UNIQUE CLASS NAMES
  // ==========================================================

  const classNames =
    Array.from(
      new Set(
        classes.map(
          (item) => item.name
        )
      )
    );


  // ==========================================================
  // SECTIONS FOR SELECTED CLASS
  // ==========================================================

  const sections =
    selectedClass
      ? classes.filter(
          (item) =>
            item.name ===
            selectedClass.name
        )
      : [];


  // ==========================================================
  // CLASS NAME CHANGE
  // ==========================================================

  function handleClassNameChange(
    value: string
  ) {

    setSelectedClassId("");

    setSelectedSection("");

    setSelectedAcademicYear("");

    setSelectedSubjectId("");

    setSubjects([]);

    setError("");


    const firstClass =
      classes.find(
        (item) =>
          item.name === value
      );


    if (firstClass) {

      setSelectedClassId(
        String(firstClass.id)
      );

      setSelectedAcademicYear(
        firstClass.academic_year
      );

    }

  }


  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  async function handleExport() {

    setError("");


    // --------------------------------------------------------
    // VALIDATE CLASS
    // --------------------------------------------------------

    if (!selectedClass) {

      setError(
        "Please select a class."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE SECTION
    // --------------------------------------------------------

    if (!selectedSection) {

      setError(
        "Please select a section."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE SUBJECT
    // --------------------------------------------------------

    if (!selectedSubjectId) {

      setError(
        "Please select a subject."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE CUSTOM DATES
    // --------------------------------------------------------

    if (period === "custom") {

      if (!fromDate || !toDate) {

        setError(
          "Please select both From Date and To Date."
        );

        return;

      }


      if (fromDate > toDate) {

        setError(
          "From Date cannot be after To Date."
        );

        return;

      }

    }


    const selectedSubject =
      subjects.find(
        (subject) =>
          String(subject.id)
          === selectedSubjectId
      );


    if (!selectedSubject) {

      setError(
        "Selected subject could not be found."
      );

      return;

    }


    setExporting(true);


    try {

      const token =
        getToken();


      const params =
        new URLSearchParams({

          class_name:
            selectedClass.name,

          section:
            selectedSection,

          subject_name:
            selectedSubject.name,

          period:

            period,

        });


      if (period === "custom") {

        params.set(
          "from_date",
          fromDate
        );

        params.set(
          "to_date",
          toDate
        );

      }


      const response =
        await fetch(
          `${API_BASE_URL}/api/attendance-excel/export?${params.toString()}`,
          {
            method: "GET",

            headers: {

              Authorization:
                `Bearer ${token}`,

            },

          }
        );


      if (!response.ok) {

        let message =
          "Unable to export attendance report.";


        try {

          const data =
            await response.json();


          if (data?.detail) {

            message =
              data.detail;

          }

        } catch {

          // Keep default message.

        }


        throw new Error(
          message
        );

      }


      const blob =
        await response.blob();


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href = url;


      link.download =
        "attendance_report.xlsx";


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        url
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to export report."
      );

    } finally {

      setExporting(false);

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="role-page">


      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="page-header">

        <div>

          <h2>
            Attendance Reports
          </h2>

          <p>
            View and export class, section and subject-wise
            attendance reports.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* REPORT FILTER */}
      {/* ================================================== */}

      <div className="card">


        <div className="card-header">

          <div>

            <h3>
              Generate Attendance Report
            </h3>

            <p>
              Select the class, section, subject and report
              period.
            </p>

          </div>

        </div>


        <div className="form-grid">


          {/* ============================================== */}
          {/* CLASS */}
          {/* ============================================== */}

          <div className="form-group">

            <label>
              Class
            </label>

            <select
              value={
                selectedClass?.name || ""
              }
              onChange={(event) =>
                handleClassNameChange(
                  event.target.value
                )
              }
              disabled={
                loadingClasses
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


          {/* ============================================== */}
          {/* SECTION */}
          {/* ============================================== */}

          <div className="form-group">

            <label>
              Section
            </label>

            <select
              value={
                selectedSection
              }
              onChange={(event) =>
                handleSectionChange(
                  event.target.value
                )
              }
              disabled={
                !selectedClass ||
                loadingClasses
              }
            >

              <option value="">
                Select Section
              </option>

              {sections.map(
                (schoolClass) => (

                  <option
                    key={
                      schoolClass.id
                    }
                    value={
                      schoolClass.section
                    }
                  >
                    {schoolClass.section}
                  </option>

                )
              )}

            </select>

          </div>


          {/* ============================================== */}
          {/* SUBJECT */}
          {/* ============================================== */}

          <div className="form-group">

            <label>
              Subject
            </label>

            <select
              value={
                selectedSubjectId
              }
              onChange={(event) =>
                setSelectedSubjectId(
                  event.target.value
                )
              }
              disabled={
                !selectedSection ||
                loadingSubjects
              }
            >

              <option value="">
                {loadingSubjects
                  ? "Loading subjects..."
                  : "Select Subject"}
              </option>

              {subjects.map(
                (subject) => (

                  <option
                    key={
                      subject.id
                    }
                    value={
                      subject.id
                    }
                  >
                    {subject.name}
                    {" "}
                    ({subject.code})
                  </option>

                )
              )}

            </select>

          </div>


          {/* ============================================== */}
          {/* PERIOD */}
          {/* ============================================== */}

          <div className="form-group">

            <label>
              Report Period
            </label>

            <select
              value={period}
              onChange={(event) => {

                setPeriod(
                  event.target.value
                );

                if (
                  event.target.value !==
                  "custom"
                ) {

                  setFromDate("");

                  setToDate("");

                }

              }}
            >

              <option value="weekly">
                Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="whole">
                Whole Attendance
              </option>

              <option value="custom">
                Specific Date Range
              </option>

            </select>

          </div>


          {/* ============================================== */}
          {/* FROM DATE */}
          {/* ============================================== */}

          {period === "custom" && (

            <div className="form-group">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
              />

            </div>

          )}


          {/* ============================================== */}
          {/* TO DATE */}
          {/* ============================================== */}

          {period === "custom" && (

            <div className="form-group">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
              />

            </div>

          )}

        </div>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (

          <div className="form-error">

            {error}

          </div>

        )}


        {/* ================================================== */}
        {/* EXPORT */}
        {/* ================================================== */}

        <div className="form-actions">

          <button
            type="button"
            onClick={
              handleExport
            }
            disabled={
              exporting ||
              loadingClasses ||
              loadingSubjects
            }
          >

            {exporting
              ? "Exporting..."
              : "Export Excel Sheet"}

          </button>

        </div>


      </div>


      {/* ================================================== */}
      {/* REPORT INFORMATION */}
      {/* ================================================== */}

      <div className="card">

        <div className="card-header">

          <div>

            <h3>
              Excel Report
            </h3>

            <p>
              The exported Excel sheet will contain:
            </p>

          </div>

        </div>


        <div className="report-columns">

          <span>
            Roll Number
          </span>

          <span>
            Name
          </span>

          <span>
            Division
          </span>

          <span>
            Gender
          </span>

          <span>
            Total Lectures
          </span>

          <span>
            Present
          </span>

          <span>
            Absent
          </span>

          <span>
            Attendance %
          </span>

        </div>

      </div>


    </div>

  );

}


export default AdminReports;