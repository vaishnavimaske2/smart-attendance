
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


import ProtectedRoute
  from "./components/ProtectedRoute";


import AdminLayout
  from "./layouts/AdminLayout";

import TeacherLayout
  from "./layouts/TeacherLayout";

import StudentLayout
  from "./layouts/StudentLayout";


import Login
  from "./pages/auth/Login";

import RegisterSchool
  from "./pages/auth/RegisterSchool";


import StudentDashboard
  from "./pages/student/StudentDashboard";

import MyAttendance
  from "./pages/student/MyAttendance";

import MySubjects
  from "./pages/student/MySubjects";

import AttendanceHistory
  from "./pages/student/AttendanceHistory";

import MyProfile
  from "./pages/student/MyProfile";

import TeacherDashboard
 from "./pages/teacher/TeacherDashboard";

import TakeAttendance
 from "./pages/teacher/TakeAttendance";

import TeacherClasses
 from "./pages/teacher/TeacherClasses";

import TeacherStudents
 from "./pages/teacher/TeacherStudents";

import StudentManagement
 from "./pages/teacher/StudentManagement";

import Reports
 from "./pages/teacher/Reports";

import Settings
 from "./pages/teacher/Settings";

import AdminDashboard
 from "./pages/admin/AdminDashboard";

import Teachers
 from "./pages/admin/Teachers";

import Students
 from "./pages/admin/Students";

import Classes
 from "./pages/admin/Classes";

import Subjects
 from "./pages/admin/Subjects";

import TeacherAssignments
 from "./pages/admin/TeacherAssignments";
 // ============================================================
// PLACEHOLDER
// ============================================================



// ============================================================
// APP
// ============================================================

function App() {


  return (

        <BrowserRouter>

        <Routes>


          {/* ================================================== */}
          {/* PUBLIC */}
          {/* ================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />


          <Route
            path="/register-school"
            element={<RegisterSchool />}
          />


          {/* ================================================== */}
          {/* ADMIN */}
          {/* ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN"]}
              />
            }
          >

            <Route
              element={<AdminLayout />}
            >

              <Route
                path="/admin/dashboard"
                element={
                  <AdminDashboard />
                }
              />


              <Route
                path="/teachers"
                element={
                  <Teachers />
                }
              />


              <Route
                path="/students"
                element={
                  <Students />
                }
              />


              <Route
                path="/classes"
                element={
                  <Classes />
                }
              />


              <Route
                path="/subjects"
                element={
                  <Subjects />
                }
              />


              <Route
                path="/teacher-assignments"
                element={
                  <TeacherAssignments />
                }
              />


              


              


              

            </Route>

          </Route>


          {/* ================================================== */}
          {/* TEACHER */}
          {/* ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["TEACHER"]}
              />
            }
          >

            <Route
              element={<TeacherLayout />}
            >

              <Route
                path="/teacher/dashboard"
                element={
                  <TeacherDashboard />
                }
              />


              <Route
                path="/teacher/classes"
                element={
                  <TeacherClasses />
                }
              />


              <Route
                path="/teacher/students"
                element={
                  <TeacherStudents />
                }
              />


              <Route
                path="/teacher/attendance"
                element={
                  <TakeAttendance />
                }
              />


              <Route
                path="/teacher/face-registration"
                element={
                  <StudentManagement />
                }
              />


              <Route
                path="/teacher/reports"
                element={
                  <Reports />
                }
              />


              <Route
                path="/teacher/settings"
                element={
                <Settings />
                }
              />

            </Route>

          </Route>


          {/* ================================================== */}
          {/* STUDENT */}
          {/* ================================================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["STUDENT"]}
              />
            }
          >

            <Route
              element={<StudentLayout />}
            >

              {/* ---------------------------------------------- */}
              {/* DASHBOARD */}
              {/* ---------------------------------------------- */}

              <Route
                path="/student/dashboard"
                element={
                  <StudentDashboard />
                }
              />


              {/* ---------------------------------------------- */}
              {/* MY ATTENDANCE */}
              {/* ---------------------------------------------- */}

              <Route
                path="/student/attendance"
                element={
                  <MyAttendance />
                }
              />


              {/* ---------------------------------------------- */}
              {/* MY SUBJECTS */}
              {/* ---------------------------------------------- */}

              <Route
                path="/student/subjects"
                element={
                  <MySubjects />
                }
              />


              {/* ---------------------------------------------- */}
              {/* ATTENDANCE HISTORY */}
              {/* ---------------------------------------------- */}

              <Route
                path="/student/attendance-history"
                element={
                  <AttendanceHistory />
                }
              />


              {/* ---------------------------------------------- */}
              {/* MY PROFILE */}
              {/* ---------------------------------------------- */}

              <Route
                path="/student/profile"
                element={
                  <MyProfile />
                }
              />

            </Route>

          </Route>


          {/* ================================================== */}
          {/* DEFAULT */}
          {/* ================================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>


  );

}


export default App;