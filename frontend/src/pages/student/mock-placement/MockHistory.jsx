import React, { useEffect, useState } from "react";
import { useLocation, useNavigate,} from "react-router-dom";
import axios from "axios";

import "./MockHistory.css";

const API_BASE_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

const MockHistory = () => {
  const navigate = useNavigate();

  const location = useLocation();

const mockCompleted =
  location.state?.mockCompleted === true;

const completedMockAttempt =
  location.state?.completedMockAttempt || null;

const mockResult =
  location.state?.mockResult || null;

  const [summary, setSummary] =
    useState(null);

  const [attempts, setAttempts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadMockHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "placifyToken"
          );

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await axios.get(
            `${API_BASE_URL}/mock-history`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setSummary(
          response.data.summary || null
        );

        setAttempts(
          response.data.attempts || []
        );
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem(
            "placifyToken"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load mock placement history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMockHistory();
  }, [navigate]);

  const getResultClass = (result) => {
    const normalizedResult =
      String(result || "")
        .trim()
        .toLowerCase();

    if (normalizedResult === "passed") {
      return "passed";
    }

    if (normalizedResult === "failed") {
      return "failed";
    }

    return "pending";
  };

  const getRoundResult = (round) => {
    if (round?.passed === true) {
      return "Passed";
    }

    if (round?.passed === false) {
      return "Failed";
    }

    return "Pending";
  };

  const getSafePercentage = (
    percentage
  ) => {
    const numericPercentage =
      Number(percentage);

    if (
      Number.isNaN(numericPercentage) ||
      numericPercentage < 0
    ) {
      return 0;
    }

    if (numericPercentage > 100) {
      return 100;
    }

    return numericPercentage;
  };

  if (loading) {
    return (
      <div className="mock-history-loading">
        <div className="mock-history-loading-card">
          <div className="mock-history-spinner"></div>

          <span>
            Loading mock placement history...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-history-page">
      <div className="mock-history-container">

        <button
          type="button"
          className="mock-history-back"
          onClick={() =>
            navigate(
              "/student/mock-placement"
            )
          }
        >
          <span>←</span>
          Back to Mock Placement
        </button>

        <section className="mock-history-hero">
          <div className="mock-history-hero-content">
            <span className="mock-history-eyebrow">
              PLACIFY MOCK ASSESSMENTS
            </span>

            <h1>
              Mock Placement History
            </h1>

            <p>
              Review your placement assessment
              performance, compare round-wise
              scores and understand your progress
              across completed mock tests.
            </p>
          </div>

          <div
            className="mock-history-hero-icon"
            aria-hidden="true"
          >
            ↗
          </div>
        </section>

        {mockCompleted && (
          <section className="mock-history-completion-banner">
            <div className="mock-history-completion-icon">
              ✓
            </div>

            <div className="mock-history-completion-content">
              <span>
                ASSESSMENT SUBMITTED
              </span>

              <h2>
                Mock Placement Completed
              </h2>

              <p>
                Your assessment has been submitted
                successfully. Review your final result
                and round-wise performance below.
              </p>
            </div>

            <div className="mock-history-completion-result">
              <span>Final Result</span>

              <strong
                className={
                  (
                    mockResult?.status ||
                    mockResult?.result ||
                    completedMockAttempt?.result ||
                    "Completed"
                  )
                    .toString()
                    .toLowerCase() === "passed"
                    ? "passed"
                    : (
                        mockResult?.status ||
                        mockResult?.result ||
                        completedMockAttempt?.result ||
                        ""
                      )
                        .toString()
                        .toLowerCase() === "failed"
                      ? "failed"
                      : ""
                }
              >
                {mockResult?.status ||
                  mockResult?.result ||
                  completedMockAttempt?.result ||
                  "Completed"}
              </strong>
            </div>
          </section>
        )}

        {error && (
          <div className="mock-history-error">
            {error}
          </div>
        )}

        {!error && summary && (
          <>
            <div className="mock-history-section-header">
              <div className="mock-history-section-heading">
                <span>
                  PERFORMANCE OVERVIEW
                </span>

                <h2>
                  Your Assessment Summary
                </h2>

                <p>
                  A quick overview of your mock
                  placement performance.
                </p>
              </div>
            </div>

            <section className="mock-history-summary-grid">

              <article className="mock-history-summary-card">
                <span className="mock-history-summary-label">
                  Total Attempts
                </span>

                <strong className="mock-history-summary-value">
                  {summary.totalAttempts ?? 0}
                </strong>

                <span className="mock-history-summary-helper">
                  Assessments attempted
                </span>
              </article>

              <article className="mock-history-summary-card cyan">
                <span className="mock-history-summary-label">
                  Completed
                </span>

                <strong className="mock-history-summary-value">
                  {summary.completedAttempts ??
                    0}
                </strong>

                <span className="mock-history-summary-helper">
                  Assessments completed
                </span>
              </article>

              <article className="mock-history-summary-card success">
                <span className="mock-history-summary-label">
                  Passed
                </span>

                <strong className="mock-history-summary-value">
                  {summary.passedAttempts ?? 0}
                </strong>

                <span className="mock-history-summary-helper">
                  Successful attempts
                </span>
              </article>

              <article className="mock-history-summary-card danger">
                <span className="mock-history-summary-label">
                  Failed
                </span>

                <strong className="mock-history-summary-value">
                  {summary.failedAttempts ?? 0}
                </strong>

                <span className="mock-history-summary-helper">
                  Attempts to improve
                </span>
              </article>

              <article className="mock-history-summary-card warning">
                <span className="mock-history-summary-label">
                  Average Score
                </span>

                <strong className="mock-history-summary-value">
                  {summary.averageScore ?? 0}%
                </strong>

                <span className="mock-history-summary-helper">
                  Across completed tests
                </span>
              </article>

              <article className="mock-history-summary-card success">
                <span className="mock-history-summary-label">
                  Best Score
                </span>

                <strong className="mock-history-summary-value">
                  {summary.bestScore ?? 0}%
                </strong>

                <span className="mock-history-summary-helper">
                  Highest performance
                </span>
              </article>

            </section>
          </>
        )}

        {!error && (
          <>
            <div className="mock-history-section-header">
              <div className="mock-history-section-heading">
                <span>
                  ASSESSMENT HISTORY
                </span>

                <h2>
                  Previous Mock Attempts
                </h2>

                <p>
                  Review overall results and
                  round-wise performance for each
                  mock placement assessment.
                </p>
              </div>
            </div>

            {attempts.length === 0 ? (
              <div className="mock-history-empty">
                <div className="mock-history-empty-icon">
                  ◎
                </div>

                <h3>
                  No mock attempts yet
                </h3>

                <p>
                  Complete a mock placement
                  assessment and your performance
                  history will appear here.
                </p>
              </div>
            ) : (
              <section className="mock-history-attempts">

                {attempts.map((attempt) => {
                  const result =
                    attempt.result ||
                    "Pending";

                  const resultClass =
                    getResultClass(result);

                  const overallPercentage =
                    getSafePercentage(
                      attempt.overallPercentage
                    );

                  const roundResults =
                    Array.isArray(
                      attempt.roundResults
                    )
                      ? attempt.roundResults
                      : [];

                  return (
                    <article
                      key={attempt._id}
                      className="mock-history-attempt-card"
                    >

                      <header className="mock-history-attempt-header">

                        <div className="mock-history-attempt-title-area">

                          <div className="mock-history-company-row">

                            <span className="mock-history-company-badge">
                              {attempt.mockTest
                                ?.companyName ||
                                "Company"}
                            </span>

                            <span className="mock-history-difficulty-badge">
                              {attempt.mockTest
                                ?.difficulty ||
                                "Difficulty"}
                            </span>

                          </div>

                          <h3 className="mock-history-attempt-title">
                            {attempt.mockTest
                              ?.title ||
                              "Mock Placement Test"}
                          </h3>

                        </div>

                        <div className="mock-history-attempt-status">

                          <span
                            className={`mock-history-status-badge ${resultClass}`}
                          >
                            {result}
                          </span>

                        </div>

                      </header>

                      <div className="mock-history-score-grid">

                        <div className="mock-history-score-item">
                          <span>
                            Assessment Status
                          </span>

                          <strong>
                            {attempt.status ||
                              "-"}
                          </strong>
                        </div>

                        <div className="mock-history-score-item">
                          <span>
                            Total Score
                          </span>

                          <strong>
                            {attempt.totalScore ??
                              0}{" "}
                            /{" "}
                            {attempt.totalMarks ??
                              0}
                          </strong>
                        </div>

                        <div className="mock-history-score-item">
                          <span>
                            Overall Percentage
                          </span>

                          <strong>
                            {attempt.overallPercentage ??
                              0}
                            %
                          </strong>
                        </div>

                        <div className="mock-history-score-item">
                          <span>
                            Total Rounds
                          </span>

                          <strong>
                            {roundResults.length}
                          </strong>
                        </div>

                      </div>

                      <div className="mock-history-overall-progress">

                        <div className="mock-history-progress-top">
                          <span>
                            Overall Performance
                          </span>

                          <strong>
                            {attempt.overallPercentage ??
                              0}
                            %
                          </strong>
                        </div>

                        <div className="mock-history-progress-track">
                          <div
                            className={`mock-history-progress-fill ${resultClass}`}
                            style={{
                              width:
                                `${overallPercentage}%`,
                            }}
                          ></div>
                        </div>

                      </div>

                      {roundResults.length >
                        0 && (
                        <section className="mock-history-round-section">

                          <div className="mock-history-round-heading">
                            <h3>
                              Round Performance
                            </h3>

                            <span>
                              {
                                roundResults.length
                              }{" "}
                              {roundResults.length ===
                              1
                                ? "round"
                                : "rounds"}
                            </span>
                          </div>

                          <div className="mock-history-round-grid">

                            {roundResults.map(
                              (
                                round,
                                index
                              ) => {
                                const roundResult =
                                  getRoundResult(
                                    round
                                  );

                                const roundResultClass =
                                  getResultClass(
                                    roundResult
                                  );

                                const roundPercentage =
                                  getSafePercentage(
                                    round.percentage
                                  );

                                return (
                                  <article
                                    key={`${attempt._id}-${round.roundName}-${index}`}
                                    className="mock-history-round-card"
                                  >

                                    <div className="mock-history-round-card-top">

                                      <div className="mock-history-round-info">
                                        <h4>
                                          {round.roundName ||
                                            `Round ${
                                              index +
                                              1
                                            }`}
                                        </h4>

                                        <span>
                                          {round.roundType ||
                                            "Assessment"}
                                        </span>
                                      </div>

                                      <span
                                        className={`mock-history-round-result ${roundResultClass}`}
                                      >
                                        {
                                          roundResult
                                        }
                                      </span>

                                    </div>

                                    <div className="mock-history-round-score-row">

                                      <div className="mock-history-round-score">
                                        <strong>
                                          {round.score ??
                                            0}{" "}
                                          /{" "}
                                          {round.totalMarks ??
                                            0}
                                        </strong>

                                        <span>
                                          SCORE
                                        </span>
                                      </div>

                                      <div className="mock-history-round-percentage">
                                        {round.percentage ??
                                          0}
                                        %
                                      </div>

                                    </div>

                                    <div className="mock-history-round-progress">
                                      <div
                                        style={{
                                          width:
                                            `${roundPercentage}%`,
                                        }}
                                      ></div>
                                    </div>

                                  </article>
                                );
                              }
                            )}

                          </div>

                        </section>
                      )}

                    </article>
                  );
                })}

              </section>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default MockHistory;