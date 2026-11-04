
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentNotifications.css";

const API_URL = "http://localhost:5000/api/student";

const NOTIFICATION_TYPES = [
  "All",
  "General",
  "Opportunity",
  "Application",
  "Interview",
  "Group Discussion",
  "Mock Placement",
  "Deadline",
  "Calendar",
  "Placement",
];

function StudentNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
  });

  const [filter, setFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const getToken = () => localStorage.getItem("placifyToken");

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  const handleApiError = useCallback(
    (err, fallbackMessage) => {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("placifyToken");
        localStorage.removeItem("placifyUser");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || fallbackMessage
      );
    },
    [navigate]
  );

  const fetchNotifications = useCallback(async () => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        limit: 100,
      };

      if (filter === "Unread") {
        params.isRead = false;
      } else if (filter === "Read") {
        params.isRead = true;
      }

      if (typeFilter !== "All") {
        params.type = typeFilter;
      }

      const response = await axios.get(
        `${API_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      if (response.data?.success) {
        setNotifications(
          response.data.notifications || []
        );

        setSummary(
          response.data.summary || {
            total: 0,
            unread: 0,
          }
        );
      } else {
        setError("Unable to fetch notifications.");
      }
    } catch (err) {
      handleApiError(
        err,
        "Unable to load your notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, navigate, handleApiError]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: getHeaders() }
      );

      await fetchNotifications();
    } catch (err) {
      handleApiError(
        err,
        "Unable to mark notification as read."
      );
    } finally {
      setBusy(false);
    }
  };

  const markAllAsRead = async () => {
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: getHeaders() }
      );

      await fetchNotifications();
    } catch (err) {
      handleApiError(
        err,
        "Unable to mark all notifications as read."
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: getHeaders() }
      );

      await fetchNotifications();
    } catch (err) {
      handleApiError(
        err,
        "Unable to delete notification."
      );
    } finally {
      setBusy(false);
    }
  };

  const getNotificationDestination = (notification) => {
    const url = notification.actionUrl;

    // Only allow navigation to internal student pages.
    if (
      typeof url === "string" &&
      url.startsWith("/student/") &&
      !url.startsWith("//")
    ) {
      return url;
    }

    switch (notification.type) {
      case "Opportunity":
      case "Deadline":
        return "/student/opportunities";

      case "Application":
      case "Placement":
        return "/student/applications";

      case "Interview":
        return "/student/interview";

      case "Calendar":
        return "/student/calendar";

      case "Mock Placement":
        return "/student/mock-placement";

      default:
        return null;
    }
  };

  const openNotification = async (notification) => {
    if (busy) return;

    if (!notification.isRead) {
      try {
        setBusy(true);
        setError("");

        await axios.patch(
          `${API_URL}/notifications/${notification._id}/read`,
          {},
          { headers: getHeaders() }
        );

        await fetchNotifications();
      } catch (err) {
        handleApiError(
          err,
          "Unable to open notification."
        );
        return;
      } finally {
        setBusy(false);
      }
    }

    const destination =
      getNotificationDestination(notification);

    if (destination) {
      navigate(destination);
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "Opportunity":
        return "↗";
      case "Application":
        return "▣";
      case "Interview":
        return "◉";
      case "Deadline":
        return "◷";
      case "Calendar":
        return "□";
      case "Placement":
        return "★";
      case "Group Discussion":
        return "◎";
      case "Mock Placement":
        return "◇";
      default:
        return "✦";
    }
  };

  return (
    <StudentLayout>
      <div className="student-notifications-page">

        <div className="notifications-page-header">
          <div>
            <span className="notifications-eyebrow">
              PLACIFY NOTIFICATION CENTER
            </span>

            <h1>Notifications</h1>

            <p>
              Stay updated with placement opportunities,
              applications, interviews and important reminders.
            </p>
          </div>

          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllAsRead}
            disabled={busy || loading || summary.unread === 0}
          >
            ✓ Mark All as Read
          </button>
        </div>

        <div className="notifications-summary">
          <div className="notifications-summary-card">
            <span>Total Notifications</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="notifications-summary-card">
            <span>Unread Notifications</span>
            <strong>{summary.unread}</strong>
          </div>

          <div className="notifications-summary-card">
            <span>Read Notifications</span>
            <strong>
              {Math.max(summary.total - summary.unread, 0)}
            </strong>
          </div>
        </div>

        <div className="notifications-panel">
          <div className="notifications-toolbar">
            <div className="notifications-tabs">
              {["All", "Unread", "Read"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    filter === item
                      ? "notifications-tab active"
                      : "notifications-tab"
                  }
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <select
              className="notifications-type-select"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              aria-label="Filter notification type"
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="notifications-error">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchNotifications}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">◷</div>
              <h3>Loading notifications...</h3>
              <p>Fetching your latest placement updates.</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">✓</div>
              <h3>No notifications found</h3>
              <p>
                Your notifications will appear here when
                placement updates and reminders are available.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                const destination =
                  getNotificationDestination(notification);

                return (
                  <article
                    key={notification._id}
                    className={
                      notification.isRead
                        ? "notification-item"
                        : "notification-item unread"
                    }
                  >
                    <div className="notification-item-icon">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="notification-item-content">
                      <div className="notification-item-heading">
                        <h3>{notification.title}</h3>

                        {!notification.isRead && (
                          <span className="notification-unread-dot" />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <div className="notification-item-meta">
                        <span>{notification.type}</span>
                        <span>{notification.priority} Priority</span>
                        <span>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="notification-item-actions">
                      {destination && (
                        <button
                          type="button"
                          className="notification-open-button"
                          onClick={() =>
                            openNotification(notification)
                          }
                          disabled={busy}
                        >
                          View Details
                        </button>
                      )}

                      {!notification.isRead && (
                        <button
                          type="button"
                          className="notification-read-button"
                          onClick={() =>
                            markAsRead(notification._id)
                          }
                          disabled={busy}
                        >
                          Mark Read
                        </button>
                      )}

                      <button
                        type="button"
                        className="notification-delete-button"
                        onClick={() =>
                          deleteNotification(notification._id)
                        }
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default StudentNotifications;
