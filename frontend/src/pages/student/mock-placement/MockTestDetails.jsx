
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MockTestDetails.css";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

// ==========================================
// HELPERS
// ==========================================

const formatAttempts = (value, unlimited = false) => {
  if (unlimited || value === null) {
    return "Unlimited";
  }

  return value ?? 0;
};

const getModeDuration = (round, mode) => {
  if (
    mode === "Demo" &&
    Number.isFinite(round.demoDurationMinutes) &&
    round.demoDurationMinutes > 0
  ) {
    return round.demoDurationMinutes;
  }

  return round.durationMinutes ?? 0;
};

const getModeQuestionCount = (round, mode) => {
  if (
    mode === "Demo" &&
    Number.isInteger(round.demoNumberOfQuestions) &&
    round.demoNumberOfQuestions > 0
  ) {
    return round.demoNumberOfQuestions;
  }

  return round.numberOfQuestions ?? 0;
};

// ==========================================
// COMPONENT
// ==========================================

const MockTestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ========================================
  // EXISTING STATE
  // ========================================

  const [mockTest, setMockTest] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  // ========================================
  // NEW PRACTICE SETTINGS
  // ========================================

  const [practiceMode, setPracticeMode] = useState("Full");
  const [enableProctoring, setEnableProctoring] =
    useState(false);

  // ========================================
  // FETCH MOCK TEST DETAILS
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const fetchMockTestDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setStartError("");

        const token =
          localStorage.getItem("placifyToken");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/mock-tests/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (cancelled) return;

        const test = response.data.mockTest;

        setMockTest(test);
        setAttemptInfo(response.data.attemptInfo);

        // Default to Full Simulation.
        // If unavailable, use Demo Mode.
        if (test?.allowFullSimulation === false) {
          setPracticeMode("Demo");
        } else {
          setPracticeMode("Full");
        }

        // Optional proctoring starts disabled.
        setEnableProctoring(false);
      } catch (err) {
        if (cancelled) return;

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem("placifyToken");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load mock test details."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMockTestDetails();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ========================================
  // START MOCK TEST
  // ========================================

  const handleStartMockTest = async () => {
    if (!attemptInfo?.canAttempt || starting) {
      return;
    }

    try {
      setStarting(true);
      setStartError("");

      const token =
        localStorage.getItem("placifyToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/mock-tests/${id}/start`,
        {
          practiceMode,
          proctoringEnabled:
            Boolean(mockTest?.proctoringEnabled) &&
            enableProctoring,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mockAttempt =
        response.data.mockAttempt;

      const currentRound =
        response.data.currentRound;

      if (!mockAttempt?._id || !currentRound) {
        setStartError(
          "Mock test started, but attempt information is incomplete."
        );
        return;
      }

      navigate(
        `/student/mock-placement/attempt/${mockAttempt._id}`,
        {
          state: {
            mockAttempt,
            currentRound,
            mockTest,
          },
        }
      );
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("placifyToken");
        navigate("/login");
        return;
      }

      // Preserve existing resume behavior when
      // the backend reports an active attempt.
      if (
        err.response?.status === 409 &&
        err.response?.data?.attempt?._id
      ) {
        const activeAttempt =
          err.response.data.attempt;

        const currentRound =
          activeAttempt.roundResults?.[
            activeAttempt.currentRoundIndex
          ];

        if (currentRound) {
          navigate(
            `/student/mock-placement/attempt/${activeAttempt._id}`,
            {
              state: {
                mockAttempt: activeAttempt,
                currentRound,
                mockTest,
              },
            }
          );
          return;
        }
      }

      setStartError(
        err.response?.data?.message ||
          "Failed to start mock placement test."
      );
    } finally {
      setStarting(false);
    }
  };

  // ========================================
  // RESUME ACTIVE MOCK TEST
  // ========================================

  const handleResumeMockTest = () => {
    const activeAttempt =
      attemptInfo?.activeAttempt;

    const currentRound =
      attemptInfo?.currentRound ||
      activeAttempt?.roundResults?.[
        activeAttempt.currentRoundIndex
      ];

    if (!activeAttempt?._id || !currentRound) {
      setStartError(
        "Active mock attempt information is incomplete."
      );
      return;
    }

    navigate(
      `/student/mock-placement/attempt/${activeAttempt._id}`,
      {
        state: {
          mockAttempt: activeAttempt,
          currentRound,
          mockTest,
        },
      }
    );
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="mock-details-page">
        <div className="mock-details-container">
          <div className="mock-details-state">
            Loading mock test details...
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="mock-details-page">
        <div className="mock-details-container">
          <div className="mock-details-error">
            {error}
          </div>

          <button
            type="button"
            className="mock-details-back"
            onClick={() =>
              navigate("/student/mock-placement")
            }
          >
            ← Back to Mock Placement
          </button>
        </div>
      </div>
    );
  }

  if (!mockTest) {
    return (
      <div className="mock-details-page">
        <div className="mock-details-container">
          <div className="mock-details-state">
            Mock test not found.
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // SORT ROUNDS
  // ========================================

  const sortedRounds = [
    ...(mockTest.rounds || []),
  ].sort(
    (a, b) =>
      (a.order || 0) - (b.order || 0)
  );

  const hasActiveAttempt = Boolean(
    attemptInfo?.hasActiveAttempt &&
      attemptInfo?.activeAttempt
  );

  // ========================================
  // ATTEMPT INFORMATION
  // ========================================

  const unlimitedAttempts =
    attemptInfo?.unlimitedAttempts === true ||
    (
      attemptInfo?.maxAttempts == null &&
      mockTest.maxAttempts == null
    );

  const maximumAttempts =
    attemptInfo?.maxAttempts ??
    mockTest.maxAttempts;

  const attemptsRemaining =
    attemptInfo?.attemptsRemaining;

  // ========================================
  // AVAILABLE MODES
  // ========================================

  const allowFullSimulation =
    mockTest.allowFullSimulation !== false;

  const allowDemoMode =
    mockTest.allowDemoMode !== false;

  const canSelectMode =
    !hasActiveAttempt &&
    attemptInfo?.canAttempt;

  const selectedModeAvailable =
    practiceMode === "Full"
      ? allowFullSimulation
      : allowDemoMode;

  const canStart =
    Boolean(attemptInfo?.canAttempt) &&
    !hasActiveAttempt &&
    !starting &&
    selectedModeAvailable &&
    sortedRounds.length > 0;

  // ========================================
  // TOTAL DURATION
  // ========================================

  const selectedDuration =
    sortedRounds.reduce(
      (total, round) =>
        total +
        Number(
          getModeDuration(round, practiceMode)
        ),
      0
    );

  // ========================================
  // COMMON INLINE STYLES
  // ========================================

  const modeContainerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "12px",
  };

  const modeButtonStyle = (selected, disabled) => ({
    padding: "14px 10px",
    borderRadius: "11px",
    border: selected
      ? "2px solid #2563eb"
      : "1px solid #dbe4f0",
    background: selected
      ? "#eff6ff"
      : "#f8fafc",
    color: selected
      ? "#1d4ed8"
      : "#475569",
    fontSize: "12px",
    fontWeight: 700,
    cursor: disabled
      ? "not-allowed"
      : "pointer",
    opacity: disabled ? 0.5 : 1,
    textAlign: "center",
  });

  // ========================================
  // UI
  // ========================================

  return (
    <div className="mock-details-page">
      <div className="mock-details-container">

        {/* BACK */}

        <button
          type="button"
          className="mock-details-back"
          onClick={() =>
            navigate("/student/mock-placement")
          }
        >
          ← Back to Mock Placement
        </button>

        {/* HERO */}

        <section className="mock-details-hero">
          <div className="mock-details-hero-content">
            <div className="mock-details-badges">
              <span>
                {mockTest.companyName || "Placement"}
              </span>

              <span>
                {mockTest.difficulty || "Assessment"}
              </span>

              {mockTest.proctoringEnabled && (
                <span>Proctoring Available</span>
              )}

              {mockTest.hiringTrack && (
                <span>{mockTest.hiringTrack}</span>
              )}
            </div>

            <h1>{mockTest.title}</h1>

            <p>
              {mockTest.description ||
                "Complete the configured placement rounds and evaluate your placement readiness."}
            </p>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="mock-summary-grid">
          <div className="mock-summary-card">
            <span>Total Rounds</span>
            <strong>{sortedRounds.length}</strong>
          </div>

          <div className="mock-summary-card">
            <span>Total Marks</span>
            <strong>
              {mockTest.totalMarks ?? 0}
            </strong>
          </div>

          <div className="mock-summary-card">
            <span>Passing Score</span>
            <strong>
              {mockTest.passingPercentage ?? 0}%
            </strong>
          </div>

          <div className="mock-summary-card">
            <span>Attempts Remaining</span>
            <strong>
              {formatAttempts(
                attemptsRemaining,
                unlimitedAttempts
              )}
            </strong>
          </div>
        </section>

        <div className="mock-details-layout">

          {/* ==================================
              PLACEMENT ROUNDS
          ================================== */}

          <section className="mock-rounds-section">
            <div className="mock-section-heading">
              <div>
                <p>TEST STRUCTURE</p>
                <h2>Placement Rounds</h2>
              </div>
            </div>

            <div className="mock-round-list">
              {sortedRounds.length === 0 ? (
                <div className="mock-details-state">
                  No rounds configured for this mock test.
                </div>
              ) : (
                sortedRounds.map((round, index) => (
                  <article
                    className="mock-round-card"
                    key={
                      round._id ||
                      `${round.roundName}-${index}`
                    }
                  >
                    <div className="mock-round-number">
                      {index + 1}
                    </div>

                    <div className="mock-round-content">
                      <div className="mock-round-title-row">
                        <div>
                          <h3>
                            {round.roundName ||
                              `Round ${index + 1}`}
                          </h3>

                          <span>
                            {round.roundType ||
                              "Assessment"}
                          </span>
                        </div>

                        <strong>
                          {round.totalMarks ?? 0} Marks
                        </strong>
                      </div>

                      <div className="mock-round-meta">
                        <span>
                          Duration:{" "}
                          <b>
                            {getModeDuration(
                              round,
                              practiceMode
                            )}{" "}
                            min
                          </b>
                        </span>

                        {round.numberOfQuestions != null && (
                          <span>
                            Questions:{" "}
                            <b>
                              {getModeQuestionCount(
                                round,
                                practiceMode
                              )}
                            </b>
                          </span>
                        )}

                        <span>
                          Pass:{" "}
                          <b>
                            {round.passingPercentage ?? 0}%
                          </b>
                        </span>
                      </div>

                      {round.instructions && (
                        <p
                          style={{
                            marginTop: "10px",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {round.instructions}
                        </p>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* ==================================
              ATTEMPT PANEL
          ================================== */}

          <aside className="mock-attempt-panel">
            <p className="mock-attempt-eyebrow">
              YOUR ATTEMPT
            </p>

            <h2>
              {hasActiveAttempt
                ? "Assessment in progress"
                : "Ready to begin?"}
            </h2>

            <p className="mock-attempt-description">
              {hasActiveAttempt
                ? "You already have an active placement assessment. Continue from your current round."
                : "Select your practice mode and complete the placement rounds in the configured order."}
            </p>

            {/* ATTEMPT INFORMATION */}

            <div className="mock-attempt-info">
              <div>
                <span>Maximum Attempts</span>
                <strong>
                  {formatAttempts(
                    maximumAttempts,
                    unlimitedAttempts
                  )}
                </strong>
              </div>

              <div>
                <span>Attempts Used</span>
                <strong>
                  {attemptInfo?.attemptsUsed ?? 0}
                </strong>
              </div>

              <div>
                <span>Attempts Remaining</span>
                <strong>
                  {formatAttempts(
                    attemptsRemaining,
                    unlimitedAttempts
                  )}
                </strong>
              </div>
            </div>

            {/* ACTIVE ROUND */}

            {hasActiveAttempt &&
              attemptInfo?.currentRound && (
                <div className="mock-proctoring-notice">
                  <strong>Current Round</strong>
                  <span>
                    {attemptInfo.currentRound.roundName ||
                      "Assessment Round"}
                    {" • "}
                    {attemptInfo.currentRound.roundType ||
                      "Assessment"}
                  </span>
                </div>
              )}

            {/* ==================================
                PRACTICE MODE
            ================================== */}

            {!hasActiveAttempt && (
              <div style={{ marginTop: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    margin: "0 0 5px",
                    color: "#0f172a",
                  }}
                >
                  Practice Mode
                </h3>

                <p
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Choose the complete assessment or a
                  shorter demonstration.
                </p>

                <div style={modeContainerStyle}>
                  <button
                    type="button"
                    style={modeButtonStyle(
                      practiceMode === "Full",
                      !canSelectMode ||
                        !allowFullSimulation
                    )}
                    disabled={
                      !canSelectMode ||
                      !allowFullSimulation
                    }
                    onClick={() => {
                      setPracticeMode("Full");
                      setStartError("");
                    }}
                    aria-pressed={
                      practiceMode === "Full"
                    }
                  >
                    Full Simulation
                  </button>

                  <button
                    type="button"
                    style={modeButtonStyle(
                      practiceMode === "Demo",
                      !canSelectMode ||
                        !allowDemoMode
                    )}
                    disabled={
                      !canSelectMode ||
                      !allowDemoMode
                    }
                    onClick={() => {
                      setPracticeMode("Demo");
                      setStartError("");
                    }}
                    aria-pressed={
                      practiceMode === "Demo"
                    }
                  >
                    Demo Mode
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{ color: "#64748b" }}
                    >
                      Selected Mode
                    </span>

                    <strong
                      style={{ color: "#1d4ed8" }}
                    >
                      {practiceMode === "Full"
                        ? "Full Simulation"
                        : "Demo Mode"}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginTop: "9px",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{ color: "#64748b" }}
                    >
                      Total Duration
                    </span>

                    <strong
                      style={{ color: "#0f172a" }}
                    >
                      {selectedDuration} min
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================
                OPTIONAL PROCTORING
            ================================== */}

            {mockTest.proctoringEnabled && (
              <div
                className="mock-proctoring-notice"
                style={{ marginTop: "16px" }}
              >
                <strong>
                  Optional AI Proctoring
                </strong>

                {hasActiveAttempt ? (
                  <span>
                    Proctoring for this session:{" "}
                    {attemptInfo.activeAttempt
                      ?.proctoringEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                ) : (
                  <>
                    <span>
                      Enable monitoring for a more
                      realistic assessment experience.
                    </span>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        marginTop: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: canSelectMode
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={enableProctoring}
                        disabled={!canSelectMode}
                        onChange={(event) =>
                          setEnableProctoring(
                            event.target.checked
                          )
                        }
                      />

                      Enable proctoring
                    </label>

                    <span
                      style={{
                        display: "block",
                        marginTop: "8px",
                        fontSize: "11px",
                      }}
                    >
                      Camera permission, fullscreen and
                      monitoring checks depend on the
                      configured assessment runner.
                      Enabling this option does not
                      automatically grant camera access.
                    </span>
                  </>
                )}
              </div>
            )}

            {/* ==================================
                EXISTING TEST INSTRUCTIONS
            ================================== */}

            {mockTest.instructions && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontSize: "12px",
                  }}
                >
                  Test Instructions
                </strong>

                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#64748b",
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                  }}
                >
                  {mockTest.instructions}
                </p>
              </div>
            )}

            {/* ==================================
                START ERROR
            ================================== */}

            {startError && (
              <div
                className="mock-details-error"
                style={{
                  marginTop: "14px",
                  padding: "10px 12px",
                  borderRadius: "9px",
                  fontSize: "11px",
                }}
              >
                {startError}
              </div>
            )}

            {/* ==================================
                RESUME OR START
            ================================== */}

            {hasActiveAttempt ? (
              <button
                type="button"
                className="mock-start-button"
                onClick={handleResumeMockTest}
              >
                Resume Assessment →
              </button>
            ) : (
              <button
                type="button"
                className="mock-start-button"
                disabled={!canStart}
                onClick={handleStartMockTest}
              >
                {starting
                  ? "Starting..."
                  : !attemptInfo?.canAttempt
                    ? unlimitedAttempts
                      ? "Unable to Start Assessment"
                      : "No Attempts Remaining"
                    : !selectedModeAvailable
                      ? "Selected Mode Unavailable"
                      : practiceMode === "Demo"
                        ? "Start Demo Assessment"
                        : "Start Full Simulation"}
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MockTestDetails;
