
import { useCallback, useEffect, useMemo, useState } from "react";
import StudentLayout from "../../../components/student/StudentLayout";
import {
  fetchPlacementApplications,
  updatePlacementApplicationStage,
  updatePlacementApplicationNotes,
  updatePlacementApplicationOffer,
} from "../../../services/placementApplicationService";
import "./StudentApplications.css";

const STAGES = [
  "Interested",
  "Applied",
  "Assessment",
  "Shortlisted",
  "Technical",
  "HR",
  "Selected",
  "Rejected",
  "Offer",
  "Placed",
];

const NEXT_STAGES = {
  Interested: ["Applied", "Rejected"],
  Applied: ["Assessment", "Shortlisted", "Rejected"],
  Assessment: ["Shortlisted", "Rejected"],
  Shortlisted: ["Technical", "HR", "Rejected"],
  Technical: ["HR", "Selected", "Rejected"],
  HR: ["Selected", "Rejected"],
  Selected: ["Offer", "Rejected"],
  Offer: ["Placed", "Rejected"],
  Rejected: [],
  Placed: [],
};

function formatDate(value, includeTime = false) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit" }
      : {}),
  });
}


function getDetails(application) {
  const source =
    application.opportunity ||
    application.telegramAnnouncement ||
    {};

  const company =
    source.companyName ||
    source.company ||
    "Company not announced";

  const message = String(source.messageText || "");
  const normalizedMessage = message.toLowerCase();

  let role =
    source.jobRole?.trim() ||
    source.role?.trim() ||
    source.title?.trim() ||
    "";

  // Smart fallback for Telegram announcements
  if (!role && application.telegramAnnouncement) {
    const hasInternship = /\binternship\b|\bintern\b/i.test(
      normalizedMessage
    );

    const hasFullTime =
      /\bfull[\s-]?time\b|\bemployment\b/i.test(
        normalizedMessage
      );

    if (hasInternship && hasFullTime) {
      role = "Internship & Full-Time Employment";
    } else if (hasInternship) {
      role = "Internship Opportunity";
    } else if (
      /\bmultiple roles\b|\bvarious positions\b/i.test(
        normalizedMessage
      )
    ) {
      role = "Multiple Roles Available";
    } else {
      role = "Placement Opportunity";
    }
  }

  return {
    company,
    role: role || "Role not announced",
    location: source.location || "Not announced",
    source: application.telegramAnnouncement
      ? "Telegram"
      : "Placement Opportunity",
  };
}


function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [nextStage, setNextStage] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [nextRoundDate, setNextRoundDate] = useState("");
  const [notes, setNotes] = useState("");
  const [offerPackage, setOfferPackage] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [offerLetterUrl, setOfferLetterUrl] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchPlacementApplications();
      const payload = result?.data ?? result;

      if (!payload?.success || !Array.isArray(payload.applications)) {
        throw new Error(payload?.message || "Invalid applications response");
      }

      setApplications(payload.applications);
      setSummary(payload.summary || {});
    } catch (err) {
      setError(err.message || "Unable to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const selected = applications.find(
    (application) => application._id === selectedId
  );

  const openApplication = (application) => {
    setSelectedId(application._id);
    setNextStage("");
    setStageNote("");
    setNextRoundDate(
      application.nextRoundDate
        ? new Date(application.nextRoundDate).toISOString().slice(0, 16)
        : ""
    );
    setNotes(application.notes || "");
    setOfferPackage(
      application.offerDetails?.package ?? ""
    );
    setJoiningDate(
      application.offerDetails?.joiningDate
        ? new Date(application.offerDetails.joiningDate)
            .toISOString()
            .slice(0, 10)
        : ""
    );
    setOfferLetterUrl(
      application.offerDetails?.offerLetterUrl || ""
    );
    setFeedback("");
  };

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications.filter((application) => {
      const details = getDetails(application);

      const matchesSearch =
        !term ||
        `${details.company} ${details.role} ${details.location}`
          .toLowerCase()
          .includes(term);

      const matchesStage =
        stageFilter === "All" ||
        application.currentStage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [applications, search, stageFilter]);

  const runUpdate = async (action, successMessage) => {
    if (!selected || saving) return;

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      await action();
      setFeedback(successMessage);
      await loadApplications();
    } catch (err) {
      setFeedback(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const saveStage = () => {
    if (!nextStage) return;

    runUpdate(
      () =>
        updatePlacementApplicationStage(selected._id, {
          stage: nextStage,
          note: stageNote,
          nextRoundDate: nextRoundDate
            ? new Date(nextRoundDate).toISOString()
            : null,
        }),
      "Application stage updated successfully."
    );
  };

  const saveNotes = () => {
    runUpdate(
      () => updatePlacementApplicationNotes(selected._id, notes),
      "Application notes saved."
    );
  };

  const saveOffer = () => {
    const data = {
      joiningDate: joiningDate || null,
      offerLetterUrl,
    };

    if (offerPackage !== "") {
      data.package = Number(offerPackage);
    }

    runUpdate(
      () => updatePlacementApplicationOffer(selected._id, data),
      "Offer details saved."
    );
  };

  const stats = [
    ["Total Applications", summary.total ?? applications.length],
    ["Applied", summary.Applied ?? 0],
    ["Shortlisted", summary.Shortlisted ?? 0],
    ["Selected", summary.Selected ?? 0],
    ["Offers", summary.Offer ?? 0],
    ["Placed", summary.Placed ?? 0],
  ];

  return (
    <StudentLayout>
      <section className="applications-page">
        <header className="applications-header">
          <div>
            <span className="applications-eyebrow">
              PLACIFY / PLACEMENT CENTER
            </span>
            <h1>My Applications</h1>
            <p>
              Track placement applications, interview rounds,
              offers and joining dates.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            disabled={loading || saving}
            className="applications-refresh"
          >
            Refresh
          </button>
        </header>

        <div className="applications-stats">
          {stats.map(([label, value]) => (
            <div className="applications-stat" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="applications-panel">
          <div className="applications-toolbar">
            <input
              type="search"
              placeholder="Search company, role or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search applications"
            />

            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              aria-label="Filter application stage"
            >
              <option value="All">All stages</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="applications-error" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="applications-empty">
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="applications-empty">
              <h3>No applications found</h3>
              <p>
                Applications added to your placement tracker
                will appear here.
              </p>
            </div>
          ) : (
            <div className="applications-list">
              {filteredApplications.map((application) => {
                const details = getDetails(application);

                return (
                  <article
                    className="applications-card"
                    key={application._id}
                  >
                    <div className="applications-avatar">
                      {details.company.charAt(0).toUpperCase()}
                    </div>

                    <div className="applications-card-content">
                      <div className="applications-card-top">
                        <span>{details.source}</span>
                        <span className="applications-stage">
                          {application.currentStage}
                        </span>
                      </div>

                      <h3>{details.role}</h3>
                      <strong>{details.company}</strong>

                      <div className="applications-meta">
                        <span>{details.location}</span>
                        <span>
                          Applied: {application.appliedAt
                            ? formatDate(application.appliedAt)
                            : "Not yet applied"}
                        </span>
                        <span>
                          Next round:{" "}
                          {formatDate(application.nextRoundDate, true)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="applications-view"
                      onClick={() => openApplication(application)}
                    >
                      Manage
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <div className="applications-modal-backdrop">
            <div
              className="applications-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Manage placement application"
            >
              <div className="applications-modal-header">
                <div>
                  <span className="applications-eyebrow">
                    APPLICATION TRACKER
                  </span>
                  <h2>{getDetails(selected).company}</h2>
                  <p>{getDetails(selected).role}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  disabled={saving}
                >
                  Close
                </button>
              </div>

              <div className="applications-modal-body">
                <div className="applications-form-section">
                  <h3>Update Placement Stage</h3>
                  <p>Current stage: {selected.currentStage}</p>

                  {NEXT_STAGES[selected.currentStage]?.length ? (
                    <>
                      <label>
                        Next stage
                        <select
                          value={nextStage}
                          onChange={(event) =>
                            setNextStage(event.target.value)
                          }
                        >
                          <option value="">Select next stage</option>
                          {NEXT_STAGES[selected.currentStage].map(
                            (stage) => (
                              <option key={stage} value={stage}>
                                {stage}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        Next round date and time
                        <input
                          type="datetime-local"
                          value={nextRoundDate}
                          onChange={(event) =>
                            setNextRoundDate(event.target.value)
                          }
                        />
                      </label>

                      <label>
                        Stage note
                        <textarea
                          rows={3}
                          value={stageNote}
                          onChange={(event) =>
                            setStageNote(event.target.value)
                          }
                          placeholder="Add an optional stage update note"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={saveStage}
                        disabled={!nextStage || saving}
                      >
                        Save Stage
                      </button>
                    </>
                  ) : (
                    <p>This application is in a final stage.</p>
                  )}
                </div>

                <div className="applications-form-section">
                  <h3>Personal Notes</h3>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Interview feedback, follow-ups, preparation notes..."
                  />
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={saving}
                  >
                    Save Notes
                  </button>
                </div>

                {["Selected", "Offer", "Placed"].includes(
                  selected.currentStage
                ) && (
                  <div className="applications-form-section">
                    <h3>Offer Details</h3>

                    <label>
                      Package
                      <input
                        type="number"
                        min="0"
                        value={offerPackage}
                        onChange={(event) =>
                          setOfferPackage(event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Joining date
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(event) =>
                          setJoiningDate(event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Offer letter URL
                      <input
                        type="url"
                        value={offerLetterUrl}
                        onChange={(event) =>
                          setOfferLetterUrl(event.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>

                    <button
                      type="button"
                      onClick={saveOffer}
                      disabled={saving}
                    >
                      Save Offer Details
                    </button>
                  </div>
                )}

                <div className="applications-form-section">
                  <h3>Stage History</h3>
                  {selected.stageHistory?.length ? (
                    <div className="applications-history">
                      {selected.stageHistory.map((entry, index) => (
                        <div key={`${entry.stage}-${index}`}>
                          <strong>{entry.stage}</strong>
                          <span>{formatDate(entry.changedAt, true)}</span>
                          {entry.note && <p>{entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No stage history available.</p>
                  )}
                </div>
              </div>

              {feedback && (
                <p className="applications-feedback" role="status">
                  {feedback}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </StudentLayout>
  );
}

export default StudentApplications;
