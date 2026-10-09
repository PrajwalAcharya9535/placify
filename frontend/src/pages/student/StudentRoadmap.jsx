    import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../components/student/StudentLayout";

import "./StudentRoadmap.css";

function StudentRoadmap() {
  const navigate = useNavigate();

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH PERSONALIZED ROADMAP
  // ==========================================

  useEffect(() => {
    const fetchRoadmap = async () => {
      const token =
        localStorage.getItem("placifyToken");

      if (!token) {
        navigate("/login", {
          replace: true,
        });

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://localhost:5000/api/student/roadmap",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setRoadmapData(
          response.data?.roadmap || null
        );
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem(
            "placifyToken"
          );

          localStorage.removeItem(
            "placifyUser"
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your personalized roadmap."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [navigate]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <StudentLayout>
        <div className="roadmap-state">
          <div className="roadmap-loader"></div>

          <h2>
            Building your personalized roadmap
          </h2>

          <p>
            Placify is analyzing your skill gaps,
            learning progress and preparation
            performance.
          </p>
        </div>
      </StudentLayout>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <StudentLayout>
        <div className="roadmap-state roadmap-error-state">
          <div className="roadmap-state-icon">
            !
          </div>

          <h2>
            Unable to load roadmap
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </StudentLayout>
    );
  }

  if (!roadmapData) {
    return null;
  }

  // ==========================================
  // ROADMAP DATA
  // ==========================================

  const {
    targetRole,
    generatedFrom = {},
    summary = {},
    actionSummary = {},
    roadmap = [],
  } = roadmapData;

  const overallProgress =
    summary?.overallProgress ?? 0;

  const totalTopics =
    summary?.totalRecommendedTopics ?? 0;

  const completedTopics =
    summary?.completedRecommendedTopics ?? 0;

  const totalSteps =
    summary?.totalSteps ?? roadmap.length;

  const highPrioritySteps =
    summary?.highPrioritySteps ?? 0;

  const mediumPrioritySteps =
    summary?.mediumPrioritySteps ?? 0;

  const availableActions =
    summary?.availableActions ?? 0;

  const unavailableActions =
    summary?.unavailableActions ?? 0;

  const missingSkills =
    generatedFrom?.missingSkills ?? 0;

  const weakAreas =
    generatedFrom?.weakAreas ?? 0;

  const priorityAreas =
    generatedFrom?.priorityAreas ?? 0;

  const strongAreas =
    generatedFrom?.strongAreas ?? [];

  // ==========================================
  // HELPERS
  // ==========================================

  const handleAction = (step) => {
    if (
      step?.isAvailable &&
      step?.destination
    ) {
      navigate(step.destination);
    }
  };

  const getPriorityClass = (priority) => {
    if (priority === "High") {
      return "roadmap-priority-high";
    }

    if (priority === "Medium") {
      return "roadmap-priority-medium";
    }

    return "roadmap-priority-low";
  };

  const getActionShortName = (
    actionType
  ) => {
    const labels = {
      Learning: "L",
      Practice: "P",
      Coding: "C",
      SQL: "SQL",
      Debugging: "D",
      "Mock Placement": "M",
      Interview: "I",
      "Group Discussion": "GD",
      Improvement: "+",
    };

    return labels[actionType] || "R";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <StudentLayout>
      <div className="student-roadmap-page">

        {/* ==================================
            HEADER
        ================================== */}

        <section className="roadmap-header">
          <div>
            <span className="roadmap-eyebrow">
              PERSONALIZED ROADMAP
            </span>

            <h1>
              Your path to placement readiness
            </h1>

            <p>
              Follow a preparation plan generated
              from your current skill gaps,
              performance and learning progress.
            </p>
          </div>

          <div className="roadmap-target-card">
            <span>Target Role</span>

            <strong>
              {targetRole ||
                "Career goal not set"}
            </strong>

            <small>
              Adaptive preparation plan
            </small>
          </div>
        </section>

        {/* ==================================
            PROGRESS HERO
        ================================== */}

        <section className="roadmap-progress-hero">
          <div className="roadmap-progress-copy">
            <span className="roadmap-progress-label">
              ROADMAP PROGRESS
            </span>

            <h2>
              Keep moving through your
              recommended preparation steps.
            </h2>

            <p>
              Your roadmap automatically reflects
              your latest learning progress and
              preparation performance.
            </p>

            <div className="roadmap-progress-bar">
              <div
                className="roadmap-progress-fill"
                style={{
                  width: `${Math.min(
                    Math.max(
                      overallProgress,
                      0
                    ),
                    100
                  )}%`,
                }}
              ></div>
            </div>

            <div className="roadmap-progress-meta">
              <span>
                {completedTopics} of{" "}
                {totalTopics} recommended topics
                completed
              </span>

              <strong>
                {overallProgress}%
              </strong>
            </div>
          </div>

          <div className="roadmap-progress-score">
            <div
              className="roadmap-progress-ring"
              style={{
                "--roadmap-progress": `${Math.min(
                  Math.max(
                    overallProgress,
                    0
                  ),
                  100
                ) * 3.6}deg`,
              }}
            >
              <div className="roadmap-progress-ring-inner">
                <strong>
                  {overallProgress}%
                </strong>

                <span>Complete</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================
            SUMMARY
        ================================== */}

        <section className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <span>Total Steps</span>

            <strong>
              {totalSteps}
            </strong>

            <p>
              Personalized preparation steps
            </p>
          </article>

          <article className="roadmap-summary-card">
            <span>High Priority</span>

            <strong>
              {highPrioritySteps}
            </strong>

            <p>
              Areas requiring attention first
            </p>
          </article>

          <article className="roadmap-summary-card">
            <span>Available Actions</span>

            <strong>
              {availableActions}
            </strong>

            <p>
              Activities ready to start
            </p>
          </article>

          <article className="roadmap-summary-card">
            <span>Learning Topics</span>

            <strong>
              {completedTopics}/{totalTopics}
            </strong>

            <p>
              Recommended topics completed
            </p>
          </article>
        </section>

        {/* ==================================
            INSIGHT STRIP
        ================================== */}

        <section className="roadmap-insight-strip">
          <div>
            <span>Missing Skills</span>
            <strong>{missingSkills}</strong>
          </div>

          <div>
            <span>Weak Areas</span>
            <strong>{weakAreas}</strong>
          </div>

          <div>
            <span>Priority Areas</span>
            <strong>{priorityAreas}</strong>
          </div>

          <div>
            <span>Medium Priority</span>
            <strong>
              {mediumPrioritySteps}
            </strong>
          </div>

          <div>
            <span>Future Actions</span>
            <strong>
              {unavailableActions}
            </strong>
          </div>
        </section>

        {/* ==================================
            MAIN ROADMAP
        ================================== */}

        <section className="roadmap-content-grid">

          {/* ROADMAP STEPS */}

          <div className="roadmap-main-column">
            <div className="roadmap-section-heading">
              <div>
                <span className="roadmap-eyebrow">
                  YOUR PREPARATION PLAN
                </span>

                <h2>
                  Recommended Roadmap
                </h2>

                <p>
                  Complete higher-priority steps
                  first and continue improving
                  through Placify activities.
                </p>
              </div>

              <span className="roadmap-step-count">
                {totalSteps} Steps
              </span>
            </div>

            {roadmap.length > 0 ? (
              <div className="roadmap-step-list">
                {roadmap.map((step) => {
                  const topics =
                    step?.topics || [];

                  const visibleTopics =
                    topics.slice(0, 4);

                  const remainingTopics =
                    Math.max(
                      topics.length -
                        visibleTopics.length,
                      0
                    );

                  return (
                    <article
                      className="roadmap-step-card"
                      key={
                        step.stepNumber ||
                        `${step.focusArea}-${step.actionType}`
                      }
                    >
                      <div className="roadmap-step-marker">
                        <span>
                          {String(
                            step.stepNumber
                          ).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="roadmap-step-body">
                        <div className="roadmap-step-top">
                          <div>
                            <div className="roadmap-step-badges">
                              <span
                                className={`roadmap-priority-badge ${getPriorityClass(
                                  step.priority
                                )}`}
                              >
                                {step.priority} Priority
                              </span>

                              <span className="roadmap-source-badge">
                                {step.sources?.[0] ||
                                  "Recommendation"}
                              </span>
                            </div>

                            <h3>
                              {step.focusArea}
                            </h3>
                          </div>

                          <div className="roadmap-action-type">
                            <span>
                              {getActionShortName(
                                step.actionType
                              )}
                            </span>

                            <div>
                              <small>
                                Action
                              </small>

                              <strong>
                                {step.actionType}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {step.reasons?.length >
                          0 && (
                          <p className="roadmap-step-reason">
                            {step.reasons[0]}
                          </p>
                        )}

                        {topics.length > 0 && (
                          <div className="roadmap-topic-area">
                            <div className="roadmap-topic-heading">
                              <span>
                                Recommended Learning
                              </span>

                              <strong>
                                {
                                  step.completedTopics
                                }
                                /{step.totalTopics}{" "}
                                completed
                              </strong>
                            </div>

                            <div className="roadmap-topic-list">
                              {visibleTopics.map(
                                (topic) => (
                                  <div
                                    className={`roadmap-topic-item ${
                                      topic.status ===
                                      "Completed"
                                        ? "completed"
                                        : ""
                                    }`}
                                    key={
                                      topic.topicId
                                    }
                                  >
                                    <span className="roadmap-topic-status">
                                      {topic.status ===
                                      "Completed"
                                        ? "✓"
                                        : "○"}
                                    </span>

                                    <div>
                                      <strong>
                                        {
                                          topic.title
                                        }
                                      </strong>

                                      <small>
                                        {
                                          topic.difficulty
                                        }
                                        {" • "}
                                        {
                                          topic.estimatedMinutes
                                        }{" "}
                                        min
                                      </small>
                                    </div>

                                    <span className="roadmap-topic-progress">
                                      {
                                        topic.progressPercentage
                                      }
                                      %
                                    </span>
                                  </div>
                                )
                              )}
                            </div>

                            {remainingTopics >
                              0 && (
                              <div className="roadmap-more-topics">
                                +{remainingTopics} more
                                recommended topic
                                {remainingTopics >
                                1
                                  ? "s"
                                  : ""}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="roadmap-step-footer">
                          <div className="roadmap-step-progress">
                            <div>
                              <span>
                                Step Progress
                              </span>

                              <strong>
                                {
                                  step.progressPercentage
                                }
                                %
                              </strong>
                            </div>

                            <div className="roadmap-mini-progress">
                              <span
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      step.progressPercentage ||
                                        0,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              ></span>
                            </div>
                          </div>

                          {step.isAvailable &&
                          step.destination ? (
                            <button
                              type="button"
                              className="roadmap-action-button"
                              onClick={() =>
                                handleAction(
                                  step
                                )
                              }
                            >
                              {step.actionLabel}
                              <span>→</span>
                            </button>
                          ) : (
                            <div className="roadmap-coming-soon">
                              <span>
                                Recommended
                              </span>

                              <small>
                                Activity page
                                coming later
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="roadmap-empty-state">
                <strong>
                  No roadmap steps yet
                </strong>

                <p>
                  Complete your profile, career
                  goal and preparation activities
                  to generate personalized
                  recommendations.
                </p>
              </div>
            )}
          </div>

          {/* ==================================
              SIDE COLUMN
          ================================== */}

          <aside className="roadmap-side-column">

            {/* ACTION MIX */}

            <article className="roadmap-side-card">
              <div className="roadmap-side-heading">
                <span className="roadmap-side-icon">
                  A
                </span>

                <div>
                  <h3>
                    Preparation Mix
                  </h3>

                  <p>
                    Recommended activity types
                  </p>
                </div>
              </div>

              <div className="roadmap-action-summary">
                {Object.entries(
                  actionSummary
                )
                  .filter(
                    ([, count]) =>
                      count > 0
                  )
                  .map(
                    ([
                      action,
                      count,
                    ]) => (
                      <div
                        key={action}
                        className="roadmap-action-summary-item"
                      >
                        <span>
                          {action}
                        </span>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    )
                  )}
              </div>
            </article>

            {/* STRENGTHS */}

            <article className="roadmap-side-card">
              <div className="roadmap-side-heading">
                <span className="roadmap-side-icon">
                  S
                </span>

                <div>
                  <h3>
                    Strong Areas
                  </h3>

                  <p>
                    Areas currently performing
                    well
                  </p>
                </div>
              </div>

              {strongAreas.length > 0 ? (
                <div className="roadmap-strength-tags">
                  {strongAreas.map(
                    (area, index) => (
                      <span
                        key={`${String(
                          area
                        )}-${index}`}
                      >
                        {typeof area ===
                        "string"
                          ? area
                          : area?.name ||
                            area?.category ||
                            "Strong Area"}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <div className="roadmap-side-empty">
                  Complete more activities to
                  identify strong areas.
                </div>
              )}
            </article>

            {/* HOW IT WORKS */}

            <article className="roadmap-side-card">
              <div className="roadmap-side-heading">
                <span className="roadmap-side-icon">
                  ?
                </span>

                <div>
                  <h3>
                    How It Adapts
                  </h3>

                  <p>
                    Your roadmap is dynamic
                  </p>
                </div>
              </div>

              <div className="roadmap-how-list">
                <div>
                  <span>1</span>

                  <p>
                    Placify analyzes your skill
                    gaps and performance.
                  </p>
                </div>

                <div>
                  <span>2</span>

                  <p>
                    Relevant learning and
                    practice activities are
                    prioritized.
                  </p>
                </div>

                <div>
                  <span>3</span>

                  <p>
                    Progress updates as you
                    complete recommended
                    activities.
                  </p>
                </div>
              </div>
            </article>

            {/* QUICK LINKS */}

            <article className="roadmap-side-card">
              <div className="roadmap-side-heading">
                <span className="roadmap-side-icon">
                  +
                </span>

                <div>
                  <h3>
                    Quick Preparation
                  </h3>

                  <p>
                    Jump into Placify modules
                  </p>
                </div>
              </div>

              <div className="roadmap-quick-links">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/learning"
                    )
                  }
                >
                  Learning
                  <span>›</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/practice"
                    )
                  }
                >
                  Practice
                  <span>›</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/practice/coding"
                    )
                  }
                >
                  Coding Lab
                  <span>›</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/mock-placement"
                    )
                  }
                >
                  Mock Placement
                  <span>›</span>
                </button>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </StudentLayout>
  );
}

export default StudentRoadmap;