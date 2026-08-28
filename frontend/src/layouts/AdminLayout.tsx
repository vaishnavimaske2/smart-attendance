import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";


function AdminLayout() {

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


  const adminName =
    user?.name || "Administrator";


  const initial =
    adminName
      .charAt(0)
      .toUpperCase();


  return (

    <div className="role-app-shell">


      {/* ==================================================== */}
      {/* SIDEBAR */}
      {/* ==================================================== */}

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
              Administration
            </span>

          </div>

        </div>


        <div className="sidebar-section-title">
          MAIN
        </div>


        <nav className="role-sidebar-nav">

          <button
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>


          <button
            onClick={() =>
              navigate("/teachers")
            }
          >
            <Users size={20} />
            Teachers
          </button>


          <button
            onClick={() =>
              navigate("/students")
            }
          >
            <GraduationCap size={20} />
            Students
          </button>


          <button
            onClick={() =>
              navigate("/classes")
            }
          >
            <Building2 size={20} />
            Classes
          </button>


          <button
            onClick={() =>
              navigate("/subjects")
            }
          >
            <BookOpen size={20} />
            Subjects
          </button>


          <button
            onClick={() =>
              navigate(
                "/teacher-assignments"
              )
            }
          >
            <UserCheck size={20} />
            Teacher Assignments
          </button>


          <button
            onClick={() =>
              navigate("/attendance")
            }
          >
            <ClipboardList size={20} />
            Attendance
          </button>


          <button
            onClick={() =>
              navigate("/reports")
            }
          >
            <BarChart3 size={20} />
            Reports
          </button>

        </nav>


        <div className="sidebar-bottom">

          <button
            onClick={() =>
              navigate("/settings")
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


      {/* ==================================================== */}
      {/* MAIN */}
      {/* ==================================================== */}

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
                {adminName}
              </strong>

              <span>
                Administrator
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


export default AdminLayout;