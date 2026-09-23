import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  // TrendingUp,
  RefreshCw,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

// ============================================================
// TYPES
// ============================================================

type DashboardData = {
  message: string;
  attendance_date: string;

  total_teachers: number;
  active_teachers: number;

  total_students: number;
  total_classes: number;
  total_subjects: number;

  present: number;
  absent: number;
  late: number;

  marked_attendance: number;
  attendance_percentage: number;
};
// ============================================================
// ADMIN DASHBOARD
// ============================================================

function AdminDashboard() {
    {/* ================================================== */}
      {/* LOADING STATE */}
      {/* ================================================== */}

      const navigate = useNavigate();

      const [dashboardData, setDashboardData] =
        useState<DashboardData | null>(null);

      const [loading, setLoading] =
        useState(true);

      const [error, setError] =
        useState("");

      {loading && (

        <div className="admin-dashboard-message">

          Loading dashboard data...

        </div>

      )}


      {/* ================================================== */}
      {/* ERROR STATE */}
      {/* ================================================== */}

      {!loading && error && (

        <div className="admin-dashboard-message admin-dashboard-error">

          {error}

        </div>

      )}

    // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  async function loadDashboard() {

    try {

      setLoading(true);

      setError("");


      const token =
        localStorage.getItem(
          "Smart Attend token"
        );


      if (!token) {

        setError(
          "Authentication token not found. Please log in again."
        );

        return;
      }


      const response =
        await fetch(
          "/api/admin/dashboard",
          {
            method: "GET",

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
          "Failed to load dashboard data."
        );
      }


      const data =
        await response.json();


      console.log(
        "ADMIN DASHBOARD RESPONSE:",
        data
      );


      setDashboardData(data);

    } catch (requestError) {

      console.error(
        "Failed to load admin dashboard:",
        requestError
      );


      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load dashboard data."
      );

    } finally {

      setLoading(false);

    }

  }

  useEffect(()=>{
    loadDashboard();
  },[]);

  return (

    <div className="admin-dashboard">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="admin-dashboard-header">

        <div>

          <span className="admin-dashboard-label">
            ADMINISTRATION
          </span>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Overview of your school's attendance
            management system.
          </p>

        </div>

        <div className="admin-dashboard-header-icon">

          <BarChart3 size={26} />

        </div>

        <button
          type="button"
          className="admin-dashboard-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "admin-dashboard-refresh-spinning"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>
      {/* ================================================== */}
      {/* SUMMARY CARDS */}
      {/* ================================================== */}

      {!loading && !error && (

  <div className="admin-dashboard-stats">


        {/* TOTAL TEACHERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <Users size={22} />
          </div>

          <div className="admin-stat-content">

            <span>
              Total Teachers
            </span>

            <strong>
              {dashboardData?.total_teachers ?? 0}
            </strong>

            <small>
              Registered teachers
            </small>

          </div>

        </div>


        {/* TOTAL STUDENTS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <GraduationCap size={22} />
          </div>

          <div className="admin-stat-content">

            <span>
              Total Students
            </span>

            <strong>
              {dashboardData?.total_students ?? 0}
            </strong>

            <small>
              Active students
            </small>

          </div>

        </div>


        {/* TOTAL CLASSES */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <Building2 size={22} />
          </div>

          <div className="admin-stat-content">

            <span>
              Total Classes
            </span>

            <strong>
              {dashboardData?.total_classes ?? 0}
            </strong>

            <small>
              Active classes
            </small>

          </div>

        </div>


        {/* TOTAL SUBJECTS */}

        <div className="admin-stat-card">

          <div className="admin-stat-icon">
            <BookOpen size={22} />
          </div>

          <div className="admin-stat-content">

            <span>
              Total Subjects
            </span>

            <strong>
              {dashboardData?.total_subjects ?? 0}
            </strong>

            <small>
              Active subjects
            </small>

          </div>

        </div>

      </div>
)}
      {/* ================================================== */}
      {/* ATTENDANCE OVERVIEW */}
      {/* ================================================== */}

      <div className="admin-dashboard-grid">


        {/* TODAY'S ATTENDANCE */}

        <div className="admin-dashboard-card">

          <div className="admin-dashboard-card-header">

            <div>

              <h2>
                Today's Attendance
              </h2>

              {dashboardData?.attendance_date && (
                <span className="admin-dashboard-date">
                  {dashboardData.attendance_date}
                </span>
              )}

            </div>

            <ClipboardCheck size={21} />

          </div>

          <div className="admin-attendance-overview">

            <div className="admin-attendance-stat">

              <span>
                Marked Attendance
              </span>

              <strong>
               {dashboardData?.marked_attendance ?? 0}
              </strong>

              <small>
                Total records marked today
              </small>

            </div>
          </div>

          <div className="admin-attendance-overview">

            <div className="admin-attendance-stat">

              <span>
                Present
              </span>

              <strong>
               {dashboardData?.present ?? 0}
              </strong>

            </div>


            <div className="admin-attendance-stat">

              <span>
                Absent
              </span>

              <strong>
                {dashboardData?.absent ?? 0}
              </strong>

            </div>


            <div className="admin-attendance-stat">

              <span>
                Late
              </span>

              <strong>
                {dashboardData?.late ?? 0}
              </strong>

            </div>

          </div>


          <div className="admin-attendance-percentage">

            <div className="admin-progress-header">

              <span>
                Attendance Rate
              </span>

              <strong>
                {(dashboardData?.attendance_percentage ?? 0).toFixed(2)}%
              </strong>

            </div>

            <div className="admin-progress-bar">

              <div
                className="admin-progress-fill"
                style={{
                  width: `${dashboardData?.attendance_percentage ?? 0}%`,
                }}
              />

            </div>

          </div>

        </div>


        {/* ================================================== */}
{/* QUICK SHORTCUTS */}
{/* ================================================== */}

<div className="admin-dashboard-card">

  <div className="admin-dashboard-card-header">

    <div>

      <h2>
        Quick Shortcuts
      </h2>

      <p>
        Quickly access the main administration sections.
      </p>

    </div>

    <BarChart3 size={21} />

  </div>


  <div className="admin-quick-shortcuts">


    {/* ================================================== */}
    {/* TEACHERS */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/teachers")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <Users size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Teachers
        </strong>

        <span>
          Manage teacher accounts and access.
        </span>

      </div>

    </button>


    {/* ================================================== */}
    {/* STUDENTS */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/students")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <GraduationCap size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Students
        </strong>

        <span>
          Manage student records and enrollment.
        </span>

      </div>

    </button>


    {/* ================================================== */}
    {/* CLASSES */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/classes")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <Building2 size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Classes
        </strong>

        <span>
          Manage classes and sections.
        </span>

      </div>

    </button>


    {/* ================================================== */}
    {/* SUBJECTS */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/subjects")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <BookOpen size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Subjects
        </strong>

        <span>
          Manage school subjects.
        </span>

      </div>

    </button>


    {/* ================================================== */}
    {/* TEACHER ASSIGNMENTS */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/teacher-assignments")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <UserCheck size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Teacher Assignments
        </strong>

        <span>
          Assign teachers to classes and subjects.
        </span>

      </div>

    </button>


    {/* ================================================== */}
    {/* REPORTS */}
    {/* ================================================== */}

    <button
      type="button"
      className="admin-quick-shortcut"
      onClick={() =>
        navigate("/records")
      }
    >

      <div className="admin-quick-shortcut-icon">
        <BarChart3 size={21} />
      </div>

      <div className="admin-quick-shortcut-content">

        <strong>
          Reports
        </strong>

        <span>
          View attendance and school reports.
        </span>

      </div>

    </button>


  </div>

</div>

      </div>
      {/* ================================================== */}
      {/* MANAGEMENT OVERVIEW */}
      {/* ================================================== */}

      <div className="admin-dashboard-card admin-management-card">

        <div className="admin-dashboard-card-header">

          <div>

            <h2>
              Management Overview
            </h2>

            <p>
              Manage the main areas of your school.
            </p>

          </div>

          <Building2 size={21} />

        </div>


        <div className="admin-management-grid">


          {/* TEACHERS */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <Users size={20} />
            </div>

            <div>

              <strong>
                Teachers
              </strong>

              <span>
                Manage teacher accounts and access.
              </span>

            </div>

          </div>


          {/* STUDENTS */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <GraduationCap size={20} />
            </div>

            <div>

              <strong>
                Students
              </strong>

              <span>
                Manage student records and enrollment.
              </span>

            </div>

          </div>


          {/* CLASSES */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <Building2 size={20} />
            </div>

            <div>

              <strong>
                Classes
              </strong>

              <span>
                Manage classes and sections.
              </span>

            </div>

          </div>


          {/* SUBJECTS */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <BookOpen size={20} />
            </div>

            <div>

              <strong>
                Subjects
              </strong>

              <span>
                Manage school subjects.
              </span>

            </div>

          </div>


          {/* TEACHER ASSIGNMENTS */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <UserCheck size={20} />
            </div>

            <div>

              <strong>
                Teacher Assignments
              </strong>

              <span>
                Assign teachers to classes and subjects.
              </span>

            </div>

          </div>


          {/* REPORTS */}

          <div className="admin-management-item">

            <div className="admin-management-icon">
              <BarChart3 size={20} />
            </div>

            <div>

              <strong>
                Reports
              </strong>

              <span>
                Review school attendance reports.
              </span>

            </div>

          </div>

        </div>

      </div>
      {/* ================================================== */}
      {/* RECENT ACTIVITY */}
      {/* ================================================== */}

      <div className="admin-dashboard-card">

        <div className="admin-dashboard-card-header">

          <div>

            <h2>
              Recent Activity
            </h2>

            <p>
              Latest activity in your school.
            </p>

          </div>

          <ClipboardCheck size={21} />

        </div>


        <div className="admin-activity-list">


          {/* ACTIVITY 1 */}

          <div className="admin-activity-item">

            <div className="admin-activity-icon">

              <UserCheck size={18} />

            </div>

            <div className="admin-activity-content">

              <strong>
                Teacher assignments
              </strong>

              <span>
                Teacher assignment activity will appear here.
              </span>

            </div>

            <small>
              —
            </small>

          </div>


          {/* ACTIVITY 2 */}

          <div className="admin-activity-item">

            <div className="admin-activity-icon">

              <GraduationCap size={18} />

            </div>

            <div className="admin-activity-content">

              <strong>
                Student registrations
              </strong>

              <span>
                New student registration activity will appear here.
              </span>

            </div>

            <small>
              —
            </small>

          </div>


          {/* ACTIVITY 3 */}

          <div className="admin-activity-item">

            <div className="admin-activity-icon">

              <ClipboardCheck size={18} />

            </div>

            <div className="admin-activity-content">

              <strong>
                Attendance activity
              </strong>

              <span>
                Recent attendance activity will appear here.
              </span>

            </div>

            <small>
              —
            </small>

          </div>


          {/* ACTIVITY 4 */}

          <div className="admin-activity-item">

            <div className="admin-activity-icon">

              <BookOpen size={18} />

            </div>

            <div className="admin-activity-content">

              <strong>
                Subject management
              </strong>

              <span>
                Subject changes will appear here.
              </span>

            </div>

            <small>
              —
            </small>

          </div>


        </div>

      </div>
      {/* ================================================== */}
      {/* DASHBOARD FOOTER */}
      {/* ================================================== */}

      <div className="admin-dashboard-footer">

        <div>

          <strong>
            SmartAttend Administration
          </strong>

          <span>
            Manage your school's attendance system
            from one place.
          </span>

        </div>

        <div className="admin-dashboard-footer-icon">

          <BarChart3 size={19} />

        </div>

      </div>

    </div>

  );

}


export default AdminDashboard;