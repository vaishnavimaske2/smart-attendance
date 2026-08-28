import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  History,
  UserRound,
  LogOut,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";


function StudentSidebar() {

  const navigate = useNavigate();


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


  const menuItems = [

    {
      label: "Dashboard",
      path: "/student/dashboard",
      icon: LayoutDashboard,
    },

    {
      label: "My Attendance",
      path: "/student/attendance",
      icon: ClipboardCheck,
    },

    {
      label: "My Subjects",
      path: "/student/subjects",
      icon: BookOpen,
    },

    {
      label: "Attendance History",
      path: "/student/attendance-history",
      icon: History,
    },

    {
      label: "My Profile",
      path: "/student/profile",
      icon: UserRound,
    },

  ];


  return (

    <aside className="student-sidebar">

      {/* ================================================== */}
      {/* BRAND */}
      {/* ================================================== */}

      <div className="student-sidebar-brand">

        <div className="student-sidebar-logo">
          SA
        </div>

        <div>

          <h2>
            SmartAttend
          </h2>

          <span>
            Student Portal
          </span>

        </div>

      </div>


      {/* ================================================== */}
      {/* NAVIGATION */}
      {/* ================================================== */}

      <nav className="student-sidebar-nav">

        <p className="student-sidebar-heading">
          MENU
        </p>


        {menuItems.map(
          (item) => {

            const Icon =
              item.icon;


            return (

              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "student-sidebar-link active"
                    : "student-sidebar-link"
                }
              >

                <Icon size={20} />

                <span>
                  {item.label}
                </span>

              </NavLink>

            );

          }
        )}

      </nav>


      {/* ================================================== */}
      {/* BOTTOM */}
      {/* ================================================== */}

      <div className="student-sidebar-bottom">

        <button
          type="button"
          className="student-logout-button"
          onClick={handleLogout}
        >

          <LogOut size={20} />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>

  );

}


export default StudentSidebar;