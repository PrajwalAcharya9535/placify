
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const API = "http://localhost:5000/api/auth";

function Login() {
  const navigate = useNavigate();

  const [flipped, setFlipped] = useState(false);
  const [registerStep, setRegisterStep] = useState("details");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setResendSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const switchCard = (showRegister) => {
    if (loading) return;

    setError("");
    setSuccess("");
    setFlipped(showRegister);
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleLogin = async (event) => {
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

      const response = await axios.post(`${API}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response.");
      }

      localStorage.setItem("placifyToken", token);
      localStorage.setItem("placifyUser", JSON.stringify(user));

      navigate(
        user.role === "admin"
          ? "/admin/dashboard"
          : "/student/dashboard"
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();

    const name = registerData.name.trim();
    const email = registerData.email.trim().toLowerCase();

    if (
      !name ||
      !email ||
      !registerData.password ||
      !registerData.confirmPassword
    ) {
      setError("Please complete all registration fields.");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (
      registerData.password !== registerData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API}/register/send-otp`,
        {
          name,
          email,
          password: registerData.password,
        }
      );

      setRegisterStep("otp");
      setOtp("");
      setResendSeconds(response.data.resendAfterSeconds || 60);
      setSuccess("Verification code sent to your email.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post(`${API}/register/verify-otp`, {
        email: registerData.email.trim().toLowerCase(),
        otp,
      });

      setFormData({
        email: registerData.email.trim().toLowerCase(),
        password: "",
      });

      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setOtp("");
      setRegisterStep("details");
      setResendSeconds(0);
      setFlipped(false);
      setSuccess(
        "Account created successfully. Log in to continue."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || resendSeconds > 0) return;

    await handleSendOtp({
      preventDefault: () => {},
    });
  };

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-grid-pattern" />
      </div>

      <div className="login-shell">
        {/* LEFT SHOWCASE — PRESERVED */}
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
              <span />
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
            <div className="showcase-stat-line" />
            <div className="showcase-stat">
              <strong>360°</strong>
              <span>Placement Preparation</span>
            </div>
            <div className="showcase-stat-line" />
            <div className="showcase-stat">
              <strong>AI</strong>
              <span>Driven Insights</span>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
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

            <div className="auth-flip-scene">
              <div
                className={`auth-flip-card ${
                  flipped ? "is-flipped" : ""
                }`}
              >
                {/* LOGIN FACE */}
                <div
                  className="auth-flip-face auth-flip-front"
                  aria-hidden={flipped}
                  inert={flipped}
                >
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

                  {success && !flipped && (
                    <div className="auth-success" role="status">
                      {success}
                    </div>
                  )}

                  <form
                    className="login-form"
                    onSubmit={handleLogin}
                  >
                    <div className="form-group">
                      <label htmlFor="login-email">
                        Email address
                      </label>
                      <div className="input-shell">
                        <span className="input-icon">@</span>
                        <input
                          id="login-email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleLoginChange}
                          placeholder="Enter your email"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="password-label-row">
                        <label htmlFor="login-password">
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
                        <span className="input-icon">◇</span>
                        <input
                          id="login-password"
                          name="password"
                          type={
                            showPassword ? "text" : "password"
                          }
                          required
                          value={formData.password}
                          onChange={handleLoginChange}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {error && !flipped && (
                      <div className="login-error" role="alert">
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
                      {loading ? "Logging in..." : "Log in to Placify"}
                      {!loading && <span>→</span>}
                    </button>
                  </form>

                  <div className="login-divider">
                    <span />
                    <p>NEW TO PLACIFY?</p>
                    <span />
                  </div>

                  <button
                    type="button"
                    className="create-account-btn"
                    onClick={() => switchCard(true)}
                  >
                    Create your student account
                  </button>

                  <p className="login-security">
                    <span>◆</span>
                    Your account is protected with secure
                    authentication.
                  </p>
                </div>

                {/* REGISTRATION FACE */}
                <div
                  className="auth-flip-face auth-flip-back"
                  aria-hidden={!flipped}
                  inert={!flipped}
                >
                  {registerStep === "details" ? (
                    <>
                      <div className="login-heading">
                        <span className="welcome-label">
                          JOIN PLACIFY
                        </span>
                        <h2>Create your account</h2>
                        <p>
                          Register as a student and verify your
                          email to get started.
                        </p>
                      </div>

                      <form
                        className="auth-register-form"
                        onSubmit={handleSendOtp}
                      >
                        <div className="form-group">
                          <label htmlFor="register-name">
                            Full name
                          </label>
                          <div className="input-shell">
                            <span className="input-icon">◇</span>
                            <input
                              id="register-name"
                              name="name"
                              type="text"
                              required
                              value={registerData.name}
                              onChange={handleRegisterChange}
                              placeholder="Enter your full name"
                              autoComplete="name"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="register-email">
                            Email address
                          </label>
                          <div className="input-shell">
                            <span className="input-icon">@</span>
                            <input
                              id="register-email"
                              name="email"
                              type="email"
                              required
                              value={registerData.email}
                              onChange={handleRegisterChange}
                              placeholder="Enter your email"
                              autoComplete="email"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="register-password">
                            Password
                          </label>
                          <div className="input-shell">
                            <span className="input-icon">◇</span>
                            <input
                              id="register-password"
                              name="password"
                              type={
                                showRegisterPassword
                                  ? "text"
                                  : "password"
                              }
                              minLength={6}
                              required
                              value={registerData.password}
                              onChange={handleRegisterChange}
                              placeholder="Minimum 6 characters"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() =>
                                setShowRegisterPassword(
                                  (value) => !value
                                )
                              }
                            >
                              {showRegisterPassword
                                ? "Hide"
                                : "Show"}
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="register-confirm">
                            Confirm password
                          </label>
                          <div className="input-shell">
                            <span className="input-icon">◇</span>
                            <input
                              id="register-confirm"
                              name="confirmPassword"
                              type={
                                showRegisterPassword
                                  ? "text"
                                  : "password"
                              }
                              minLength={6}
                              required
                              value={registerData.confirmPassword}
                              onChange={handleRegisterChange}
                              placeholder="Re-enter your password"
                              autoComplete="new-password"
                            />
                          </div>
                        </div>

                        {error && flipped && (
                          <div className="login-error" role="alert">
                            <span>!</span>
                            {error}
                          </div>
                        )}

                        <button
                          className="login-submit"
                          type="submit"
                          disabled={loading}
                        >
                          {loading
                            ? "Sending OTP..."
                            : "Send Verification OTP"}
                          {!loading && <span>→</span>}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="login-heading">
                        <span className="welcome-label">
                          EMAIL VERIFICATION
                        </span>
                        <h2>Verify your email</h2>
                        <p>
                          Enter the 6-digit code sent to{" "}
                          <strong>{registerData.email}</strong>.
                        </p>
                      </div>

                      {success && (
                        <div className="auth-success" role="status">
                          {success}
                        </div>
                      )}

                      <form
                        className="auth-register-form"
                        onSubmit={handleVerifyOtp}
                      >
                        <div className="form-group">
                          <label htmlFor="register-otp">
                            Verification code
                          </label>
                          <div className="input-shell">
                            <span className="input-icon">#</span>
                            <input
                              id="register-otp"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              required
                              value={otp}
                              onChange={(event) => {
                                setOtp(
                                  event.target.value.replace(
                                    /\D/g,
                                    ""
                                  )
                                );
                                setError("");
                              }}
                              placeholder="Enter 6-digit OTP"
                              autoComplete="one-time-code"
                            />
                          </div>
                        </div>

                        <p className="auth-otp-hint">
                          Your OTP expires in 5 minutes.
                        </p>

                        {error && (
                          <div className="login-error" role="alert">
                            <span>!</span>
                            {error}
                          </div>
                        )}

                        <button
                          className="login-submit"
                          type="submit"
                          disabled={loading}
                        >
                          {loading
                            ? "Verifying..."
                            : "Verify & Create Account"}
                          {!loading && <span>→</span>}
                        </button>
                      </form>

                      <button
                        type="button"
                        className="auth-switch-btn"
                        disabled={loading || resendSeconds > 0}
                        onClick={handleResendOtp}
                      >
                        {resendSeconds > 0
                          ? `Resend OTP in ${resendSeconds}s`
                          : "Resend OTP"}
                      </button>

                      <button
                        type="button"
                        className="auth-switch-btn"
                        disabled={loading}
                        onClick={() => {
                          setRegisterStep("details");
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Edit registration details
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="auth-switch-btn"
                    disabled={loading}
                    onClick={() => switchCard(false)}
                  >
                    ← Already have an account? Log in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
