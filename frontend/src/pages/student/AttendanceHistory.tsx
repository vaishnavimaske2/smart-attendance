import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  History,
  CheckCircle2,
  XCircle,
  Clock3,
  CircleAlert,
  Filter,
  RotateCcw,
} from "lucide-react";

import { apiRequest } from "../../services/api";


interface AttendanceRecord {
  id: number;
  attendance_date: string;
  subject_id: number | null;
  subject_name: string;
  status: string;
}


interface HistoryResponse {
  total_records: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  records: AttendanceRecord[];
}


function AttendanceHistory() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [data, setData] =
    useState<HistoryResponse | null>(null);


  // ==========================================================
  // FILTERS
  // ==========================================================

  const [subjectId, setSubjectId] =
    useState("");


  const [status, setStatus] =
    useState("");


  const [fromDate, setFromDate] =
    useState("");


  const [toDate, setToDate] =
    useState("");


  // ==========================================================
  // UI
  // ==========================================================

  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  async function loadHistory() {

    try {

      setLoading(true);

      setError("");


      const params =
        new URLSearchParams();


      if (subjectId) {

        params.set(
          "subject_id",
          subjectId
        );

      }


      if (status) {

        params.set(
          "status",
          status
        );

      }


      if (fromDate) {

        params.set(
          "from_date",
          fromDate
        );

      }


      if (toDate) {

        params.set(
          "to_date",
          toDate
        );

      }


      const queryString =
        params.toString();


      const endpoint =
        queryString
          ? `/api/attendance/student/history?${queryString}`
          : "/api/attendance/student/history";


      const response =
        await apiRequest(
          endpoint
        );


      setData(response);


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load attendance history."
      );


    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadHistory();

  }, []);


  // ==========================================================
  // SUBJECT LIST
  // ==========================================================

  const subjects =
    useMemo(() => {

      const records =
        data?.records || [];


      const map =
        new Map<number, string>();


      records.forEach(
        (record) => {

          if (
            record.subject_id !== null
          ) {

            map.set(
              record.subject_id,
              record.subject_name
            );

          }

        }
      );


      return Array.from(
        map.entries()
      ).map(
        ([id, name]) => ({
          id,
          name,
        })
      );

    }, [data]);


  // ==========================================================
  // RESET
  // ==========================================================

  function resetFilters() {

    setSubjectId("");

    setStatus("");

    setFromDate("");

    setToDate("");

    setTimeout(
      () => {
        loadHistory();
      },
      0
    );

  }


  // ==========================================================
  // STATUS ICON
  // ==========================================================

  function getStatusIcon(
    value: string
  ) {

    switch (
      value.toUpperCase()
    ) {

      case "PRESENT":

        return (
          <CheckCircle2
            size={17}
          />
        );


      case "ABSENT":

        return (
          <XCircle
            size={17}
          />
        );


      case "LATE":

        return (
          <Clock3
            size={17}
          />
        );


      default:

        return (
          <CircleAlert
            size={17}
          />
        );

    }

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !data
  ) {

    return (

      <div className="student-module-loading">

        Loading attendance history...

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


  return (

    <div className="student-module-page">


      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="student-module-header">

        <div className="student-module-icon">

          <History
            size={26}
          />

        </div>


        <div>

          <h1>
            Attendance History
          </h1>

          <p>
            View and filter your attendance records.
          </p>

        </div>

      </div>


      {/* ==================================================== */}
      {/* SUMMARY */}
      {/* ==================================================== */}

      <div className="history-summary-grid">


        <div className="history-summary-card">

          <span>
            Total
          </span>

          <strong>
            {data?.total_records ?? 0}
          </strong>

        </div>


        <div className="history-summary-card">

          <span>
            Present
          </span>

          <strong>
            {data?.present ?? 0}
          </strong>

        </div>


        <div className="history-summary-card">

          <span>
            Absent
          </span>

          <strong>
            {data?.absent ?? 0}
          </strong>

        </div>


        <div className="history-summary-card">

          <span>
            Late
          </span>

          <strong>
            {data?.late ?? 0}
          </strong>

        </div>

      </div>


      {/* ==================================================== */}
      {/* FILTERS */}
      {/* ==================================================== */}

      <section className="attendance-filter-card">

        <div className="attendance-filter-title">

          <Filter
            size={19}
          />

          <h2>
            Filter Attendance
          </h2>

        </div>


        <div className="attendance-filter-grid">


          {/* SUBJECT */}

          <div className="attendance-filter-field">

            <label>
              Subject
            </label>

            <select
              value={subjectId}
              onChange={(event) =>
                setSubjectId(
                  event.target.value
                )
              }
            >

              <option value="">
                All Subjects
              </option>


              {subjects.map(
                (subject) => (

                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>

                )
              )}

            </select>

          </div>


          {/* STATUS */}

          <div className="attendance-filter-field">

            <label>
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >

              <option value="">
                All Status
              </option>

              <option value="PRESENT">
                Present
              </option>

              <option value="ABSENT">
                Absent
              </option>

              <option value="LATE">
                Late
              </option>

              <option value="EXCUSED">
                Excused
              </option>

            </select>

          </div>


          {/* FROM */}

          <div className="attendance-filter-field">

            <label>
              From
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target.value
                )
              }
            />

          </div>


          {/* TO */}

          <div className="attendance-filter-field">

            <label>
              To
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        <div className="attendance-filter-actions">

          <button
            type="button"
            className="attendance-apply-button"
            onClick={loadHistory}
            disabled={loading}
          >

            <Filter size={17} />

            {loading
              ? "Loading..."
              : "Apply Filters"
            }

          </button>


          <button
            type="button"
            className="attendance-reset-button"
            onClick={resetFilters}
          >

            <RotateCcw
              size={17}
            />

            Reset

          </button>

        </div>

      </section>


      {/* ==================================================== */}
      {/* TABLE */}
      {/* ==================================================== */}

      {data?.records.length === 0 ? (

        <div className="student-empty-state">

          <History
            size={30}
          />

          <h3>
            No attendance records found
          </h3>

          <p>
            Try changing your filters.
          </p>

        </div>

      ) : (

        <div className="attendance-history-card">

          <div className="attendance-history-table">


            <div className="attendance-history-header">

              <span>
                Date
              </span>

              <span>
                Subject
              </span>

              <span>
                Status
              </span>

            </div>


            {data?.records.map(
              (record) => (

                <div
                  className="attendance-history-row"
                  key={record.id}
                >


                  <span>

                    {new Date(
                      record.attendance_date
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}

                  </span>


                  <strong>

                    {record.subject_name}

                  </strong>


                  <span>

                    <span
                      className={
                        `attendance-status ${record.status.toLowerCase()}`
                      }
                    >

                      {getStatusIcon(
                        record.status
                      )}

                      {record.status}

                    </span>

                  </span>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>

  );

}


export default AttendanceHistory;