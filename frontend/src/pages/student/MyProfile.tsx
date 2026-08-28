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


function MyProfile() {

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadProfile() {

      try {

        const data =
          await apiRequest(
            "/api/student-profile/me"
          );

        setProfile(data);

      } catch (error) {

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


  if (loading) {

    return (
      <div className="student-module-loading">
        Loading your profile...
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


  if (!profile) {
    return null;
  }


  return (

    <div className="student-module-page">

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


      {/* PROFILE HEADER */}

      <section className="student-profile-card">

        <div className="student-profile-avatar">

          {profile.name
            .charAt(0)
            .toUpperCase()
          }

        </div>


        <div>

          <h2>
            {profile.name}
          </h2>

          <p>
            Student • {profile.class_name}
          </p>

        </div>

      </section>


      {/* DETAILS */}

      <section className="student-profile-grid">


        <div className="student-profile-detail">

          <Hash size={21} />

          <div>

            <span>
              Roll Number
            </span>

            <strong>
              {profile.roll_number}
            </strong>

          </div>

        </div>


        <div className="student-profile-detail">

          <GraduationCap size={21} />

          <div>

            <span>
              Class
            </span>

            <strong>
              {profile.class_name}
            </strong>

          </div>

        </div>


        <div className="student-profile-detail">

          <Layers3 size={21} />

          <div>

            <span>
              Section
            </span>

            <strong>
              {profile.section}
            </strong>

          </div>

        </div>


        <div className="student-profile-detail">

          <CalendarDays size={21} />

          <div>

            <span>
              Academic Year
            </span>

            <strong>
              {profile.academic_year}
            </strong>

          </div>

        </div>


        <div className="student-profile-detail">

          <CalendarDays size={21} />

          <div>

            <span>
              Date of Birth
            </span>

            <strong>
              {profile.date_of_birth
                ? profile.date_of_birth
                : "Not available"
              }
            </strong>

          </div>

        </div>


        <div className="student-profile-detail">

          <VenusAndMars size={21} />

          <div>

            <span>
              Gender
            </span>

            <strong>
              {profile.gender
                || "Not available"
              }
            </strong>

          </div>

        </div>

      </section>

    </div>

  );

}


export default MyProfile;