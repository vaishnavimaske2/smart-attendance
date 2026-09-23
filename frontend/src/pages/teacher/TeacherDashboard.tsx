import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";


interface Subject {
  subject_id: number;
  subject_name: string;
  is_class_teacher: boolean;
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


function TeacherDashboard() {

  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [profile, setProfile] =
    useState<TeacherProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD TEACHER PROFILE
  // ==========================================================

  useEffect(() => {

    async function loadProfile() {

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
            : "Unable to load teacher dashboard."
        );

      } finally {

        setLoading(false);

      }

    }


    loadProfile();

  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="student-module-loading">

        Loading your dashboard...

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div className="student-module-error">

        {error}

      </div>

    );

  }


  if (!profile) {

    return null;

  }


  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const totalClasses =
    profile.classes.length;


  const totalSubjects =
    profile.classes.reduce(
      (
        total,
        item
      ) =>
        total +
        item.subjects.length,
      0
    );


  const classTeacherCount =
    profile.classes.filter(
      (item) =>
        item.is_class_teacher
    ).length;


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="teacher-dashboard-page">


      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="teacher-dashboard-header">

        <div>

          <span className="teacher-dashboard-label">
            TEACHER PORTAL
          </span>

          <h1>
            Welcome,{" "}
            {profile.name.split(" ")[0]} ..!
          </h1>

          <p>
            Here's a quick overview of your teaching
            activities today.
          </p>

        </div>


        {/* TAKE ATTENDANCE */}

        <button
          type="button"
          className="teacher-dashboard-attendance-button"
          onClick={() =>
            navigate(
              "/teacher/attendance"
            )
          }
        >

          <ClipboardCheck
            size={18}
          />

          Take Attendance

          <ArrowRight
            size={17}
          />

        </button>

      </div>


      {/* ==================================================== */}
      {/* SUMMARY CARDS */}
      {/* ==================================================== */}

      <div className="teacher-summary-grid">


        {/* CLASSES */}

        <div className="teacher-summary-card">

          <div className="teacher-summary-icon">

            <GraduationCap
              size={23}
            />

          </div>

          <div>

            <span>
              My Classes
            </span>

            <strong>
              {totalClasses}
            </strong>

          </div>

        </div>


        {/* SUBJECTS */}

        <div className="teacher-summary-card">

          <div className="teacher-summary-icon">

            <BookOpen
              size={23}
            />

          </div>

          <div>

            <span>
              Subjects
            </span>

            <strong>
              {totalSubjects}
            </strong>

          </div>

        </div>


        {/* CLASS TEACHER */}

        <div className="teacher-summary-card">

          <div className="teacher-summary-icon">

            <Users
              size={23}
            />

          </div>

          <div>

            <span>
              Class Teacher
            </span>

            <strong>
              {classTeacherCount}
            </strong>

          </div>

        </div>


        {/* ATTENDANCE */}

        <div className="teacher-summary-card">

          <div className="teacher-summary-icon">

            <CalendarCheck
              size={23}
            />

          </div>

          <div>

            <span>
              Attendance
            </span>

            <strong>
              Today
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================== */}
      {/* QUICK ACTIONS */}
      {/* ==================================================== */}

      <div className="teacher-section-header">

        <div>

          <h2>
            Quick Actions
          </h2>

          <p>
            Frequently used teacher functions.
          </p>

        </div>

      </div>


      <div className="teacher-quick-actions">


        {/* TAKE ATTENDANCE */}

        <button
          type="button"
          className="teacher-quick-action-card"
          onClick={() =>
            navigate(
              "/teacher/attendance"
            )
          }
        >

          <div className="teacher-quick-action-icon">

            <ClipboardCheck
              size={23}
            />

          </div>

          <div>

            <h3>
              Take Attendance
            </h3>

            <p>
              Upload classroom photos and mark
              attendance using face recognition.
            </p>

          </div>

          <ArrowRight
            size={19}
          />

        </button>


        {/* MY CLASSES */}

        <button
          type="button"
          className="teacher-quick-action-card"
          onClick={() =>
            navigate(
              "/teacher/classes"
            )
          }
        >

          <div className="teacher-quick-action-icon">

            <GraduationCap
              size={23}
            />

          </div>

          <div>

            <h3>
              My Classes
            </h3>

            <p>
              View your assigned classes and
              teaching subjects.
            </p>

          </div>

          <ArrowRight
            size={19}
          />

        </button>


        {/* STUDENTS */}

        <button
          type="button"
          className="teacher-quick-action-card"
          onClick={() =>
            navigate(
              "/teacher/students"
            )
          }
        >

          <div className="teacher-quick-action-icon">

            <Users
              size={23}
            />

          </div>

          <div>

            <h3>
              My Students
            </h3>

            <p>
              View students belonging to your
              assigned classes.
            </p>

          </div>

          <ArrowRight
            size={19}
          />

        </button>


        {/* REPORTS */}

        <button
          type="button"
          className="teacher-quick-action-card"
          onClick={() =>
            navigate(
              "/teacher/reports"
            )
          }
        >

          <div className="teacher-quick-action-icon">

            <CalendarCheck
              size={23}
            />

          </div>

          <div>

            <h3>
              Attendance Reports
            </h3>

            <p>
              View attendance records and
              performance reports.
            </p>

          </div>

          <ArrowRight
            size={19}
          />

        </button>

      </div>


      {/* ==================================================== */}
      {/* TODAY'S ATTENDANCE */}
      {/* ==================================================== */}

      <div className="teacher-section-header">

        <div>

          <h2>
            Today's Attendance
          </h2>

          <p>
            Your attendance activity for today.
          </p>

        </div>

      </div>


      <div className="teacher-dashboard-attendance-card">

        <div className="teacher-dashboard-attendance-icon">

          <ClipboardCheck
            size={25}
          />

        </div>


        <div>

          <h3>
            Attendance Overview
          </h3>

          <p>
            Attendance statistics will appear here
            after you mark attendance for your classes.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/teacher/attendance"
            )
          }
        >

          Go to Attendance

          <ArrowRight
            size={16}
          />

        </button>

      </div>

    </div>

  );

}


export default TeacherDashboard;