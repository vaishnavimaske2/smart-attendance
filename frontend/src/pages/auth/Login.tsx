import {
  useState,
  type FormEvent,
} from "react";

import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserRound,
  GraduationCap,
  Building2,
  CalendarDays,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";


type LoginMode =
  | "STAFF"
  | "STUDENT";


function Login() {

  const navigate =
    useNavigate();


  // ==========================================================
  // LOGIN MODE
  // ==========================================================

  const [loginMode, setLoginMode] =
    useState<LoginMode>("STAFF");


  // ==========================================================
  // STAFF
  // ==========================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);


  // ==========================================================
  // STUDENT
  // ==========================================================

  const [schoolCode, setSchoolCode] =
    useState("");

  const [studentName, setStudentName] =
    useState("");

  const [rollNumber, setRollNumber] =
    useState("");

  const [className, setClassName] =
    useState("");

  const [section, setSection] =
    useState("");

  const [dateOfBirth, setDateOfBirth] =
    useState("");


  // ==========================================================
  // UI
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // CHANGE MODE
  // ==========================================================

  function handleModeChange(
    mode: LoginMode
  ) {

    setLoginMode(mode);

    setError("");

  }


  // ==========================================================
  // STAFF LOGIN
  // ==========================================================

  async function handleStaffLogin() {

    const response =
      await apiRequest(
        "/api/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );


    if (
      !response ||
      !response.access_token
    ) {

      throw new Error(
        "Login succeeded but no access token was returned."
      );

    }


    localStorage.setItem(
      "Smart Attend token",
      response.access_token
    );


    localStorage.setItem(
      "Smart Attend user",
      JSON.stringify({
        id: response.user_id,
        name: response.name,
        role: response.role,
        school_id: response.school_id,
      })
    );


    if (response.role === "ADMIN") {

      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );

    } else if (
      response.role === "TEACHER"
    ) {

      navigate(
        "/teacher/dashboard",
        {
          replace: true,
        }
      );

    } else {

      throw new Error(
        "Unknown staff role."
      );

    }

  }


  // ==========================================================
  // STUDENT LOGIN
  // ==========================================================

  async function handleStudentLogin() {

    if (!schoolCode.trim()) {

      throw new Error(
        "Please enter the school code."
      );

    }


    if (!studentName.trim()) {

      throw new Error(
        "Please enter the student's name."
      );

    }


    if (!rollNumber.trim()) {

      throw new Error(
        "Please enter the roll number."
      );

    }


    if (!className.trim()) {

      throw new Error(
        "Please enter the class."
      );

    }


    if (!section.trim()) {

      throw new Error(
        "Please enter the section."
      );

    }


    const response =
      await apiRequest(
        "/api/auth/student-login",
        {
          method: "POST",

          body: JSON.stringify({

            school_code:
              schoolCode.trim().toUpperCase(),

            name:
              studentName.trim(),

            roll_number:
              rollNumber.trim(),

            class_name:
              className.trim(),

            section:
              section.trim().toUpperCase(),

            date_of_birth:
              dateOfBirth || null,

          }),
        }
      );


    if (
      !response ||
      !response.access_token
    ) {

      throw new Error(
        "Student login succeeded but no access token was returned."
      );

    }


    localStorage.setItem(
      "Smart Attend token",
      response.access_token
    );


    localStorage.setItem(
      "Smart Attend user",
      JSON.stringify({

        id:
          response.student_id,

        name:
          response.name,

        role:
          "STUDENT",

        school_id:
          response.school_id,

        roll_number:
          response.roll_number,

        class_id:
          response.class_id,

        class_name:
          response.class_name,

        section:
          response.section,

      })
    );


    navigate(
      "/student/dashboard",
      {
        replace: true,
      }
    );

  }


  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");

    setLoading(true);


    try {

      if (
        loginMode === "STAFF"
      ) {

        await handleStaffLogin();

      } else {

        await handleStudentLogin();

      }


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Unable to login."
      );


    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="login-page">

      <div className="login-container">


        {/* ================================================== */}
        {/* BRAND */}
        {/* ================================================== */}

        <div className="login-brand">

          <div className="login-brand-icon">
            SA
          </div>

          <div>

            <h1>
              SmartAttend
            </h1>

            <p>
              Smart attendance management system
            </p>

          </div>

        </div>


        {/* ================================================== */}
        {/* CARD */}
        {/* ================================================== */}

        <div className="login-card">


          <div className="login-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to your portal.
            </p>

          </div>


          {/* ================================================= */}
          {/* MODE SWITCH */}
          {/* ================================================= */}

          <div className="login-mode-switch">

            <button
              type="button"
              className={
                loginMode === "STAFF"
                  ? "login-mode active"
                  : "login-mode"
              }
              onClick={() =>
                handleModeChange("STAFF")
              }
            >

              <UserRound size={18} />

              Staff

            </button>


            <button
              type="button"
              className={
                loginMode === "STUDENT"
                  ? "login-mode active"
                  : "login-mode"
              }
              onClick={() =>
                handleModeChange("STUDENT")
              }
            >

              <GraduationCap size={18} />

              Student

            </button>

          </div>


          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (

            <div className="login-error">

              {error}

            </div>

          )}


          <form
            onSubmit={handleLogin}
          >


            {/* ================================================= */}
            {/* STAFF FORM */}
            {/* ================================================= */}

            {loginMode === "STAFF" && (

              <>


                {/* EMAIL */}

                <div className="form-group">

                  <label htmlFor="email">
                    Email Address
                  </label>


                  <div className="input-wrapper">

                    <Mail size={19} />

                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="form-group">

                  <label htmlFor="password">
                    Password
                  </label>


                  <div className="input-wrapper">

                    <Lock size={19} />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      required
                    />


                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          previous =>
                            !previous
                        )
                      }
                    >

                      {showPassword
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                      }

                    </button>

                  </div>

                </div>


                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >

                  {loading
                    ? "Signing in..."
                    : (
                      <>
                        <LogIn size={19} />
                        Sign In
                      </>
                    )
                  }

                </button>

              </>

            )}


            {/* ================================================= */}
            {/* STUDENT FORM */}
            {/* ================================================= */}

            {loginMode === "STUDENT" && (

              <>


                {/* SCHOOL CODE */}

                <div className="form-group">

                  <label htmlFor="schoolCode">
                    School Code
                  </label>


                  <div className="input-wrapper">

                    <Building2 size={19} />

                    <input
                      id="schoolCode"
                      type="text"
                      placeholder="Enter school code"
                      value={schoolCode}
                      onChange={(event) =>
                        setSchoolCode(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* STUDENT NAME */}

                <div className="form-group">

                  <label htmlFor="studentName">
                    Student Name
                  </label>


                  <div className="input-wrapper">

                    <UserRound size={19} />

                    <input
                      id="studentName"
                      type="text"
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(event) =>
                        setStudentName(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* ROLL NUMBER */}

                <div className="form-group">

                  <label htmlFor="rollNumber">
                    Roll Number
                  </label>


                  <div className="input-wrapper">

                    <GraduationCap size={19} />

                    <input
                      id="rollNumber"
                      type="text"
                      placeholder="Enter roll number"
                      value={rollNumber}
                      onChange={(event) =>
                        setRollNumber(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* CLASS */}

                <div className="form-group">

                  <label htmlFor="className">
                    Class
                  </label>


                  <div className="input-wrapper">

                    <GraduationCap size={19} />

                    <input
                      id="className"
                      type="text"
                      placeholder="Example: TY BCA"
                      value={className}
                      onChange={(event) =>
                        setClassName(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* SECTION */}

                <div className="form-group">

                  <label htmlFor="section">
                    Section
                  </label>


                  <div className="input-wrapper">

                    <Building2 size={19} />

                    <input
                      id="section"
                      type="text"
                      placeholder="Example: A"
                      value={section}
                      onChange={(event) =>
                        setSection(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>


                {/* DATE OF BIRTH */}

                <div className="form-group">

                  <label htmlFor="dateOfBirth">
                    Date of Birth
                  </label>


                  <div className="input-wrapper">

                    <CalendarDays size={19} />

                    <input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >

                  {loading
                    ? "Signing in..."
                    : (
                      <>
                        <GraduationCap
                          size={19}
                        />

                        Student Login
                      </>
                    )
                  }

                </button>

              </>

            )}

          </form>

        </div>


        {/* ================================================== */}
        {/* SCHOOL REGISTRATION */}
        {/* ================================================== */}

        <div className="register-link">

          <span>
            Don't have a school account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/register-school"
              )
            }
          >
            Register New School
          </button>

        </div>


        <p className="login-footer">
          SmartAttend © 2026
        </p>

      </div>

    </div>

  );
}


export default Login;