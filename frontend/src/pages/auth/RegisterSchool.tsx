import {
  useState,
  type FormEvent,
} from "react";

import {
  Building2,
  MapPin,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../services/api";


function RegisterSchool() {

  const navigate = useNavigate();


  // ==========================================================
  // STEP
  // ==========================================================

  const [step, setStep] =
    useState(1);


  // ==========================================================
  // SCHOOL
  // ==========================================================

  const [schoolName, setSchoolName] =
    useState("");

  const [schoolCode, setSchoolCode] =
    useState("");

  const [location, setLocation] =
    useState("");


  // ==========================================================
  // ADMIN
  // ==========================================================

  const [adminName, setAdminName] =
    useState("");

  const [adminEmail, setAdminEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // ==========================================================
  // UI
  // ==========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  // ==========================================================
  // NEXT
  // ==========================================================

  function handleNext() {

    setError("");


    if (!schoolName.trim()) {

      setError(
        "Please enter the school name."
      );

      return;
    }


    if (!schoolCode.trim()) {

      setError(
        "Please enter the school code."
      );

      return;
    }


    setStep(2);
  }


  // ==========================================================
  // BACK
  // ==========================================================

  function handleBack() {

    setError("");

    setStep(1);
  }


  // ==========================================================
  // REGISTER
  // ==========================================================

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");


    if (
      password !== confirmPassword
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    if (password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    setLoading(true);


    try {

      const response =
        await apiRequest(
          "/api/schools/register",
          {
            method: "POST",

            body: JSON.stringify({
              school_name:
                schoolName.trim(),

              school_code:
                schoolCode.trim().toUpperCase(),

              location:
                location.trim() || null,

              admin_name:
                adminName.trim(),

              admin_email:
                adminEmail.trim().toLowerCase(),

              admin_password:
                password,

              confirm_password:
                confirmPassword,
            }),
          }
        );


      console.log(
        "SCHOOL REGISTRATION RESPONSE:",
        response
      );


      setSuccess(true);

    } catch (error) {

      console.error(
        "SCHOOL REGISTRATION ERROR:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Unable to register school."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // SUCCESS SCREEN
  // ==========================================================

  if (success) {

    return (

      <div className="register-page">

        <div className="register-card success-card">

          <div className="success-icon">

            <CheckCircle2
              size={48}
            />

          </div>


          <h1>
            School Registered!
          </h1>


          <p>

            Your school and administrator
            account have been created
            successfully.

          </p>


          <div className="success-school">

            <strong>
              {schoolName}
            </strong>

            <span>
              {adminEmail}
            </span>

          </div>


          <button
            className="register-primary-button"
            onClick={() =>
              navigate(
                "/login",
                {
                  replace: true,
                }
              )
            }
          >

            Go to Login

            <ArrowRight size={18} />

          </button>

        </div>

      </div>

    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <div className="register-page">

      <div className="register-wrapper">


        {/* ================================================== */}
        {/* BRAND */}
        {/* ================================================== */}

        <div className="register-brand">

          <div className="register-logo">
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

        <div className="register-card">


          {/* HEADER */}

          <div className="register-header">

            <h2>
              Register Your School
            </h2>

            <p>
              Create your school account and
              administrator profile.
            </p>

          </div>


          {/* ================================================= */}
          {/* STEPS */}
          {/* ================================================= */}

          <div className="register-steps">

            <div
              className={
                step >= 1
                  ? "register-step active"
                  : "register-step"
              }
            >

              <span>
                1
              </span>

              <label>
                School Details
              </label>

            </div>


            <div className="step-line" />


            <div
              className={
                step >= 2
                  ? "register-step active"
                  : "register-step"
              }
            >

              <span>
                2
              </span>

              <label>
                Administrator
              </label>

            </div>

          </div>


          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (

            <div className="register-error">

              {error}

            </div>

          )}


          {/* ================================================= */}
          {/* STEP 1 */}
          {/* ================================================= */}

          {step === 1 && (

            <div className="register-form">


              <div className="form-group">

                <label>
                  School / College Name
                </label>

                <div className="register-input">

                  <Building2 size={19} />

                  <input
                    type="text"
                    placeholder="Enter school or college name"
                    value={schoolName}
                    onChange={(event) =>
                      setSchoolName(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  School Code
                </label>

                <div className="register-input">

                  <Building2 size={19} />

                  <input
                    type="text"
                    placeholder="Example: ABC001"
                    value={schoolCode}
                    onChange={(event) =>
                      setSchoolCode(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Location
                  <span>
                    Optional
                  </span>
                </label>

                <div className="register-input">

                  <MapPin size={19} />

                  <input
                    type="text"
                    placeholder="City / Location"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              <button
                type="button"
                className="register-primary-button"
                onClick={handleNext}
              >

                Continue

                <ArrowRight size={18} />

              </button>

            </div>

          )}


          {/* ================================================= */}
          {/* STEP 2 */}
          {/* ================================================= */}

          {step === 2 && (

            <form
              className="register-form"
              onSubmit={handleRegister}
            >


              <div className="form-group">

                <label>
                  Administrator Name
                </label>

                <div className="register-input">

                  <User size={19} />

                  <input
                    type="text"
                    placeholder="Enter administrator name"
                    value={adminName}
                    onChange={(event) =>
                      setAdminName(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Administrator Email
                </label>

                <div className="register-input">

                  <Mail size={19} />

                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(event) =>
                      setAdminEmail(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Password
                </label>

                <div className="register-input">

                  <Lock size={19} />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
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


              <div className="form-group">

                <label>
                  Confirm Password
                </label>

                <div className="register-input">

                  <Lock size={19} />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    required
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        previous =>
                          !previous
                      )
                    }
                  >

                    {showConfirmPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />
                    }

                  </button>

                </div>

              </div>


              <div className="register-buttons">

                <button
                  type="button"
                  className="register-secondary-button"
                  onClick={handleBack}
                  disabled={loading}
                >

                  <ArrowLeft size={18} />

                  Back

                </button>


                <button
                  type="submit"
                  className="register-primary-button"
                  disabled={loading}
                >

                  {loading
                    ? "Creating School..."
                    : "Create School"
                  }

                  {!loading && (
                    <CheckCircle2 size={18} />
                  )}

                </button>

              </div>

            </form>

          )}

        </div>


        {/* ================================================== */}
        {/* LOGIN LINK */}
        {/* ================================================== */}

        <div className="register-login-link">

          Already have an account?

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Sign in
          </button>

        </div>

      </div>

    </div>

  );
}


export default RegisterSchool;