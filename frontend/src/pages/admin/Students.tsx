import { useEffect, useState } from "react";
import "./Students.css";

// ============================================================
// STUDENT TYPE
// ============================================================

interface Student {

  id: number;

  school_id: number;

  class_id: number;

  class_name: string;

  section: string;

  name: string;

  roll_number: string;

  date_of_birth: string | null;

  gender: string | null;

  is_active: boolean;

  face_registration: unknown | null;
}


// ============================================================
// BACKEND URL
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// STUDENTS PAGE
// ============================================================

export default function Students() {

  // ==========================================================
  // STUDENT DATA
  // ==========================================================

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  // ==========================================================
  // SEARCH & FILTERS
  // ==========================================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");


  // ==========================================================
  // ADD STUDENT
  // ==========================================================

  const [showAddStudent, setShowAddStudent] =
    useState(false);

  const [studentName, setStudentName] =
    useState("");

  const [studentRollNumber, setStudentRollNumber] =
    useState("");

  const [studentClass, setStudentClass] =
    useState("");

  const [studentSection, setStudentSection] =
    useState("");

  const [studentGender, setStudentGender] =
    useState("");

  const [studentDateOfBirth, setStudentDateOfBirth] =
    useState("");

  const [savingStudent, setSavingStudent] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const [editingStudent, setEditingStudent] =
  useState<Student | null>(null);

const [updatingStudent, setUpdatingStudent] =
  useState(false);

const [updateError, setUpdateError] =
  useState<string | null>(null);

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = (): string | null => {
  const token = localStorage.getItem(
    "Smart Attend token"
  );

  console.log(
    "Students token:",
    token ? "FOUND" : "NOT FOUND"
  );

  return token;
};

  // ==========================================================
  // FETCH STUDENTS
  // ==========================================================

  const fetchStudents = async () => {

    try {

      setLoading(true);

      setError(null);


      const token =
        getToken();


      if (!token) {

        throw new Error(
          "Authentication token not found. Please login again."
        );

      }


      const response =
        await fetch(
          `${API_BASE_URL}/api/admin/students`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json"
            }
          }
        );


      if (!response.ok) {

        if (
          response.status === 401
        ) {

          throw new Error(
            "Authentication failed. Please login again."
          );

        }


        if (
          response.status === 403
        ) {

          throw new Error(
            "Administrator access required."
          );

        }


        throw new Error(
          `Failed to load students (${response.status})`
        );

      }


      const data = await response.json();

        console.log(
        "Students API response:",
        data
        );

        setStudents(data);

    } catch (err) {

      console.error(
        "Error fetching students:",
        err
      );


      if (
        err instanceof Error
      ) {

        setError(
          err.message
        );

      } else {

        setError(
          "Failed to load students."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LOAD STUDENTS
  // ==========================================================

  useEffect(() => {

    fetchStudents();

  }, []);


  // ==========================================================
  // CLASS OPTIONS
  // ==========================================================

  const classOptions =
    Array.from(
      new Set(
        students.map(
          (student) =>
            student.class_name
        )
      )
    ).sort();


  // ==========================================================
  // SECTION OPTIONS
  // ==========================================================

  const sectionOptions =
    Array.from(
      new Set(
        students
          .filter(
            (student) =>
              !selectedClass ||
              student.class_name ===
                selectedClass
          )
          .map(
            (student) =>
              student.section
          )
      )
    ).sort();


  // ==========================================================
  // FILTERED STUDENTS
  // ==========================================================

  const filteredStudents =
    students.filter(
      (student) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();


        const matchesSearch =
          !search ||
          student.name
            .toLowerCase()
            .includes(search) ||
          student.roll_number
            .toLowerCase()
            .includes(search);


        const matchesClass =
          !selectedClass ||
          student.class_name ===
            selectedClass;


        const matchesSection =
          !selectedSection ||
          student.section ===
            selectedSection;


        return (
          matchesSearch &&
          matchesClass &&
          matchesSection
        );

      }
    );


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    value: string | null
  ): string => {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleDateString();

  };

  const showStudentValue = (
  student: Student,
  value: string | null
): string => {

  if (!student.is_active) {
    return "—";
  }

  return value || "—";
};

const createStudent = async () => {
  try {
    setSavingStudent(true);
    setSaveError(null);

    const token = getToken();

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    if (
      !studentName.trim() ||
      !studentRollNumber.trim() ||
      !studentClass.trim() ||
      !studentSection.trim()
    ) {
      throw new Error("Please fill all required fields.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/students`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: studentName.trim(),
          roll_number: studentRollNumber.trim(),
          class_name: studentClass.trim(),
          section: studentSection.trim().toUpperCase(),
          gender: studentGender || null,
          date_of_birth: studentDateOfBirth || null,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      throw new Error(
        data?.detail || "Failed to create student."
      );
    }

    await fetchStudents();

    setStudentName("");
    setStudentRollNumber("");
    setStudentClass("");
    setStudentSection("");
    setStudentGender("");
    setStudentDateOfBirth("");

    setShowAddStudent(false);

  } catch (err) {
    setSaveError(
      err instanceof Error
        ? err.message
        : "Failed to create student."
    );
  } finally {
    setSavingStudent(false);
  }
};

const updateStudent = async () => {
  if (!editingStudent) return;

  try {
    setUpdatingStudent(true);
    setUpdateError(null);

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found."
      );
    }

    const params = new URLSearchParams({
      current_class_name:
        editingStudent.class_name,

      current_section:
        editingStudent.section,

      current_roll_number:
        editingStudent.roll_number,
    });

    const response = await fetch(
      `${API_BASE_URL}/api/admin/students/by-roll/details?${params.toString()}`,
      {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          class_name:
            studentClass.trim(),

          section:
            studentSection
              .trim()
              .toUpperCase(),

          roll_number:
            studentRollNumber.trim(),

          name:
            studentName.trim(),

          gender:
            studentGender || null,

          date_of_birth:
            studentDateOfBirth || null,
        }),
      }
    );

    if (!response.ok) {
      const data =
        await response.json().catch(
          () => null
        );

      throw new Error(
        data?.detail ||
        "Failed to update student."
      );
    }

    await fetchStudents();

    setEditingStudent(null);

  } catch (err) {

    setUpdateError(
      err instanceof Error
        ? err.message
        : "Failed to update student."
    );

  } finally {

    setUpdatingStudent(false);

  }
};

const toggleStudentStatus = async (
  student: Student
) => {

  try {

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/students/by-roll`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          class_name: student.class_name,
          section: student.section,
          roll_number: student.roll_number,
        }),
      }
    );

    if (!response.ok) {

      const data =
        await response.json().catch(
          () => null
        );

      throw new Error(
        data?.detail ||
        "Failed to update student status."
      );
    }

    const updatedStudent =
      await response.json();

        console.log(
  "Updated student from API:",
  updatedStudent
);
    setStudents((currentStudents) =>
      currentStudents.map((item) =>
        item.id === updatedStudent.id
          ? updatedStudent
          : item
      )
    );

  } catch (err) {

    console.error(
      "Error updating student status:",
      err
    );

  }
};
  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div
      style={{
        padding: "24px"
      }}
    >

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "24px"
        }}
      >

        <div>

          <h1>
            Students
          </h1>

          {!loading &&
            !error && (

              <p>
                Showing{" "}
                {filteredStudents.length}
                {" "}
                of{" "}
                {students.length}
                {" "}
                students
              </p>

            )}

        </div>


        <button
  type="button"
  className="add-student-btn"
  onClick={() => {

    setSaveError(null);

    setShowAddStudent(true);

  }}
>
  <span className="add-student-icon">+</span>
  <span>Add Student</span>
</button>

      </div>


      {/* ================================================== */}
      {/* LOADING */}
      {/* ================================================== */}

      {loading && (
        <div className="admin-student-state admin-student-loading">
            <p>Loading students...</p>
        </div>
    )}


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {!loading &&
            error && (
                <div className="admin-student-state admin-student-error">
                <p>{error}</p>

                <button
                    type="button"
                    onClick={fetchStudents}
                >
                    Try Again
                </button>
                </div>
        )}

      {/* ================================================== */}
      {/* FILTERS */}
      {/* ================================================== */}

      {!loading &&
        !error &&
        students.length > 0 && (

          <div className="admin-student-filters">

  <input
    type="text"
    placeholder="Search by name or roll number"
    value={searchTerm}
    onChange={(event) =>
      setSearchTerm(event.target.value)
    }
  />

  <select
    value={selectedClass}
    onChange={(event) => {
      setSelectedClass(event.target.value);
      setSelectedSection("");
    }}
  >
    <option value="">
      All Classes
    </option>

    {classOptions.map((className) => (
      <option
        key={className}
        value={className}
      >
        {className}
      </option>
    ))}
  </select>

  <select
    value={selectedSection}
    onChange={(event) =>
      setSelectedSection(event.target.value)
    }
  >
    <option value="">
      All Sections
    </option>

    {sectionOptions.map((section) => (
      <option
        key={section}
        value={section}
      >
        Section {section}
      </option>
    ))}
  </select>

  <button
    type="button"
    onClick={() => {
      setSearchTerm("");
      setSelectedClass("");
      setSelectedSection("");
    }}
  >
    Reset
  </button>

</div>
          

        )}


        {showAddStudent && (
            <div className="admin-student-form">

                <h2>Add Student</h2>

                {saveError && (
                <p>{saveError}</p>
                )}

                <input
                placeholder="Student Name"
                value={studentName}
                onChange={(e) =>
                    setStudentName(e.target.value)
                }
                />

                <input
                placeholder="Roll Number"
                value={studentRollNumber}
                onChange={(e) =>
                    setStudentRollNumber(e.target.value)
                }
                />

                <input
                placeholder="Class"
                value={studentClass}
                onChange={(e) =>
                    setStudentClass(e.target.value)
                }
                />

                <input
                placeholder="Section"
                value={studentSection}
                onChange={(e) =>
                    setStudentSection(e.target.value)
                }
                />

                <select
                value={studentGender}
                onChange={(e) =>
                    setStudentGender(e.target.value)
                }
                >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                </select>

                <input
                type="date"
                value={studentDateOfBirth}
                onChange={(e) =>
                    setStudentDateOfBirth(e.target.value)
                }
                />

                <button
                type="button"
                onClick={createStudent}
                disabled={savingStudent}
                >
                {savingStudent ? "Saving..." : "Save Student"}
                </button>

                <button
                type="button"
                onClick={() => {
                    setShowAddStudent(false);
                    setSaveError(null);
                }}
                >
                Cancel
                </button>

            </div>
            )}


      {/* ================================================== */}
      {/* STUDENT TABLE */}
      {/* ================================================== */}

      {editingStudent && (
        <div className="admin-student-form">

            <h2>Edit Student</h2>

            {updateError && (
            <p>{updateError}</p>
            )}

            <input
            placeholder="Student Name"
            value={studentName}
            onChange={(e) =>
                setStudentName(e.target.value)
            }
            />

            <input
            placeholder="Roll Number"
            value={studentRollNumber}
            onChange={(e) =>
                setStudentRollNumber(e.target.value)
            }
            />

            <input
            placeholder="Class"
            value={studentClass}
            onChange={(e) =>
                setStudentClass(e.target.value)
            }
            />

            <input
            placeholder="Section"
            value={studentSection}
            onChange={(e) =>
                setStudentSection(e.target.value)
            }
            />

            <select
            value={studentGender}
            onChange={(e) =>
                setStudentGender(e.target.value)
            }
            >
            <option value="">
                Gender
            </option>

            <option value="Male">
                Male
            </option>

            <option value="Female">
                Female
            </option>

            <option value="Other">
                Other
            </option>
            </select>

            <input
            type="date"
            value={studentDateOfBirth}
            onChange={(e) =>
                setStudentDateOfBirth(
                e.target.value
                )
            }
            />

            <button
            type="button"
            onClick={updateStudent}
            disabled={updatingStudent}
            >
            {updatingStudent
                ? "Updating..."
                : "Update Student"}
            </button>

            <button
            type="button"
            onClick={() => {
                setEditingStudent(null);
                setUpdateError(null);
            }}
            >
            Cancel
            </button>

        </div>
        )}

      {!loading &&
        !error &&
        filteredStudents.length >
          0 && (

          <div
            className="admin-student-table-wrapper"
          >

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse"
              }}
            >

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Roll Number
                  </th>

                  <th>
                    Class
                  </th>

                  <th>
                    Section
                  </th>

                  <th>
                    Gender
                  </th>

                  <th>
                    Date of Birth
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

                {filteredStudents.map(
                  (student) => (

                    <tr
                      key={
                        student.id
                      }
                    >

                      <td>
                            {showStudentValue(
                                student,
                                student.name
                            )}
                            </td>

                            <td>
                            {showStudentValue(
                                student,
                                student.roll_number
                            )}
                            </td>

                            <td>
                            {showStudentValue(
                                student,
                                student.class_name
                            )}
                            </td>

                            <td>
                            {showStudentValue(
                                student,
                                student.section
                            )}
                            </td>

                            <td>
                            {showStudentValue(
                                student,
                                student.gender
                            )}
                            </td>

                            <td>
                            {student.is_active
                                ? formatDate(student.date_of_birth)
                                : "—"}
                            </td>

                      <td>
                        <span
                            className={
                            student.is_active
                                ? "student-status active"
                                : "student-status inactive"
                            }
                        >
                            {student.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                        </td>

                      <td>
  <div className="student-actions">

    <button
      type="button"
      className="student-edit-btn"
      onClick={() => {

        setEditingStudent(student);

        setStudentName(
          student.name
        );

        setStudentRollNumber(
          student.roll_number
        );

        setStudentClass(
          student.class_name
        );

        setStudentSection(
          student.section
        );

        setStudentGender(
          student.gender || ""
        );

        setStudentDateOfBirth(
          student.date_of_birth || ""
        );

        setUpdateError(null);

      }}
    >
      Edit
    </button>


    <button
      type="button"
      className={
        student.is_active
          ? "student-deactivate-btn"
          : "student-activate-btn"
      }
      onClick={() =>
        toggleStudentStatus(student)
      }
    >
      {student.is_active
        ? "Deactivate"
        : "Activate"}
    </button>

  </div>
</td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}


      {/* ================================================== */}
      {/* NO STUDENTS */}
      {/* ================================================== */}

      {!loading &&
        !error &&
        students.length ===
          0 && (

          <div className="admin-student-state admin-student-empty">
            <p>No students found.</p>
          </div>

        )}


      {/* ================================================== */}
      {/* NO FILTER RESULTS */}
      {/* ================================================== */}

      {!loading &&
        !error &&
        students.length > 0 &&
        filteredStudents.length ===
          0 && (

          <div className="admin-student-state admin-student-empty">
            <p>
                No students match your search or filters.
            </p>
        </div>

        )}

    </div>

  );

}