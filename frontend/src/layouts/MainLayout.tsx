import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";


function MainLayout() {

  return (
    <div className="app-shell">

      {/* Sidebar */}

      <Sidebar />


      {/* Main Content */}

      <div className="main-area">

        {/* ================================================= */}
        {/* TOP BAR */}
        {/* ================================================= */}

        <header className="topbar">

          <div>

            <h1 className="topbar-title">
              SmartAttend
            </h1>

            <p className="topbar-subtitle">
              Smart attendance management system
            </p>

          </div>


          {/* User */}

          <div className="topbar-user">

            <button className="notification-button">
              🔔
            </button>


            <div className="user-avatar">
              G
            </div>


            <div className="user-info">

              <span className="user-name">
                Geetanjali
              </span>

              <span className="user-role">
                Teacher
              </span>

            </div>

          </div>

        </header>


        {/* ================================================= */}
        {/* PAGE */}
        {/* ================================================= */}

        <main className="page-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}


export default MainLayout;