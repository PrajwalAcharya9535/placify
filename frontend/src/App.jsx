  import { Routes, Route } from "react-router-dom";

  import Login from "./pages/auth/Login";
  import ProtectedRoute from "./components/ProtectedRoute";

  import StudentDashboard from "./pages/student/StudentDashboard";
  import StudentLearning from "./pages/student/learning/StudentLearning";
  import StudentLearningTopic from "./pages/student/learning/StudentLearningTopic";
  import StudentPractice from "./pages/student/practice/StudentPractice";
  import MCQPractice from "./pages/student/practice/mcq/MCQPractice";
  import CodingPractice from "./pages/student/practice/coding/CodingPractice";
  import SQLPractice from "./pages/student/practice/sql/SQLPractice";
  import DebuggingPractice from "./pages/student/practice/debugging/DebuggingPractice";
  import MockPlacement from "./pages/student/mock-placement/MockPlacement";
  import MockTestDetails from "./pages/student/mock-placement/MockTestDetails";
  import MockAttempt from "./pages/student/mock-placement/MockAttempt";
  import MockHistory from "./pages/student/mock-placement/MockHistory";
  import StudentResume from "./pages/student/resume/StudentResume";
  import StudentRoadmap from "./pages/student/StudentRoadmap";
  import StudentInterview from "./pages/student/interview/StudentInterview";
  import StudentOpportunities from "./pages/student/opportunities/StudentOpportunities";
  import AIInterviewRoom from "./pages/student/interview/AIInterviewRoom";
  import AIInterviewResult from "./pages/student/interview/AIInterviewResult";


  import "./App.css";

  function HomePage() {
    return (
      <div className="placify-app">

        {/* =========================
            NAVBAR
        ========================== */}

        <header className="navbar">
          <div className="nav-container">

            <a className="brand" href="#">
              <div className="brand-icon">
                <span>P</span>
              </div>

              <div className="brand-text">
                <span className="brand-name">
                  Placify
                </span>

                <span className="brand-tagline">
                  Prepare. Perform. Get Placed.
                </span>
              </div>
            </a>

            <nav className="nav-links">
              <a
                href="#home"
                className="active"
              >
                Home
              </a>

              <a href="#features">
                Features
              </a>

              <a href="#journey">
                How it Works
              </a>

              <a href="#about">
                About
              </a>
            </nav>

            <div className="nav-actions">
              <button
                className="login-btn"
                type="button"
              >
                Log in
              </button>

              <button
                className="get-started-btn"
                type="button"
              >
                Get Started
                <span>→</span>
              </button>
            </div>

          </div>
        </header>

        {/* =========================
            HERO
        ========================== */}

        <main
          id="home"
          className="hero-section"
        >

          <div className="hero-glow hero-glow-one"></div>
          <div className="hero-glow hero-glow-two"></div>

          <div className="hero-container">

            <div className="hero-content">

              <div className="hero-badge">
                <span className="badge-dot"></span>
                AI-Powered Placement Preparation
              </div>

              <h1>
                Prepare Smarter.
                <br />

                Become{" "}
                <span className="gradient-text">
                  Placement Ready.
                </span>
              </h1>

              <p className="hero-description">
                Your complete placement preparation
                platform. Learn, practice, improve your
                skills, prepare for interviews and
                discover the right opportunities — all
                in one place.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-cta"
                  type="button"
                >
                  Start Your Journey
                  <span>→</span>
                </button>

                <a
                  className="secondary-cta"
                  href="#features"
                >
                  <span className="play-icon">
                    ▶
                  </span>
                  Explore Placify
                </a>
              </div>

              <div className="hero-trust">

                <div className="trust-item">
                  <strong>12</strong>
                  <span>
                    Connected Modules
                  </span>
                </div>

                <div className="trust-divider"></div>

                <div className="trust-item">
                  <strong>360°</strong>
                  <span>
                    Placement Preparation
                  </span>
                </div>

                <div className="trust-divider"></div>

                <div className="trust-item">
                  <strong>AI</strong>
                  <span>
                    Driven Insights
                  </span>
                </div>

              </div>

            </div>

            {/* =========================
                HERO DASHBOARD PREVIEW
            ========================== */}

            <div className="hero-visual">

              <div className="visual-orbit orbit-one"></div>
              <div className="visual-orbit orbit-two"></div>

              <div className="dashboard-preview">

                <div className="preview-topbar">

                  <div className="preview-brand">
                    <div className="mini-logo">
                      P
                    </div>

                    <span>
                      Placify
                    </span>
                  </div>

                  <div className="preview-user">
                    <span className="notification-dot"></span>

                    <div className="avatar">
                      PS
                    </div>
                  </div>

                </div>

                <div className="preview-body">

                  <div className="preview-heading">

                    <div>
                      <span className="small-label">
                        PLACEMENT DASHBOARD
                      </span>

                      <h3>
                        Good morning 👋
                      </h3>
                    </div>

                    <span className="status-pill">
                      ● On Track
                    </span>

                  </div>

                  <div className="readiness-card">

                    <div className="readiness-copy">
                      <span>
                        Placement Readiness
                      </span>

                      <strong>
                        82%
                      </strong>

                      <p>
                        You're making great
                        progress.
                      </p>

                      <div className="progress-track">
                        <div className="progress-value"></div>
                      </div>
                    </div>

                    <div className="readiness-ring">
                      <div className="ring-inner">
                        <strong>
                          82
                        </strong>

                        <span>
                          Score
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="mini-grid">

                    <div className="mini-card">
                      <div className="mini-card-icon blue">
                        ✓
                      </div>

                      <div>
                        <span>
                          Practice
                        </span>

                        <strong>
                          24 Tests
                        </strong>
                      </div>
                    </div>

                    <div className="mini-card">
                      <div className="mini-card-icon cyan">
                        &lt;/&gt;
                      </div>

                      <div>
                        <span>
                          Coding
                        </span>

                        <strong>
                          18 Solved
                        </strong>
                      </div>
                    </div>

                    <div className="mini-card">
                      <div className="mini-card-icon green">
                        ↑
                      </div>

                      <div>
                        <span>
                          ATS Score
                        </span>

                        <strong>
                          86%
                        </strong>
                      </div>
                    </div>

                  </div>

                  <div className="next-step-card">

                    <div className="next-icon">
                      ✦
                    </div>

                    <div className="next-copy">

                      <span>
                        AI RECOMMENDATION
                      </span>

                      <strong>
                        Improve your DSA skills
                      </strong>

                      <p>
                        Complete 3 recommended
                        practice sets.
                      </p>

                    </div>

                    <button type="button">
                      →
                    </button>

                  </div>

                </div>

              </div>

              <div className="floating-card floating-card-one">

                <div className="floating-icon">
                  ✓
                </div>

                <div>
                  <span>
                    Skill Progress
                  </span>

                  <strong>
                    +12% this week
                  </strong>
                </div>

              </div>

              <div className="floating-card floating-card-two">

                <div className="floating-icon opportunity">
                  ↗
                </div>

                <div>
                  <span>
                    New Opportunity
                  </span>

                  <strong>
                    Java Developer
                  </strong>
                </div>

              </div>

            </div>

          </div>

          <div className="trusted-strip">

            <span>
              ONE PLATFORM FOR
            </span>

            <div className="trusted-items">

              <span>
                Learning
              </span>

              <i>•</i>

              <span>
                Practice
              </span>

              <i>•</i>

              <span>
                Mock Placement
              </span>

              <i>•</i>

              <span>
                Resume & ATS
              </span>

              <i>•</i>

              <span>
                Interviews
              </span>

              <i>•</i>

              <span>
                Opportunities
              </span>

            </div>

          </div>

        </main>

        {/* =========================
            FEATURES PREVIEW
        ========================== */}

        <section
          id="features"
          className="features-section"
        >

          <div className="section-heading">

            <span className="section-label">
              EVERYTHING YOU NEED
            </span>

            <h2>
              One platform. Your complete
              <br />

              <span>
                placement journey.
              </span>
            </h2>

            <p>
              Placify connects preparation,
              performance, opportunities and
              placement tracking into one
              intelligent experience.
            </p>

          </div>

          <div className="feature-grid">

            <article className="feature-card">
              <div className="feature-icon">
                ⌁
              </div>

              <h3>
                Learn & Practice
              </h3>

              <p>
                Build placement-ready skills
                with structured learning,
                aptitude, technical practice,
                coding and SQL.
              </p>
            </article>

            <article className="feature-card featured">
              <div className="feature-icon">
                ✦
              </div>

              <h3>
                AI-Powered Preparation
              </h3>

              <p>
                Discover skill gaps, analyze
                your resume and get personalized
                recommendations based on your
                performance.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">
                ◎
              </div>

              <h3>
                Mock Placement
              </h3>

              <p>
                Experience placement-style
                assessments, interviews and
                group discussions before the
                real selection process.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">
                ↗
              </div>

              <h3>
                Career Opportunities
              </h3>

              <p>
                Find relevant placement
                opportunities, check eligibility
                and understand how well your
                profile matches each role.
              </p>
            </article>

          </div>

        </section>

        {/* =========================
            JOURNEY
        ========================== */}

        <section
          id="journey"
          className="journey-section"
        >

          <div className="journey-container">

            <div className="journey-copy">

              <span className="section-label">
                YOUR PLACEMENT JOURNEY
              </span>

              <h2>
                From preparation
                <br />

                to{" "}
                <span>
                  placement.
                </span>
              </h2>

              <p>
                Placify connects every important
                stage so your progress,
                weaknesses and next actions stay
                in one place.
              </p>

            </div>

            <div className="journey-flow">

              <div className="journey-step">
                <span>
                  01
                </span>

                <strong>
                  Learn
                </strong>
              </div>

              <div className="journey-line"></div>

              <div className="journey-step">
                <span>
                  02
                </span>

                <strong>
                  Practice
                </strong>
              </div>

              <div className="journey-line"></div>

              <div className="journey-step">
                <span>
                  03
                </span>

                <strong>
                  Assess
                </strong>
              </div>

              <div className="journey-line"></div>

              <div className="journey-step">
                <span>
                  04
                </span>

                <strong>
                  Improve
                </strong>
              </div>

              <div className="journey-line"></div>

              <div className="journey-step">
                <span>
                  05
                </span>

                <strong>
                  Get Placed
                </strong>
              </div>

            </div>

          </div>

        </section>

        <section
          id="about"
          className="about-anchor"
        ></section>

      </div>
    );
  }

  function App() {
    return (
      <Routes>

        {/* =========================
            PUBLIC
        ========================== */}

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            STUDENT DASHBOARD
        ========================== */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT LEARNING
        ========================== */}

        <Route
          path="/student/learning"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentLearning />
            </ProtectedRoute>
          }
        />


        <Route
    path="/student/learning/:topicId"
    element={
      <ProtectedRoute allowedRole="student">
        <StudentLearningTopic />
      </ProtectedRoute>
    }
  />

        {/* =========================
            STUDENT PRACTICE
        ========================== */}

        <Route
          path="/student/practice"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentPractice />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT MCQ PRACTICE
        ========================== */}

        <Route
          path="/student/practice/mcq"
          element={
            <ProtectedRoute allowedRole="student">
              <MCQPractice />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT CODING PRACTICE
        ========================== */}

        <Route
          path="/student/practice/coding"
          element={
            <ProtectedRoute allowedRole="student">
              <CodingPractice />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT SQL PRACTICE
        ========================== */}

        <Route
          path="/student/practice/sql"
          element={
            <ProtectedRoute allowedRole="student">
              <SQLPractice />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT DEBUGGING PRACTICE
        ========================== */}

        <Route
          path="/student/practice/debugging"
          element={
            <ProtectedRoute allowedRole="student">
              <DebuggingPractice />
            </ProtectedRoute>
          }
        />

        {/* =========================
            STUDENT MOCK PLACEMENT
        ========================== */}

        <Route
          path="/student/mock-placement"
          element={
            <ProtectedRoute allowedRole="student">
              <MockPlacement />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MOCK PLACEMENT HISTORY
        ========================== */}

        <Route
          path="/student/mock-placement/history"
          element={
            <ProtectedRoute allowedRole="student">
              <MockHistory />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MOCK TEST DETAILS
        ========================== */}

        <Route
          path="/student/mock-placement/:id"
          element={
            <ProtectedRoute allowedRole="student">
              <MockTestDetails />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MOCK ATTEMPT
        ========================== */}

        <Route
          path="/student/mock-placement/attempt/:attemptId"
          element={
            <ProtectedRoute allowedRole="student">
              <MockAttempt />
            </ProtectedRoute>
          }
        />


        <Route
    path="/student/resume"
    element={
      <ProtectedRoute allowedRole="student">
        <StudentResume />
      </ProtectedRoute>
    }
  />

  <Route
    path="/student/roadmap"
    element={
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentRoadmap />
      </ProtectedRoute>
    }
  />


  {/* =========================
      AI INTERVIEW
  ========================== */}

  <Route
    path="/student/interview"
    element={
      <ProtectedRoute allowedRole="student">
        <StudentInterview />
      </ProtectedRoute>
    }
  />


  <Route
    path="/student/ai-interview/:sessionId"
    element={<AIInterviewRoom />}
  />


  <Route
    path="/student/ai-interview/:sessionId/result"
    element={<AIInterviewResult />}
  />

  {/* =========================
      STUDENT OPPORTUNITIES
  ========================= */}

  <Route
    path="/student/opportunities"
    element={
      <ProtectedRoute allowedRole="student">
        <StudentOpportunities />
      </ProtectedRoute>
    }
  />

      </Routes>


    );
  }

  export default App;
