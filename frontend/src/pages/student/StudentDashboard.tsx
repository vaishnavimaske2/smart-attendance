import {
  useEffect,
  useState,
} from "react";

import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  UserRound,
  TrendingUp,
  Clock3,
  AlertCircle,
} from "lucide-react";

import { apiRequest } from "../../services/api";


interface Subject {
  subject_id: number;
  subject_name: string;
}


interface StudentProfile {
  id: number;
  name: string;
  roll_number: string;
  class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
  subjects: Subject[];
}


interface AttendanceSummary {
  student_id: number;
  student_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
}


interface SubjectAttendance {
  subject_id: number;
  subject_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
}


function StudentDashboard() {

  // ==========================================================
  // PROFILE
  // ==========================================================

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);


  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  const [attendance, setAttendance] =
    useState<AttendanceSummary | null>(null);


  const [subjectAttendance, setSubjectAttendance] =
    useState<SubjectAttendance[]>([]);


  // ==========================================================
  // UI
  // ==========================================================

  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  useEffect(() => {

    async function loadDashboard() {

      try {

        setLoading(true);

        setError("");


        const [
          profileData,
          attendanceData,
          subjectAttendanceData,
        ] = await Promise.all([

          apiRequest(
            "/api/student-profile/me"
          ),

          apiRequest(
            "/api/attendance/student/summary"
          ),

          apiRequest(
            "/api/attendance/student/subjects"
          ),

        ]);


        setProfile(
          profileData
        );


        setAttendance(
          attendanceData
        );


        setSubjectAttendance(
          subjectAttendanceData.subjects || []
        );


      } catch (error) {

        console.error(
          "STUDENT DASHBOARD ERROR:",
          error
        );


        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard."
        );


      } finally {

        setLoading(false);

      }

    }


    loadDashboard();

  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="student-dashboard-loading">

        <div className="student-loading-icon">

          <GraduationCap size={30} />

        </div>


        <h2>
          Loading your dashboard...
        </h2>


        <p>
          Please wait a moment.
        </p>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div className="student-dashboard-error">

        <div className="student-error-icon">
          !
        </div>


        <h2>
          Unable to load dashboard
        </h2>


        <p>
          {error}
        </p>


        <button
          onClick={() =>
            window.location.reload()
          }
        >
          Try Again
        </button>

      </div>

    );

  }


  if (!profile) {
    return null;
  }


  // ==========================================================
  // ATTENDANCE VALUES
  // ==========================================================

  const totalDays =
    attendance?.total_days ?? 0;


  const presentDays =
    attendance?.present_days ?? 0;


  const absentDays =
    attendance?.absent_days ?? 0;


  const lateDays =
    attendance?.late_days ?? 0;


  const attendancePercentage =
    attendance?.attendance_percentage ?? 0;


  // ==========================================================
  // ATTENDANCE STATUS
  // ==========================================================

  let attendanceStatus =
    "No attendance data";


  if (totalDays > 0) {

    if (attendancePercentage >= 75) {

      attendanceStatus =
        "Good attendance";

    } else {

      attendanceStatus =
        "Attendance needs attention";

    }

  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (

    <div className="student-dashboard">


      {/* ==================================================== */}
      {/* WELCOME */}
      {/* ==================================================== */}

      <section className="student-welcome-card">

        <div>

          <span className="student-welcome-label">
            STUDENT PORTAL
          </span>


          <h1>
            Good morning, {profile.name} 👋
          </h1>


          <p>
            Here is your academic and attendance overview.
          </p>

        </div>


        <div className="student-welcome-icon">

          <GraduationCap size={42} />

        </div>

      </section>


      {/* ==================================================== */}
      {/* BASIC INFORMATION */}
      {/* ==================================================== */}

      <section className="student-info-grid">


        <div className="student-info-card">

          <div className="student-info-icon">

            <UserRound size={22} />

          </div>


          <div>

            <span>
              Roll Number
            </span>


            <strong>
              {profile.roll_number}
            </strong>

          </div>

        </div>


        <div className="student-info-card">

          <div className="student-info-icon">

            <GraduationCap size={22} />

          </div>


          <div>

            <span>
              Class
            </span>


            <strong>
              {profile.class_name}
            </strong>

          </div>

        </div>


        <div className="student-info-card">

          <div className="student-info-icon">

            <BookOpen size={22} />

          </div>


          <div>

            <span>
              Section
            </span>


            <strong>
              {profile.section}
            </strong>

          </div>

        </div>


        <div className="student-info-card">

          <div className="student-info-icon">

            <CalendarCheck size={22} />

          </div>


          <div>

            <span>
              Academic Year
            </span>


            <strong>
              {profile.academic_year}
            </strong>

          </div>

        </div>

      </section>


      {/* ==================================================== */}
      {/* ATTENDANCE HEADER */}
      {/* ==================================================== */}

      <section className="student-section-header">

        <div>

          <h2>
            Attendance Overview
          </h2>


          <p>
            Your attendance calculated from school records.
          </p>

        </div>


        <TrendingUp size={23} />

      </section>


      {/* ==================================================== */}
      {/* ATTENDANCE CARDS */}
      {/* ==================================================== */}

      <section className="student-attendance-grid">


        {/* TOTAL */}

        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">

            <CalendarCheck size={22} />

          </div>


          <div>

            <span>
              Total Classes
            </span>


            <strong>
              {totalDays}
            </strong>

          </div>

        </div>


        {/* PRESENT */}

        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">

            <TrendingUp size={22} />

          </div>


          <div>

            <span>
              Present
            </span>


            <strong>
              {presentDays}
            </strong>

          </div>

        </div>


        {/* ABSENT */}

        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">

            <AlertCircle size={22} />

          </div>


          <div>

            <span>
              Absent
            </span>


            <strong>
              {absentDays}
            </strong>

          </div>

        </div>


        {/* LATE */}

        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">

            <Clock3 size={22} />

          </div>


          <div>

            <span>
              Late
            </span>


            <strong>
              {lateDays}
            </strong>

          </div>

        </div>

      </section>


      {/* ==================================================== */}
      {/* ATTENDANCE PERCENTAGE */}
      {/* ==================================================== */}

      <section className="student-attendance-summary">


        <div className="student-percentage-content">

          <div>

            <span>
              Overall Attendance
            </span>


            <strong>
              {attendancePercentage.toFixed(1)}%
            </strong>


            <p>
              {attendanceStatus}
            </p>

          </div>


          <div
            className="student-percentage-circle"
            style={{
              "--attendance":
                `${Math.min(
                  attendancePercentage,
                  100
                )}%`,
            } as React.CSSProperties}
          >

            <div>

              <strong>
                {attendancePercentage.toFixed(0)}%
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================== */}
      {/* SUBJECT ATTENDANCE */}
      {/* ==================================================== */}

      <section className="student-section-header">

        <div>

          <h2>
            Subject-wise Attendance
          </h2>


          <p>
            Attendance for each subject.
          </p>

        </div>


        <BookOpen size={23} />

      </section>


      {subjectAttendance.length === 0 ? (

        <div className="student-empty-state">

          <BookOpen size={28} />


          <h3>
            No attendance records yet
          </h3>


          <p>
            Subject attendance will appear here
            once attendance is recorded.
          </p>

        </div>

      ) : (

        <div className="student-subject-attendance-list">

          {subjectAttendance.map(
            (subject) => (

              <div
                className="student-subject-attendance-card"
                key={subject.subject_id}
              >


                <div className="student-subject-attendance-top">

                  <div>

                    <h3>
                      {subject.subject_name}
                    </h3>


                    <span>

                      {subject.present_days}
                      {" "}present out of{" "}
                      {subject.total_days}

                    </span>

                  </div>


                  <strong>

                    {subject.attendance_percentage.toFixed(1)}
                    %

                  </strong>

                </div>


                <div className="student-progress-track">

                  <div
                    className="student-progress-bar"
                    style={{
                      width:
                        `${Math.min(
                          subject.attendance_percentage,
                          100
                        )}%`,
                    }}
                  />

                </div>


                <div className="student-subject-attendance-footer">

                  <span>
                    Present: {subject.present_days}
                  </span>


                  <span>
                    Absent: {subject.absent_days}
                  </span>


                  <span>
                    Late: {subject.late_days}
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* ==================================================== */}
      {/* SUBJECT LIST */}
      {/* ==================================================== */}

      <section className="student-section-header">

        <div>

          <h2>
            My Subjects
          </h2>


          <p>
            Subjects assigned to your class.
          </p>

        </div>


        <BookOpen size={23} />

      </section>


      {profile.subjects.length === 0 ? (

        <div className="student-empty-state">

          <BookOpen size={28} />


          <h3>
            No subjects assigned
          </h3>


          <p>
            Subjects for your class have not
            been configured yet.
          </p>

        </div>

      ) : (

        <div className="student-subject-grid">

          {profile.subjects.map(
            (subject, index) => (

              <div
                className="student-subject-card"
                key={subject.subject_id}
              >

                <div className="student-subject-number">

                  {String(
                    index + 1
                  ).padStart(2, "0")}

                </div>


                <div>

                  <h3>
                    {subject.subject_name}
                  </h3>


                  <span>
                    Subject
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

}


export default StudentDashboard;