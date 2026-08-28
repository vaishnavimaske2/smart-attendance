import { useEffect, useState } from "react";
import "./Classes.css";
import {
  Plus,
  Search,
  Pencil,
  Power,
  Users,
  X,
} from "lucide-react";


// ============================================================
// TYPES
// ============================================================

interface ClassItem {
  id: number;
  name: string;
  section: string;
  is_active: boolean;
  school_id: number;
  student_count?: number;
}


// ============================================================
// API
// ============================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// COMPONENT
// ============================================================

export default function Classes() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [classes, setClasses] =
    useState<ClassItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [searchTerm, setSearchTerm] =
    useState("");


  // ==========================================================
  // ADD / EDIT FORM
  // ==========================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingClass, setEditingClass] =
    useState<ClassItem | null>(null);

  const [className, setClassName] =
    useState("");

  const [section, setSection] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = () => {

    return localStorage.getItem(
      "Smart Attend token"
    );

  };


  // ==========================================================
  // LOAD CLASSES
  // ==========================================================

  const fetchClasses = async () => {
  try {
    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      throw new Error(
        "Authentication token not found. Please login again."
      );
    }

    const url =
      `${API_BASE_URL}/api/classes/admin`;

    console.log("Fetching classes from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log(
      "Classes response status:",
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      "Classes raw response:",
      responseText
    );

    if (!response.ok) {
      let errorMessage =
        `Failed to load classes (${response.status})`;

      try {
        const errorData =
          JSON.parse(responseText);

        if (errorData?.detail) {
          errorMessage =
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail);
        }
      } catch {
        // Response was not JSON.
      }

      throw new Error(errorMessage);
    }

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        "Server returned an invalid JSON response."
      );
    }

    console.log(
      "Classes parsed data:",
      data
    );

    if (!Array.isArray(data)) {
      throw new Error(
        "Invalid classes response from server."
      );
    }

    setClasses(data as ClassItem[]);

  } catch (err) {
    console.error(
      "Error loading classes:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load classes."
    );

  } finally {
    setLoading(false);
  }
};


  // ==========================================================
  // LOAD ON PAGE OPEN
  // ==========================================================

  useEffect(() => {

    fetchClasses();

  }, []);


  // ==========================================================
  // OPEN ADD FORM
  // ==========================================================

  const openAddForm = () => {

    setEditingClass(null);

    setClassName("");

    setSection("");

    setFormError("");

    setSuccess("");

    setShowForm(true);

  };


  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  const openEditForm = (
    item: ClassItem
  ) => {

    setEditingClass(item);

    setClassName(item.name);

    setSection(item.section);

    setFormError("");

    setSuccess("");

    setShowForm(true);

  };


  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const closeForm = () => {

    setShowForm(false);

    setEditingClass(null);

    setClassName("");

    setSection("");

    setFormError("");

  };


  // ==========================================================
  // SAVE CLASS
  // ==========================================================

  const saveClass = async () => {

    try {

      setSaving(true);

      setFormError("");

      setSuccess("");


      const token = getToken();

      if (!token) {

        throw new Error(
          "Authentication token not found."
        );

      }


      if (!className.trim()) {

        throw new Error(
          "Please enter a class name."
        );

      }


      if (!section.trim()) {

        throw new Error(
          "Please enter a section."
        );

      }


      const payload = {

        name:
          className.trim(),

        section:
          section.trim().toUpperCase(),

      };


      const url =
        editingClass

          ? `${API_BASE_URL}/api/classes/admin/${editingClass.id}`

          : `${API_BASE_URL}/api/classes/admin`;


      const response =
        await fetch(
          url,
          {
            method:
              editingClass
                ? "PUT"
                : "POST",

            headers: {

              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify(payload),

          }
        );


      if (!response.ok) {

        const data =
          await response.json()
            .catch(() => null);

        const detail = data?.detail;

throw new Error(
  typeof detail === "string"
    ? detail
    : Array.isArray(detail)
      ? detail
          .map((item) =>
            item?.msg || "Validation error"
          )
          .join(", ")
      : "Failed to save class."
);

      }


      const data =
        await response.json();


      setSuccess(
        data.message ||
        (
          editingClass
            ? "Class updated successfully."
            : "Class created successfully."
        )
      );


      closeForm();

      await fetchClasses();

    } catch (err) {

      console.error(
        "Error saving class:",
        err
      );

      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to save class."
      );

    } finally {

      setSaving(false);

    }

  };


  // ==========================================================
  // TOGGLE STATUS
  // ==========================================================

  const toggleClassStatus = async (
    item: ClassItem
  ) => {

    try {

      const token = getToken();

      if (!token) {

        throw new Error(
          "Authentication token not found."
        );

      }


      const nextStatus =
        !item.is_active;


      const response =
        await fetch(
          `${API_BASE_URL}/api/classes/admin/${item.id}/status?is_active=${nextStatus}`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (!response.ok) {

        const data =
          await response.json()
            .catch(() => null);

        throw new Error(
          data?.detail ||
          "Failed to update class status."
        );

      }


      const data =
        await response.json();


      setSuccess(
        data.message ||
        "Class status updated successfully."
      );


      await fetchClasses();

    } catch (err) {

      console.error(
        "Error updating class:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update class."
      );

    }

  };


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredClasses =
    classes.filter(
      (item) => {

        const search =
          searchTerm
            .trim()
            .toLowerCase();


        if (!search) {
          return true;
        }


        return (
          item.name
            .toLowerCase()
            .includes(search)
          ||
          item.section
            .toLowerCase()
            .includes(search)
        );

      }
    );


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalClasses =
    classes.length;


  const activeClasses =
    classes.filter(
      (item) =>
        item.is_active
    ).length;


  const inactiveClasses =
    classes.filter(
      (item) =>
        !item.is_active
    ).length;


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="admin-classes">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="admin-module-header">

        <div>

          <span className="admin-module-label">
            ADMINISTRATION
          </span>

          <h1>
            Classes
          </h1>

          <p>
            Manage classes and sections
            in your school.
          </p>

        </div>


        <button
          type="button"
          className="admin-primary-button"
          onClick={openAddForm}
        >

          <Plus size={18} />

          Add Class

        </button>

      </div>


      {/* ================================================== */}
      {/* SUCCESS */}
      {/* ================================================== */}

      {success && (

        <div className="admin-form-message admin-form-message-success">

          {success}

        </div>

      )}


      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (

        <div className="admin-form-message admin-form-message-error">

          {error}

        </div>

      )}


      {/* ================================================== */}
      {/* SUMMARY */}
      {/* ================================================== */}

      <div className="admin-class-summary">

        <div className="admin-class-summary-card">

          <Users size={20} />

          <div>

            <span>
              Total Classes
            </span>

            <strong>
              {totalClasses}
            </strong>

          </div>

        </div>


        <div className="admin-class-summary-card">

          <Users size={20} />

          <div>

            <span>
              Active Classes
            </span>

            <strong>
              {activeClasses}
            </strong>

          </div>

        </div>


        <div className="admin-class-summary-card">

          <Users size={20} />

          <div>

            <span>
              Inactive Classes
            </span>

            <strong>
              {inactiveClasses}
            </strong>

          </div>

        </div>

      </div>


      {/* ================================================== */}
      {/* SEARCH */}
      {/* ================================================== */}

      <div className="admin-class-toolbar">

        <div className="admin-search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search classes or sections..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

      </div>


      {/* ================================================== */}
      {/* FORM */}
      {/* ================================================== */}

      {showForm && (

        <div className="admin-class-form-card">

          <div className="admin-class-form-header">

            <div>

              <h2>
                {editingClass
                  ? "Edit Class"
                  : "Add Class"}
              </h2>

              <p>
                {editingClass
                  ? "Update class information."
                  : "Create a new class and section."}
              </p>

            </div>


            <button
              type="button"
              onClick={closeForm}
            >

              <X size={18} />

            </button>

          </div>


          {formError && (

            <div className="admin-form-message admin-form-message-error">

              {formError}

            </div>

          )}


          <div className="admin-class-form">

            <div className="admin-form-field">

              <label>
                Class Name
              </label>

              <input
                type="text"
                value={className}
                onChange={(event) =>
                  setClassName(
                    event.target.value
                  )
                }
                placeholder="Example: Class 10"
              />

            </div>


            <div className="admin-form-field">

              <label>
                Section
              </label>

              <input
                type="text"
                value={section}
                onChange={(event) =>
                  setSection(
                    event.target.value
                  )
                }
                placeholder="Example: A"
              />

            </div>


            <div className="admin-class-form-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>


              <button
                type="button"
                className="admin-primary-button"
                onClick={saveClass}
                disabled={saving}
              >

                {saving
                  ? "Saving..."
                  : editingClass
                    ? "Update Class"
                    : "Create Class"}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================================================== */}
      {/* TABLE */}
      {/* ================================================== */}

      <div className="admin-classes-card">

        <div className="admin-classes-card-header">

          <div>

            <h2>
              Class Accounts
            </h2>

            <p>
              View and manage classes
              registered in your school.
            </p>

          </div>


          <span className="admin-record-count">

            {filteredClasses.length}{" "}

            {filteredClasses.length === 1
              ? "class"
              : "classes"}

          </span>

        </div>


        <div className="admin-classes-table-wrapper">

          {loading ? (

            <div className="admin-table-empty">

              Loading classes...

            </div>

          ) : filteredClasses.length === 0 ? (

            <div className="admin-table-empty">

              <Users size={30} />

              <strong>
                No classes found
              </strong>

              <span>
                Add a class to get started.
              </span>

            </div>

          ) : (

            <table className="admin-classes-table">

              <thead>

                <tr>

                  <th>
                    Class
                  </th>

                  <th>
                    Section
                  </th>

                  <th>
                    Students
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

                {filteredClasses.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>

                        <strong>
                          {item.name}
                        </strong>

                      </td>


                      <td>

                        <span className="admin-class-section-badge">

                          {item.section}

                        </span>

                      </td>


                      <td>

                        {item.student_count ?? 0}

                      </td>


                      <td>

                        <span
                          className={
                            item.is_active
                              ? "admin-status-status active"
                              : "admin-status-status inactive"
                          }
                        >

                          {item.is_active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>


                      <td>

                        <div className="admin-class-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(item)
                            }
                          >

                            <Pencil size={15} />

                            Edit

                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              toggleClassStatus(item)
                            }
                          >

                            <Power size={15} />

                            {item.is_active
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

          )}

        </div>

      </div>

    </div>

  );

}