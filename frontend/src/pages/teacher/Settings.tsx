import {
  useState,
  type FormEvent,
} from "react";

import {
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Save,
  Settings as SettingsIcon,
  GraduationCap,
  Camera,
  ClipboardCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";


// ============================================================
// TYPES
// ============================================================

type SettingsSection =
  | "profile"
  | "school"
  | "face"
  | "attendance";


// ============================================================
// COMPONENT
// ============================================================

function Settings() {

  // ==========================================================
  // ACTIVE SECTION
  // ==========================================================

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");


  // ==========================================================
  // PROFILE
  // ==========================================================

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role] =
    useState("Teacher");


  // ==========================================================
  // PASSWORD
  // ==========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // ==========================================================
  // SCHOOL
  // ==========================================================

  const [schoolName, setSchoolName] =
    useState("");

  const [schoolAddress, setSchoolAddress] =
    useState("");

  const [schoolContact, setSchoolContact] =
    useState("");

  const [academicYear, setAcademicYear] =
    useState("2026-27");


  // ==========================================================
  // FACE RECOGNITION
  // ==========================================================

  const [recognitionThreshold, setRecognitionThreshold] =
    useState("0.75");

  const [maxRegistrationPhotos, setMaxRegistrationPhotos] =
    useState("6");


  // ==========================================================
  // ATTENDANCE
  // ==========================================================

  const [minimumAttendance, setMinimumAttendance] =
    useState("75");

  const [allowManualCorrection, setAllowManualCorrection] =
    useState(true);

  const [allowTeacherEditing, setAllowTeacherEditing] =
    useState(true);


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

    // ==========================================================
  // SAVE SETTINGS
  // ==========================================================

  function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");

    setSuccess(
      "Settings saved successfully."
    );
  }


  // ==========================================================
  // PASSWORD
  // ==========================================================

  function handlePasswordChange(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword) {

      setError(
        "Please enter your current password."
      );

      return;
    }

    if (!newPassword) {

      setError(
        "Please enter a new password."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "New password and confirmation password do not match."
      );

      return;
    }

    setSuccess(
      "Password updated successfully."
    );

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }


  // ==========================================================
  // SETTINGS NAVIGATION
  // ==========================================================

  const settingsSections = [

    {
      id: "profile" as SettingsSection,
      label: "Profile",
      description:
        "Manage your personal information",
      icon: UserRound,
    },

    {
      id: "school" as SettingsSection,
      label: "School",
      description:
        "School and academic information",
      icon: GraduationCap,
    },

    {
      id: "face" as SettingsSection,
      label: "Face Recognition",
      description:
        "Recognition preferences",
      icon: Camera,
    },

    {
      id: "attendance" as SettingsSection,
      label: "Attendance",
      description:
        "Attendance preferences",
      icon: ClipboardCheck,
    },

  ];


  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  function changeSection(
    section: SettingsSection
  ) {

    setActiveSection(section);

    setSuccess("");
    setError("");
  }


  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  function getSectionTitle() {

    switch (activeSection) {

      case "profile":

        return {
          title: "Profile Settings",
          description:
            "Manage your personal account information.",
        };

      case "school":

        return {
          title: "School Settings",
          description:
            "Manage your school's basic information and academic settings.",
        };

      case "face":

        return {
          title: "Face Recognition",
          description:
            "Configure preferences related to student face recognition.",
        };

      case "attendance":

        return {
          title: "Attendance Settings",
          description:
            "Manage attendance rules and teacher permissions.",
        };

      default:

        return {
          title: "Settings",
          description:
            "Manage your account and application preferences.",
        };
    }
  }


  const currentSection =
    getSectionTitle();

    // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="settings-page">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="settings-header">

        <div>

          <span className="settings-header-label">
            SETTINGS
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your account, school preferences
            and attendance configuration.
          </p>

        </div>

        <div className="settings-header-icon">

          <SettingsIcon size={25} />

        </div>

      </div>


      {/* ==================================================== */}
      {/* MESSAGES */}
      {/* ==================================================== */}

      {error && (

        <div className="settings-message settings-message-error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

        </div>

      )}


      {success && (

        <div className="settings-message settings-message-success">

          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

        </div>

      )}


      {/* ==================================================== */}
      {/* SETTINGS LAYOUT */}
      {/* ==================================================== */}

      <div className="settings-layout">


        {/* ================================================== */}
        {/* SIDEBAR */}
        {/* ================================================== */}

        <aside className="settings-sidebar">

          <div className="settings-sidebar-title">

            <SettingsIcon size={17} />

            <span>
              Settings
            </span>

          </div>


          <div className="settings-navigation">

            {settingsSections.map(
              (section) => {

                const Icon =
                  section.icon;

                const isActive =
                  activeSection === section.id;


                return (

                  <button
                    type="button"
                    key={section.id}
                    className={
                      `settings-navigation-item ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      changeSection(
                        section.id
                      )
                    }
                  >

                    <div className="settings-navigation-icon">

                      <Icon size={18} />

                    </div>


                    <div className="settings-navigation-content">

                      <strong>
                        {section.label}
                      </strong>

                      <span>
                        {section.description}
                      </span>

                    </div>


                    <ChevronRight
                      size={16}
                      className="settings-navigation-arrow"
                    />

                  </button>

                );

              }
            )}

          </div>

        </aside>


        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <main className="settings-content">

          <div className="settings-content-header">

            <div>

              <h2>
                {currentSection.title}
              </h2>

              <p>
                {currentSection.description}
              </p>

            </div>

          </div>

          {/* ================================================== */}
          {/* PROFILE SETTINGS */}
          {/* ================================================== */}

          {activeSection === "profile" && (

            <div className="settings-section">


              {/* ---------------------------------------------- */}
              {/* ACCOUNT INFORMATION */}
              {/* ---------------------------------------------- */}

              <form
                className="settings-form-card"
                onSubmit={handleSave}
              >

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <UserRound size={19} />

                  </div>

                  <div>

                    <h3>
                      Account Information
                    </h3>

                    <p>
                      Update the information associated
                      with your account.
                    </p>

                  </div>

                </div>


                <div className="settings-form-grid">


                  {/* NAME */}

                  <div className="settings-field">

                    <label>
                      Full Name
                    </label>

                    <div className="settings-input">

                      <UserRound size={17} />

                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) =>
                          setFullName(
                            event.target.value
                          )
                        }
                        placeholder="Enter your full name"
                      />

                    </div>

                  </div>


                  {/* EMAIL */}

                  <div className="settings-field">

                    <label>
                      Email Address
                    </label>

                    <div className="settings-input">

                      <Mail size={17} />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                        placeholder="Enter your email address"
                      />

                    </div>

                  </div>


                  {/* ROLE */}

                  <div className="settings-field">

                    <label>
                      Account Role
                    </label>

                    <div className="settings-input">

                      <ShieldCheck size={17} />

                      <input
                        type="text"
                        value={role}
                        readOnly
                      />

                    </div>

                    <small>
                      Your account role is managed
                      by the school administrator.
                    </small>

                  </div>

                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-primary-button"
                  >

                    <Save size={17} />

                    Save Changes

                  </button>

                </div>

              </form>


              {/* ---------------------------------------------- */}
              {/* CHANGE PASSWORD */}
              {/* ---------------------------------------------- */}

              <form
                className="settings-form-card"
                onSubmit={handlePasswordChange}
              >

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <LockKeyhole size={19} />

                  </div>

                  <div>

                    <h3>
                      Change Password
                    </h3>

                    <p>
                      Keep your account secure by
                      regularly updating your password.
                    </p>

                  </div>

                </div>


                <div className="settings-form-grid">


                  {/* CURRENT PASSWORD */}

                  <div className="settings-field">

                    <label>
                      Current Password
                    </label>

                    <div className="settings-input">

                      <LockKeyhole size={17} />

                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(
                            event.target.value
                          )
                        }
                        placeholder="Enter current password"
                      />

                    </div>

                  </div>


                  {/* NEW PASSWORD */}

                  <div className="settings-field">

                    <label>
                      New Password
                    </label>

                    <div className="settings-input">

                      <LockKeyhole size={17} />

                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value
                          )
                        }
                        placeholder="Enter new password"
                      />

                    </div>

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="settings-field">

                    <label>
                      Confirm New Password
                    </label>

                    <div className="settings-input">

                      <LockKeyhole size={17} />

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            event.target.value
                          )
                        }
                        placeholder="Confirm new password"
                      />

                    </div>

                  </div>

                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-primary-button"
                  >

                    <LockKeyhole size={17} />

                    Update Password

                  </button>

                </div>

              </form>

            </div>

          )}

          {/* ================================================== */}
          {/* SCHOOL SETTINGS */}
          {/* ================================================== */}

          {activeSection === "school" && (

            <div className="settings-section">

              <form
                className="settings-form-card"
                onSubmit={handleSave}
              >

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <GraduationCap size={19} />

                  </div>

                  <div>

                    <h3>
                      School Information
                    </h3>

                    <p>
                      Manage the basic information displayed
                      throughout your school management system.
                    </p>

                  </div>

                </div>


                <div className="settings-form-grid">


                  {/* SCHOOL NAME */}

                  <div className="settings-field">

                    <label>
                      School Name
                    </label>

                    <div className="settings-input">

                      <GraduationCap size={17} />

                      <input
                        type="text"
                        value={schoolName}
                        onChange={(event) =>
                          setSchoolName(
                            event.target.value
                          )
                        }
                        placeholder="Enter school name"
                      />

                    </div>

                  </div>


                  {/* CONTACT */}

                  <div className="settings-field">

                    <label>
                      School Contact
                    </label>

                    <div className="settings-input">

                      <Mail size={17} />

                      <input
                        type="text"
                        value={schoolContact}
                        onChange={(event) =>
                          setSchoolContact(
                            event.target.value
                          )
                        }
                        placeholder="Enter school contact"
                      />

                    </div>

                  </div>


                  {/* ACADEMIC YEAR */}

                  <div className="settings-field">

                    <label>
                      Academic Year
                    </label>

                    <div className="settings-input">

                      <GraduationCap size={17} />

                      <select
                        value={academicYear}
                        onChange={(event) =>
                          setAcademicYear(
                            event.target.value
                          )
                        }
                      >

                        <option value="2025-26">
                          2025-26
                        </option>

                        <option value="2026-27">
                          2026-27
                        </option>

                        <option value="2027-28">
                          2027-28
                        </option>

                        <option value="2028-29">
                          2028-29
                        </option>

                      </select>

                    </div>

                  </div>


                  {/* ADDRESS */}

                  <div className="settings-field settings-field-full">

                    <label>
                      School Address
                    </label>

                    <textarea
                      value={schoolAddress}
                      onChange={(event) =>
                        setSchoolAddress(
                          event.target.value
                        )
                      }
                      placeholder="Enter school address"
                      rows={4}
                    />

                  </div>

                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-primary-button"
                  >

                    <Save size={17} />

                    Save School Settings

                  </button>

                </div>

              </form>


              {/* ---------------------------------------------- */}
              {/* SCHOOL INFORMATION NOTICE */}
              {/* ---------------------------------------------- */}

              <div className="settings-info-card">

                <div className="settings-info-icon">

                  <ShieldCheck size={18} />

                </div>

                <div>

                  <strong>
                    Administrator access
                  </strong>

                  <p>
                    School information should normally
                    be managed by the school administrator.
                    Teacher access can be restricted when
                    we connect this section to the backend.
                  </p>

                </div>

              </div>

            </div>

          )}

          {/* ================================================== */}
          {/* FACE RECOGNITION SETTINGS */}
          {/* ================================================== */}

          {activeSection === "face" && (

            <div className="settings-section">

              <form
                className="settings-form-card"
                onSubmit={handleSave}
              >

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <Camera size={19} />

                  </div>

                  <div>

                    <h3>
                      Face Recognition Preferences
                    </h3>

                    <p>
                      Configure how the face recognition
                      system handles registered student faces.
                    </p>

                  </div>

                </div>


                <div className="settings-form-grid">


                  {/* RECOGNITION THRESHOLD */}

                  <div className="settings-field">

                    <label>
                      Recognition Threshold
                    </label>

                    <div className="settings-input">

                      <Camera size={17} />

                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={recognitionThreshold}
                        onChange={(event) =>
                          setRecognitionThreshold(
                            event.target.value
                          )
                        }
                      />

                    </div>

                    <small>
                      Higher values require a stronger
                      face match.
                    </small>

                  </div>


                  {/* MAXIMUM PHOTOS */}

                  <div className="settings-field">

                    <label>
                      Maximum Registration Photos
                    </label>

                    <div className="settings-input">

                      <Camera size={17} />

                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={maxRegistrationPhotos}
                        onChange={(event) =>
                          setMaxRegistrationPhotos(
                            event.target.value
                          )
                        }
                      />

                    </div>

                    <small>
                      Maximum number of face photos
                      allowed during student registration.
                    </small>

                  </div>

                </div>


                {/* RECOGNITION INFORMATION */}

                <div className="settings-warning-card">

                  <Camera size={19} />

                  <div>

                    <strong>
                      Face recognition accuracy
                    </strong>

                    <p>
                      Changing the recognition threshold
                      can affect how easily students are
                      matched during attendance.
                    </p>

                  </div>

                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-primary-button"
                  >

                    <Save size={17} />

                    Save Recognition Settings

                  </button>

                </div>

              </form>


              {/* ---------------------------------------------- */}
              {/* CURRENT CONFIGURATION */}
              {/* ---------------------------------------------- */}

              <div className="settings-form-card">

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <ShieldCheck size={19} />

                  </div>

                  <div>

                    <h3>
                      Current Configuration
                    </h3>

                    <p>
                      These values are currently displayed
                      as your selected preferences.
                    </p>

                  </div>

                </div>


                <div className="settings-configuration-list">

                  <div className="settings-configuration-item">

                    <div>

                      <strong>
                        Recognition threshold
                      </strong>

                      <span>
                        Face similarity requirement
                      </span>

                    </div>

                    <b>
                      {recognitionThreshold}
                    </b>

                  </div>


                  <div className="settings-configuration-item">

                    <div>

                      <strong>
                        Registration photos
                      </strong>

                      <span>
                        Maximum photos per student
                      </span>

                    </div>

                    <b>
                      {maxRegistrationPhotos}
                    </b>

                  </div>

                </div>

              </div>

            </div>

          )}

          {/* ================================================== */}
          {/* ATTENDANCE SETTINGS */}
          {/* ================================================== */}

          {activeSection === "attendance" && (

            <div className="settings-section">

              <form
                className="settings-form-card"
                onSubmit={handleSave}
              >

                <div className="settings-form-card-header">

                  <div className="settings-form-card-icon">

                    <ClipboardCheck size={19} />

                  </div>

                  <div>

                    <h3>
                      Attendance Preferences
                    </h3>

                    <p>
                      Configure attendance rules and
                      teacher permissions.
                    </p>

                  </div>

                </div>


                <div className="settings-form-grid">


                  {/* MINIMUM ATTENDANCE */}

                  <div className="settings-field">

                    <label>
                      Minimum Attendance Requirement
                    </label>

                    <div className="settings-input">

                      <ClipboardCheck size={17} />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minimumAttendance}
                        onChange={(event) =>
                          setMinimumAttendance(
                            event.target.value
                          )
                        }
                      />

                      <span className="settings-input-suffix">
                        %
                      </span>

                    </div>

                    <small>
                      Students below this percentage
                      can be highlighted in reports.
                    </small>

                  </div>


                  {/* MANUAL CORRECTION */}

                  <div className="settings-toggle-field">

                    <div className="settings-toggle-content">

                      <strong>
                        Allow Manual Attendance Correction
                      </strong>

                      <span>
                        Allow authorized users to correct
                        attendance records manually.
                      </span>

                    </div>


                    <label className="settings-switch">

                      <input
                        type="checkbox"
                        checked={
                          allowManualCorrection
                        }
                        onChange={(event) =>
                          setAllowManualCorrection(
                            event.target.checked
                          )
                        }
                      />

                      <span className="settings-switch-slider" />

                    </label>

                  </div>


                  {/* TEACHER EDITING */}

                  <div className="settings-toggle-field">

                    <div className="settings-toggle-content">

                      <strong>
                        Allow Teachers to Edit Attendance
                      </strong>

                      <span>
                        Teachers can modify attendance
                        records after recognition.
                      </span>

                    </div>


                    <label className="settings-switch">

                      <input
                        type="checkbox"
                        checked={
                          allowTeacherEditing
                        }
                        onChange={(event) =>
                          setAllowTeacherEditing(
                            event.target.checked
                          )
                        }
                      />

                      <span className="settings-switch-slider" />

                    </label>

                  </div>

                </div>


                {/* ATTENDANCE NOTICE */}

                <div className="settings-info-card">

                  <div className="settings-info-icon">

                    <ClipboardCheck size={18} />

                  </div>

                  <div>

                    <strong>
                      Attendance protection
                    </strong>

                    <p>
                      Attendance changes should be
                      restricted to authorized users.
                      This helps protect the accuracy
                      of student attendance records.
                    </p>

                  </div>

                </div>


                <div className="settings-form-actions">

                  <button
                    type="submit"
                    className="settings-primary-button"
                  >

                    <Save size={17} />

                    Save Attendance Settings

                  </button>

                </div>

              </form>

            </div>

          )}

          </main>

      </div>

    </div>

  );
}


export default Settings;