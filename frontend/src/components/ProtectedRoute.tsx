import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";


interface ProtectedRouteProps {
  allowedRoles?: string[];
}


function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {

  const location =
    useLocation();


  // ==========================================================
  // GET AUTHENTICATION DATA
  // ==========================================================

  const token =
    localStorage.getItem(
      "Smart Attend token"
    );

  const storedUser =
    localStorage.getItem(
      "Smart Attend user"
    );


  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!token || !storedUser) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );

  }


  // ==========================================================
  // READ USER
  // ==========================================================

  let user: any;

  try {

    user =
      JSON.parse(storedUser);

  } catch {

    localStorage.removeItem(
      "Smart Attend token"
    );

    localStorage.removeItem(
      "Smart Attend user"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role
    )
  ) {

    if (user.role === "ADMIN") {

      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );

    }


    if (user.role === "TEACHER") {

      return (
        <Navigate
          to="/teacher/dashboard"
          replace
        />
      );

    }


    if (user.role === "STUDENT") {

      return (
        <Navigate
          to="/student/dashboard"
          replace
        />
      );

    }


    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // ==========================================================
  // AUTHORIZED
  // ==========================================================

  return <Outlet />;
}


export default ProtectedRoute;