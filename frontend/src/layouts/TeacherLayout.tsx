import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ScanFace,
  BarChart3,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react";


function TeacherLayout() {

  const navigate =
    useNavigate();


  const userData =
    localStorage.getItem(
      "Smart Attend user"
    );


  let user: any = null;


  try {

    user =
      userData
        ? JSON.parse(userData)
        : null;

  } catch {

    user = null;

  }


  function handleLogout() {

    localStorage.removeItem(
      "Smart Attend token"
    );

    localStorage.removeItem(
      "Smart Attend user"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  }


  const teacherName =
    user?.name || "Teacher";


  const initial =
    teacherName
      .charAt(0)
      .toUpperCase();


  return (

    <div className="role-app-shell">


      <aside className="role-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            SA
          </div>

          <div>

            <h2>
              SmartAttend
            </h2>

            <span>
              Teacher Portal
            </span>

          </div>

        </div>


        <div className="sidebar-section-title">
          TEACHING
        </div>


        <nav className="role-sidebar-nav">

          <button
            onClick={() =>
              navigate(
                "/teacher/dashboard"
              )
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>


          <button
            onClick={() =>
              navigate(
                "/teacher/classes"
              )
            }
          >
            <BookOpen size={20} />
            My Classes
          </button>


          <button
            onClick={() =>
              navigate("/teacher/students")
            }
          >
            <Users size={20} />
            Students
          </button>


          <button
            onClick={() =>
              navigate(
                "/teacher/attendance"
              )
            }
          >
            <ClipboardCheck size={20} />
            Attendance
          </button>


          <button
            onClick={() =>
              navigate(
                "/teacher/face-registration"
              )
            }
          >
            <ScanFace size={20} />
            Face Registration
          </button>


          <button
            onClick={() =>
              navigate(
                "/teacher/reports"
              )
            }
          >
            <BarChart3 size={20} />
            Reports
          </button>

        </nav>


        <div className="sidebar-bottom">

          <button
            onClick={() =>
              navigate(
                "/teacher/settings"
              )
            }
          >
            <Settings size={20} />
            Settings
          </button>


          <button
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </button>

        </div>

      </aside>


      <div className="role-main-area">

        <header className="role-topbar">

          <div>

            <h1>
              SmartAttend
            </h1>

            <p>
              Smart attendance management system
            </p>

          </div>


          <div className="role-user">

            <div className="role-user-avatar">
              {initial}
            </div>

            <div>

              <strong>
                {teacherName}
              </strong>

              <span>
                Teacher
              </span>

            </div>

          </div>

        </header>


        <main className="role-page-content">

          <Outlet />

        </main>

      </div>

    </div>

  );
}


export default TeacherLayout;