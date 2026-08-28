
import "./Teacher.css";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Users,
  UserPlus,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
} from "lucide-react";


// ============================================================
// TYPES
// ============================================================

type Teacher = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  school_id: number;
};


// ============================================================
// COMPONENT
// ============================================================

function Teachers() {

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [searchTerm, setSearchTerm] =
    useState("");


  // ==========================================================
  // TEACHER DATA
  // ==========================================================

  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");


  // ==========================================================
  // ADD TEACHER FORM
  // ==========================================================

  const [teacherName, setTeacherName] =
    useState("");

  const [teacherEmail, setTeacherEmail] =
    useState("");

  const [teacherPassword, setTeacherPassword] =
    useState("");


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD TEACHERS
  // ==========================================================

  async function loadTeachers() {

    try {

      setLoading(true);

      setLoadError("");


      const token =
        localStorage.getItem(
          "Smart Attend token"
        );


      if (!token) {

        setLoadError(
          "Authentication token not found."
        );

        return;
      }


      const response =
        await fetch(
          "/api/teachers",
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
          "Failed to load teachers."
        );
      }


      const data =
        await response.json();

        console.log(
        "TEACHERS API RESPONSE:",
        data
        );

        console.log(
        "TEACHERS FROM API:",
        data.teachers
        );

        setTeachers(
        data.teachers || []
        );

    } catch (requestError) {

      console.error(
        "Failed to load teachers:",
        requestError
      );


      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load teachers."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // LOAD TEACHERS WHEN PAGE OPENS
  // ==========================================================

  useEffect(() => {

    loadTeachers();

  }, []);


  // ==========================================================
  // FILTER TEACHERS
  // ==========================================================

  const filteredTeachers =
    teachers.filter(
      (teacher) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();


        if (!search) {

          return true;

        }


        return (
          teacher.name
            .toLowerCase()
            .includes(search)
          ||
          teacher.email
            .toLowerCase()
            .includes(search)
        );

      }
    );


  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalTeachers =
    teachers.length;


  const activeTeachers =
    teachers.filter(
      (teacher) =>
        teacher.is_active
    ).length;


  const inactiveTeachers =
    teachers.filter(
      (teacher) =>
        !teacher.is_active
    ).length;


  // ==========================================================
  // PART 1 ENDS HERE
  // ==========================================================
  // ==========================================================
  // CREATE TEACHER
  // ==========================================================

async function handleCreateTeacher(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setSuccess("");
  setError("");

  if (!teacherName.trim()) {
    setError("Please enter the teacher's full name.");
    return;
  }

  if (!teacherEmail.trim()) {
    setError("Please enter the teacher's email address.");
    return;
  }

  if (!teacherPassword.trim()) {
    setError("Please enter a temporary password.");
    return;
  }

  if (teacherPassword.length < 6) {
    setError(
      "Temporary password must be at least 6 characters."
    );
    return;
  }

  const token = localStorage.getItem(
    "Smart Attend token"
  );

  if (!token) {
    setError(
      "Authentication token not found. Please log in again."
    );
    return;
  }

  try {
    const params = new URLSearchParams();

    params.set(
      "name",
      teacherName.trim()
    );

    params.set(
      "email",
      teacherEmail.trim().toLowerCase()
    );

    params.set(
      "password",
      teacherPassword
    );

    const response = await fetch(
      `/api/teachers?${params.toString()}`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData =
        await response.json().catch(() => null);

      const detail =
        typeof errorData?.detail === "string"
          ? errorData.detail
          : "Failed to create teacher.";

      throw new Error(detail);
    }

    const data =
      await response.json();

    setSuccess(
      data.message ||
      "Teacher ${teacherName.trim()} added successfully."
    );

    setTeacherName("");
    setTeacherEmail("");
    setTeacherPassword("");

    await loadTeachers();

  } catch (requestError) {

    console.error(
      "Failed to create teacher:",
      requestError
    );

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Failed to create teacher."
    );
  }
}


  // ==========================================================
  // UPDATE TEACHER STATUS
  // ==========================================================

  async function handleTeacherStatus(
    teacher: Teacher
  ) {

    setSuccess("");
    setError("");


    // --------------------------------------------------------
    // GET AUTHENTICATION TOKEN
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DETERMINE NEW STATUS
    // --------------------------------------------------------

    const nextStatus =
      !teacher.is_active;


    // --------------------------------------------------------
    // SEND REQUEST
    // --------------------------------------------------------

    try {

      const response =
        await fetch(
          `/api/teachers/${teacher.id}/status?is_active=${nextStatus}`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      // ------------------------------------------------------
      // HANDLE BACKEND ERROR
      // ------------------------------------------------------

      if (!response.ok) {

        const errorData =
          await response.json()
            .catch(() => null);


        throw new Error(
          errorData?.detail ||
          "Failed to update teacher status."
        );
      }


      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      const data =
        await response.json();


      setSuccess(
        data.message ||
        "Teacher status updated successfully."
      );


      // ------------------------------------------------------
      // REFRESH TEACHER LIST
      // ------------------------------------------------------

      await loadTeachers();

    } catch (requestError) {

      console.error(
        "Failed to update teacher status:",
        requestError
      );


      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update teacher status."
      );

    }

  }


  // ==========================================================
  // PART 2 ENDS HERE
  // ==========================================================
  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="admin-teachers">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="admin-module-header">

        <div>

          <span className="admin-module-label">
            ADMINISTRATION
          </span>

          <h1>
            Teachers
          </h1>

          <p>
            Manage teacher accounts, access and
            school assignments.
          </p>

        </div>


        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {

            setSuccess("");
            setError("");

          }}
        >

          <UserPlus size={18} />

          Add Teacher

        </button>

      </div>


      {/* ================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================== */}

      {success && (

        <div className="admin-form-message admin-form-message-success">

          <UserCheck size={17} />

          <span>
            {success}
          </span>

        </div>

      )}


      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (

        <div className="admin-form-message admin-form-message-error">

          <UserX size={17} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* ================================================== */}
      {/* SUMMARY CARDS */}
      {/* ================================================== */}

      <div className="admin-teacher-summary">

        {/* TOTAL */}

        <div className="admin-teacher-summary-card">

          <div className="admin-teacher-summary-icon">

            <Users size={20} />

          </div>

          <div>

            <span>
              Total Teachers
            </span>

            <strong>
              {totalTeachers}
            </strong>

          </div>

        </div>


        {/* ACTIVE */}

        <div className="admin-teacher-summary-card">

          <div className="admin-teacher-summary-icon">

            <UserCheck size={20} />

          </div>

          <div>

            <span>
              Active Teachers
            </span>

            <strong>
              {activeTeachers}
            </strong>

          </div>

        </div>


        {/* INACTIVE */}

        <div className="admin-teacher-summary-card">

          <div className="admin-teacher-summary-icon">

            <UserX size={20} />

          </div>

          <div>

            <span>
              Inactive Teachers
            </span>

            <strong>
              {inactiveTeachers}
            </strong>

          </div>

        </div>


        {/* ADMINISTRATORS */}

        <div className="admin-teacher-summary-card">

          <div className="admin-teacher-summary-icon">

            <ShieldCheck size={20} />

          </div>

          <div>

            <span>
              Administrators
            </span>

            <strong>
              1
            </strong>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* SEARCH TOOLBAR */}
      {/* ================================================== */}

      <div className="admin-teacher-toolbar">

        <div className="admin-search-box">

          <Search size={18} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search teachers..."
          />

        </div>

      </div>


      {/* ==========================================================
         PART 3 ENDS HERE
         ========================================================== */}

    {/* ================================================== */}
      {/* TEACHER LIST */}
      {/* ================================================== */}

      <div className="admin-teachers-card">

        <div className="admin-teachers-card-header">

          <div>

            <h2>
              Teacher Accounts
            </h2>

            <p>
              View and manage teachers registered
              in your school.
            </p>

          </div>

          <span className="admin-record-count">

            {filteredTeachers.length}{" "}

            {filteredTeachers.length === 1
              ? "teacher"
              : "teachers"}

          </span>

        </div>


        {/* ================================================== */}
        {/* TABLE */}
        {/* ================================================== */}

        <div className="admin-teachers-table-wrapper">

          <table className="admin-teachers-table">

            <thead>

              <tr>

                <th>
                  Teacher
                </th>

                <th>
                  Email
                </th>

                <th>
                  Role
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {/* ================================================== */}
              {/* LOADING */}
              {/* ================================================== */}

              {loading && (

                <tr>

                  <td
                    colSpan={5}
                    className="admin-table-empty"
                  >

                    <div className="admin-empty-state">

                      <Users size={30} />

                      <strong>
                        Loading teachers...
                      </strong>

                      <span>
                        Please wait while teacher
                        accounts are loaded.
                      </span>

                    </div>

                  </td>

                </tr>

              )}


              {/* ================================================== */}
              {/* LOAD ERROR */}
              {/* ================================================== */}

              {!loading && loadError && (

                <tr>

                  <td
                    colSpan={5}
                    className="admin-table-empty"
                  >

                    <div className="admin-empty-state">

                      <UserX size={30} />

                      <strong>
                        Unable to load teachers
                      </strong>

                      <span>
                        {loadError}
                      </span>

                    </div>

                  </td>

                </tr>

              )}


              {/* ================================================== */}
              {/* NO TEACHERS / NO SEARCH RESULTS */}
              {/* ================================================== */}

              {!loading &&
                !loadError &&
                filteredTeachers.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="admin-table-empty"
                  >

                    <div className="admin-empty-state">

                      <Users size={30} />

                      <strong>

                        {searchTerm.trim()
                          ? "No teachers found"
                          : "No teachers registered"}

                      </strong>

                      <span>

                        {searchTerm.trim()
                          ? `No teacher accounts match "${searchTerm}".`
                          : "Teacher accounts will appear here after they are created."}

                      </span>

                    </div>

                  </td>

                </tr>

              )}


              {/* ================================================== */}
              {/* REAL TEACHERS */}
              {/* ================================================== */}

              {!loading &&
                !loadError &&
                filteredTeachers.length > 0 &&
                filteredTeachers.map(
                  (teacher) => (

                    <tr key={teacher.id}>

                      {/* ------------------------------------------ */}
                      {/* TEACHER */}
                      {/* ------------------------------------------ */}

                      <td>

                        <div className="admin-teacher-name">

                          <div className="admin-teacher-avatar">

                            {teacher.name
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <strong>
                            {teacher.name}
                          </strong>

                        </div>

                      </td>


                      {/* ------------------------------------------ */}
                      {/* EMAIL */}
                      {/* ------------------------------------------ */}

                      <td>
                        {teacher.email}
                      </td>


                      {/* ------------------------------------------ */}
                      {/* ROLE */}
                      {/* ------------------------------------------ */}

                      <td>

                        <span className="admin-role-badge">

                          {teacher.role}

                        </span>

                      </td>


                      {/* ------------------------------------------ */}
                      {/* STATUS */}
                      {/* ------------------------------------------ */}

                      <td>

                        <span
                          className={
                            teacher.is_active
                              ? "admin-status-status active"
                              : "admin-status-status inactive"
                          }
                        >

                          {teacher.is_active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>


                      {/* ------------------------------------------ */}
                      {/* ACTION */}
                      {/* ------------------------------------------ */}

                      <td>

                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() =>
                            handleTeacherStatus(
                              teacher
                            )
                          }
                        >

                          {teacher.is_active
                            ? "Deactivate"
                            : "Activate"}

                        </button>

                      </td>

                    </tr>

                  )
                )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==========================================================
         PART 4 ENDS HERE
         ========================================================== */}

         {/* ================================================== */}
      {/* ADD TEACHER */}
      {/* ================================================== */}

      <div className="admin-teacher-form-card">

        <div className="admin-teacher-form-header">

          <div>

            <h2>
              Add Teacher
            </h2>

            <p>
              Create a new teacher account for your school.
            </p>

          </div>

        </div>


        <form
          className="admin-teacher-form"
          onSubmit={handleCreateTeacher}
        >

          {/* ================================================== */}
          {/* FULL NAME */}
          {/* ================================================== */}

          <div className="admin-form-field">

            <label htmlFor="teacher-name">
              Full Name
            </label>

            <input
              id="teacher-name"
              type="text"
              value={teacherName}
              onChange={(event) =>
                setTeacherName(
                  event.target.value
                )
              }
              placeholder="Enter teacher name"
            />

          </div>


          {/* ================================================== */}
          {/* EMAIL */}
          {/* ================================================== */}

          <div className="admin-form-field">

            <label htmlFor="teacher-email">
              Email Address
            </label>

            <input
              id="teacher-email"
              type="email"
              value={teacherEmail}
              onChange={(event) =>
                setTeacherEmail(
                  event.target.value
                )
              }
              placeholder="Enter teacher email"
            />

          </div>


          {/* ================================================== */}
          {/* PASSWORD */}
          {/* ================================================== */}

          <div className="admin-form-field">

            <label htmlFor="teacher-password">
              Temporary Password
            </label>

            <input
              id="teacher-password"
              type="password"
              value={teacherPassword}
              onChange={(event) =>
                setTeacherPassword(
                  event.target.value
                )
              }
              placeholder="Enter temporary password"
              minLength={6}
            />

            <small>
              Password must contain at least 6 characters.
            </small>

          </div>


          {/* ================================================== */}
          {/* ROLE */}
          {/* ================================================== */}

          <div className="admin-form-field">

            <label htmlFor="teacher-role">
              Account Role
            </label>

            <select
              id="teacher-role"
              value="TEACHER"
              disabled
            >

              <option value="TEACHER">
                Teacher
              </option>

            </select>

            <small>
              Teacher accounts are created with the
              TEACHER role.
            </small>

          </div>


          {/* ================================================== */}
          {/* FORM ACTIONS */}
          {/* ================================================== */}

          <div className="admin-teacher-form-actions">

            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {

                setTeacherName("");

                setTeacherEmail("");

                setTeacherPassword("");

                setSuccess("");

                setError("");

              }}
            >
              Clear
            </button>


            <button
              type="submit"
              className="admin-primary-button"
            >

              <UserPlus size={17} />

              Create Teacher

            </button>

          </div>

        </form>

      </div>


      {/* ================================================== */}
      {/* INFORMATION */}
      {/* ================================================== */}

      <div className="admin-teachers-info">

        <ShieldCheck size={18} />

        <div>

          <strong>
            Teacher account management
          </strong>

          <span>
            Teacher accounts are securely stored
            in your school's database. Passwords
            are hashed before being saved.
          </span>

        </div>

      </div>

    </div>);
}

export default Teachers;