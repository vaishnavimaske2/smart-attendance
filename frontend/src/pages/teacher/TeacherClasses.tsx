import {
  useEffect,
  useState,
} from "react";

import {
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";


interface Subject {
  id: number;
  name: string;
}


interface TeacherClass {
    class_id: number;
  class_name: string;
  section: string;
  academic_year: string;
  is_class_teacher: boolean;
  subjects: Subject[];
}


interface TeacherOptionsResponse {
  classes: TeacherClass[];
}


function TeacherClasses() {

  const navigate = useNavigate();

  const [classes, setClasses] =
    useState<TeacherClass[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadClasses() {

      try {

        const response =
          await apiRequest(
            "/api/teacher-students/options"
          ) as TeacherOptionsResponse;

        setClasses(
          response.classes || []
        );

      } catch (error) {

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your classes."
        );

      } finally {

        setLoading(false);

      }

    }

    loadClasses();

  }, []);


  if (loading) {

    return (
      <div className="student-module-loading">
        Loading your classes...
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


  return (

    <div className="teacher-dashboard-page">


      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="teacher-dashboard-header">

        <div>

          <span className="teacher-dashboard-label">
            TEACHING
          </span>

          <h1>
            My Classes
          </h1>

          <p>
            View the classes and subjects assigned to you.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* EMPTY */}
      {/* ================================================== */}

      {classes.length === 0 ? (

        <div className="teacher-empty-state">

          <GraduationCap size={35} />

          <h3>
            No classes assigned
          </h3>

          <p>
            Your assigned classes will appear here.
          </p>

        </div>

      ) : (

        <div className="teacher-class-grid">

          {classes.map(
            (schoolClass, index) => (

              <div
                className="teacher-class-card"
                key={`${schoolClass.class_name}-${schoolClass.section}-${index}`}
              >


                {/* CLASS HEADER */}

                <div className="teacher-class-card-top">

                  <div className="teacher-class-icon">

                    <GraduationCap
                      size={22}
                    />

                  </div>


                  {schoolClass.is_class_teacher && (

                    <span className="class-teacher-badge">
                      Class Teacher
                    </span>

                  )}

                </div>


                <h3>

                  {schoolClass.class_name}

                  {" — Section "}

                  {schoolClass.section}

                </h3>


                <p>

                  Academic Year:{" "}
                  {schoolClass.academic_year}

                </p>


                {/* SUBJECTS */}

                <div className="teacher-class-subjects">

                  <span>
                    Assigned Subjects
                  </span>


                  {schoolClass.subjects.length === 0 ? (

                    <small>
                      No subjects assigned
                    </small>

                  ) : (

                    <div>

                      {schoolClass.subjects.map(
                        (subject) => (

                          <span
                            className="teacher-subject-chip"
                            key={subject.id}
                          >

                            <BookOpen
                              size={14}
                            />

                            {subject.name}

                          </span>

                        )
                      )}

                    </div>

                  )}

                </div>


                {/* ACTIONS */}

                <div className="teacher-class-card-actions">

                    <button
                        type="button"
                        onClick={() =>
                        navigate(
                            `/teacher/students?class_id=${schoolClass.class_id}`
                        )
                        }
                    >

                        <Users size={17} />

                        Students

                    </button>


                    <button
                        type="button"
                        onClick={() =>
                        navigate(
                            "/teacher/attendance"
                        )
                        }
                    >

                        <ClipboardCheck size={17} />

                        Attendance

                    </button>

                    </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

}


export default TeacherClasses;