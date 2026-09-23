import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  BarChart3,
  CalendarDays,
  Download,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { apiRequest } from "../../services/api";


// ============================================================
// TYPES
// ============================================================

interface Subject {
  subject_id: number;
  subject_name: string;
}


interface ClassOption {
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
  is_class_teacher?: boolean;
  subjects?: Subject[];
}


interface StudentReport {
  student_id: number;
  student_name: string;
  roll_number: string;
  status: string;
}


interface AttendanceReport {
  message: string;

  class_id: number;
  class_name: string;
  section: string;

  attendance_date: string;

  total_students: number;
  present_students: number;
  absent_students: number;

  students: StudentReport[];
}


// ============================================================
// COMPONENT
// ============================================================

function Reports() {

  // ==========================================================
  // CLASS DATA
  // ==========================================================

  const [classes, setClasses] =
    useState<ClassOption[]>([]);

  const [selectedClassId, setSelectedClassId] =
    useState("");


  // ==========================================================
  // REPORT DATA
  // ==========================================================

  const [report, setReport] =
    useState<AttendanceReport | null>(null);


  // ==========================================================
  // FILTERS
  // ==========================================================

  const [attendanceDate, setAttendanceDate] =
    useState("");


  const [searchTerm, setSearchTerm] =
    useState("");


  // ==========================================================
  // EXCEL EXPORT
  // ==========================================================

  const [exportClassId, setExportClassId] =
    useState("");

  const [exportSection, setExportSection] =
    useState("");

  const [exportSubjectId, setExportSubjectId] =
    useState("");

  const [exportPeriod, setExportPeriod] =
    useState("whole");

  const [exportFromDate, setExportFromDate] =
    useState("");

  const [exportToDate, setExportToDate] =
    useState("");

  const [exporting, setExporting] =
    useState(false);


  // ==========================================================
  // LOADING
  // ==========================================================

  const [loadingClasses, setLoadingClasses] =
    useState(true);


  const [loadingReport, setLoadingReport] =
    useState(false);


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");



  // ==========================================================
  // EXCEL EXPORT CLASS
  // ==========================================================

  const exportClass =
    classes.find(
      (item) =>
        String(item.class_id) === exportClassId &&
        item.section === exportSection
    );


  // ==========================================================
  // EXCEL EXPORT SECTIONS
  // ==========================================================

  const exportSections =
    classes
      .filter(
        (item) =>
          String(item.class_id) === exportClassId
      )
      .map(
        (item) => item.section
      );


  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  useEffect(() => {

    async function loadClasses() {

      try {

        setLoadingClasses(true);
        setError("");

        const response =
          await apiRequest(
            "/api/teacher-students/options"
          ) as {
            classes: Array<{
              class_id: number;
              class_name: string;
              section: string;
              academic_year: string;
              is_class_teacher?: boolean;
              subjects?: Array<{
                id: number;
                name: string;
              }>;
            }>;
          };

        const mappedClasses: ClassOption[] =
          (response?.classes || []).map(
            (schoolClass) => ({
              class_id:
                schoolClass.class_id,

              class_name:
                schoolClass.class_name,

              section:
                schoolClass.section,

              academic_year:
                schoolClass.academic_year,

              is_class_teacher:
                schoolClass.is_class_teacher,

              subjects:
                (schoolClass.subjects || []).map(
                  (subject) => ({
                    subject_id:
                      subject.id,

                    subject_name:
                      subject.name,
                  })
                ),
            })
          );

        setClasses(
          mappedClasses
        );

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load classes."
        );

      } finally {

        setLoadingClasses(false);

      }

    }


    loadClasses();

  }, []);


  // ==========================================================
  // CLASS CHANGE
  // ==========================================================

  function handleClassChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {

    const value =
      event.target.value;

    setSelectedClassId(value);

    setReport(null);

    setSearchTerm("");

    setError("");
    setSuccess("");

  }


  // ==========================================================
  // EXCEL CLASS CHANGE
  // ==========================================================

  function handleExportClassChange(
    value: string
  ) {

    setExportClassId(value);

    setExportSection("");

    setExportSubjectId("");

    setError("");
    setSuccess("");

  }


  // ==========================================================
  // EXCEL SECTION CHANGE
  // ==========================================================

  function handleExportSectionChange(
    value: string
  ) {

    setExportSection(value);

    setExportSubjectId("");

    setError("");
    setSuccess("");

  }


  // ==========================================================
  // DATE CHANGE
  // ==========================================================

  function handleDateChange(
    event: ChangeEvent<HTMLInputElement>
  ) {

    setAttendanceDate(
      event.target.value
    );

    setReport(null);

    setError("");
    setSuccess("");

  }


  // ==========================================================
  // GENERATE REPORT
  // ==========================================================

  async function generateReport() {

    // --------------------------------------------------------
    // VALIDATE CLASS
    // --------------------------------------------------------

    if (!selectedClassId) {

      setError(
        "Please select a class."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE DATE
    // --------------------------------------------------------

    if (!attendanceDate) {

      setError(
        "Please select an attendance date."
      );

      return;

    }


    try {

      setLoadingReport(true);

      setError("");
      setSuccess("");

      const response =
        await apiRequest(
          `/api/attendance-report/class?class_id=${encodeURIComponent(
            selectedClassId
          )}&attendance_date=${encodeURIComponent(
            attendanceDate
          )}`
        ) as AttendanceReport;


      setReport(
        response
      );


      setSuccess(
        "Attendance report generated successfully."
      );

    } catch (error) {

      setReport(null);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate attendance report."
      );

    } finally {

      setLoadingReport(false);

    }

  }


  // ==========================================================
  // EXCEL EXPORT
  // ==========================================================

  async function handleExportExcel() {

    // --------------------------------------------------------
    // VALIDATE CLASS
    // --------------------------------------------------------

    if (!exportClassId) {

      setError(
        "Please select a class for Excel export."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE SECTION
    // --------------------------------------------------------

    if (!exportSection) {

      setError(
        "Please select a section for Excel export."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE CLASS + SECTION
    // --------------------------------------------------------

    if (!exportClass) {

      setError(
        "Selected class and section could not be found."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE SUBJECT
    // --------------------------------------------------------

    if (!exportSubjectId) {

      setError(
        "Please select a subject for Excel export."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE CUSTOM DATES
    // --------------------------------------------------------

    if (
      exportPeriod === "custom"
      && (
        !exportFromDate
        || !exportToDate
      )
    ) {

      setError(
        "Please select both From Date and To Date."
      );

      return;

    }


    if (
      exportPeriod === "custom"
      && exportFromDate > exportToDate
    ) {

      setError(
        "From Date cannot be after To Date."
      );

      return;

    }


    // --------------------------------------------------------
    // FIND SUBJECT
    // --------------------------------------------------------

    const selectedSubject =
      exportClass.subjects?.find(
        (subject) =>
          String(
            subject.subject_id
          ) === exportSubjectId
      );


    if (!selectedSubject) {

      setError(
        "Selected subject could not be found."
      );

      return;

    }


    try {

      setExporting(true);

      setError("");

      setSuccess("");


      // ------------------------------------------------------
      // BUILD QUERY
      // ------------------------------------------------------

      const params =
        new URLSearchParams({

          class_name:
            exportClass.class_name,

          section:
            exportClass.section,

          subject_name:
            selectedSubject.subject_name,

          period:
            exportPeriod,

        });


      // ------------------------------------------------------
      // CUSTOM DATE RANGE
      // ------------------------------------------------------

      if (
        exportPeriod === "custom"
      ) {

        params.set(
          "from_date",
          exportFromDate
        );

        params.set(
          "to_date",
          exportToDate
        );

      }


      // ------------------------------------------------------
      // REQUEST EXCEL FILE
      // ------------------------------------------------------

      const token =
        localStorage.getItem("Smart Attend token");


      const response =
        await fetch(
          `http://127.0.0.1:8000/api/attendance-excel/export?${params.toString()}`,
          {
            method: "GET",

            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : undefined,
          }
        );


      if (!response.ok) {

        let message =
          "Unable to export attendance.";

        try {

          const errorData =
            await response.json();

          if (
            errorData?.detail
          ) {

            message =
              errorData.detail;

          }

        } catch {

          // Ignore JSON parsing errors

        }


        throw new Error(
          message
        );

      }


      // ------------------------------------------------------
      // DOWNLOAD FILE
      // ------------------------------------------------------

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


      link.href =
        url;


      // ------------------------------------------------------
      // FILE NAME
      // ------------------------------------------------------

      link.download =
        `attendance_${exportClass.class_name}_${exportClass.section}_${selectedSubject.subject_name}_${exportPeriod}.xlsx`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.URL.revokeObjectURL(
        url
      );


      setSuccess(
        "Attendance Excel exported successfully."
      );

    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to export attendance."
      );

    } finally {

      setExporting(false);

    }

  }


  // ==========================================================
  // FILTER STUDENTS
  // ==========================================================

  const filteredStudents =
    report?.students.filter(
      (student) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();

        if (!search) {
          return true;
        }

        return (
          student.student_name
            .toLowerCase()
            .includes(search)
          ||
          student.roll_number
            .toLowerCase()
            .includes(search)
        );

      }
    ) || [];


  // ==========================================================
  // ATTENDANCE PERCENTAGE
  // ==========================================================

  const attendancePercentage =
    report &&
    report.total_students > 0
      ? (
          report.present_students /
          report.total_students
        ) * 100
      : 0;


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loadingClasses) {

    return (

      <div className="student-module-loading">

        <RefreshCw
          size={20}
          className="spin"
        />

        Loading reports...

      </div>

    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="teacher-dashboard-page">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="teacher-dashboard-header">

        <div>

          <span className="teacher-dashboard-label">
            REPORTS & ANALYTICS
          </span>

          <h1>
            Attendance Reports
          </h1>

          <p>
            View and analyze student attendance
            for your assigned classes.
          </p>

        </div>

        <div className="reports-header-icon">

          <BarChart3 size={28} />

        </div>

      </div>


      {/* ==================================================== */}
      {/* MESSAGES */}
      {/* ==================================================== */}

      {error && (

        <div className="student-module-error">

          <XCircle size={18} />

          <span>
            {error}
          </span>

        </div>

      )}


      {success && (

        <div className="student-module-success">

          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

        </div>

      )}


      {/* ==================================================== */}
      {/* REPORT FILTER CARD */}
      {/* ==================================================== */}

      <div className="teacher-attendance-card">

        <div className="teacher-attendance-card-title">

          <ClipboardList size={22} />

          <div>

            <h2>
              Generate Attendance Report
            </h2>

            <p>
              Select a class and date to view
              attendance details.
            </p>

          </div>

        </div>


        {/* ================================================== */}
        {/* FILTER GRID */}
        {/* ================================================== */}

        <div className="teacher-attendance-selection-grid">


          {/* ================================================ */}
          {/* CLASS */}
          {/* ================================================ */}

          <div className="teacher-attendance-field">

            <label>
              Class & Section
            </label>

            <div className="reports-input-with-icon">

              <GraduationCap size={18} />

              <select
                value={selectedClassId}
                onChange={
                  handleClassChange
                }
              >

                <option value="">
                  Select class
                </option>

                {classes.map(
                  (schoolClass) => (

                    <option
                      key={
                        schoolClass.class_id
                      }
                      value={
                        schoolClass.class_id
                      }
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

          </div>


          {/* ================================================ */}
          {/* DATE */}
          {/* ================================================ */}

          <div className="teacher-attendance-field">

            <label>
              Attendance Date
            </label>

            <div className="reports-input-with-icon">

              <CalendarDays size={18} />

              <input
                type="date"
                value={
                  attendanceDate
                }
                onChange={
                  handleDateChange
                }
              />

            </div>

          </div>


        </div>


        {/* ================================================== */}
        {/* GENERATE BUTTON */}
        {/* ================================================== */}

        <div className="reports-filter-actions">

          <button
            type="button"
            className="student-primary-button"
            onClick={
              generateReport
            }
            disabled={
              loadingReport
            }
          >

            {loadingReport ? (

              <>

                <RefreshCw
                  size={18}
                  className="spin"
                />

                Generating...

              </>

            ) : (

              <>

                <BarChart3
                  size={18}
                />

                Generate Report

              </>

            )}

          </button>


          {report && (

            <button
              type="button"
              className="student-secondary-button"
              onClick={() => {

                setReport(null);

                setSearchTerm("");

                setSuccess("");

                setError("");

              }}
            >

              <X size={18} />

              Clear Report

            </button>

          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* REPORT SUMMARY */}
      {/* ==================================================== */}

      {report && (

        <div className="reports-summary-grid">


          {/* ================================================= */}
          {/* TOTAL STUDENTS */}
          {/* ================================================= */}

          <div className="reports-summary-card">

            <div className="reports-summary-icon">

              <Users size={22} />

            </div>

            <div className="reports-summary-content">

              <span>
                TOTAL STUDENTS
              </span>

              <strong>
                {report.total_students}
              </strong>

              <p>
                Active students
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* PRESENT */}
          {/* ================================================= */}

          <div className="reports-summary-card reports-summary-present">

            <div className="reports-summary-icon">

              <CheckCircle2 size={22} />

            </div>

            <div className="reports-summary-content">

              <span>
                PRESENT
              </span>

              <strong>
                {report.present_students}
              </strong>

              <p>
                Students present
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* ABSENT */}
          {/* ================================================= */}

          <div className="reports-summary-card reports-summary-absent">

            <div className="reports-summary-icon">

              <XCircle size={22} />

            </div>

            <div className="reports-summary-content">

              <span>
                ABSENT
              </span>

              <strong>
                {report.absent_students}
              </strong>

              <p>
                Students absent
              </p>

            </div>

          </div>


          {/* ================================================= */}
          {/* ATTENDANCE PERCENTAGE */}
          {/* ================================================= */}

          <div className="reports-summary-card reports-summary-percentage">

            <div className="reports-summary-icon">

              <BarChart3 size={22} />

            </div>

            <div className="reports-summary-content">

              <span>
                ATTENDANCE
              </span>

              <strong>
                {attendancePercentage.toFixed(1)}%
              </strong>

              <p>
                Overall attendance
              </p>

            </div>

          </div>


        </div>

      )}


      {/* ==================================================== */}
      {/* STUDENT ATTENDANCE SECTION */}
      {/* ==================================================== */}

      {report && (

        <div className="teacher-students-card">

          <div className="teacher-students-header">

            <div>

              <span>
                ATTENDANCE REPORT
              </span>

              <h2>
                {report.class_name}
                {" — Section "}
                {report.section}
              </h2>

            </div>

            <div className="teacher-students-count">

              <CalendarDays size={17} />

              {report.attendance_date}

            </div>

          </div>

        </div>

      )}


      {/* ==================================================== */}
      {/* STUDENT ATTENDANCE TABLE */}
      {/* ==================================================== */}

      {report && (

        <div className="reports-table-card">

          {/* ================================================== */}
          {/* TABLE HEADER */}
          {/* ================================================== */}

          <div className="reports-table-header">

            <div>

              <span>
                STUDENT ATTENDANCE
              </span>

              <h2>
                Attendance Details
              </h2>

            </div>


            {/* ============================================== */}
            {/* SEARCH */}
            {/* ============================================== */}

            <div className="reports-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search student or roll number..."
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
                  onClick={() =>
                    setSearchTerm("")
                  }
                  title="Clear search"
                >

                  <X size={15} />

                </button>

              )}

            </div>

          </div>


          {/* ================================================== */}
          {/* RESULT COUNT */}
          {/* ================================================== */}

          <div className="reports-table-meta">

            <span>

              Showing{" "}

              <strong>
                {filteredStudents.length}
              </strong>

              {" "}of{" "}

              <strong>
                {report.students.length}
              </strong>

              {" "}students

            </span>


            <span>

              {report.attendance_date}

            </span>

          </div>


          {/* ================================================== */}
          {/* TABLE */}
          {/* ================================================== */}

          {filteredStudents.length === 0 ? (

            <div className="teacher-empty-state">

              <Users size={32} />

              <h3>
                No students found
              </h3>

              <p>
                No student matches your search.
              </p>

            </div>

          ) : (

            <div className="reports-table-wrapper">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Roll Number
                    </th>

                    <th>
                      Student
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredStudents.map(
                    (student, index) => (

                      <tr
                        key={
                          student.student_id
                        }
                      >

                        {/* ================================== */}
                        {/* INDEX */}
                        {/* ================================== */}

                        <td>

                          <span className="reports-row-number">

                            {index + 1}

                          </span>

                        </td>


                        {/* ================================== */}
                        {/* ROLL NUMBER */}
                        {/* ================================== */}

                        <td>

                          <span className="reports-roll-number">

                            {student.roll_number}

                          </span>

                        </td>


                        {/* ================================== */}
                        {/* STUDENT */}
                        {/* ================================== */}

                        <td>

                          <div className="reports-student-cell">

                            <div className="reports-student-avatar">

                              {student.student_name
                                .charAt(0)
                                .toUpperCase()
                              }

                            </div>

                            <div>

                              <strong>
                                {student.student_name}
                              </strong>

                              <span>
                                Student ID #
                                {student.student_id}
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* ================================== */}
                        {/* STATUS */}
                        {/* ================================== */}

                        <td>

                          {student.status ===
                          "PRESENT" ? (

                            <span className="reports-status reports-status-present">

                              <CheckCircle2
                                size={15}
                              />

                              Present

                            </span>

                          ) : student.status ===
                            "ABSENT" ? (

                            <span className="reports-status reports-status-absent">

                              <XCircle
                                size={15}
                              />

                              Absent

                            </span>

                          ) : (

                            <span className="reports-status">

                              {student.status}

                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}


      {/* ==================================================== */}
      {/* EXCEL EXPORT */}
      {/* ==================================================== */}

      <section className="teacher-attendance-card">

        <div className="teacher-attendance-card-title">

          <Download size={22} />

          <div>

            <h2>
              Export Attendance
            </h2>

            <p>
              Select a class, section, subject and
              attendance period to download Excel.
            </p>

          </div>

        </div>


        <div className="teacher-attendance-selection-grid">


          {/* ================================================= */}
          {/* CLASS */}
          {/* ================================================= */}

          <div className="teacher-attendance-field">

            <label>
              Class
            </label>

            <select
              value={exportClassId}
              onChange={(event) =>
                handleExportClassChange(
                  event.target.value
                )
              }
            >

              <option value="">
                Select class
              </option>

              {classes
                .filter(
                  (
                    schoolClass,
                    index,
                    allClasses
                  ) =>
                    index ===
                    allClasses.findIndex(
                      (item) =>
                        item.class_id
                        === schoolClass.class_id
                    )
                )
                .map(
                  (schoolClass) => (

                    <option
                      key={
                        schoolClass.class_id
                      }
                      value={
                        schoolClass.class_id
                      }
                    >

                      {schoolClass.class_name}

                    </option>

                  )
                )}

            </select>

          </div>


          {/* ================================================= */}
          {/* SECTION */}
          {/* ================================================= */}

          <div className="teacher-attendance-field">

            <label>
              Section
            </label>

            <select
              value={exportSection}
              onChange={(event) =>
                handleExportSectionChange(
                  event.target.value
                )
              }
              disabled={
                !exportClassId
              }
            >

              <option value="">
                Select section
              </option>

              {exportSections.map(
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
          {/* SUBJECT */}
          {/* ================================================= */}

          <div className="teacher-attendance-field">

            <label>
              Subject
            </label>

            <select
              value={exportSubjectId}
              onChange={(event) =>
                setExportSubjectId(
                  event.target.value
                )
              }
              disabled={
                !exportClass
              }
            >

              <option value="">
                Select subject
              </option>

              {exportClass?.subjects?.map(
                (subject) => (

                  <option
                    key={
                      subject.subject_id
                    }
                    value={
                      subject.subject_id
                    }
                  >

                    {subject.subject_name}

                  </option>

                )
              )}

            </select>

          </div>


          {/* ================================================= */}
          {/* EXPORT PERIOD */}
          {/* ================================================= */}

          <div className="teacher-attendance-field">

            <label>
              Export Period
            </label>

            <select
              value={exportPeriod}
              onChange={(event) => {

                setExportPeriod(
                  event.target.value
                );

                if (
                  event.target.value
                  !== "custom"
                ) {

                  setExportFromDate("");

                  setExportToDate("");

                }

              }}
            >

              <option value="weekly">
                This Week
              </option>

              <option value="monthly">
                This Month
              </option>

              <option value="whole">
                Whole Attendance
              </option>

              <option value="custom">
                Custom Date Range
              </option>

            </select>

          </div>


        </div>


        {/* ================================================== */}
        {/* CUSTOM DATE RANGE */}
        {/* ================================================== */}

        {exportPeriod === "custom" && (

          <div
            className="teacher-attendance-selection-grid"
            style={{
              marginTop: "16px",
            }}
          >

            <div className="teacher-attendance-field">

              <label>
                From Date
              </label>

              <input
                type="date"
                value={exportFromDate}
                onChange={(event) =>
                  setExportFromDate(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="teacher-attendance-field">

              <label>
                To Date
              </label>

              <input
                type="date"
                value={exportToDate}
                onChange={(event) =>
                  setExportToDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

        )}


        {/* ================================================== */}
        {/* EXPORT BUTTON */}
        {/* ================================================== */}

        <div
          className="reports-filter-actions"
          style={{
            marginTop: "20px",
          }}
        >

          <button
            type="button"
            className="student-primary-button"
            onClick={
              handleExportExcel
            }
            disabled={
              exporting
              || !exportClassId
              || !exportSection
              || !exportSubjectId
              || (
                exportPeriod === "custom"
                && (
                  !exportFromDate
                  || !exportToDate
                )
              )
            }
          >

            {exporting ? (

              <>

                <RefreshCw
                  size={18}
                  className="spin"
                />

                Exporting...

              </>

            ) : (

              <>

                <Download
                  size={18}
                />

                Export Excel

              </>

            )}

          </button>

        </div>

      </section>


      {/* ==================================================== */}
      {/* REPORT FOOTER */}
      {/* ==================================================== */}

      {report && (

        <div className="reports-footer">

          <div>

            <BarChart3 size={18} />

            <span>
              Attendance report generated for{" "}
              {report.class_name}
              {" — Section "}
              {report.section}
            </span>

          </div>

          <span>
            {report.attendance_date}
          </span>

        </div>

      )}

    </div>

  );

}


export default Reports;