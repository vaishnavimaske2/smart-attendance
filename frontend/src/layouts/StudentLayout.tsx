import {
  Outlet,
} from "react-router-dom";

import StudentSidebar from "../pages/student/StudentSidebar";


function StudentLayout() {

  const storedUser =
    localStorage.getItem(
      "Smart Attend user"
    );


  let userName =
    "Student";


  if (storedUser) {

    try {

      const user =
        JSON.parse(
          storedUser
        );

      userName =
        user.name ||
        "Student";

    } catch {

      userName =
        "Student";

    }

  }


  return (

    <div className="student-app-shell">

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <StudentSidebar />


      {/* ================================================== */}
      {/* MAIN AREA */}
      {/* ================================================== */}

      <div className="student-main-area">


        {/* ================================================= */}
        {/* TOP BAR */}
        {/* ================================================= */}

        <header className="student-topbar">

          <div>

            <h1>
              Student Portal
            </h1>

            <p>
              Welcome back, {userName}
            </p>

          </div>


          {/* USER */}

          <div className="student-topbar-user">

            <div className="student-topbar-avatar">

              {userName
                .charAt(0)
                .toUpperCase()
              }

            </div>


            <div>

              <strong>
                {userName}
              </strong>

              <span>
                Student
              </span>

            </div>

          </div>

        </header>


        {/* ================================================= */}
        {/* PAGE CONTENT */}
        {/* ================================================= */}

        <main className="student-page-content">

          <Outlet />

        </main>

      </div>

    </div>

  );

}


export default StudentLayout;