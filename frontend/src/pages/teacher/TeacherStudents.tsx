import {
  useEffect,
  useState,
} from "react";

import {
  Users,
  UserRound,
  CalendarDays,
} from "lucide-react";

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


interface Student {

  id: number;

  name: string;

  roll_number: string;

  date_of_birth: string | null;

  gender: string | null;

}


interface TeacherStudentsResponse {

  class_name: string;

  section: string;

  academic_year: string;

  subject: {

    id: number;

    name: string;

  };

  students: Student[];

}


function TeacherStudents() {


  // ==========================================================
  // STATE
  // ==========================================================

  const [classes, setClasses] =
    useState<TeacherClass[]>([]);


  const [selectedClassId, setSelectedClassId] =
    useState("");


  const [selectedSubjectId, setSelectedSubjectId] =
    useState("");


  const [students, setStudents] =
    useState<TeacherStudentsResponse | null>(
      null
    );


  const [loadingOptions, setLoadingOptions] =
    useState(true);


  const [loadingStudents, setLoadingStudents] =
    useState(false);


  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD TEACHER OPTIONS
  // ==========================================================

  useEffect(() => {

    async function loadOptions() {

      try {

        setError("");


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

            : "Unable to load classes."

        );


      } finally {

        setLoadingOptions(false);

      }

    }


    loadOptions();

  }, []);


  // ==========================================================
  // SELECTED CLASS
  // ==========================================================

  const selectedClass =
    classes.find(
      (schoolClass) =>
        String(
          schoolClass.class_id
        )
        ===
        selectedClassId
    ) || null;


  // ==========================================================
  // CLASS CHANGE
  // ==========================================================

  function handleClassChange(
    value: string
  ) {

    setSelectedClassId(
      value
    );

    setSelectedSubjectId(
      ""
    );

    setStudents(
      null
    );

    setError("");

  }


  // ==========================================================
  // LOAD STUDENTS
  // ==========================================================

  async function loadStudents(
    subjectId: string
  ) {

    setSelectedSubjectId(
      subjectId
    );

    setStudents(
      null
    );

    setError("");


    if (!subjectId) {

      return;

    }


    if (!selectedClass) {

      return;

    }


    try {

      setLoadingStudents(true);


      const response =
        await apiRequest(

          `/api/teacher-students/?class_id=${
            selectedClass.class_id
          }&subject_id=${subjectId}`

        ) as TeacherStudentsResponse;


      setStudents(
        response
      );


    } catch (error) {

      setError(

        error instanceof Error

          ? error.message

          : "Unable to load students."

      );


    } finally {

      setLoadingStudents(false);

    }

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingOptions) {

    return (

      <div className="student-module-loading">

        Loading your students...

      </div>

    );

  }


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

            STUDENTS

          </span>


          <h1>

            My Students

          </h1>


          <p>

            View students from your assigned classes.

          </p>

        </div>

      </div>


      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (

        <div className="student-module-error">

          {error}

        </div>

      )}


      {/* ==================================================== */}
      {/* FILTER CARD */}
      {/* ==================================================== */}

      <div className="teacher-attendance-card">


        <div className="teacher-attendance-card-title">

          <Users
            size={21}
          />


          <div>

            <h2>

              Select Class & Subject

            </h2>


            <p>

              Choose a class and subject to view students.

            </p>

          </div>

        </div>


        <div className="teacher-attendance-selection-grid">


          {/* ================================================= */}
          {/* CLASS */}
          {/* ================================================= */}

          <div className="teacher-attendance-field">

            <label>

              Class & Section

            </label>


            <select

              value={
                selectedClassId
              }

              onChange={(event) =>
                handleClassChange(
                  event.target.value
                )
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

              value={
                selectedSubjectId
              }

              disabled={
                !selectedClass
              }

              onChange={(event) =>
                loadStudents(
                  event.target.value
                )
              }

            >

              <option value="">

                Select subject

              </option>


              {selectedClass?.subjects.map(
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

                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </div>


      {/* ==================================================== */}
      {/* LOADING STUDENTS */}
      {/* ==================================================== */}

      {loadingStudents && (

        <div className="student-module-loading">

          Loading students...

        </div>

      )}


      {/* ==================================================== */}
      {/* STUDENT LIST */}
      {/* ==================================================== */}

      {students &&
        !loadingStudents && (

          <div className="teacher-students-card">


            {/* ============================================== */}
            {/* HEADER */}
            {/* ============================================== */}

            <div className="teacher-students-header">


              <div>

                <span>

                  {students.class_name}

                  {" — Section "}

                  {students.section}

                </span>


                <h2>

                  {students.subject.name}

                </h2>

              </div>


              <div className="teacher-students-count">

                <Users
                  size={17}
                />

                {students.students.length}

                {" "}

                Students

              </div>

            </div>


            {/* ============================================== */}
            {/* EMPTY */}
            {/* ============================================== */}

            {students.students.length === 0 ? (

              <div className="teacher-empty-state">

                <Users
                  size={30}
                />


                <h3>

                  No students found

                </h3>


                <p>

                  There are no active students in this class.

                </p>

              </div>

            ) : (


              /* ============================================ */
              /* STUDENT LIST */
              /* ============================================ */

              <div className="teacher-student-list">


                {students.students.map(
                  (student) => (

                    <div

                      className="teacher-student-row"

                      key={
                        student.id
                      }

                    >


                      {/* ================================== */}
                      {/* AVATAR */}
                      {/* ================================== */}

                      <div className="teacher-student-avatar">

                        {student.name
                          .charAt(0)
                          .toUpperCase()
                        }

                      </div>


                      {/* ================================== */}
                      {/* NAME */}
                      {/* ================================== */}

                      <div className="teacher-student-name">

                        <strong>

                          {student.name}

                        </strong>


                        <span>

                          Roll No.{" "}

                          {student.roll_number}

                        </span>

                      </div>


                      {/* GENDER */}

                        <div className="teacher-student-detail">

                        <UserRound
                            size={17}
                        />

                        <span>
                            {student.gender || "Not specified"}
                        </span>

                        </div>


                        {/* DATE OF BIRTH */}

                        <div className="teacher-student-detail">

                        <CalendarDays
                            size={17}
                        />

                        <span>
                            {student.date_of_birth || "Not available"}
                        </span>

                        </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        )}

    </div>

  );

}


export default TeacherStudents;