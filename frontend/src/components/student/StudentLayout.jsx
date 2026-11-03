import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { fetchTelegramOpportunities } from "../../services/telegramOpportunityService";
import "./StudentLayout.css";

const OPPORTUNITIES_PATH = "/student/opportunities";
const CHECK_INTERVAL_MS = 60000;

function StudentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [opportunityNotificationCount, setOpportunityNotificationCount] = useState(0);

  const storedUser = localStorage.getItem("placifyUser");
  let user = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const studentId = String(user?._id || user?.id || user?.email || "student");
  const seenStorageKey = `placify_opportunities_seen_v1_${studentId}`;
  const onOpportunitiesPage =
    location.pathname === OPPORTUNITIES_PATH ||
    location.pathname.startsWith(`${OPPORTUNITIES_PATH}/`);

  useEffect(() => {
    let cancelled = false;

    const checkNewOpportunities = async () => {
      try {
        const result = await fetchTelegramOpportunities();
        const payload = result?.data ?? result;
        if (!payload?.success || !Array.isArray(payload.announcements)) return;
        if (cancelled) return;

        const ids = [...new Set(payload.announcements
          .filter((item) => item.announcementType === "New Opportunity" || !item.announcementType)
          .map((item) => String(item._id || item.id || ""))
          .filter(Boolean))];

        let seen = [];
        try {
          const saved = JSON.parse(localStorage.getItem(seenStorageKey) || "[]");
          if (Array.isArray(saved)) seen = saved.map(String);
        } catch {
          // Invalid local state is treated as not yet seen.
        }

        if (onOpportunitiesPage) {
          const allSeen = [...new Set([...seen, ...ids])];
          try {
            localStorage.setItem(seenStorageKey, JSON.stringify(allSeen));
          } catch {
            // Notification tracking works for this session even without storage.
          }
          setOpportunityNotificationCount(0);
        } else {
          const seenSet = new Set(seen);
          setOpportunityNotificationCount(ids.filter((id) => !seenSet.has(id)).length);
        }
      } catch {
        // Keep the previous count if the API is temporarily unavailable.
      }
    };

    checkNewOpportunities();
    const interval = window.setInterval(checkNewOpportunities, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [seenStorageKey, onOpportunitiesPage]);

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
              isActive ? "student-nav-item active" : "student-nav-item"
            }
          >
            <span className="student-nav-icon">⌂</span>
            Dashboard
          </NavLink>

          <p className="student-nav-label">PREPARATION</p>
          <NavLink to="/student/learning" className="student-nav-item">
            <span className="student-nav-icon">▤</span>
            Learning
          </NavLink>
          <NavLink to="/student/roadmap" className="student-nav-item">
            <span className="student-nav-icon">↟</span>
            Roadmap
          </NavLink>
          <NavLink to="/student/practice" className="student-nav-item">
            <span className="student-nav-icon">✓</span>
            Practice
          </NavLink>
          <NavLink to="/student/mock-placement" className="student-nav-item">
            <span className="student-nav-icon">◇</span>
            Mock Placement
          </NavLink>
          <NavLink to="/student/resume" className="student-nav-item">
            <span className="student-nav-icon">▧</span>
            Resume & ATS
          </NavLink>
          <NavLink to="/student/interview" className="student-nav-item">
            <span className="student-nav-icon">◉</span>
            HR Interview
          </NavLink>

          <p className="student-nav-label">PLACEMENT</p>
          <NavLink
            to={OPPORTUNITIES_PATH}
            className="student-nav-item"
            onClick={() => setOpportunityNotificationCount(0)}
          >
            <span className="student-nav-icon">⌕</span>
            Opportunities
            {opportunityNotificationCount > 0 && !onOpportunitiesPage && (
              <span
                aria-label={`${opportunityNotificationCount} new opportunities`}
                title={`${opportunityNotificationCount} new opportunities`}
                style={{
                  marginLeft: "auto",
                  minWidth: "22px",
                  height: "22px",
                  padding: "0 6px",
                  borderRadius: "999px",
                  backgroundColor: "#ef3340",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {opportunityNotificationCount > 99 ? "99+" : opportunityNotificationCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/student/applications" className="student-nav-item">
            <span className="student-nav-icon">▣</span>
            Applications
          </NavLink>
          <NavLink to="/student/analytics" className="student-nav-item">
            <span className="student-nav-icon">↗</span>
            Analytics
          </NavLink>
          <NavLink to="/student/calendar" className="student-nav-item">
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
            <button type="button" className="student-profile-button">
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
        <main className="student-content">{children}</main>
      </div>
    </div>
  );
}

export default StudentLayout;
