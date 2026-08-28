import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Camera,
  ClipboardCheck,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";


function Sidebar() {

  const navigate = useNavigate();


  const menuItems = [

    {
      label: "Dashboard",
      path: "/teacher/dashboard",
      icon: LayoutDashboard,
    },

    {
      label: "My Classes",
      path: "/teacher/classes",
      icon: GraduationCap,
    },

    {
      label: "Students",
      path: "/teacher/students",
      icon: Users,
    },

    {
      label: "Attendance",
      path: "/teacher/attendance",
      icon: ClipboardCheck,
    },

    {
      label: "Face Registration",
      path: "/teacher/face-registration",
      icon: Camera,
    },

    {
      label: "Reports",
      path: "/teacher/reports",
      icon: FileBarChart,
    },

    {
      label: "Settings",
      path: "/teacher/settings",
      icon: Settings,
    },

  ];


  // ==========================================================
  // LOGOUT
  // ==========================================================

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


  return (

    <aside className="sidebar">


      {/* ================================================== */}
      {/* BRAND */}
      {/* ================================================== */}

      <div className="sidebar-brand">

        <div className="brand-icon">
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


      {/* ================================================== */}
      {/* NAVIGATION */}
      {/* ================================================== */}

      <nav className="sidebar-navigation">

        <p className="navigation-title">
          MAIN MENU
        </p>


        {menuItems.map((item) => {

          const Icon =
            item.icon;


          return (

            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <Icon
                size={20}
              />

              <span>
                {item.label}
              </span>

            </NavLink>

          );

        })}

      </nav>


      {/* ================================================== */}
      {/* LOGOUT */}
      {/* ================================================== */}

      <div className="sidebar-bottom">

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >

          <LogOut
            size={20}
          />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>

  );

}


export default Sidebar;