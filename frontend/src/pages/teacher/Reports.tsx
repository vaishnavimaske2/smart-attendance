import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  BarChart3,
  CalendarDays,
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

interface ClassOption {
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
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
  // LOAD CLASSES
  // ==========================================================

  useEffect(() => {

    async function loadClasses() {

      try {

        setLoadingClasses(true);
        setError("");

        const response =
          await apiRequest(
            "/api/students/options"
          ) as ClassOption[];

        setClasses(
          response || []
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
  // UI STARTS IN PART 2
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
