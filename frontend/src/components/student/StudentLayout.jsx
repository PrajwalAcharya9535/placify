import { NavLink, useNavigate } from "react-router-dom";
import "./StudentLayout.css";

function StudentLayout({ children }) {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("placifyUser");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("placifyToken");
    localStorage.removeItem("placifyUser");

    navigate("/login", { replace: true });
  };

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <button
          type="button"
          className="student-brand"
          onClick={() => navigate("/student/dashboard")}
        >
          <span className="student-brand-logo">P</span>

          <span className="student-brand-text">
            <strong>Placify</strong>
            <small>Student Portal</small>
          </span>
        </button>

        <nav className="student-navigation">
          <p className="student-nav-label">OVERVIEW</p>

          <NavLink
            to="/student/dashboard"
            className={({ isActive }) =>
              isActive
                ? "student-nav-item active"
                : "student-nav-item"
            }
          >
            <span className="student-nav-icon">⌂</span>
            Dashboard
          </NavLink>

          <p className="student-nav-label">PREPARATION</p>

          <NavLink
            to="/student/learning"
            className="student-nav-item"
          >
            <span className="student-nav-icon">▤</span>
            Learning
          </NavLink>


          <NavLink
  to="/student/roadmap"
  className="student-nav-item"
>
  <span className="student-nav-icon">↟</span>
  Roadmap
</NavLink>

          <NavLink
            to="/student/practice"
            className="student-nav-item"
          >
            <span className="student-nav-icon">✓</span>
            Practice
          </NavLink>

          <NavLink
            to="/student/mock-placement"
            className="student-nav-item"
          >
            <span className="student-nav-icon">◇</span>
            Mock Placement
          </NavLink>

          <NavLink
            to="/student/resume"
            className="student-nav-item"
          >
            <span className="student-nav-icon">▧</span>
            Resume & ATS
          </NavLink>

        <NavLink
  to="/student/interview"
  className="student-nav-item"
>
  <span className="student-nav-icon">◉</span>
  HR Interview
</NavLink>

          <p className="student-nav-label">PLACEMENT</p>

          <NavLink
            to="/student/opportunities"
            className="student-nav-item"
          >
            <span className="student-nav-icon">⌕</span>
            Opportunities
          </NavLink>

          <NavLink
            to="/student/applications"
            className="student-nav-item"
          >
            <span className="student-nav-icon">▣</span>
            Applications
          </NavLink>

          <NavLink
            to="/student/analytics"
            className="student-nav-item"
          >
            <span className="student-nav-icon">↗</span>
            Analytics
          </NavLink>

          <NavLink
            to="/student/calendar"
            className="student-nav-item"
          >
            <span className="student-nav-icon">□</span>
            Calendar
          </NavLink>
        </nav>

        <div className="student-sidebar-footer">
          <div className="student-sidebar-user">
            <div className="student-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div className="student-user-info">
              <strong>{user?.name || "Student"}</strong>
              <span>Student</span>
            </div>
          </div>

          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div className="student-topbar-title">
            <span className="student-mobile-logo">P</span>

            <div>
              <strong>Placify</strong>
              <span>Placement Preparation Platform</span>
            </div>
          </div>

          <div className="student-topbar-actions">
            <button
              type="button"
              className="student-topbar-button"
              aria-label="Notifications"
            >
              ♢
            </button>

            <button
              type="button"
              className="student-profile-button"
            >
              <span className="student-profile-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
              </span>

              <span className="student-profile-copy">
                <strong>{user?.name || "Student"}</strong>
                <small>Student</small>
              </span>
            </button>
          </div>
        </header>

        <main className="student-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;