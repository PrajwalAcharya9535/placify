
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentLearning.css";

// ============================================================
// PLACIFY - STUDENT LEARNING CENTER
// ============================================================

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

// ============================================================
// SVG ICONS
// ============================================================

const ICONS = {
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  bookmark: (
    <path d="M6 3h12v18l-6-4-6 4V3Z" />
  ),
  sparkles: (
    <>
      <path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1L12 2Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  sort: (
    <>
      <path d="M7 20V4m-4 4 4-4 4 4" />
      <path d="M17 4v16m-4-4 4 4 4-4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </>
  ),
  code: (
    <>
      <path d="m8 17-5-5 5-5" />
      <path d="m16 7 5 5-5 5" />
      <path d="m14 4-4 16" />
    </>
  ),
  brain: (
    <>
      <path d="M12 18V5a3 3 0 0 0-5.8-1A4 4 0 0 0 4 10a4 4 0 0 0 2 7 3 3 0 0 0 6 1Z" />
      <path d="M12 18V5a3 3 0 0 1 5.8-1A4 4 0 0 1 20 10a4 4 0 0 1-2 7 3 3 0 0 1-6 1Z" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8 6h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  message: (
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" />
  ),
  network: (
    <>
      <rect x="8" y="2" width="8" height="7" rx="1" />
      <rect x="2" y="16" width="8" height="6" rx="1" />
      <rect x="14" y="16" width="8" height="6" rx="1" />
      <path d="M12 9v4M6 16v-3h12v3" />
    </>
  ),
  cpu: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m0 6h4" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6m0 4h.01" />
    </>
  ),
  reset: (
    <>
      <path d="M3 11a9 9 0 1 1 3 7" />
      <path d="M3 4v7h7" />
    </>
  ),
};

function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.book}
    </svg>
  );
}

// ============================================================
// COURSE LOGO CONFIGURATION
// ============================================================

const TECHNOLOGY_LOGOS = [
  {
    regex: /spring boot|spring framework/i,
    logo: "springboot",
    color: "green",
    icon: "code",
  },
  {
    regex: /rest api/i,
    logo: null,
    color: "violet",
    icon: "code",
  },
  {
    regex: /javascript/i,
    logo: "javascript",
    color: "yellow",
    icon: "code",
  },
  {
    regex: /typescript/i,
    logo: "typescript",
    color: "blue",
    icon: "code",
  },
  {
    regex: /python/i,
    logo: "python",
    color: "blue",
    icon: "code",
  },
  {
    regex: /java/i,
    logo: "openjdk",
    color: "orange",
    icon: "code",
  },
  {
    regex: /react/i,
    logo: "react",
    color: "cyan",
    icon: "code",
  },
  {
    regex: /node\.?js/i,
    logo: "nodedotjs",
    color: "green",
    icon: "code",
  },
  {
    regex: /mongodb/i,
    logo: "mongodb",
    color: "green",
    icon: "database",
  },
  {
    regex: /html/i,
    logo: "html5",
    color: "orange",
    icon: "code",
  },
  {
    regex: /css/i,
    logo: "css3",
    color: "blue",
    icon: "code",
  },
  {
    regex: /git\b/i,
    logo: "git",
    color: "orange",
    icon: "code",
  },
];

function getCourseAppearance(topic = {}) {
  const title = String(topic.title || "");
  const category = String(topic.category || "");

  const technology = TECHNOLOGY_LOGOS.find((item) =>
    item.regex.test(title)
  );

  if (technology) {
    return technology;
  }

  const text = `${title} ${category}`;

  if (/sql|database|dbms/i.test(text)) {
    return { color: "orange", icon: "database" };
  }

  if (/data structure|algorithm|dsa|stack|queue|tree/i.test(text)) {
    return { color: "pink", icon: "brain" };
  }

  if (/object.oriented|oop/i.test(text)) {
    return { color: "violet", icon: "layers" };
  }

  if (/aptitude|quantitative|arithmetic/i.test(text)) {
    return { color: "amber", icon: "calculator" };
  }

  if (/reasoning|logical/i.test(text)) {
    return { color: "pink", icon: "brain" };
  }

  if (/network/i.test(text)) {
    return { color: "cyan", icon: "network" };
  }

  if (/operating system|computer architecture/i.test(text)) {
    return { color: "blue", icon: "cpu" };
  }

  if (/verbal|communication|interview|discussion|english/i.test(text)) {
    return { color: "violet", icon: "message" };
  }

  if (/programming|coding|development/i.test(text)) {
    return { color: "blue", icon: "code" };
  }

  return { color: "blue", icon: "book" };
}

function CourseLogo({ topic, small = false }) {
  const appearance = getCourseAppearance(topic);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [appearance.logo]);

  return (
    <div
      className={`pl-course-logo pl-logo-${appearance.color} ${
        small ? "pl-logo-small" : ""
      }`}
      aria-hidden="true"
    >
      {appearance.logo && !failed ? (
        <img
          src={`https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/${appearance.logo}.svg`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon
          name={appearance.icon}
          size={small ? 23 : 30}
        />
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function clamp(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, Math.min(100, number))
    : 0;
}

function formatDuration(minutes) {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "Self-paced";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}

function ProgressBar({ value }) {
  return (
    <div
      className="pl-progress-track"
      role="progressbar"
      aria-valuenow={clamp(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="pl-progress-fill"
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}

// ============================================================
// STATISTICS
// ============================================================

function LearningStats({ total, summary }) {
  const cards = [
    {
      label: "Total Topics",
      value: total,
      icon: "book",
      color: "blue",
    },
    {
      label: "Started",
      value: summary.totalStarted || 0,
      icon: "play",
      color: "green",
    },
    {
      label: "In Progress",
      value: summary.inProgressTopics || 0,
      icon: "clock",
      color: "amber",
    },
    {
      label: "Completed",
      value: summary.completedTopics || 0,
      icon: "check",
      color: "violet",
    },
  ];

  return (
    <div className="pl-stats-grid">
      {cards.map((card) => (
        <div
          className={`pl-stat-card pl-stat-${card.color}`}
          key={card.label}
        >
          <div className="pl-stat-icon">
            <Icon name={card.icon} size={27} />
          </div>

          <div className="pl-stat-info">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>

          <div className="pl-stat-decoration" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COURSE CARD - REFERENCE DESIGN
// ============================================================

function CourseCard({
  topic,
  percentage,
  updating,
  bookmarked,
  onBookmark,
  onOpen,
  listView,
}) {
  const appearance = getCourseAppearance(topic);

  const completed = percentage >= 100;
  const started = percentage > 0;

  return (
    <article
      className={`pl-topic-card pl-accent-${appearance.color} ${
        listView ? "pl-topic-card-list" : ""
      }`}
    >
      <div className="pl-topic-main">
        <CourseLogo topic={topic} />

        <div className="pl-topic-details">
          <div className="pl-topic-title-row">
            <h3>{topic.title}</h3>

            <button
              type="button"
              className={`pl-bookmark-btn ${
                bookmarked ? "active" : ""
              }`}
              onClick={() => onBookmark(topic._id)}
              aria-label={
                bookmarked
                  ? `Remove ${topic.title} bookmark`
                  : `Bookmark ${topic.title}`
              }
              aria-pressed={bookmarked}
            >
              <Icon name="bookmark" size={18} />
            </button>
          </div>

          <p className="pl-topic-description">
            {topic.description ||
              "Build your knowledge and placement skills."}
          </p>

          <div className="pl-topic-progress">
            <ProgressBar value={percentage} />
            <strong>{percentage}%</strong>
          </div>
        </div>
      </div>

      <div className="pl-topic-footer">
        <div className="pl-topic-tags">
          <span className="pl-category-tag">
            {topic.category || "General"}
          </span>

          <span className="pl-difficulty-tag">
            {topic.difficulty || "Beginner"}
          </span>
        </div>

        <span className="pl-topic-duration">
          <Icon name="clock" size={16} />
          {formatDuration(topic.estimatedMinutes)}
        </span>

        <button
          type="button"
          className="pl-topic-open-button"
          onClick={() => onOpen(topic)}
          disabled={updating}
        >
          {updating
            ? "Opening..."
            : completed
            ? "Review"
            : started
            ? "Continue"
            : "Start"}

          <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  );
}

// ============================================================
// COMPACT RECOMMENDATION ROW
// ============================================================

function RecommendationRow({
  recommendation,
  progress,
  onOpen,
}) {
  const topic = recommendation.topic;

  if (!topic) return null;

  const score = Number(recommendation.matchScore);

  return (
    <button
      type="button"
      className="pl-recommend-row"
      onClick={() => onOpen(topic)}
    >
      <CourseLogo topic={topic} small />

      <div className="pl-recommend-row-info">
        <strong>{topic.title}</strong>

        <span>
          {topic.difficulty || "Beginner"}
          <span className="pl-meta-dot">·</span>
          {formatDuration(topic.estimatedMinutes)}
        </span>
      </div>

      <span className="pl-recommend-score">
        {Number.isFinite(score)
          ? `${clamp(score)}%`
          : `${clamp(progress)}%`}
      </span>

      <Icon
        name="chevron"
        size={18}
        className="pl-recommend-chevron"
      />
    </button>
  );
}

// ============================================================
// CIRCULAR PROGRESS PANEL
// ============================================================

function LearningProgressPanel({ summary, total }) {
  const completed = summary.completedTopics || 0;
  const inProgress = summary.inProgressTopics || 0;

  const notStarted = Math.max(
    0,
    total - completed - inProgress
  );

  const overall = total > 0
    ? Math.round((completed / total) * 100)
    : 0;

  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="pl-side-card pl-progress-panel">
      <div className="pl-side-card-heading">
        <Icon name="target" size={21} />
        <h2>Your Learning Progress</h2>
      </div>

      <div className="pl-overall-progress-content">
        <div className="pl-circular-progress">
          <svg
            viewBox="0 0 120 120"
            width="124"
            height="124"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e2e8f3"
              strokeWidth="10"
            />

            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#13b85b"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference *
                (1 - overall / 100)
              }
              transform="rotate(-90 60 60)"
            />
          </svg>

          <div className="pl-circle-value">
            <strong>{overall}%</strong>
          </div>

          <span>Overall Progress</span>
        </div>

        <div className="pl-progress-legend">
          <div>
            <span className="pl-legend-dot green" />
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>

          <div>
            <span className="pl-legend-dot blue" />
            <span>In Progress</span>
            <strong>{inProgress}</strong>
          </div>

          <div>
            <span className="pl-legend-dot gray" />
            <span>Not Started</span>
            <strong>{notStarted}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function StudentLearning() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState([]);

  const [summary, setSummary] = useState({
    totalStarted: 0,
    inProgressTopics: 0,
    completedTopics: 0,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingTopic, setUpdatingTopic] = useState(null);

  // Bookmarks are local to this browser.
  // No bookmark backend API is assumed.
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("placifyLearningBookmarks") || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const token = localStorage.getItem("placifyToken");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  // ==========================================================
  // FETCH DATA
  // ==========================================================

  const fetchLearningData = useCallback(
    async (showLoader = true) => {
      if (!token) {
        navigate("/login", { replace: true });
        return false;
      }

      try {
        if (showLoader) setLoading(true);
        setError("");

        const [
          topicsResponse,
          recommendationsResponse,
          progressResponse,
        ] = await Promise.all([
          axios.get(
            `${API_BASE}/learning`,
            authConfig
          ),
          axios.get(
            `${API_BASE}/learning/recommendations`,
            authConfig
          ),
          axios.get(
            `${API_BASE}/learning-progress`,
            authConfig
          ),
        ]);

        setTopics(
          topicsResponse.data?.topics || []
        );

        setRecommendations(
          recommendationsResponse.data?.recommendations || []
        );

        setProgress(
          progressResponse.data?.progress || []
        );

        setSummary(
          progressResponse.data?.summary || {
            totalStarted: 0,
            inProgressTopics: 0,
            completedTopics: 0,
          }
        );

        return true;
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem("placifyToken");
          localStorage.removeItem("placifyUser");

          navigate("/login", {
            replace: true,
          });

          return false;
        }

        setError(
          err.response?.data?.message ||
          "Unable to load learning data."
        );

        return false;
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [token, authConfig, navigate]
  );

  useEffect(() => {
    fetchLearningData();
  }, [fetchLearningData]);

  // ==========================================================
  // PROGRESS LOOKUP
  // ==========================================================

  const progressMap = useMemo(() => {
    const map = {};

    progress.forEach((item) => {
      const topicId =
        item.topic?._id ||
        item.topic ||
        item.topicId;

      if (topicId) {
        map[String(topicId)] = item;
      }
    });

    return map;
  }, [progress]);

  const getProgress = (topicId) => {
    return clamp(
      progressMap[String(topicId)]?.progressPercentage ?? 0
    );
  };

  // ==========================================================
  // CATEGORY OPTIONS
  // ==========================================================

  const categories = useMemo(() => {
    return [
      ...new Set(
        topics
          .map((topic) => topic.category)
          .filter(Boolean)
      ),
    ];
  }, [topics]);

  const difficulties = useMemo(() => {
    return [
      ...new Set(
        topics
          .map((topic) => topic.difficulty)
          .filter(Boolean)
      ),
    ];
  }, [topics]);

  // ==========================================================
  // RECOMMENDATION RANKING
  // ==========================================================

  const recommendationMap = useMemo(() => {
    const map = {};

    recommendations.forEach((item) => {
      if (item.topic?._id) {
        map[String(item.topic._id)] =
          Number(item.matchScore) || 0;
      }
    });

    return map;
  }, [recommendations]);

  // ==========================================================
  // SEARCH / FILTER / SORT
  // ==========================================================

  const filteredTopics = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = topics.filter((topic) => {
      const searchable = [
        topic.title,
        topic.description,
        ...(Array.isArray(topic.skillsCovered)
          ? topic.skillsCovered
          : []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchable.includes(term);

      const matchesCategory =
        !category || topic.category === category;

      const matchesDifficulty =
        !difficulty || topic.difficulty === difficulty;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "az") {
        return String(a.title || "").localeCompare(
          String(b.title || "")
        );
      }

      if (sortBy === "za") {
        return String(b.title || "").localeCompare(
          String(a.title || "")
        );
      }

      if (sortBy === "progress") {
        return (
          clamp(
            progressMap[String(b._id)]?.progressPercentage
          ) -
          clamp(
            progressMap[String(a._id)]?.progressPercentage
          )
        );
      }

      if (sortBy === "duration") {
        return (
          (Number(a.estimatedMinutes) || Infinity) -
          (Number(b.estimatedMinutes) || Infinity)
        );
      }

      // Recommended sort uses real backend scores.
      // Topics without a score retain their relative order.
      return (
        (recommendationMap[String(b._id)] || 0) -
        (recommendationMap[String(a._id)] || 0)
      );
    });
  }, [
    topics,
    search,
    category,
    difficulty,
    sortBy,
    progressMap,
    recommendationMap,
  ]);

  // ==========================================================
  // BOOKMARK
  // ==========================================================

  const toggleBookmark = (topicId) => {
    setBookmarks((current) => {
      const id = String(topicId);

      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      localStorage.setItem(
        "placifyLearningBookmarks",
        JSON.stringify(next)
      );

      return next;
    });
  };

  // ==========================================================
  // UPDATE PROGRESS
  // ==========================================================

  const updateProgress = async (topicId, percentage) => {
    try {
      setUpdatingTopic(topicId);
      setError("");

      await axios.put(
        `${API_BASE}/learning-progress`,
        {
          topicId,
          progressPercentage: percentage,
        },
        authConfig
      );

      return await fetchLearningData(false);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("placifyToken");
        localStorage.removeItem("placifyUser");

        navigate("/login", {
          replace: true,
        });

        return false;
      }

      setError(
        err.response?.data?.message ||
        "Unable to update learning progress."
      );

      return false;
    } finally {
      setUpdatingTopic(null);
    }
  };

  // ==========================================================
  // OPEN COURSE
  // ==========================================================

  const handleOpenTopic = async (topic) => {
    if (!topic?._id || updatingTopic) return;

    const currentProgress = getProgress(topic._id);

    if (currentProgress === 0) {
      const success = await updateProgress(
        topic._id,
        1
      );

      if (!success) return;
    }

    navigate(
      `/student/learning/${topic._id}`
    );
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setDifficulty("");
    setSortBy("recommended");
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(category) ||
    Boolean(difficulty) ||
    sortBy !== "recommended";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <StudentLayout>
        <main className="pl-learning-page">
          <div className="pl-loading-state">
            <div className="pl-loading-spinner" />
            <h2>Loading Learning Center</h2>
            <p>Preparing your courses...</p>
          </div>
        </main>
      </StudentLayout>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && topics.length === 0) {
    return (
      <StudentLayout>
        <main className="pl-learning-page">
          <div className="pl-error-state">
            <Icon name="alert" size={34} />
            <h2>Unable to load courses</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchLearningData()}
            >
              Try Again
            </button>
          </div>
        </main>
      </StudentLayout>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <StudentLayout>
      <main className="pl-learning-page">

        {/* ================================================
            FIXED TOP AREA
           ================================================ */}

        <header className="pl-learning-fixed-header">

          <div className="pl-learning-title-row">
            <h1>Learning Center</h1>

            <div className="pl-learning-flow">
              <Icon name="target" size={21} />
              <span>Learn</span>
              <Icon name="arrow" size={17} />
              <span>Practice</span>
              <Icon name="arrow" size={17} />
              <span>Improve</span>
            </div>
          </div>

          <LearningStats
            total={topics.length}
            summary={summary}
          />

        </header>

        {/* ================================================
            SEARCH AND FILTER TOOLBAR
           ================================================ */}

        <section className="pl-toolbar">

          <div className="pl-toolbar-search">
            <Icon name="search" size={21} />

            <input
              type="search"
              placeholder="Search topics, skills or keywords..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Search learning topics"
            />
          </div>

          <div className="pl-toolbar-select">
            <Icon name="grid" size={19} />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label="Select category"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="pl-toolbar-select">
            <Icon name="sort" size={19} />

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value)
              }
              aria-label="Select difficulty"
            >
              <option value="">All Levels</option>

              {difficulties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="pl-toolbar-select">
            <Icon name="sort" size={19} />

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              aria-label="Sort courses"
            >
              <option value="recommended">
                Recommended
              </option>

              <option value="az">
                Name A-Z
              </option>

              <option value="za">
                Name Z-A
              </option>

              <option value="progress">
                Highest Progress
              </option>

              <option value="duration">
                Shortest Duration
              </option>
            </select>
          </div>

          <button
            type="button"
            className={`pl-toolbar-filter-button ${
              showFilters ? "active" : ""
            }`}
            onClick={() =>
              setShowFilters((current) => !current)
            }
            aria-label="Show additional filters"
            aria-expanded={showFilters}
          >
            <Icon name="filter" size={21} />
          </button>

        </section>

        {showFilters && (
          <div className="pl-extra-filters">
            <span>
              {filteredTopics.length} of {topics.length} topics
            </span>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <Icon name="reset" size={16} />
              Clear Filters
            </button>
          </div>
        )}

        {error && (
          <div
            className="pl-inline-error"
            role="alert"
          >
            <Icon name="alert" size={17} />
            {error}
          </div>
        )}

        {/* ================================================
            MAIN TWO-COLUMN DASHBOARD
           ================================================ */}

        <div className="pl-learning-dashboard">

          {/* ============================================
              LEFT: COURSE LIBRARY
             ============================================ */}

          <section className="pl-library-column">

            <div className="pl-library-heading">

              <div className="pl-library-title">
                <h2>
                  All Learning Topics
                  <span> ({filteredTopics.length})</span>
                </h2>
              </div>

              <div className="pl-view-toggle">
                <button
                  type="button"
                  className={
                    viewMode === "grid" ? "active" : ""
                  }
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                >
                  <Icon name="grid" size={16} />
                  Grid View
                </button>

                <button
                  type="button"
                  className={
                    viewMode === "list" ? "active" : ""
                  }
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                >
                  <Icon name="list" size={16} />
                  List View
                </button>
              </div>

            </div>

            <div className="pl-course-scroll-area">

              {filteredTopics.length > 0 ? (
                <div
                  className={`pl-course-grid ${
                    viewMode === "list"
                      ? "pl-course-list-view"
                      : ""
                  }`}
                >
                  {filteredTopics.map((topic) => (
                    <CourseCard
                      key={topic._id}
                      topic={topic}
                      percentage={getProgress(topic._id)}
                      updating={
                        updatingTopic === topic._id
                      }
                      bookmarked={bookmarks.includes(
                        String(topic._id)
                      )}
                      onBookmark={toggleBookmark}
                      onOpen={handleOpenTopic}
                      listView={viewMode === "list"}
                    />
                  ))}
                </div>
              ) : (
                <div className="pl-no-courses">
                  <Icon name="search" size={32} />

                  <h3>No courses found</h3>

                  <p>
                    Try changing your search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            </div>

          </section>

          {/* ============================================
              RIGHT: AI RECOMMENDATIONS AND PROGRESS
             ============================================ */}

          <aside className="pl-learning-sidebar">

            <section className="pl-side-card pl-recommendations-panel">

              <div className="pl-side-card-heading">
                <div className="pl-side-title">
                  <Icon name="sparkles" size={21} />
                  <h2>Recommended for You</h2>
                </div>

                <span className="pl-ai-badge">
                  <Icon name="sparkles" size={13} />
                  AI Match
                </span>
              </div>

              {recommendations.length > 0 ? (
                <>
                  <div className="pl-recommendations-list">
                    {recommendations
                      .slice(0, 3)
                      .map((item, index) => (
                        <RecommendationRow
                          key={
                            item.topic?._id ||
                            `recommendation-${index}`
                          }
                          recommendation={item}
                          progress={getProgress(
                            item.topic?._id
                          )}
                          onOpen={handleOpenTopic}
                        />
                      ))}
                  </div>

                  <button
                    type="button"
                    className="pl-view-all-recommendations"
                    onClick={() => {
                      setSortBy("recommended");

                      document
                        .querySelector(
                          ".pl-library-column"
                        )
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                        });
                    }}
                  >
                    View all recommendations
                    <Icon name="arrow" size={17} />
                  </button>
                </>
              ) : (
                <div className="pl-no-recommendations">
                  <Icon name="sparkles" size={27} />

                  <p>
                    Your personalized recommendations
                    will appear here.
                  </p>
                </div>
              )}

            </section>

            <LearningProgressPanel
              summary={summary}
              total={topics.length}
            />

          </aside>

        </div>

      </main>
    </StudentLayout>
  );
}
