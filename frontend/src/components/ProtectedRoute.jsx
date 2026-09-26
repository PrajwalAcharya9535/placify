import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("placifyToken");
  const storedUser = localStorage.getItem("placifyUser");

  // User is not logged in
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("placifyToken");
    localStorage.removeItem("placifyUser");

    return <Navigate to="/login" replace />;
  }

  // Logged-in user does not have permission for this portal
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;