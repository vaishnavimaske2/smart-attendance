import { useEffect, useState } from "react";

import {
  BookOpen,
  GraduationCap,
} from "lucide-react";

import { apiRequest } from "../../services/api";


interface Subject {
  subject_id: number;
  subject_name: string;
}


interface StudentProfile {
  name: string;
  class_name: string;
  section: string;
  subjects: Subject[];
}


function MySubjects() {

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function loadSubjects() {

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
            : "Unable to load subjects."
        );

      } finally {

        setLoading(false);

      }

    }

    loadSubjects();

  }, []);


  if (loading) {

    return (
      <div className="student-module-loading">
        Loading your subjects...
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
          <BookOpen size={26} />
        </div>

        <div>

          <h1>
            My Subjects
          </h1>

          <p>
            {profile.class_name}
            {" • "}
            Section {profile.section}
          </p>

        </div>

      </div>


      <div className="student-subject-page-grid">

        {profile.subjects.length === 0 ? (

          <div className="student-empty-state">

            <BookOpen size={30} />

            <h3>
              No subjects assigned
            </h3>

            <p>
              No subjects have been assigned
              to your class yet.
            </p>

          </div>

        ) : (

          profile.subjects.map(
            (subject, index) => (

              <div
                className="student-subject-page-card"
                key={subject.subject_id}
              >

                <div className="student-subject-page-number">

                  {String(index + 1).padStart(2, "0")}

                </div>


                <div>

                  <h3>
                    {subject.subject_name}
                  </h3>

                  <p>
                    {profile.class_name}
                    {" • "}
                    Section {profile.section}
                  </p>

                </div>


                <GraduationCap
                  size={21}
                />

              </div>

            )
          )

        )}

      </div>

    </div>

  );

}


export default MySubjects;