import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentPractice.css";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

function StudentPractice() {
  const navigate = useNavigate();

  const [performance, setPerformance] = useState({
    overall: {
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: 0,
      marksObtained: 0,
      totalMarks: 0,
      averageTimeSeconds: 0,
    },
    categoryPerformance: [],
    weakAreas: [],
    strengths: [],
  });

  const [sessionSummary, setSessionSummary] = useState({
    totalSessions: 0,
    completedSessions: 0,
    inProgressSessions: 0,
    averageAccuracy: 0,
  });

  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("placifyToken");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const fetchPracticeData = async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [performanceResponse, sessionsResponse] =
        await Promise.all([
          axios.get(
            `${API_BASE}/practice/performance`,
            authConfig
          ),
          axios.get(
            `${API_BASE}/practice/session/history`,
            authConfig
          ),
        ]);

      setPerformance({
        overall: performanceResponse.data?.overall || {
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          marksObtained: 0,
          totalMarks: 0,
          averageTimeSeconds: 0,
        },

        categoryPerformance:
          performanceResponse.data?.categoryPerformance || [],

        weakAreas:
          performanceResponse.data?.weakAreas || [],

        strengths:
          performanceResponse.data?.strengths || [],
      });

      setSessionSummary(
        sessionsResponse.data?.summary || {
          totalSessions: 0,
          completedSessions: 0,
          inProgressSessions: 0,
          averageAccuracy: 0,
        }
      );

      setSessions(sessionsResponse.data?.sessions || []);
    } catch (err) {
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
        err.response?.data?.message ||
          "Unable to load Practice Center."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeData();
  }, []);

  const formatTime = (seconds = 0) => {
    const totalSeconds = Number(seconds) || 0;

    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="practice-state">
          <div className="practice-loader"></div>

          <h2>Loading Practice Center</h2>

          <p>
            Preparing your practice performance and activities...
          </p>
        </div>
      </StudentLayout>
    );
  }

  if (error && !sessions.length) {
    return (
      <StudentLayout>
        <div className="practice-state practice-error">
          <div className="practice-error-icon">!</div>

          <h2>Unable to load Practice Center</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchPracticeData}
          >
            Try Again
          </button>
        </div>
      </StudentLayout>
    );
  }

  const overall = performance.overall;

  return (
    <StudentLayout>
      <div className="student-practice-page">

        {/* =========================
            PAGE HEADER
        ========================== */}

        <section className="practice-page-header">
          <div>
            <span className="practice-eyebrow">
              PREPARATION CENTER
            </span>

            <h1>Practice Center</h1>

            <p>
              Strengthen your placement skills through
              assessments, coding, SQL and debugging practice.
            </p>
          </div>

          <div className="practice-header-badge">
            <span>PLACIFY PRACTICE</span>

            <strong>
              Practice → Analyze → Improve
            </strong>
          </div>
        </section>

        {/* =========================
            PERFORMANCE SUMMARY
        ========================== */}

        <section className="practice-summary">
          <article className="practice-summary-card">
            <div className="practice-summary-icon blue">
              T
            </div>

            <div>
              <span>Total Attempts</span>

              <strong>{overall.totalAttempts}</strong>

              <small>
                Questions attempted
              </small>
            </div>
          </article>

          <article className="practice-summary-card">
            <div className="practice-summary-icon green">
              ✓
            </div>

            <div>
              <span>Correct</span>

              <strong>{overall.correctAttempts}</strong>

              <small>
                Correct answers
              </small>
            </div>
          </article>

          <article className="practice-summary-card">
            <div className="practice-summary-icon cyan">
              %
            </div>

            <div>
              <span>Accuracy</span>

              <strong>{overall.accuracy}%</strong>

              <small>
                Overall performance
              </small>
            </div>
          </article>

          <article className="practice-summary-card">
            <div className="practice-summary-icon purple">
              ◷
            </div>

            <div>
              <span>Average Time</span>

              <strong>
                {formatTime(overall.averageTimeSeconds)}
              </strong>

              <small>
                Per attempted question
              </small>
            </div>
          </article>
        </section>

        {error && (
          <div className="practice-inline-error">
            {error}
          </div>
        )}

        {/* =========================
            PRACTICE MODES
        ========================== */}

        <section className="practice-section">
          <div className="practice-section-heading">
            <div>
              <span>CHOOSE YOUR PRACTICE</span>

              <h2>Practice Environment</h2>

              <p>
                Choose a practice mode and improve the skills
                required for placement rounds.
              </p>
            </div>
          </div>

          <div className="practice-mode-grid">

            <article className="practice-mode-card practice-featured">
              <div className="practice-mode-top">
                <div className="practice-mode-icon blue">
                  ✓
                </div>

                <span className="practice-mode-badge">
                  ASSESSMENT
                </span>
              </div>

              <h3>MCQ Practice</h3>

              <p>
                Practice aptitude, reasoning, verbal and
                technical questions with timed sessions.
              </p>

              <div className="practice-mode-meta">
                <span>
                  {sessionSummary.totalSessions} Sessions
                </span>

                <span>
                  {sessionSummary.averageAccuracy}% Avg.
                  Accuracy
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/practice/mcq")
                }
              >
                Start Practice
                <span>→</span>
              </button>
            </article>

            <article className="practice-mode-card">
              <div className="practice-mode-top">
                <div className="practice-mode-icon cyan">
                  &lt;/&gt;
                </div>

                <span className="practice-mode-badge">
                  PROGRAMMING
                </span>
              </div>

              <h3>Coding Lab</h3>

              <p>
                Solve programming problems and validate your
                solutions against test cases.
              </p>

              <div className="practice-mode-meta">
                <span>Code Execution</span>
                <span>Test Cases</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/practice/coding")
                }
              >
                Open Coding Lab
                <span>→</span>
              </button>
            </article>

            <article className="practice-mode-card">
              <div className="practice-mode-top">
                <div className="practice-mode-icon purple">
                  DB
                </div>

                <span className="practice-mode-badge">
                  DATABASE
                </span>
              </div>

              <h3>SQL Lab</h3>

              <p>
                Practice SQL queries using placement-oriented
                database problems and scenarios.
              </p>

              <div className="practice-mode-meta">
                <span>SQL Queries</span>
                <span>Instant Evaluation</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/practice/sql")
                }
              >
                Open SQL Lab
                <span>→</span>
              </button>
            </article>

            <article className="practice-mode-card">
              <div className="practice-mode-top">
                <div className="practice-mode-icon orange">
                  !
                </div>

                <span className="practice-mode-badge">
                  DEBUGGING
                </span>
              </div>

              <h3>Debugging Lab</h3>

              <p>
                Identify programming errors, fix broken code
                and strengthen your debugging skills.
              </p>

              <div className="practice-mode-meta">
                <span>Find Errors</span>
                <span>Fix Code</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/practice/debugging")
                }
              >
                Start Debugging
                <span>→</span>
              </button>
            </article>

          </div>
        </section>

        {/* =========================
            PERFORMANCE INSIGHTS
        ========================== */}

        <section className="practice-insight-grid">

          <article className="practice-insight-card">
            <div className="practice-insight-heading">
              <div>
                <span>PERFORMANCE</span>
                <h2>Category Performance</h2>
              </div>

              <strong>
                {overall.accuracy}%
              </strong>
            </div>

            {performance.categoryPerformance.length > 0 ? (
              <div className="category-performance-list">
                {performance.categoryPerformance.map(
                  (item) => (
                    <div
                      className="category-performance-item"
                      key={item.category}
                    >
                      <div className="category-performance-copy">
                        <div>
                          <strong>{item.category}</strong>

                          <span>
                            {item.totalAttempts} attempts
                          </span>
                        </div>

                        <strong>
                          {item.accuracy}%
                        </strong>
                      </div>

                      <div className="category-performance-track">
                        <div
                          style={{
                            width: `${Math.min(
                              item.accuracy,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="practice-small-empty">
                <strong>No performance data yet</strong>

                <p>
                  Complete practice questions to see your
                  category-wise performance.
                </p>
              </div>
            )}
          </article>

          <article className="practice-insight-card">
            <div className="practice-insight-heading">
              <div>
                <span>SKILL INSIGHTS</span>
                <h2>Strengths & Weak Areas</h2>
              </div>
            </div>

            <div className="practice-skill-insight">
              <div className="practice-strength-block">
                <span className="practice-insight-label">
                  Strengths
                </span>

                {performance.strengths.length > 0 ? (
                  <div className="practice-tag-list">
                    {performance.strengths.map((item) => (
                      <span
                        className="practice-tag strength"
                        key={item}
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>
                    Reach 80%+ accuracy in a category to
                    establish a strength.
                  </p>
                )}
              </div>

              <div className="practice-weak-block">
                <span className="practice-insight-label">
                  Needs Improvement
                </span>

                {performance.weakAreas.length > 0 ? (
                  <div className="practice-tag-list">
                    {performance.weakAreas.map((item) => (
                      <span
                        className="practice-tag weakness"
                        key={item}
                      >
                        ↑ {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>
                    No weak areas identified from your
                    current attempts.
                  </p>
                )}
              </div>
            </div>
          </article>

        </section>

        {/* =========================
            RECENT SESSIONS
        ========================== */}

        <section className="practice-section">
          <div className="practice-section-heading">
            <div>
              <span>PRACTICE HISTORY</span>

              <h2>Recent Sessions</h2>

              <p>
                Review your latest timed practice sessions
                and performance.
              </p>
            </div>

            <div className="practice-session-stats">
              <span>
                {sessionSummary.completedSessions} Completed
              </span>

              <span>
                {sessionSummary.inProgressSessions} In Progress
              </span>
            </div>
          </div>

          {sessions.length > 0 ? (
            <div className="practice-session-list">
              {sessions.slice(0, 5).map((session) => (
                <article
                  className="practice-session-item"
                  key={session._id}
                >
                  <div className="practice-session-main">
                    <div className="practice-session-icon">
                      ✓
                    </div>

                    <div>
                      <strong>
                        {session.title || "Practice Session"}
                      </strong>

                      <span>
                        {session.category} •{" "}
                        {session.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="practice-session-detail">
                    <span>Questions</span>
                    <strong>
                      {session.totalQuestions || 0}
                    </strong>
                  </div>

                  <div className="practice-session-detail">
                    <span>Score</span>
                    <strong>
                      {session.marksObtained || 0}/
                      {session.totalMarks || 0}
                    </strong>
                  </div>

                  <div className="practice-session-detail">
                    <span>Accuracy</span>
                    <strong>
                      {session.accuracy || 0}%
                    </strong>
                  </div>

                  <span
                    className={`practice-session-status ${
                      session.status === "Completed"
                        ? "completed"
                        : "progress"
                    }`}
                  >
                    {session.status}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="practice-empty">
              <div className="practice-empty-icon">
                ✓
              </div>

              <h3>No practice sessions yet</h3>

              <p>
                Start your first MCQ practice session to
                begin tracking your performance.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/practice/mcq")
                }
              >
                Start First Practice
              </button>
            </div>
          )}
        </section>

      </div>
    </StudentLayout>
  );
}

export default StudentPractice;