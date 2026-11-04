import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../components/student/StudentLayout";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("placifyToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          "http://localhost:5000/api/student/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDashboard(response.data);
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
            "Unable to load your Placify dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="dashboard-state">
          <div className="dashboard-loader"></div>

          <h2>Loading your dashboard</h2>

          <p>
            Preparing your placement progress and insights...
          </p>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="dashboard-state dashboard-error-state">
          <div className="dashboard-state-icon">!</div>

          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </StudentLayout>
    );
  }

  if (!dashboard) {
    return null;
  }

  const {
    student,
    profile,
    skills = [],
    goal,
    readiness,
    learning,
    practice,
    interview,
    gd,
    placementTracker,
    skillGap,
    summary,
  } = dashboard;

  const readinessScore =
    summary?.overallReadinessScore ??
    readiness?.overallScore ??
    0;

  const learningCompleted =
    learning?.completedTopics ?? 0;

  const learningStarted =
    learning?.totalStarted ?? 0;

  const learningProgress =
    learning?.averageProgress ?? 0;

  const practiceAttempts =
    practice?.totalAttempts ?? 0;

  const practiceAccuracy =
    practice?.accuracy ?? 0;

  const interviewSessions =
    interview?.totalSessions ?? 0;

  const interviewScore =
    interview?.averageScore ?? 0;

  const gdSessions =
    gd?.totalSessions ?? 0;

  const gdScore =
    gd?.averageScore ?? 0;

  const totalApplications =
    placementTracker?.totalApplications ?? 0;

  const activeApplications =
    placementTracker?.activeApplications ?? 0;

  const placedApplications =
    placementTracker?.placedApplications ?? 0;

  const missingSkills =
    skillGap?.missingSkills ?? [];

  const priorityAreas =
    skillGap?.priorityAreas ?? [];

  const strengths =
    practice?.strengths ?? [];

  const weakAreas =
    practice?.weakAreas ?? [];

  const firstName =
    student?.name?.split(" ")[0] || "Student";

  const readinessMessage =
    readinessScore >= 80
      ? "Excellent progress. You're approaching placement-ready status."
      : readinessScore >= 60
      ? "Good progress. Keep improving your weaker preparation areas."
      : readinessScore >= 40
      ? "You're building momentum. Focus on your priority skill gaps."
      : "Your preparation journey has started. Complete the recommended activities to improve your readiness.";

  return (
    <StudentLayout>
      <div className="student-dashboard-page">

        {/* =========================
            WELCOME HEADER
        ========================== */}

        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">
              STUDENT DASHBOARD
            </span>

            <h1>
              Welcome back, {firstName}
              <span>👋</span>
            </h1>

            <p>
              Track your preparation, improve your skills and
              move closer to becoming placement ready.
            </p>
          </div>

          <div className="dashboard-goal-card">
            <span>Target Role</span>

            <strong>
              {goal?.targetRole || "Set your career goal"}
            </strong>

            <small>
              {profile?.course || "Course not added"}
              {profile?.graduationYear
                ? ` • ${profile.graduationYear}`
                : ""}
            </small>
          </div>
        </section>

        {/* =========================
            READINESS HERO
        ========================== */}

        <section className="readiness-hero">
          <div className="readiness-content">
            <div className="readiness-heading">
              <span className="readiness-badge">
                PLACEMENT READINESS
              </span>

              <h2>
                Your placement preparation is moving forward.
              </h2>

              <p>{readinessMessage}</p>
            </div>

            <div className="readiness-actions">
             <button
  type="button"
  className="readiness-primary-button"
  onClick={() =>
    navigate("/student/roadmap")
  }
>
  Continue Preparation
</button>

              <button
                type="button"
                className="readiness-secondary-button"
                onClick={() =>
                  navigate("/student/analytics")
                }
              >
                View Analytics
              </button>
            </div>
          </div>

          <div className="readiness-score-area">
            <div
              className="readiness-ring"
              style={{
                "--readiness-value": `${Math.min(
                  Math.max(readinessScore, 0),
                  100
                ) * 3.6}deg`,
              }}
            >
              <div className="readiness-ring-inner">
                <strong>{readinessScore}%</strong>
                <span>Ready</span>
              </div>
            </div>

            <small>Overall Readiness Score</small>
          </div>
        </section>

        {/* =========================
            MAIN METRICS
        ========================== */}

        <section className="dashboard-metrics">

          <article className="dashboard-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon metric-blue">
                L
              </div>

              <span>Learning</span>
            </div>

            <strong>{learningCompleted}</strong>

            <p>Topics completed</p>

            <div className="metric-footer">
              <span>{learningStarted} started</span>
              <span>{learningProgress}% progress</span>
            </div>
          </article>

          <article className="dashboard-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon metric-cyan">
                P
              </div>

              <span>Practice</span>
            </div>

            <strong>{practiceAccuracy}%</strong>

            <p>Practice accuracy</p>

            <div className="metric-footer">
              <span>{practiceAttempts} attempts</span>
              <span>
                {practice?.correctAttempts ?? 0} correct
              </span>
            </div>
          </article>

          <article className="dashboard-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon metric-purple">
                I
              </div>

              <span>Interview</span>
            </div>

            <strong>{interviewScore}%</strong>

            <p>Average interview score</p>

            <div className="metric-footer">
              <span>{interviewSessions} sessions</span>
              <span>
                {interview?.completedSessions ?? 0} completed
              </span>
            </div>
          </article>

          <article className="dashboard-metric-card">
            <div className="metric-card-top">
              <div className="metric-icon metric-green">
                GD
              </div>

              <span>Group Discussion</span>
            </div>

            <strong>{gdScore}%</strong>

            <p>Average GD score</p>

            <div className="metric-footer">
              <span>{gdSessions} sessions</span>
              <span>
                {gd?.completedSessions ?? 0} completed
              </span>
            </div>
          </article>

        </section>

        {/* =========================
            DASHBOARD BODY
        ========================== */}

        <section className="dashboard-main-grid">

          {/* LEFT SIDE */}

          <div className="dashboard-main-column">

            {/* SKILL GAP */}

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    CAREER PREPARATION
                  </span>

                  <h2>Skill Gap Analysis</h2>

                  <p>
                    Skills to focus on for your target role.
                  </p>
                </div>

                <button
                  type="button"
                  className="panel-link-button"
                  onClick={() =>
                    navigate("/student/analytics")
                  }
                >
                  View Details
                </button>
              </div>

              <div className="skill-overview">
                <div className="skill-overview-item">
                  <span>Current Skills</span>

                  <strong>{skills.length}</strong>
                </div>

                <div className="skill-overview-item">
                  <span>Missing Skills</span>

                  <strong>{missingSkills.length}</strong>
                </div>

                <div className="skill-overview-item">
                  <span>Priority Areas</span>

                  <strong>{priorityAreas.length}</strong>
                </div>
              </div>

              <div className="dashboard-skill-section">
                <h3>Skills to Improve</h3>

                {missingSkills.length > 0 ? (
                  <div className="dashboard-tags">
                    {missingSkills
                      .slice(0, 6)
                      .map((skill, index) => (
                        <span
                          className="dashboard-tag missing"
                          key={`${String(skill)}-${index}`}
                        >
                          {typeof skill === "string"
                            ? skill
                            : skill?.name ||
                              skill?.skillName ||
                              "Skill"}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-inline">
                    No missing skills identified.
                  </div>
                )}
              </div>

              <div className="dashboard-skill-section">
                <h3>Your Strengths</h3>

                {strengths.length > 0 ? (
                  <div className="dashboard-tags">
                    {strengths
                      .slice(0, 6)
                      .map((strength, index) => (
                        <span
                          className="dashboard-tag strength"
                          key={`${String(strength)}-${index}`}
                        >
                          {typeof strength === "string"
                            ? strength
                            : strength?.category ||
                              strength?.name ||
                              "Strength"}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-inline">
                    Complete more practice activities to
                    discover your strengths.
                  </div>
                )}
              </div>
            </article>

            {/* PLACEMENT TRACKER */}

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    PLACEMENT ACTIVITY
                  </span>

                  <h2>Application Tracker</h2>

                  <p>
                    Monitor your real placement applications.
                  </p>
                </div>

                <button
                  type="button"
                  className="panel-link-button"
                  onClick={() =>
                    navigate("/student/applications")
                  }
                >
                  View Applications
                </button>
              </div>

              <div className="application-summary">
                <div>
                  <strong>{totalApplications}</strong>
                  <span>Total</span>
                </div>

                <div>
                  <strong>{activeApplications}</strong>
                  <span>Active</span>
                </div>

                <div>
                  <strong>{placedApplications}</strong>
                  <span>Placed</span>
                </div>

                <div>
                  <strong>
                    {placementTracker?.rejectedApplications ??
                      0}
                  </strong>
                
<span>Rejected</span>
</div>

<div>
  <strong>
    {placementTracker?.upcomingRoundsCount ?? 0}
  </strong>
  <span>Upcoming Rounds</span>
</div>
</div>


              {placementTracker?.latestApplication ? (
                <div className="latest-application">
               
<div className="latest-application-icon">
  {placementTracker.latestApplication.companyName
    ?.charAt(0)
    ?.toUpperCase() || "C"}
</div>

<div className="latest-application-info">
  <span>Latest Application</span>

  <strong>
    {placementTracker.latestApplication.companyName ||
      "Company"}
  </strong>

 
<p>
  {placementTracker.latestApplication.jobRole ||
    placementTracker.latestApplication.opportunityTitle ||
    "Role not specified"}
</p>

</div>


                  <span className="application-status">
                    {placementTracker.latestApplication.status ||
                      placementTracker.latestApplication
                        .currentStage ||
                      "Applied"}
                  </span>
                </div>
              ) : (
                <div className="dashboard-empty-box">
                  <strong>No applications yet</strong>

                  <p>
                    Start exploring placement opportunities
                    that match your profile.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/student/opportunities")
                    }
                  >
                    Explore Opportunities
                  </button>
                </div>

              )}

              {/* UPCOMING PLACEMENT ROUND */}
              {placementTracker?.nextRound && (
                <div
                  className="latest-application"
                  style={{ marginTop: "16px" }}
                >
                  <div className="latest-application-icon">
                    {placementTracker.nextRound.companyName
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div className="latest-application-info">
                    <span>Upcoming Placement Round</span>

                    <strong>
                      {placementTracker.nextRound.companyName ||
                        "Company"}
                    </strong>

                    <p>
                      {placementTracker.nextRound.jobRole ||
                        placementTracker.nextRound.opportunityTitle ||
                        "Role not specified"}
                    </p>

                    <p>
                      {placementTracker.nextRound.nextRoundDate
                        ? new Date(
                            placementTracker.nextRound.nextRoundDate
                          ).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Date not scheduled"}
                    </p>
                  </div>

                  <span className="application-status">
                    {placementTracker.nextRound.currentStage ||
                      "Upcoming"}
                  </span>
                </div>
              )}
            </article>

          </div>

          {/* RIGHT SIDE */}


          <aside className="dashboard-side-column">

            {/* PROFILE */}

            <article className="dashboard-side-card">
              <div className="side-card-heading">
                <span className="side-card-icon">P</span>

                <div>
                  <h3>Your Profile</h3>
                  <p>Academic & career details</p>
                </div>
              </div>

              <div className="profile-details">
                <div>
                  <span>Course</span>
                  <strong>
                    {profile?.course || "Not added"}
                  </strong>
                </div>

                <div>
                  <span>Graduation</span>
                  <strong>
                    {profile?.graduationYear || "—"}
                  </strong>
                </div>

                <div>
                  <span>CGPA</span>
                  <strong>
                    {profile?.cgpa ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>
                    {profile?.location || "Not added"}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="side-full-button"
                onClick={() =>
                  navigate("/student/profile")
                }
              >
                View Profile
              </button>
            </article>

            {/* QUICK ACTIONS */}

            <article className="dashboard-side-card">
              <div className="side-card-heading">
                <span className="side-card-icon">+</span>

                <div>
                  <h3>Quick Actions</h3>
                  <p>Continue your preparation</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/learning")
                  }
                >
                  <span className="quick-action-icon">L</span>

                  <span>
                    <strong>Continue Learning</strong>
                    <small>Learn placement concepts</small>
                  </span>

                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/practice")
                  }
                >
                  <span className="quick-action-icon">P</span>

                  <span>
                    <strong>Start Practice</strong>
                    <small>Improve through practice</small>
                  </span>

                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/mock-placement")
                  }
                >
                  <span className="quick-action-icon">M</span>

                  <span>
                    <strong>Mock Placement</strong>
                    <small>Simulate placement rounds</small>
                  </span>

                  <b>›</b>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/opportunities")
                  }
                >
                  <span className="quick-action-icon">O</span>

                  <span>
                    <strong>Opportunities</strong>
                    <small>Discover matching roles</small>
                  </span>

                  <b>›</b>
                </button>
              </div>
            </article>

            {/* FOCUS AREAS */}

            <article className="dashboard-side-card">
              <div className="side-card-heading">
                <span className="side-card-icon">F</span>

                <div>
                  <h3>Focus Areas</h3>
                  <p>Recommended improvement areas</p>
                </div>
              </div>

              {priorityAreas.length > 0 ? (
                <div className="focus-area-list">
                  {priorityAreas
                    .slice(0, 4)
                    .map((area, index) => (
                      <div
                        className="focus-area-item"
                        key={`${String(area)}-${index}`}
                      >
                        <span>{index + 1}</span>

                        <p>
                          {typeof area === "string"
                            ? area
                            : area?.name ||
                              area?.category ||
                              area?.skill ||
                              "Improvement Area"}
                        </p>
                      </div>
                    ))}
                </div>
              ) : weakAreas.length > 0 ? (
                <div className="focus-area-list">
                  {weakAreas
                    .slice(0, 4)
                    .map((area, index) => (
                      <div
                        className="focus-area-item"
                        key={`${String(area)}-${index}`}
                      >
                        <span>{index + 1}</span>

                        <p>
                          {typeof area === "string"
                            ? area
                            : area?.category ||
                              area?.name ||
                              "Practice Area"}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="dashboard-empty-inline">
                  Complete practice and assessments to generate
                  personalized focus areas.
                </div>
              )}
            </article>

          </aside>
        </section>

      </div>
    </StudentLayout>
  );
}

export default StudentDashboard;