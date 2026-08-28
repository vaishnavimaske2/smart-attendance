import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import {
  GraduationCap,
  UserCheck,
  UserX,
  ClipboardCheck,
  ArrowUpRight,
  Camera,
} from "lucide-react";

import { apiRequest } from "../../services/api";


// ============================================================
// TYPES
// ============================================================

interface ClassOption {
  id: number;
  name: string;
  section: string;
  academic_year: string;
}


interface DashboardStats {
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;

  total_students: number;
  present_today: number;
  absent_today: number;
  attendance_rate: number;
}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

  // ==========================================================
  // CLASS STATE
  // ==========================================================

  const [classes, setClasses] =
    useState<ClassOption[]>([]);


  const [selectedClass, setSelectedClass] =
    useState<ClassOption | null>(null);


  const [loadingClasses, setLoadingClasses] =
    useState(true);


  // ==========================================================
  // STATISTICS STATE
  // ==========================================================

  const [stats, setStats] =
    useState<DashboardStats | null>(null);


  const [loadingStats, setLoadingStats] =
    useState(false);


  // ==========================================================
  // ERROR STATE
  // ==========================================================

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD CLASSES WHEN DASHBOARD OPENS
  // ==========================================================

  useEffect(() => {

    loadClasses();

  }, []);


  // ==========================================================
  // LOAD DASHBOARD STATISTICS WHEN CLASS CHANGES
  // ==========================================================

  useEffect(() => {

    if (!selectedClass) {

      setStats(null);

      return;
    }


    loadDashboardStats(
      selectedClass.id
    );

  }, [selectedClass]);


  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  async function loadClasses() {
    console.log("LOAD CLASSES FUNCTION CALLED");
    
    try {

      setLoadingClasses(true);

      setError("");


      const data =
        await apiRequest(
          "/api/classes/options"
        );


      setClasses(data);


      // Automatically select first class

      if (data.length > 0) {

        setSelectedClass(data[0]);

      } else {

        setSelectedClass(null);

      }

    } catch (error) {

      console.error(
        "Error loading classes:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Unable to load classes"
      );

    } finally {

      setLoadingClasses(false);

    }
  }


  // ==========================================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================================

  async function loadDashboardStats(
    classId: number
  ) {

    try {

      setLoadingStats(true);

      setError("");


      const data =
        await apiRequest(
          `/api/dashboard/stats?class_id=${classId}`
        );


      setStats(data);

    } catch (error) {

      console.error(
        "Error loading dashboard statistics:",
        error
      );


      setStats(null);


      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard statistics"
      );

    } finally {

      setLoadingStats(false);

    }
  }


  // ==========================================================
  // HANDLE CLASS CHANGE
  // ==========================================================

  function handleClassChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {

    const classId =
      Number(event.target.value);


    const selected =
      classes.find(
        (item) =>
          item.id === classId
      );


    setSelectedClass(
      selected ?? null
    );

  }


  // ==========================================================
  // LOADING STATISTIC VALUE
  // ==========================================================

  function displayValue(
    value: number | string
  ) {

    if (loadingStats) {

      return "...";

    }

    return value;

  }


  // ==========================================================
  // DASHBOARD UI
  // ==========================================================

  return (

    <div className="dashboard">


      {/* ================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================== */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            OVERVIEW
          </p>


          <h2>
            Good morning, Geetanjali 👋
          </h2>


          <p>
            Here's what's happening with
            your classes today.
          </p>

        </div>


        {/* ================================================= */}
        {/* DASHBOARD ACTIONS */}
        {/* ================================================= */}

        <div className="dashboard-actions">


          {/* Class Selector */}

          <div className="class-selector">

            <label htmlFor="class-select">
              Select Class
            </label>


            <select
              id="class-select"

              value={
                selectedClass?.id ?? ""
              }

              onChange={
                handleClassChange
              }

              disabled={
                loadingClasses ||
                classes.length === 0
              }
            >

              {/* Loading */}

              {loadingClasses && (

                <option value="">
                  Loading classes...
                </option>

              )}


              {/* No classes */}

              {!loadingClasses &&
                classes.length === 0 && (

                <option value="">
                  No classes assigned
                </option>

              )}


              {/* Classes */}

              {!loadingClasses &&
                classes.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} — Section{" "}
                      {item.section}
                    </option>

                  )
                )}

            </select>

          </div>


          {/* Take Attendance */}

          <button
            className="primary-button"
            type="button"
          >

            <ClipboardCheck
              size={19}
            />

            Take Attendance

          </button>

        </div>

      </div>


      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}


      {/* ================================================== */}
      {/* SELECTED CLASS */}
      {/* ================================================== */}

      <div className="class-banner">


        <div className="class-banner-icon">

          <GraduationCap
            size={27}
          />

        </div>


        <div>

          <span>
            Selected Class
          </span>


          <h3>

            {selectedClass

              ? `${selectedClass.name} — Section ${selectedClass.section}`

              : "No class selected"

            }

          </h3>

        </div>


        <div className="class-banner-right">

          <span>
            Academic Year
          </span>


          <strong>

            {selectedClass
              ? selectedClass.academic_year
              : "--"
            }

          </strong>

        </div>

      </div>


      {/* ================================================== */}
      {/* STATISTICS */}
      {/* ================================================== */}

      <div className="stats-grid">


        {/* ================================================= */}
        {/* TOTAL STUDENTS */}
        {/* ================================================= */}

        <div className="stat-card">

          <div className="stat-icon students">

            <GraduationCap
              size={23}
            />

          </div>


          <div className="stat-content">

            <span>
              Total Students
            </span>


            <strong>

              {displayValue(
                stats?.total_students ?? 0
              )}

            </strong>


            <small>
              Active students
            </small>

          </div>

        </div>


        {/* ================================================= */}
        {/* PRESENT */}
        {/* ================================================= */}

        <div className="stat-card">

          <div className="stat-icon present">

            <UserCheck
              size={23}
            />

          </div>


          <div className="stat-content">

            <span>
              Present Today
            </span>


            <strong>

              {displayValue(
                stats?.present_today ?? 0
              )}

            </strong>


            <small>
              Today's attendance
            </small>

          </div>

        </div>


        {/* ================================================= */}
        {/* ABSENT */}
        {/* ================================================= */}

        <div className="stat-card">

          <div className="stat-icon absent">

            <UserX
              size={23}
            />

          </div>


          <div className="stat-content">

            <span>
              Absent Today
            </span>


            <strong>

              {displayValue(
                stats?.absent_today ?? 0
              )}

            </strong>


            <small>
              Today's attendance
            </small>

          </div>

        </div>


        {/* ================================================= */}
        {/* ATTENDANCE RATE */}
        {/* ================================================= */}

        <div className="stat-card">

          <div className="stat-icon attendance">

            <ClipboardCheck
              size={23}
            />

          </div>


          <div className="stat-content">

            <span>
              Attendance Rate
            </span>


            <strong>

              {loadingStats
                ? "..."
                : `${stats?.attendance_rate ?? 0}%`
              }

            </strong>


            <small>
              Today's rate
            </small>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* DASHBOARD CONTENT */}
      {/* ================================================== */}

      <div className="dashboard-grid">


        {/* ================================================= */}
        {/* TODAY'S ATTENDANCE */}
        {/* ================================================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h3>
                Today's Attendance
              </h3>


              <p>

                {selectedClass

                  ? `${selectedClass.name} — Section ${selectedClass.section}`

                  : "Select a class"

                }

              </p>

            </div>


            <button
              className="icon-button"
              type="button"
            >

              <ArrowUpRight
                size={19}
              />

            </button>

          </div>


          {/* Attendance Summary */}

          {loadingStats ? (

            <div className="empty-dashboard-state">

              <ClipboardCheck
                size={35}
              />


              <h4>
                Loading attendance...
              </h4>


              <p>
                Please wait.
              </p>

            </div>

          ) : stats ? (

            <div className="attendance-summary">


              <div className="attendance-summary-item">

                <span>
                  Total Students
                </span>

                <strong>
                  {stats.total_students}
                </strong>

              </div>


              <div className="attendance-summary-item">

                <span>
                  Present
                </span>

                <strong>
                  {stats.present_today}
                </strong>

              </div>


              <div className="attendance-summary-item">

                <span>
                  Absent
                </span>

                <strong>
                  {stats.absent_today}
                </strong>

              </div>


              <div className="attendance-summary-item">

                <span>
                  Rate
                </span>

                <strong>
                  {stats.attendance_rate}%
                </strong>

              </div>

            </div>

          ) : (

            <div className="empty-dashboard-state">

              <ClipboardCheck
                size={35}
              />


              <h4>
                No attendance data
              </h4>


              <p>
                Select a class to view
                attendance.
              </p>

            </div>

          )}

        </div>


        {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>

              <h3>
                Quick Actions
              </h3>


              <p>
                Frequently used features
              </p>

            </div>

          </div>


          <div className="quick-actions">


            {/* Take Attendance */}

            <button type="button">

              <ClipboardCheck
                size={22}
              />


              <span>
                Take Attendance
              </span>

            </button>


            {/* View Students */}

            <button type="button">

              <GraduationCap
                size={22}
              />


              <span>
                View Students
              </span>

            </button>


            {/* Face Registration */}

            <button type="button">

              <Camera
                size={22}
              />


              <span>
                Register Face
              </span>

            </button>

          </div>

        </div>

      </div>

    </div>

  );
}


export default Dashboard;