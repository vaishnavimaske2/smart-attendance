import {
  useEffect,
  useState,
} from "react";

import {
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  Clock3,
  BookOpen,
} from "lucide-react";

import { apiRequest } from "../../services/api";


interface AttendanceSummary {
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


function MyAttendance() {

  const [summary, setSummary] =
    useState<AttendanceSummary | null>(null);

  const [subjects, setSubjects] =
    useState<SubjectAttendance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadAttendance() {

      try {

        const [
          summaryData,
          subjectData,
        ] = await Promise.all([

          apiRequest(
            "/api/attendance/student/summary"
          ),

          apiRequest(
            "/api/attendance/student/subjects"
          ),

        ]);


        setSummary(
          summaryData
        );


        setSubjects(
          subjectData.subjects || []
        );

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load attendance."
        );

      } finally {

        setLoading(false);

      }

    }


    loadAttendance();

  }, []);


  if (loading) {

    return (
      <div className="student-module-loading">
        Loading your attendance...
      </div>
    );

  }


  if (error) {

    return (
      <div className="student-module-error">
        {error}
      </div>
    );

  }


  const attendancePercentage =
    summary?.attendance_percentage ?? 0;


  return (

    <div className="student-module-page">

      <div className="student-module-header">

        <div className="student-module-icon">
          <ClipboardCheck size={26} />
        </div>

        <div>

          <h1>
            My Attendance
          </h1>

          <p>
            Your complete attendance overview.
          </p>

        </div>

      </div>


      {/* SUMMARY */}

      <div className="student-attendance-grid">


        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">
            <ClipboardCheck size={22} />
          </div>

          <div>

            <span>
              Total Classes
            </span>

            <strong>
              {summary?.total_days ?? 0}
            </strong>

          </div>

        </div>


        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">
            <TrendingUp size={22} />
          </div>

          <div>

            <span>
              Present
            </span>

            <strong>
              {summary?.present_days ?? 0}
            </strong>

          </div>

        </div>


        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">
            <AlertCircle size={22} />
          </div>

          <div>

            <span>
              Absent
            </span>

            <strong>
              {summary?.absent_days ?? 0}
            </strong>

          </div>

        </div>


        <div className="student-attendance-card">

          <div className="student-attendance-card-icon">
            <Clock3 size={22} />
          </div>

          <div>

            <span>
              Late
            </span>

            <strong>
              {summary?.late_days ?? 0}
            </strong>

          </div>

        </div>

      </div>


      {/* OVERALL */}

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
              {attendancePercentage >= 75
                ? "Good attendance"
                : "Attendance needs attention"
              }
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


      {/* SUBJECTS */}

      <div className="student-module-header">

        <div className="student-module-icon">

          <BookOpen size={25} />

        </div>

        <div>

          <h1>
            Subject-wise Attendance
          </h1>

          <p>
            Attendance for each subject.
          </p>

        </div>

      </div>


      {subjects.length === 0 ? (

        <div className="student-empty-state">

          <BookOpen size={30} />

          <h3>
            No attendance records
          </h3>

          <p>
            Subject attendance will appear
            once attendance is recorded.
          </p>

        </div>

      ) : (

        <div className="student-subject-attendance-list">

          {subjects.map(
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
                    {subject.attendance_percentage.toFixed(1)}%
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

    </div>

  );

}


export default MyAttendance;