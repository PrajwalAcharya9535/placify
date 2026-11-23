
import { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentCalendar.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

const EVENT_TYPES = [
  "General",
  "Opportunity Deadline",
  "Application Round",
  "Interview",
  "Group Discussion",
  "Mock Placement",
  "Test",
  "Joining",
];

const initialForm = {
  title: "",
  description: "",
  eventType: "General",
  startDate: "",
  endDate: "",
  allDay: false,
  reminderEnabled: true,
  reminderMinutesBefore: 60,
};

const dateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const toLocalInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

export default function StudentCalendar() {
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("placifyToken");

  const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await request("/calendar/events");
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) => filter === "All" || event.eventType === filter
      ),
    [events, filter]
  );

  const selectedEvents = useMemo(
    () =>
      filteredEvents.filter(
        (event) => dateKey(event.startDate) === selectedDate
      ),
    [filteredEvents, selectedDate]
  );

  const upcomingEvents = useMemo(
    () =>
      filteredEvents
        .filter(
          (event) =>
            event.status === "Scheduled" &&
            new Date(event.startDate) >= new Date()
        )
        .sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        )
        .slice(0, 5),
    [filteredEvents]
  );

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [month]);

  const changeMonth = (offset) => {
    setMonth(
      new Date(month.getFullYear(), month.getMonth() + offset, 1)
    );
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      startDate: `${selectedDate}T09:00`,
    });
    setShowForm(true);
    setError("");
  };

  const openEdit = (event) => {
    setEditingId(event._id);
    setForm({
      title: event.title,
      description: event.description || "",
      eventType: event.eventType,
      startDate: toLocalInput(event.startDate),
      endDate: toLocalInput(event.endDate),
      allDay: event.allDay,
      reminderEnabled: event.reminderEnabled,
      reminderMinutesBefore: event.reminderMinutesBefore,
      status: event.status,
    });
    setShowForm(true);
    setError("");
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : null,
        reminderMinutesBefore: Number(form.reminderMinutesBefore),
      };

      if (editingId) {
        await request(`/calendar/events/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        delete payload.status;
        await request("/calendar/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditingId(null);
      setNotice(editingId ? "Event updated." : "Event created.");
      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;

    try {
      setError("");
      await request(`/calendar/events/${event._id}`, {
        method: "DELETE",
      });
      setNotice("Event deleted.");
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <StudentLayout>
      <div className="student-calendar">
        <div className="calendar-heading">
          <div>
            <p className="calendar-eyebrow">PLACIFY / PLACEMENT</p>
            <h1>Placement Calendar</h1>
            <p>Manage interviews, deadlines, tests and important events.</p>
          </div>
          <button className="calendar-primary-btn" onClick={openCreate}>
            + Add Event
          </button>
        </div>

       {error && <div className="calendar-error">{error}</div>}
{notice && (
  <div className="calendar-notice calendar-toast" role="status">
    {notice}
  </div>
)}

        <div className="calendar-toolbar">
          <div className="calendar-month-controls">
            <button onClick={() => changeMonth(-1)}>‹</button>
            <h2>
              {month.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button onClick={() => changeMonth(1)}>›</button>
            <button
              className="calendar-today-btn"
              onClick={() => {
                const now = new Date();
                setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                setSelectedDate(dateKey(now));
              }}
            >
              Today
            </button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Events</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar-content-grid">
          <div className="calendar-main-panel">
            <div className="calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => <span key={day}>{day}</span>
              )}
            </div>

            <div className="calendar-days-grid">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`blank-${index}`} className="calendar-empty-day" />;
                }

                const key = dateKey(
                  new Date(month.getFullYear(), month.getMonth(), day)
                );
                const dayEvents = filteredEvents.filter(
                  (event) => dateKey(event.startDate) === key
                );
                const isToday = key === dateKey(new Date());

                return (
                  <button
                    key={key}
                    className={`calendar-day ${
                      selectedDate === key ? "selected" : ""
                    } ${isToday ? "today" : ""}`}
                    onClick={() => setSelectedDate(key)}
                  >
                    <span className="calendar-day-number">{day}</span>
                    <div className="calendar-day-events">
                    {dayEvents.slice(0, 2).map((event) => (
  <span
    key={event._id}
    className="calendar-event-chip"
    title={event.title}
  >
    <span className="calendar-event-chip-text">
      {event.title}
    </span>
  </span>
))}
                      {dayEvents.length > 2 && (
                        <small>+{dayEvents.length - 2} more</small>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="calendar-side-panel">
            <h3>
              {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            </h3>
            <p className="calendar-side-subtitle">
              {selectedEvents.length} event(s) scheduled
            </p>

            {selectedEvents.length === 0 ? (
              <p className="calendar-empty-message">No events on this date.</p>
            ) : (
              selectedEvents.map((event) => (
                <div className="calendar-event-card" key={event._id}>
                  <span className="calendar-event-type">{event.eventType}</span>
                  <h4>{event.title}</h4>
                  <p>{formatDateTime(event.startDate)}</p>
                  {event.description && <p>{event.description}</p>}
                  <span className="calendar-event-status">{event.status}</span>
                  <div className="calendar-card-actions">
                    <button onClick={() => openEdit(event)}>Edit</button>
                    <button onClick={() => deleteEvent(event)}>Delete</button>
                  </div>
                </div>
              ))
            )}

            <div className="calendar-upcoming">
              <h3>Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p className="calendar-empty-message">No upcoming events.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <button
                    key={event._id}
                    className="calendar-upcoming-item"
                    onClick={() => {
                      const date = new Date(event.startDate);
                      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                      setSelectedDate(dateKey(date));
                    }}
                  >
                    <strong>{event.title}</strong>
                    <span>{formatDateTime(event.startDate)}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>

        {loading && <p className="calendar-loading">Loading calendar...</p>}

        {showForm && (
          <div className="calendar-modal-backdrop">
            <div className="calendar-modal">
              <div className="calendar-modal-header">
                <h2>{editingId ? "Edit Event" : "Create Event"}</h2>
                <button onClick={() => setShowForm(false)}>×</button>
              </div>

              <form onSubmit={saveEvent}>
                <label>
                  Event Title
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </label>

                <label>
                  Event Type
                  <select
                    value={form.eventType}
                    onChange={(e) =>
                      setForm({ ...form, eventType: e.target.value })
                    }
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <div className="calendar-form-row">
                  <label>
                    Start Date & Time
                    <input
                      type="datetime-local"
                      required
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    End Date & Time
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="calendar-checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) =>
                        setForm({ ...form, allDay: e.target.checked })
                      }
                    />
                    All-day event
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.reminderEnabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          reminderEnabled: e.target.checked,
                        })
                      }
                    />
                    Enable reminder
                  </label>
                </div>

                {form.reminderEnabled && (
                  <label>
                    Remind Before
                    <select
                      value={form.reminderMinutesBefore}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          reminderMinutesBefore: Number(e.target.value),
                        })
                      }
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={1440}>1 day</option>
                    </select>
                  </label>
                )}

                {editingId && (
                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option>Scheduled</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </label>
                )}

                <div className="calendar-form-actions">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="calendar-primary-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
