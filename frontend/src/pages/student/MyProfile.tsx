import { useEffect, useState } from "react";

import {
  UserRound,
  GraduationCap,
  Hash,
  Layers3,
  CalendarDays,
  VenusAndMars,
} from "lucide-react";

import { apiRequest } from "../../services/api";


// ============================================================
// STUDENT PROFILE TYPE
// ============================================================

interface StudentProfile {
  id: number;

  name: string;

  roll_number: string;

  class_id: number;

  class_name: string;

  section: string;

  academic_year: string;

  date_of_birth?: string | null;

  gender?: string | null;

  subjects: {
    subject_id: number;
    subject_name: string;
  }[];
}


// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (
  dateValue?: string | null
): string => {

  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString();
};


// ============================================================
// MY PROFILE
// ============================================================

function MyProfile() {

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {

    async function loadProfile() {

      try {

        setLoading(true);

        setError("");


        const data =
          await apiRequest(
            "/api/student-profile/me"
          );


        console.log(
          "Student profile API response:",
          data
        );


        /*
         * Some APIs return the profile directly:
         *
         * {
         *   id: 1,
         *   name: "...",
         *   gender: "Male",
         *   date_of_birth: "2005-01-01"
         * }
         *
         * Others return:
         *
         * {
         *   profile: {
         *     ...
         *   }
         * }
         *
         * Handle both.
         */

        const profileData =
          data?.profile ?? data;


        setProfile(
          profileData
        );

      } catch (error) {

        console.error(
          "Error loading student profile:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load profile."
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
        Loading your profile...
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


  // ==========================================================
  // NO PROFILE
  // ==========================================================

  if (!profile) {

    return (
      <div className="student-module-error">
        Student profile not found.
      </div>
    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="student-module-page">


      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="student-module-header">

        <div className="student-module-icon">

          <UserRound size={26} />

        </div>


        <div>

          <h1>
            My Profile
          </h1>

          <p>
            Your personal and academic information.
          </p>

        </div>

      </div>


      {/* ================================================== */}
      {/* PROFILE HEADER */}
      {/* ================================================== */}

      <section className="student-profile-card">

        <div className="student-profile-avatar">

          {profile.name
            ? profile.name
                .charAt(0)
                .toUpperCase()
            : "S"
          }

        </div>


        <div>

          <h2>
            {profile.name || "Student"}
          </h2>

          <p>
            Student •{" "}
            {profile.class_name || "Class not available"}
          </p>

        </div>

      </section>


      {/* ================================================== */}
      {/* DETAILS */}
      {/* ================================================== */}

      <section className="student-profile-grid">


        {/* ================================================= */}
        {/* ROLL NUMBER */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <Hash size={21} />

          <div>

            <span>
              Roll Number
            </span>

            <strong>
              {profile.roll_number || "Not available"}
            </strong>

          </div>

        </div>


        {/* ================================================= */}
        {/* CLASS */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <GraduationCap size={21} />

          <div>

            <span>
              Class
            </span>

            <strong>
              {profile.class_name || "Not available"}
            </strong>

          </div>

        </div>


        {/* ================================================= */}
        {/* SECTION */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <Layers3 size={21} />

          <div>

            <span>
              Section
            </span>

            <strong>
              {profile.section || "Not available"}
            </strong>

          </div>

        </div>


        {/* ================================================= */}
        {/* ACADEMIC YEAR */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <CalendarDays size={21} />

          <div>

            <span>
              Academic Year
            </span>

            <strong>
              {profile.academic_year || "Not available"}
            </strong>

          </div>

        </div>


        {/* ================================================= */}
        {/* DATE OF BIRTH */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <CalendarDays size={21} />

          <div>

            <span>
              Date of Birth
            </span>

            <strong>
              {formatDate(
                profile.date_of_birth
              )}
            </strong>

          </div>

        </div>


        {/* ================================================= */}
        {/* GENDER */}
        {/* ================================================= */}

        <div className="student-profile-detail">

          <VenusAndMars size={21} />

          <div>

            <span>
              Gender
            </span>

            <strong>
              {profile.gender
                ? profile.gender
                : "Not available"
              }
            </strong>

          </div>

        </div>


      </section>

    </div>

  );

}


export default MyProfile;