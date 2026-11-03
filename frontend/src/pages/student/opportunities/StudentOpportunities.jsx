
import { useEffect, useMemo, useRef, useState } from "react";
import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentOpportunities.css";

/* Real Telegram announcements, no demo records. */
import {
  fetchTelegramOpportunities,
  updateTelegramResponse,
} from "../../../services/telegramOpportunityService";

const STATUS_OPTIONS = ["All", "New Opportunity"];
const STORAGE_KEY = "placify_telegram_read_state_v1";
const NOT_ANNOUNCED = "Not Announced";

const textOrFallback = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : NOT_ANNOUNCED;

function normalizeAnnouncement(item) {
  return {
    ...item,
    id: String(item._id),
    type: item.announcementType || "New Opportunity",
    message: item.messageText || "",
    deadline: item.registrationDeadline || null,
    receivedAt: item.telegramDate || item.receivedAt,
  };
}

/* =========================================
   HELPERS
========================================= */

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      readIds: Array.isArray(saved.readIds) ? saved.readIds : [],
      dismissedWarnings: Array.isArray(saved.dismissedWarnings)
        ? saved.dismissedWarnings
        : [],
    };
  } catch {
    return { readIds: [], dismissedWarnings: [] };
  }
}

function formatDate(dateString, includeTime = false) {
  if (!dateString) return NOT_ANNOUNCED;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return NOT_ANNOUNCED;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDaysUntilDeadline(deadline) {
  if (!deadline) return null;
  const timestamp = new Date(deadline).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const today = new Date();
  const dayInIndia = (value) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(value));
    const part = (type) => parts.find((entry) => entry.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  };
  const deadlineDay = dayInIndia(timestamp);
  const todayDay = dayInIndia(today);
  const parseDay = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parseDay(deadlineDay) - parseDay(todayDay)) / 86400000);
}

function getDeadlineInfo(announcement, currentTime = Date.now()) {
  const cutoff = announcement.deadline
    ? new Date(announcement.deadline).getTime()
    : NaN;
  const confirmed = announcement.deadlineTimeConfirmed === true;
  const days = getDaysUntilDeadline(announcement.deadline);

  // Only a confirmed time can establish that today's cutoff has passed.
  if (confirmed && Number.isFinite(cutoff)) {
    if (currentTime >= cutoff) {
      return { label: "Registration deadline passed", tone: "danger", days: -1 };
    }

    const closingTime = new Date(cutoff).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (days === 0) {
      return {
        label: `Registration closes today at ${closingTime} IST`,
        tone: "warning",
        days: 0,
      };
    }
    if (days === 1) {
      return {
        label: `Registration closes tomorrow at ${closingTime} IST`,
        tone: "warning",
        days: 1,
      };
    }
    if (days !== null && days > 1) {
      return {
        label: `Registration closes in ${days} days at ${closingTime} IST`,
        tone: days <= 3 ? "warning" : "success",
        days,
      };
    }
  }

  if (announcement.opportunityStatus === "Expired") {
    return { label: "Registration deadline passed", tone: "danger", days: -1 };
  }
  if (announcement.opportunityStatus === "Needs Review") {
    return { label: "Details need review", tone: "warning", days: null };
  }
  if (days === null) {
    return { label: "Deadline not announced", tone: "neutral", days: null };
  }
  if (days < 0) {
    return { label: "Deadline date passed", tone: "danger", days: -1 };
  }
  if (!confirmed || announcement.opportunityStatus === "Deadline Unconfirmed") {
    return {
      label: days === 0
        ? "Registration date is today — closing time unconfirmed"
        : `Registration in ${days} day${days === 1 ? "" : "s"} — closing time unconfirmed`,
      tone: "warning",
      days: null,
    };
  }
  return { label: "Deadline time not confirmed", tone: "warning", days: null };
}

function cleanEligibility(value) {
  if (typeof value !== "string") return value;
  // The original Telegram announcement remains unchanged in Full Message.
  return value
    .split(/\n+/)
    .map((part) => part.replace(/\s*(?:Interested and eligible students are requested to complete their registration|Students are requested to complete their registration|Please complete (?:your|the) registration|Register (?:on or )?before|Registration deadline|Last date to register)\b.*$/i, "").trim())
    .filter((part) => part && !/^(?:registration deadline|last date|apply (?:now|before)|registration link)\b/i.test(part))
    .join("\n")
    .trim();
}

function getDetailBoxes(item) {
  return [
    ["Salary / CTC", item.salary],
    ["Stipend", item.stipend],
    ["Minimum CGPA / Percentage", item.minimumCGPA],
    ["Eligibility / Branches", cleanEligibility(item.eligibility)],
    ["Eligible Batch", item.graduationBatch],
    ["Job Location", item.location],
    ["Job Type", item.jobType],
    ["Work Mode", item.workMode],
    ["Registration Deadline", formatDate(item.deadline, item.deadlineTimeConfirmed)],
    ["Selection Process", item.selectionProcess],
  ];
}

function getSafeUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/* =========================================
   COMPONENT
========================================= */

function StudentOpportunities() {
  const [activeTab, setActiveTab] = useState("telegram");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] =
    useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [localState, setLocalState] = useState(loadLocalState);

  const [feedback, setFeedback] = useState("");
  const [showNotificationCenter, setShowNotificationCenter] =
    useState(false);
  const [warningAnnouncement, setWarningAnnouncement] =
    useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [maximized, setMaximized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responseFilter, setResponseFilter] = useState("All");
  const listRef = useRef(null);

  const { readIds, dismissedWarnings } = localState;
  const responses = useMemo(() =>
    Object.fromEntries(announcements.map((item) => [item.id, item.studentStatus || "Pending"])),
    [announcements]
  );

  /* Load real opportunities from the backend. */
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const result = await fetchTelegramOpportunities();
        const payload = result?.data ?? result;
        if (!payload?.success || !Array.isArray(payload.announcements)) {
          throw new Error(payload?.message || "Invalid opportunities response");
        }
        if (active) setAnnouncements(payload.announcements.map(normalizeAnnouncement));
      } catch (error) {
        if (active) setLoadError(error?.response?.data?.message || error.message || "Unable to load opportunities");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
    } catch {
      // Browser storage is optional.
    }
  }, [localState]);

  /* =========================================
     REFRESH DEADLINE DISPLAY
  ========================================= */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  /* =========================================
     DERIVED COUNTS
  ========================================= */

  const unreadAnnouncements = useMemo(
    () =>
      announcements.filter(
        (item) => !readIds.includes(item.id)
      ),
    [announcements, readIds]
  );

  const unreadCount = unreadAnnouncements.length;

  const appliedCount = announcements.filter(
    (item) => responses[item.id] === "Applied"
  ).length;

  const newOpportunityCount =
    announcements.filter(
      (item) => item.type === "New Opportunity"
    ).length;

  const upcomingDeadlineCount =
    announcements.filter((item) => {
      const info = getDeadlineInfo(item, now);

      return (
        item.type !== "Drive Cancelled" &&
        info.days !== null &&
        info.days >= 0 &&
        info.days <= 3 &&
        responses[item.id] !== "Applied" &&
        responses[item.id] !== "Not Interested"
      );
    }).length;

  /* =========================================
     FILTERING
  ========================================= */

  const filteredAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return announcements.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.companyName,
          item.jobRole,
          item.eligibility,
          item.location,
          item.message,
          item.salary,
          item.minimumCGPA,
          item.graduationBatch,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesType =
        typeFilter === "All" ||
        item.type === typeFilter;

      const matchesUnread =
        !showUnreadOnly || !readIds.includes(item.id);
      const status = item.studentStatus || "Pending";
      const matchesResponse =
        responseFilter === "Applied"
          ? status === "Applied"
          : responseFilter === "Not Interested"
            ? status === "Not Interested"
            : status !== "Not Interested";

      return (
        matchesSearch &&
        matchesType &&
        matchesUnread &&
        matchesResponse
      );
    });
  }, [announcements, search, typeFilter, showUnreadOnly, readIds, responseFilter]);

  // Keep the selected company within the filtered results.
  useEffect(() => {
    setCurrentIndex((index) =>
      Math.max(0, Math.min(index, filteredAnnouncements.length - 1))
    );
  }, [filteredAnnouncements.length]);

  const moveCompany = (direction) => {
    setCurrentIndex((index) =>
      Math.max(0, Math.min(index + direction, filteredAnnouncements.length - 1))
    );
    setExpandedId(null);
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Keyboard navigation applies only to the maximized company view.
  useEffect(() => {
    if (!maximized) return;
    const onKeyDown = (event) => {
      const target = event.target;
      if (event.altKey || event.ctrlKey || event.metaKey ||
          target?.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName) ||
          warningAnnouncement) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveCompany(event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maximized, filteredAnnouncements.length, warningAnnouncement]);

  const jumpToNearestDeadline = () => {
    const upcoming = announcements
      .filter((item) => {
        const deadline = new Date(item.deadline).getTime();
        return item.deadline && item.deadlineTimeConfirmed === true &&
          Number.isFinite(deadline) && deadline > now &&
          item.studentStatus !== "Not Interested" &&
          item.studentStatus !== "Applied";
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (!upcoming.length) {
      setFeedback("No upcoming confirmed registration deadlines.");
      return;
    }
    const nearest = upcoming[0];
    setActiveTab("telegram");
    setSearch("");
    setTypeFilter("All");
    setShowUnreadOnly(false);
    setResponseFilter("All");
    setMaximized(true);
    setExpandedId(null);
    // The next render has the unfiltered list.
    const visible = announcements.filter((item) => item.studentStatus !== "Not Interested");
    setCurrentIndex(Math.max(0, visible.findIndex((item) => item.id === nearest.id)));
    setFeedback(`Nearest deadline: ${nearest.companyName} — ${formatDate(nearest.deadline, true)}`);
  };

  /* =========================================
     READ TRACKING
  ========================================= */

  const markAsRead = (announcementId) => {
    setLocalState((previous) => ({
      ...previous,
      readIds: previous.readIds.includes(
        announcementId
      )
        ? previous.readIds
        : [...previous.readIds, announcementId],
    }));
  };

  const markAllAsRead = () => {
    setLocalState((previous) => ({
      ...previous,
      readIds: announcements.map(
        (item) => item.id
      ),
    }));

    setFeedback(
      "All Telegram announcements marked as read."
    );
  };

  const toggleAnnouncement = (announcement) => {
    const opening = expandedId !== announcement.id;

    setExpandedId(
      opening ? announcement.id : null
    );

    if (opening) {
      markAsRead(announcement.id);
    }
  };

  /* =========================================
     STUDENT ACTIONS
  ========================================= */

  const updateResponse = async (announcement, status) => {
    if (savingId) return false;
    setSavingId(announcement.id);
    try {
      const result = await updateTelegramResponse(announcement.id, status);
      const payload = result?.data ?? result;
      if (payload?.success === false) {
        throw new Error(payload.message || "Unable to update response");
      }
      setAnnouncements((previous) => previous.map((item) =>
        item.id === announcement.id ? { ...item, studentStatus: status } : item
      ));
      markAsRead(announcement.id);
      setFeedback(`${announcement.companyName}: ${status}`);
      if (status === "Applied" || status === "Not Interested") {
        setWarningAnnouncement(null);
      }
      return true;
    } catch (error) {
      setFeedback(error?.response?.data?.message || error.message || "Could not save response");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleApply = async (announcement) => {
    const safeUrl = getSafeUrl(announcement.applicationUrl);
    if (!safeUrl || !announcement.canApply) {
      setFeedback("Registration is not confirmed open or a valid link is unavailable.");
      return;
    }
    // Open a blank tab on the user gesture so async validation does not trigger popup blocking.
    const tab = window.open("", "_blank");
    const saved = await updateResponse(announcement, "Application Opened");
    if (saved) {
      if (tab) {
        tab.opener = null;
        tab.location.replace(safeUrl);
      } else {
        setFeedback("Application recorded. Please allow pop-ups to open the registration link.");
      }
    } else if (tab) {
      tab.close();
    }
  };

  /* =========================================
     DEADLINE WARNING
  ========================================= */

  const openDeadlineWarning = (announcement) => {
    setWarningAnnouncement(announcement);
  };

  const dismissDeadlineWarning = (announcement) => {
    setLocalState((previous) => ({
      ...previous,
      dismissedWarnings:
        previous.dismissedWarnings.includes(
          announcement.id
        )
          ? previous.dismissedWarnings
          : [
              ...previous.dismissedWarnings,
              announcement.id,
            ],
    }));

    setWarningAnnouncement(null);
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <StudentLayout>
      <section className="opportunities-page opportunities-v2">
        {/* Unified top header: the feed starts immediately beneath this row. */}
        <div className="opportunities-panel" style={maximized ? { minHeight: "calc(100vh - 135px)" } : undefined}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 20px 10px", flexWrap: "wrap" }}>
            <div className="opportunities-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flex: 1, minWidth: 0, margin: 0 }}>
              <div style={{ minWidth: 0 }}>
                <span className="opportunities-eyebrow">PLACIFY / PLACEMENT CENTER</span>
                <h1 style={{ margin: "3px 0 0", fontSize: maximized ? 22 : 26, lineHeight: 1.15 }}>Placement Opportunities</h1>
                {!maximized && <p style={{ margin: "4px 0 0" }}>Your placement announcements, deadlines and applications in one place.</p>}
              </div>
              <div className="opportunities-header-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className="opportunities-demo-badge">LIVE TELEGRAM</span>
                <button
                  type="button"
                  className="opportunities-notification-button"
                  onClick={() => setShowNotificationCenter((previous) => !previous)}
                  aria-label={`Telegram notifications, ${unreadCount} unread`}
                >
                  <span className="opportunities-bell-icon">♢</span>
                  {unreadCount > 0 && <span className="opportunities-bell-count">{unreadCount}</span>}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setMaximized((value) => !value); setExpandedId(null); }}
              aria-pressed={maximized}
              style={{ padding: "8px 13px", border: "1px solid #cbd9ed", borderRadius: 9, background: "#fff", color: "#1855bc", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
            >
              {maximized ? "⊟ Minimize" : "⊞ Maximize"}
            </button>
          </div>

        {/* COMPACT OVERVIEW */}

        {!maximized && <div className="opportunities-stats">
          <div className="opportunities-stat">
            <span>Total Announcements</span>
            <strong>
              {announcements.length}
            </strong>
            <small>Telegram placement updates</small>
          </div>

          <div className="opportunities-stat opportunities-stat-unread">
            <span>Unread Alerts</span>
            <strong>{unreadCount}</strong>
            <small>
              {unreadCount === 0
                ? "You're all caught up"
                : "Announcements to review"}
            </small>
          </div>

          <div className="opportunities-stat">
            <span>Marked Applied</span>
            <strong>{appliedCount}</strong>
            <small>Student applications</small>
          </div>

          <div className="opportunities-stat opportunities-stat-deadline"
            role="button" tabIndex={0} onClick={jumpToNearestDeadline}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); jumpToNearestDeadline(); } }}
            title="Jump to nearest upcoming registration deadline"
            style={{ cursor: "pointer" }}>
            <span>Upcoming Deadlines</span>
            <strong>{upcomingDeadlineCount}</strong>
            <small>Within 3 calendar days</small>
          </div>
        </div>}

        {/* NOTIFICATION CENTER */}

        {showNotificationCenter && (
          <div className="opportunities-notification-center">
            <div className="opportunities-notification-heading">
              <div>
                <strong>Telegram Notifications</strong>
                <p>
                  {unreadCount} unread placement updates
                </p>
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>

            {unreadAnnouncements.length === 0 ? (
              <p className="opportunities-notification-empty">
                No unread announcements.
              </p>
            ) : (
              unreadAnnouncements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="opportunities-notification-item"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("All");
                    setShowUnreadOnly(false);
                    setActiveTab("telegram");
                    setExpandedId(item.id);
                    markAsRead(item.id);
                    setShowNotificationCenter(false);
                  }}
                >
                  <strong>{item.companyName}</strong>
                  <span>{item.jobRole}</span>
                  <small>
                    {formatDateTime(item.receivedAt)}
                  </small>
                </button>
              ))
            )}
          </div>
        )}

        {/* FIXED PANEL HEADER */}

          <div className="opportunities-panel-header" style={{ gap: 0, paddingTop: 0, marginTop: 0 }}>
            <div className="opportunities-tabs">
              <button
                type="button"
                className={
                  activeTab === "telegram"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("telegram")
                }
              >
                Telegram Alerts
                {unreadCount > 0 && (
                  <span className="opportunities-tab-count">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={
                  activeTab === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab("all")
                }
              >
                All Opportunities
              </button>
            </div>

            <div className="opportunities-toolbar">
              <input
                type="search"
                placeholder="Search company, role or eligibility..."
                aria-label="Search placement announcements"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                aria-label="Filter announcement type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>

              <select aria-label="Filter by student response" value={responseFilter}
                onChange={(event) => { setResponseFilter(event.target.value); setCurrentIndex(0); setExpandedId(null); }}>
                <option value="All">All active</option>
                <option value="Applied">Applied only</option>
                <option value="Not Interested">Not Interested</option>
              </select>

              <button
                type="button"
                className={
                  showUnreadOnly
                    ? "opportunities-unread-toggle active"
                    : "opportunities-unread-toggle"
                }
                onClick={() =>
                  setShowUnreadOnly(
                    (previous) => !previous
                  )
                }
              >
                Unread only
              </button>
            </div>

            <div className="opportunities-list-heading">
              <div>
                <strong>
                  {activeTab === "telegram"
                    ? "Telegram Placement Feed"
                    : "Placement Opportunities"}
                </strong>

                <span>
                  {filteredAnnouncements.length} announcements
                  · {newOpportunityCount} new drives
                </span>
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>
          </div>

          {/* ONLY THIS AREA SCROLLS */}

          {maximized && !expandedId && !loading && !loadError && filteredAnnouncements.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "5px 16px", borderBottom: "1px solid #e4eaf4" }}>
              <strong style={{ color: "#15355d" }}>Company {currentIndex + 1} of {filteredAnnouncements.length}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={() => moveCompany(-1)} disabled={currentIndex === 0}
                  aria-label="Previous company" style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid #d1dff2", cursor: "pointer" }}>↑ Previous</button>
                <button type="button" onClick={() => moveCompany(1)} disabled={currentIndex >= filteredAnnouncements.length - 1}
                  aria-label="Next company" style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid #d1dff2", cursor: "pointer" }}>↓ Next</button>
              </div>
            </div>
          )}
          <div className="opportunities-list" ref={listRef}
            style={maximized ? { overflowY: "auto", maxHeight: "calc(100dvh - 265px)", minHeight: 0, paddingTop: 4 } : undefined}>
            {activeTab === "all" && (
              <div className="opportunities-tab-notice">
                Showing verified Telegram placement opportunities. Admin-created
                opportunities can be integrated separately.
              </div>
            )}

            {loading ? (
              <div className="opportunities-empty"><h3>Loading opportunities...</h3></div>
            ) : loadError ? (
              <div className="opportunities-empty"><h3>Unable to load opportunities</h3><p>{loadError}</p></div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="opportunities-empty">
                <h3>No announcements found</h3>
                <p>
                  Try changing the search or filters.
                </p>
              </div>
            ) : (
              (maximized
                ? filteredAnnouncements.slice(currentIndex, currentIndex + 1)
                : filteredAnnouncements).map(
                (announcement) => {
                  const isExpanded =
                    expandedId === announcement.id;

                  const response =
                    responses[announcement.id] ||
                    "Pending";

                  const isRead = readIds.includes(
                    announcement.id
                  );

                  const isCancelled =
                    announcement.type ===
                    "Drive Cancelled";

                  const deadlineInfo =
                    getDeadlineInfo(announcement, now);

                  const showWarning =
                    !isCancelled &&
                    deadlineInfo.days !== null &&
                    deadlineInfo.days >= 0 &&
                    deadlineInfo.days <= 3 &&
                    response !== "Applied" &&
                    response !== "Not Interested" &&
                    !dismissedWarnings.includes(
                      announcement.id
                    );

                  return (
                    <article
                      key={announcement.id}
                      className={
                        isRead
                          ? "opportunity-card"
                          : "opportunity-card opportunity-card-unread"
                      }
                    >
                      {isExpanded ? (
                        <div className="opportunity-expanded" style={{ maxHeight: "calc(100dvh - 310px)", minHeight: "min(55dvh, 460px)", overflowY: "auto", padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "#fff", zIndex: 2, padding: "8px 0 12px" }}>
                            <div>
                              <strong style={{ display: "block", color: "#15355d" }}>{announcement.companyName}</strong>
                              <span style={{ fontSize: 12, color: "#64748b" }}>Original Telegram Announcement</span>
                            </div>
                            <button type="button" onClick={() => setExpandedId(null)} aria-label="Close full message"
                              style={{ border: "1px solid #d6e1f0", borderRadius: 8, background: "white", padding: "8px 14px", cursor: "pointer" }}>× Close</button>
                          </div>
                          <p className="opportunity-original-message" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7, margin: "8px 0 18px" }}>
                            {announcement.message}
                          </p>
                          {announcement.posterUrl && (
                            <img src={announcement.posterUrl} alt={`${announcement.companyName} placement poster`} className="opportunity-poster" />
                          )}
                          <div className="opportunity-expanded-footer">
                            <span>{announcement.chatTitle || "Telegram"}</span>
                            <span>Received: {formatDateTime(announcement.receivedAt)}</span>
                          </div>
                          {getSafeUrl(announcement.messageUrl) && (
                            <a href={getSafeUrl(announcement.messageUrl)} target="_blank" rel="noopener noreferrer">
                              View original Telegram message ↗
                            </a>
                          )}
                        </div>
                      ) : (
                      <>
                      <div className="opportunity-card-top">
                        <div className="opportunity-company-avatar">
                          {(announcement.companyName || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="opportunity-card-heading">
                          <div className="opportunity-card-labels">
                            <span className="opportunity-source">
                              Telegram
                            </span>

                            {!isRead && (
                              <span className="opportunity-unread-label">
                                Unread
                              </span>
                            )}

                            <span
                              className={`opportunity-type ${
                                isCancelled
                                  ? "cancelled"
                                  : announcement.type ===
                                    "Deadline Updated"
                                  ? "updated"
                                  : "new"
                              }`}
                            >
                              {announcement.type}
                            </span>
                          </div>

                          <h3>
                            {textOrFallback(announcement.jobRole)}
                          </h3>

                          <p>
                            {announcement.companyName}
                          </p>
                        </div>

                        <span className="opportunity-response">
                          {response}
                        </span>
                      </div>

                      <div className="opportunity-meta-row">
                        <span>
                          ◷ Posted{" "}
                          {formatDateTime(
                            announcement.receivedAt
                          )}
                        </span>

                        <span>
                          ◇ {textOrFallback(announcement.location)}
                        </span>
                      </div>

                      {!isExpanded && <div className="opportunity-details-grid">
                        {getDetailBoxes(announcement).map(([label, value]) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong>{textOrFallback(value)}</strong>
                          </div>
                        ))}
                      </div>}

                      {!isExpanded && Array.isArray(announcement.additionalDetails) &&
                        announcement.additionalDetails.length > 0 && (
                          <div className="opportunity-details-grid">
                            {announcement.additionalDetails
                              .filter((detail) => detail?.label && detail?.value)
                              .map((detail, index) => (
                                <div key={`${detail.label}-${index}`}>
                                  <span>{detail.label}</span>
                                  <strong>{detail.value}</strong>
                                </div>
                              ))}
                          </div>
                        )}

                      <div
                        className={`opportunity-deadline-status ${deadlineInfo.tone}`}
                      >
                        {deadlineInfo.label}

                        {showWarning && (
                          <button
                            type="button"
                            onClick={() =>
                              openDeadlineWarning(
                                announcement
                              )
                            }
                          >
                            View warning
                          </button>
                        )}
                      </div>

                      {/* Brief preview is replaced by full announcement when expanded. */}
                      {!isExpanded && <div className="opportunity-message-preview">
                        <div className="opportunity-message-preview-heading">
                          <span>Telegram announcement</span>
                          <span>{announcement.chatTitle || "Telegram"}</span>
                        </div>
                        <p>{announcement.message}</p>
                      </div>}

                      <div className="opportunity-card-actions">
                        <button
                          type="button"
                          className="opportunity-view-button"
                          onClick={() =>
                            toggleAnnouncement(
                              announcement
                            )
                          }
                        >
                          {isExpanded
                            ? "Hide Full Message"
                            : "View Full Message"}
                        </button>

                        <button
                          type="button"
                          className="opportunity-apply-button"
                          disabled={!announcement.canApply || Boolean(savingId)}
                          onClick={() =>
                            handleApply(announcement)
                          }
                        >
                          Apply ↗
                        </button>

                        <button
                          type="button"
                          className="opportunity-applied-button"
                          disabled={Boolean(savingId)}
                          onClick={() =>
                            updateResponse(
                              announcement,
                              "Applied"
                            )
                          }
                        >
                          Applied
                        </button>

                        <button
                          type="button"
                          className="opportunity-dismiss-button"
                          disabled={Boolean(savingId)}
                          onClick={() =>
                            updateResponse(
                              announcement,
                              "Not Interested"
                            )
                          }
                        >
                          Not Interested
                        </button>
                      </div>

                      </>
                      )}
                    </article>
                  );
                }
              )
            )}
          </div>
        </div>

        {/* FLOATING FEEDBACK */}

        {feedback && (
          <div
            className="opportunities-feedback opportunities-toast"
            role="status"
          >
            <span>{feedback}</span>

            <button
              type="button"
              onClick={() => setFeedback("")}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* DEADLINE WARNING POPUP */}

        {warningAnnouncement && (
          <div
            className="opportunities-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setWarningAnnouncement(null);
              }
            }}
          >
            <div
              className="opportunities-warning-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="opportunity-warning-title"
            >
              <div className="opportunities-warning-icon">
                !
              </div>

              <h2 id="opportunity-warning-title">
                Registration Deadline Alert
              </h2>

              <p>
                The registration deadline date for
                <strong>
                  {" "}
                  {warningAnnouncement.companyName}
                </strong>{" "}
                is approaching.
              </p>

              <div className="opportunities-warning-details">
                <span>Job Role</span>
                <strong>
                  {warningAnnouncement.jobRole}
                </strong>

                <span>Deadline Date</span>
                <strong>
                  {formatDate(
                    warningAnnouncement.deadline
                  )}
                </strong>

                <span>Time Remaining</span>
                <strong>
                  {
                    getDeadlineInfo(
                      warningAnnouncement, now
                    ).label
                  }
                </strong>
              </div>

              <p className="opportunities-warning-note">
                {warningAnnouncement.deadlineTimeConfirmed
                  ? "Check the confirmed registration deadline before applying."
                  : "An exact closing time has not been confirmed. PLACIFY will not assume a cutoff hour."}
              </p>

              <div className="opportunities-warning-actions">
                <button
                  type="button"
                  className="opportunity-apply-button"
                  onClick={() => {
                    handleApply(
                      warningAnnouncement
                    );
                    setWarningAnnouncement(null);
                  }}
                  disabled={!warningAnnouncement.canApply || Boolean(savingId)}
                >
                  Open Registration
                </button>

                <button
                  type="button"
                  className="opportunity-view-button"
                  onClick={() =>
                    dismissDeadlineWarning(
                      warningAnnouncement
                    )
                  }
                >
                  Dismiss Warning
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="opportunities-demo-footer">
          Telegram opportunities · Last UI refresh: {new Date(now).toLocaleTimeString("en-IN", {
            hour: "numeric", minute: "2-digit",
          })}
        </div>
      </section>
    </StudentLayout>
  );
}

export default StudentOpportunities;
