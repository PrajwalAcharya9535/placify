import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MockTestDetails.css";

const API_BASE_URL = "http://localhost:5000/api/student";

const MockTestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mockTest, setMockTest] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  // ==============================
  // FETCH MOCK TEST DETAILS
  // ==============================
  useEffect(() => {
    const fetchMockTestDetails = async () => {
      try {
        setLoading(true);
        setError("");

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

        setMockTest(response.data.mockTest);
        setAttemptInfo(response.data.attemptInfo);
      } catch (err) {
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
        setLoading(false);
      }
    };

    fetchMockTestDetails();
  }, [id, navigate]);

  // ==============================
  // START MOCK TEST
  // ==============================
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
        {},
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

      setStartError(
        err.response?.data?.message ||
          "Failed to start mock placement test."
      );
    } finally {
      setStarting(false);
    }
  };

  // ==============================
  // RESUME ACTIVE MOCK TEST
  // ==============================
  const handleResumeMockTest = () => {
    const activeAttempt =
      attemptInfo?.activeAttempt;

    const currentRound =
      attemptInfo?.currentRound;

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

  // ==============================
  // LOADING
  // ==============================
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

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return (
      <div className="mock-details-page">
        <div className="mock-details-container">
          <div className="mock-details-error">
            {error}
          </div>
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

  // ==============================
  // SORT ROUNDS
  // ==============================
  const sortedRounds = [
    ...(mockTest.rounds || []),
  ].sort(
    (a, b) =>
      (a.order || 0) - (b.order || 0)
  );

  const hasActiveAttempt =
    Boolean(
      attemptInfo?.hasActiveAttempt &&
        attemptInfo?.activeAttempt
    );

  // ==============================
  // UI
  // ==============================
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
                {mockTest.companyName ||
                  "Placement"}
              </span>

              <span>
                {mockTest.difficulty ||
                  "Assessment"}
              </span>

              {mockTest.proctoringEnabled && (
                <span>Proctored</span>
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
            <strong>
              {sortedRounds.length}
            </strong>
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
              {attemptInfo?.attemptsRemaining ?? 0}
            </strong>
          </div>
        </section>

        <div className="mock-details-layout">

          {/* ROUNDS */}
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
                  No rounds configured for this mock
                  test.
                </div>
              ) : (
                sortedRounds.map(
                  (round, index) => (
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
                                `Round ${
                                  index + 1
                                }`}
                            </h3>

                            <span>
                              {round.roundType ||
                                "Assessment"}
                            </span>
                          </div>

                          <strong>
                            {round.totalMarks ?? 0}{" "}
                            Marks
                          </strong>
                        </div>

                        <div className="mock-round-meta">
                          <span>
                            Duration:{" "}
                            <b>
                              {round.durationMinutes ??
                                0}{" "}
                              min
                            </b>
                          </span>

                          {round.numberOfQuestions !=
                            null && (
                            <span>
                              Questions:{" "}
                              <b>
                                {
                                  round.numberOfQuestions
                                }
                              </b>
                            </span>
                          )}

                          <span>
                            Pass:{" "}
                            <b>
                              {round.passingPercentage ??
                                0}
                              %
                            </b>
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                )
              )}
            </div>
          </section>

          {/* ATTEMPT PANEL */}
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
                : "Once started, complete the placement rounds in the configured order."}
            </p>

            <div className="mock-attempt-info">
              <div>
                <span>Maximum Attempts</span>

                <strong>
                  {attemptInfo?.maxAttempts ??
                    mockTest.maxAttempts ??
                    0}
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
                  {attemptInfo?.attemptsRemaining ??
                    0}
                </strong>
              </div>
            </div>

            {/* ACTIVE ROUND */}
            {hasActiveAttempt &&
              attemptInfo?.currentRound && (
                <div className="mock-proctoring-notice">
                  <strong>
                    Current Round
                  </strong>

                  <span>
                    {attemptInfo.currentRound
                      .roundName ||
                      "Assessment Round"}
                    {" • "}
                    {attemptInfo.currentRound
                      .roundType ||
                      "Assessment"}
                  </span>
                </div>
              )}

            {mockTest.proctoringEnabled && (
              <div className="mock-proctoring-notice">
                <strong>
                  Proctored Assessment
                </strong>

                <span>
                  Proctoring rules are enabled for
                  this mock placement test.
                </span>
              </div>
            )}

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

            {/* RESUME OR START */}
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
                disabled={
                  !attemptInfo?.canAttempt ||
                  starting
                }
                onClick={handleStartMockTest}
              >
                {starting
                  ? "Starting..."
                  : attemptInfo?.canAttempt
                    ? "Start Mock Test"
                    : "No Attempts Remaining"}
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MockTestDetails;