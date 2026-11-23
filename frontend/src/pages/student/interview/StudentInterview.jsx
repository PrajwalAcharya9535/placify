
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  History,
  LoaderCircle,
  Mic2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import "./StudentInterview.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const ROLES = [
  "Java Developer",
  "Java Full Stack Developer",
  "Junior Java Developer",
  "Java Backend Developer",
  "Java Software Engineer",
  "Java Spring Boot Developer",
  "JavaScript Developer",
  "JavaScript Full Stack Developer",
  "Junior Software Developer",
  "Software Engineer",
  "Software Developer",
  "Software Development Engineer",
  "Associate Software Engineer",
  "Graduate Engineer Trainee",
  "Software Engineer Trainee",
  "Frontend Developer",
  "React Developer",
  "Angular Developer",
  "Vue.js Developer",
  "Backend Developer",
  "Node.js Developer",
  "Express.js Developer",
  "Full Stack Developer",
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "Python Developer",
  "Python Backend Developer",
  "Django Developer",
  "Flask Developer",
  "C Developer",
  "C++ Developer",
  "C# Developer",
  ".NET Developer",
  "ASP.NET Developer",
  "PHP Developer",
  "Laravel Developer",
  "Ruby Developer",
  "Go Developer",
  "Rust Developer",
  "Kotlin Developer",
  "Swift Developer",
  "Android Developer",
  "iOS Developer",
  "Flutter Developer",
  "React Native Developer",
  "Mobile App Developer",
  "Web Developer",
  "UI Developer",
  "UI/UX Designer",
  "Product Designer",
  "Graphic Designer",
  "QA Engineer",
  "Manual Tester",
  "Automation Test Engineer",
  "SDET",
  "Performance Test Engineer",
  "Data Analyst",
  "Business Analyst",
  "Business Data Analyst",
  "Business Intelligence Analyst",
  "Data Scientist",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Generative AI Engineer",
  "LLM Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "MLOps Engineer",
  "Prompt Engineer",
  "SQL Developer",
  "Database Developer",
  "Database Administrator",
  "Cloud Engineer",
  "AWS Cloud Engineer",
  "Azure Cloud Engineer",
  "Google Cloud Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Platform Engineer",
  "Cybersecurity Analyst",
  "Security Engineer",
  "SOC Analyst",
  "Penetration Tester",
  "Network Engineer",
  "System Administrator",
  "IT Support Engineer",
  "Technical Support Engineer",
  "Application Support Engineer",
  "Product Manager",
  "Associate Product Manager",
  "Project Coordinator",
  "Project Manager",
  "Scrum Master",
  "Technical Consultant",
  "Associate Consultant",
  "ERP Consultant",
  "SAP Consultant",
  "Salesforce Developer",
  "ServiceNow Developer",
  "Technical Writer",
  "Digital Marketing Analyst",
  "SEO Analyst",
  "Operations Analyst",
  "HR Executive",
  "HR Recruiter",
  "Talent Acquisition Associate",
  "Business Development Associate",
  "Business Development Executive",
  "Customer Success Associate",
  "Technical Sales Executive",
  "Management Trainee",
  "Operations Executive",
];

const COMPANIES = [
  "TCS",
  "Tata Consultancy Services",
  "TCS Digital",
  "TCS Prime",
  "Infosys",
  "Infosys BPM",
  "Infosys Consulting",
  "Wipro",
  "Wipro Digital",
  "HCLTech",
  "Tech Mahindra",
  "Cognizant",
  "Accenture",
  "Accenture Technology",
  "Capgemini",
  "Capgemini Engineering",
  "IBM",
  "IBM Consulting",
  "Deloitte",
  "Deloitte USI",
  "EY",
  "EY GDS",
  "KPMG",
  "PwC",
  "LTIMindtree",
  "Mphasis",
  "Persistent Systems",
  "Hexaware",
  "Birlasoft",
  "Zensar Technologies",
  "Sonata Software",
  "Nagarro",
  "Thoughtworks",
  "Publicis Sapient",
  "Virtusa",
  "NTT DATA",
  "DXC Technology",
  "CGI",
  "Atos",
  "Oracle",
  "SAP",
  "Salesforce",
  "ServiceNow",
  "Microsoft",
  "Microsoft India",
  "Google",
  "Google India",
  "Google Cloud",
  "Amazon",
  "Amazon Web Services",
  "Amazon Development Centre",
  "Flipkart",
  "PhonePe",
  "Paytm",
  "Razorpay",
  "Swiggy",
  "Zomato",
  "Meesho",
  "Myntra",
  "Uber",
  "Ola",
  "Ola Electric",
  "Adobe",
  "NVIDIA",
  "Intel",
  "AMD",
  "Qualcomm",
  "Cisco",
  "Dell Technologies",
  "HP",
  "HPE",
  "Lenovo",
  "Samsung",
  "Samsung R&D",
  "Apple",
  "Meta",
  "Netflix",
  "Spotify",
  "Atlassian",
  "Zoho",
  "Freshworks",
  "BrowserStack",
  "Postman",
  "Chargebee",
  "Zerodha",
  "Groww",
  "CRED",
  "Juspay",
  "Navi",
  "Pine Labs",
  "BharatPe",
  "Walmart Global Tech",
  "Target",
  "Tesco",
  "Goldman Sachs",
  "JPMorgan Chase",
  "Morgan Stanley",
  "Wells Fargo",
  "American Express",
  "Visa",
  "Mastercard",
  "HSBC",
  "Deutsche Bank",
  "Barclays",
  "Standard Chartered",
  "Bosch",
  "Siemens",
  "Mercedes-Benz Research and Development India",
  "Mercedes-Benz",
  "BMW",
  "Volvo",
  "Continental",
  "Philips",
  "Honeywell",
  "GE Healthcare",
  "Ericsson",
  "Nokia",
  "Airtel",
  "Jio",
  "Reliance Industries",
  "Tata Elxsi",
  "Tata Technologies",
  "Larsen & Toubro",
  "L&T Technology Services",
  "Mu Sigma",
  "Fractal Analytics",
  "Tiger Analytics",
  "LatentView Analytics",
  "Happiest Minds",
  "Mindtree",
  "KPIT Technologies",
  "Cyient",
  "InMobi",
  "Unacademy",
  "BYJU'S",
  "upGrad",
  "Coursera",
  "Udemy",
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getSessionId = (data) =>
  data?.sessionId ||
  data?.interview?.sessionId ||
  data?.session?._id ||
  null;

function Autocomplete({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  inputRef,
  nextRef,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  const matches = useMemo(() => {
    const search = value.trim().toLowerCase();
    if (!search) return [];

    const starts = options.filter((item) =>
      item.toLowerCase().startsWith(search)
    );
    const contains = options.filter(
      (item) =>
        !item.toLowerCase().startsWith(search) &&
        item.toLowerCase().includes(search)
    );

    return [...starts, ...contains].slice(0, 80);
  }, [value, options]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;

    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
  }, [activeIndex, open]);

  useEffect(() => {
    const handlePointer = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointer);
    return () =>
      document.removeEventListener("pointerdown", handlePointer);
  }, []);

  const choose = (option) => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => nextRef?.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(matches.length ? 0 : -1);
      } else {
        setActiveIndex((previous) =>
          Math.min(previous + 1, matches.length - 1)
        );
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(matches.length ? matches.length - 1 : -1);
      } else {
        setActiveIndex((previous) =>
          Math.max(previous - 1, 0)
        );
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (open && matches.length) {
        choose(matches[activeIndex >= 0 ? activeIndex : 0]);
      } else {
        setOpen(false);
        nextRef?.current?.focus();
      }
    }
  };

  return (
    <div
      className="hr-field hr-autocomplete"
      ref={containerRef}
    >
      <label htmlFor={id}>
        <Icon size={15} />
        {label}
        <span className="hr-optional">Optional</span>
      </label>

      <div className="hr-input-wrap">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(value.trim().length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${id}-option-${activeIndex}`
              : undefined
          }
        />
        <ChevronDown
          size={16}
          className="hr-input-chevron"
        />
      </div>

      {open && value.trim().length > 0 && (
        <div
          className="hr-suggestions"
          id={`${id}-suggestions`}
          role="listbox"
          ref={listRef}
        >
          {matches.length ? (
            matches.map((option, index) => (
              <button
                key={option}
                id={`${id}-option-${index}`}
                data-index={index}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? "hr-suggestion active"
                    : "hr-suggestion"
                }
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
              >
                <span>{option}</span>
                {value.toLowerCase() === option.toLowerCase() && (
                  <Check size={14} />
                )}
              </button>
            ))
          ) : (
            <div className="hr-suggestions-empty">
              No suggestions. You can use your own value.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const StudentInterview = () => {
  const navigate = useNavigate();

  const fileRef = useRef(null);
  const roleRef = useRef(null);
  const companyRef = useRef(null);
  const startRef = useRef(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const token = useMemo(
    () => localStorage.getItem("placifyToken") || "",
    []
  );

  useEffect(() => {
    if (!historyOpen) {
      fileRef.current?.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (!historyOpen) return;

    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await fetch(
          `${API_BASE}/student/ai-interview/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load interview history."
          );
        }

        if (!cancelled) {
          setHistory(
            Array.isArray(data.interviews)
              ? data.interviews
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(
            err.message || "Unable to load interview history."
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [historyOpen, token]);

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setResumeFile(null);
      setError("Please select a valid PDF resume.");
      event.target.value = "";
      return;
    }

    setResumeFile(file);
    requestAnimationFrame(() => roleRef.current?.focus());
  };

  const clearResume = () => {
    setResumeFile(null);
    setError("");
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.focus();
    }
  };

  const startInterview = async (event) => {
    event?.preventDefault();

    if (loading) return;

    setError("");

    if (!resumeFile) {
      setError("Upload your PDF resume to start the HR interview.");
      fileRef.current?.focus();
      return;
    }

    try {
      setLoading(true);
      setPhase("Analyzing your resume");

      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("targetRole", targetRole.trim());
      formData.append("targetCompany", targetCompany.trim());

      // Retained for compatibility with the existing API.
      formData.append("jobDescription", "");

      const prepareResponse = await fetch(
        `${API_BASE}/student/ai-interview/resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const prepared = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(
          prepared.message ||
            prepared.error ||
            "Unable to analyze your resume."
        );
      }

      const sessionId = getSessionId(prepared);

      if (!sessionId) {
        throw new Error(
          "Interview session was not returned by the server."
        );
      }

      setPhase("Preparing your HR interviewer");

      const startResponse = await fetch(
        `${API_BASE}/student/ai-interview/${sessionId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const started = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(
          started.message ||
            started.error ||
            "Unable to start your HR interview."
        );
      }

      navigate(
        `/student/ai-interview/${getSessionId(started) || sessionId}`,
        {
          state: {
            interview: started,
            candidate: prepared.candidate || null,
            target: prepared.target || {
              role: targetRole.trim(),
              company: targetCompany.trim(),
            },
          },
        }
      );
    } catch (err) {
      console.error("HR interview start error:", err);
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setPhase("");
    }
  };

  const openHistory = () => {
    setHistoryOpen(true);
    setError("");
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    requestAnimationFrame(() =>
      fileRef.current?.focus({ preventScroll: true })
    );
  };

  return (
    <div className="ai-interview-page hr-page">
      <div className="hr-orb hr-orb-one" />
      <div className="hr-orb hr-orb-two" />

      <div className="hr-shell">
        <header className="hr-header">
          <div className="hr-brand">
            <div className="hr-brand-mark">
              <Mic2 size={23} />
            </div>
            <div>
              <span className="hr-eyebrow">
                PLACIFY · AI CAREER STUDIO
              </span>
              <h1>AI HR Mock Interview</h1>
              <p>
                A personalized, resume-aware interview experience
              </p>
            </div>
          </div>

          <button
            type="button"
            className="hr-back-button"
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </header>

        <div className="hr-main-grid">
          <aside className="hr-hero-panel">
            <div className="hr-hero-top">
              <span className="hr-hero-kicker">
                <Sparkles size={14} />
                YOUR INTERVIEW STARTS HERE
              </span>

              <h2>
                Practice with
                <span> confidence.</span>
                <br />
                Interview with
                <span> clarity.</span>
              </h2>

              <p>
                Meet your AI HR interviewer. Practice authentic
                conversations based on your resume, goals and
                responses.
              </p>
            </div>

            <div className="hr-interviewer-visual">
              <div className="hr-visual-glow" />
              <div className="hr-visual-ring ring-a" />
              <div className="hr-visual-ring ring-b" />

              <div className="hr-ai-avatar">
                <div className="hr-avatar-halo">
                  <Mic2 size={43} strokeWidth={1.5} />
                </div>
              </div>

              <div className="hr-visual-caption">
                <span className="hr-online-dot" />
                PLACIFY AI INTERVIEWER
              </div>

              <div className="hr-voice-wave">
                {Array.from({ length: 21 }, (_, index) => (
                  <span
                    key={index}
                    style={{
                      "--bar": `${12 + ((index * 17) % 32)}px`,
                      "--delay": `${(index % 7) * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="hr-feature-stack">
              <div className="hr-feature">
                <div className="hr-feature-icon">
                  <FileText size={17} />
                </div>
                <div>
                  <strong>Resume-aware questions</strong>
                  <small>
                    Discuss your background, achievements and projects
                  </small>
                </div>
              </div>

              <div className="hr-feature">
                <div className="hr-feature-icon">
                  <Mic2 size={17} />
                </div>
                <div>
                  <strong>Real-time voice interview</strong>
                  <small>
                    Speak naturally with your AI interviewer
                  </small>
                </div>
              </div>

              <div className="hr-feature">
                <div className="hr-feature-icon">
                  <Sparkles size={17} />
                </div>
                <div>
                  <strong>Adaptive conversation</strong>
                  <small>
                    Follow-up questions shaped by your answers
                  </small>
                </div>
              </div>
            </div>
          </aside>

          <section className="hr-workspace">
            {!historyOpen ? (
              <>
                <div className="hr-workspace-header">
                  <div>
                    <span className="hr-section-kicker">
                      INTERVIEW SETUP
                    </span>
                    <h2>Get ready for your interview</h2>
                    <p>
                      Three simple steps to begin your HR practice.
                    </p>
                  </div>
                  <span className="hr-step-pill">
                    <span>01</span> / 03
                  </span>
                </div>

                <form
                  className="hr-setup-form"
                  onSubmit={startInterview}
                >
                  <div className="hr-field">
                    <label htmlFor="hr-resume">
                      <FileText size={15} />
                      Upload Resume
                      <span className="hr-required">Required</span>
                    </label>

                    <div
                      className={
                        resumeFile
                          ? "hr-upload-zone has-file"
                          : "hr-upload-zone"
                      }
                    >
                      <input
                        ref={fileRef}
                        id="hr-resume"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleResumeChange}
                        disabled={loading}
                        aria-label="Upload PDF resume"
                      />

                      <div className="hr-upload-icon">
                        {resumeFile ? (
                          <Check size={23} />
                        ) : (
                          <UploadCloud size={25} />
                        )}
                      </div>

                      <div className="hr-upload-copy">
                        <strong>
                          {resumeFile
                            ? resumeFile.name
                            : "Choose your resume"}
                        </strong>
                        <small>
                          {resumeFile
                            ? "PDF selected · Ready for interview"
                            : "Click to browse · PDF format"}
                        </small>
                      </div>

                      {resumeFile ? (
                        <button
                          type="button"
                          className="hr-upload-remove"
                          onClick={clearResume}
                          disabled={loading}
                          aria-label="Remove resume"
                        >
                          <X size={17} />
                        </button>
                      ) : (
                        <span className="hr-upload-action">
                          Browse
                          <ArrowRight size={14} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hr-form-divider">
                    <span />
                    <small>PERSONALIZE YOUR INTERVIEW</small>
                    <span />
                  </div>

                  <Autocomplete
                    id="hr-role"
                    label="Target Role"
                    icon={BriefcaseBusiness}
                    value={targetRole}
                    onChange={setTargetRole}
                    options={ROLES}
                    placeholder="Search a role, e.g. Java Developer"
                    inputRef={roleRef}
                    nextRef={companyRef}
                    disabled={loading}
                  />

                  <Autocomplete
                    id="hr-company"
                    label="Target Company"
                    icon={Building2}
                    value={targetCompany}
                    onChange={setTargetCompany}
                    options={COMPANIES}
                    placeholder="Search a company, e.g. Google"
                    inputRef={companyRef}
                    nextRef={startRef}
                    disabled={loading}
                  />

                  <div className="hr-privacy-note">
                    <ShieldCheck size={17} />
                    <span>
                      Your resume is used to prepare relevant
                      interview questions. Role and company are optional.
                    </span>
                  </div>

                  {error && (
                    <div className="hr-error" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="hr-form-actions">
                    <button
                      ref={startRef}
                      type="submit"
                      className="hr-start-button"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={19}
                            className="hr-spinner"
                          />
                          {phase || "Preparing..."}
                        </>
                      ) : (
                        <>
                          <Play size={17} fill="currentColor" />
                          Start HR Interview
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="hr-history-button"
                      onClick={openHistory}
                      disabled={loading}
                    >
                      <History size={18} />
                      View Interview History
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <p className="hr-bottom-hint">
                    Press Enter after selecting a company to focus
                    Start Interview.
                  </p>
                </form>
              </>
            ) : (
              <div className="hr-history-view">
                <div className="hr-history-header">
                  <div>
                    <span className="hr-section-kicker">
                      YOUR PROGRESS
                    </span>
                    <h2>Interview History</h2>
                    <p>
                      Review previous sessions and performance reports.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="hr-history-close"
                    onClick={closeHistory}
                    aria-label="Close interview history"
                  >
                    <X size={19} />
                  </button>
                </div>

                <div className="hr-history-toolbar">
                  <span>
                    <History size={15} />
                    {history.length} interview attempts
                  </span>

                  <button
                    type="button"
                    onClick={closeHistory}
                  >
                    <ArrowLeft size={14} />
                    Back to setup
                  </button>
                </div>

                <div className="hr-history-scroll">
                  {historyLoading ? (
                    <div className="hr-history-state">
                      <LoaderCircle
                        size={27}
                        className="hr-spinner"
                      />
                      Loading your interview history...
                    </div>
                  ) : historyError ? (
                    <div
                      className="hr-history-state hr-error"
                      role="alert"
                    >
                      {historyError}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="hr-history-state">
                      <History size={35} />
                      <strong>No interviews yet</strong>
                      <span>
                        Your completed HR interviews will appear here.
                      </span>
                    </div>
                  ) : (
                    history.map((item, index) => {
                      const completed =
                        String(item.status).toLowerCase() ===
                        "completed";

                      const score = Number(
                        item.scores?.overallScore
                      );

                      const date =
                        item.completedAt ||
                        item.startedAt ||
                        item.createdAt;

                      return (
                        <article
                          className="hr-history-card"
                          key={item.sessionId || index}
                        >
                          <div className="hr-history-card-top">
                            <div className="hr-history-card-icon">
                              <Mic2 size={19} />
                            </div>

                            <div className="hr-history-card-title">
                              <strong>
                                {item.target?.role ||
                                  "General HR Interview"}
                              </strong>
                              <span>
                                {item.target?.company ||
                                  "Placify AI"}
                              </span>
                            </div>

                            <span
                              className={
                                completed
                                  ? "hr-status completed"
                                  : "hr-status pending"
                              }
                            >
                              {item.status || "Pending"}
                            </span>
                          </div>

                          <div className="hr-history-card-details">
                            <span>
                              <Clock3 size={13} />
                              {formatDate(date)}
                            </span>

                            <span>
                              <Mic2 size={13} />
                              {item.answeredQuestions || 0} answers
                            </span>

                            <span className="hr-score">
                              {completed && Number.isFinite(score)
                                ? `${Math.round(score)}/100`
                                : "—"}
                            </span>
                          </div>

                          {completed && item.canViewResult ? (
                            <button
                              type="button"
                              className="hr-report-button"
                              onClick={() =>
                                navigate(
                                  `/student/ai-interview/${item.sessionId}/result`
                                )
                              }
                            >
                              View Full Report
                              <ArrowRight size={15} />
                            </button>
                          ) : (
                            <div className="hr-report-unavailable">
                              Report available after completion
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  className="hr-return-button"
                  onClick={closeHistory}
                >
                  <RotateCcw size={16} />
                  Start a New Interview
                </button>
              </div>
            )}
          </section>
        </div>

        <footer className="hr-footer">
          <span>PLACIFY AI · INTERVIEW PREPARATION</span>
          <span>
            <ShieldCheck size={13} />
            Practice. Improve. Succeed.
          </span>
        </footer>
      </div>
    </div>
  );
};

export default StudentInterview;
