import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      const { token, user } = response.data;

      if (!token || !user) {
        setError("Invalid login response. Please try again.");
        return;
      }

      localStorage.setItem("placifyToken", token);
      localStorage.setItem(
        "placifyUser",
        JSON.stringify(user)
      );

      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to login. Please check your connection.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb-one"></div>
        <div className="login-orb login-orb-two"></div>
        <div className="login-grid-pattern"></div>
      </div>

      <div className="login-shell">
        {/* LEFT SIDE */}

        <section className="login-showcase">
          <button
            type="button"
            className="login-brand"
            onClick={() => navigate("/")}
          >
            <span className="login-brand-icon">P</span>

            <span className="login-brand-copy">
              <strong>Placify</strong>
              <small>Prepare. Perform. Get Placed.</small>
            </span>
          </button>

          <div className="showcase-content">
            <div className="showcase-badge">
              <span></span>
              YOUR PLACEMENT JOURNEY
            </div>

            <h1>
              Build skills.
              <br />
              Track progress.
              <br />
              <span>Get placement ready.</span>
            </h1>

            <p>
              Continue your personalized placement preparation
              journey with learning, practice, mock assessments,
              interviews and career opportunities in one place.
            </p>

            <div className="showcase-features">
              <div className="showcase-feature">
                <span className="feature-check">✓</span>

                <div>
                  <strong>Personalized Preparation</strong>
                  <p>
                    Focus on skills that matter for your career goal.
                  </p>
                </div>
              </div>

              <div className="showcase-feature">
                <span className="feature-check">✓</span>

                <div>
                  <strong>Placement Readiness</strong>
                  <p>
                    Understand your progress with connected analytics.
                  </p>
                </div>
              </div>

              <div className="showcase-feature">
                <span className="feature-check">✓</span>

                <div>
                  <strong>AI-Powered Insights</strong>
                  <p>
                    Discover weaknesses and your next best action.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div className="showcase-stat">
              <strong>12</strong>
              <span>Connected Modules</span>
            </div>

            <div className="showcase-stat-line"></div>

            <div className="showcase-stat">
              <strong>360°</strong>
              <span>Placement Preparation</span>
            </div>

            <div className="showcase-stat-line"></div>

            <div className="showcase-stat">
              <strong>AI</strong>
              <span>Driven Insights</span>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}

        <section className="login-panel">
          <div className="login-form-wrapper">
            <button
              type="button"
              className="back-home"
              onClick={() => navigate("/")}
            >
              <span>←</span>
              Back to home
            </button>

            <div className="mobile-login-brand">
              <span className="login-brand-icon">P</span>

              <div>
                <strong>Placify</strong>
                <small>Prepare. Perform. Get Placed.</small>
              </div>
            </div>

            <div className="login-heading">
              <span className="welcome-label">
                WELCOME BACK
              </span>

              <h2>Log in to Placify</h2>

              <p>
                Continue your journey towards becoming
                placement ready.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <div className="input-shell">
                  <span className="input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="password-label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  <button
                    type="button"
                    className="forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-shell">
                  <span className="input-icon">
                    ◇
                  </span>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  <span>!</span>
                  {error}
                </div>
              )}

              <div className="login-options">
                <label className="remember-option">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    Log in to Placify
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span></span>
              <p>NEW TO PLACIFY?</p>
              <span></span>
            </div>

            <button
              type="button"
              className="create-account-btn"
              onClick={() => navigate("/register")}
            >
              Create your student account
            </button>

            <p className="login-security">
              <span>◆</span>
              Your account is protected with secure authentication.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;