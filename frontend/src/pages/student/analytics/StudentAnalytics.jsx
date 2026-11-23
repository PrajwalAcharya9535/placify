
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StudentLayout from "../../../components/student/StudentLayout";
import { fetchPlacementApplications } from "../../../services/placementApplicationService";
import "./StudentAnalytics.css";

const sections = [
  {
    title: "Preparation Progress",
    description: "Track learning, roadmap completion, and overall preparation.",
    icon: "📚",
  },
  {
    title: "Assessment Performance",
    description: "Monitor aptitude, technical, coding, and mock test results.",
    icon: "📊",
  },
  {
    title: "Skill Analysis",
    description: "Identify strong skills, weak areas, and improvement priorities.",
    icon: "🎯",
  },
  {
    title: "Interview Performance",
    description: "Review AI interview feedback and performance trends.",
    icon: "🎤",
  },
  {
    title: "Application Analytics",
    description: "Track applications, shortlisting, interviews, and offers.",
    icon: "💼",
  },
  {
    title: "Job Compatibility",
    description: "Understand how your profile matches target job roles.",
    icon: "🧩",
  },
];

const progressAreas = [
  { name: "Learning Progress", icon: "📚" },
  { name: "Coding Practice", icon: "⌘" },
  { name: "Roadmap Completion", icon: "↟" },
  { name: "Interview Preparation", icon: "◉" },
];

const applicationStages = [
  "Interested",
  "Applied",
  "Assessment",
  "Shortlisted",
  "Technical",
  "HR",
  "Selected",
  "Rejected",
  "Offer",
  "Placed",
];

function isWithinPeriod(dateValue, period) {
  if (period === "All Time") return true;
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const days = {
    "7 Days": 7,
    "30 Days": 30,
    "90 Days": 90,
  }[period];

  if (!days) return true;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return date >= cutoff && date <= new Date();
}

const completedStatuses = new Set(["Completed", "Auto Submitted"]);

function getAnalyticsError(error, fallback) {
  if (error?.code === "ERR_NETWORK") {
    return "Unable to connect to Placify server. Please try again later.";
  }

  return error?.response?.data?.message || error?.message || fallback;
}

function assessmentDate(attempt) {
  return attempt.completedAt || attempt.submittedAt || attempt.createdAt;
}

function AssessmentTrend({ attempts }) {
  const dated = attempts
    .filter((attempt) => Number.isFinite(Number(attempt.overallPercentage)))
    .slice()
    .sort((a, b) => new Date(assessmentDate(a)) - new Date(assessmentDate(b)));

  if (dated.length === 0) {
    return (
      <div className="analytics-chart-empty">
        <div className="analytics-chart-empty-icon" aria-hidden="true">↗</div>
        <h4>No assessment data yet</h4>
        <p>Complete mock assessments to see your score trend.</p>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const left = 42;
  const right = 20;
  const top = 18;
  const bottom = 35;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = dated.map((attempt, index) => {
    const score = Math.max(0, Math.min(100, Number(attempt.overallPercentage)));
    const x = left + (dated.length === 1 ? plotWidth / 2 : index * plotWidth / (dated.length - 1));
    const y = top + (100 - score) / 100 * plotHeight;
    return { x, y, score, date: assessmentDate(attempt), id: attempt._id || index };
  });

  return (
    <div className="analytics-trend-visual" style={{ flex: 1, display: "flex", alignItems: "center", minWidth: 0, padding: "16px 0" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={`Mock assessment scores over time: ${points.map(p => `${p.score}%`).join(", ")}`}>
        {[0, 25, 50, 75, 100].map((score) => {
          const y = top + (100 - score) / 100 * plotHeight;
          return (
            <g key={score}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#334766" strokeDasharray="4 5" />
              <text x={left - 9} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{score}</text>
            </g>
          );
        })}
        {points.length > 1 && (
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke="#60a5fa" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
          />
        )}
        {points.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="5" fill="#60a5fa" stroke="#15233a" strokeWidth="2">
              <title>{`${new Date(point.date).toLocaleDateString()}: ${point.score}%`}</title>
            </circle>
          </g>
        ))}
        {points.length === 1 ? (
          <text x={points[0].x} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize="11">
            {new Date(points[0].date).toLocaleDateString()}
          </text>
        ) : (
          <>
            <text x={left} y={height - 8} fill="#94a3b8" fontSize="11">
              {new Date(points[0].date).toLocaleDateString()}
            </text>
            <text x={width - right} y={height - 8} textAnchor="end" fill="#94a3b8" fontSize="11">
              {new Date(points[points.length - 1].date).toLocaleDateString()}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function StudentAnalytics() {
  const [activePeriod, setActivePeriod] = useState("30 Days");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");
  const [mockAttempts, setMockAttempts] = useState([]);
  const [mockLoading, setMockLoading] = useState(true);
  const [mockError, setMockError] = useState("");
  const [learningProgress, setLearningProgress] = useState(null);
  const [roadmapProgress, setRoadmapProgress] = useState(null);
  const [learningLoading, setLearningLoading] = useState(true);
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [learningError, setLearningError] = useState("");
  const [roadmapError, setRoadmapError] = useState("");
  const [codingProgress, setCodingProgress] = useState(null);
  const [codingLoading, setCodingLoading] = useState(true);
  const [codingError, setCodingError] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(true);
  const [interviewError, setInterviewError] = useState("");
  const [skillGap, setSkillGap] = useState(null);
  const [skillGapLoading, setSkillGapLoading] = useState(true);
  const [skillGapError, setSkillGapError] = useState("");
  const [jobMatches, setJobMatches] = useState([]);
  const [jobOpportunityCount, setJobOpportunityCount] = useState(null);
  const [jobCheckedCount, setJobCheckedCount] = useState(0);
  const [jobMatchLoading, setJobMatchLoading] = useState(true);
  const [jobMatchError, setJobMatchError] = useState("");
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState("");
  const [readinessNotCalculated, setReadinessNotCalculated] = useState(false);
  const [readinessRecalculating, setReadinessRecalculating] = useState(false);


  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("placifyToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    async function loadLearning() {
      try {
        if (!token) throw new Error("Student login required.");
        const [topicsResponse, progressResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/learning`, config),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/learning-progress`, config),
        ]);
        const topics = topicsResponse.data?.topics;
        const completed = progressResponse.data?.summary?.completedTopics;
        if (!Array.isArray(topics) || !Number.isFinite(Number(completed))) {
          throw new Error("Invalid learning progress response.");
        }
        const percent = topics.length > 0
          ? Math.round((Number(completed) / topics.length) * 100)
          : 0;
        if (!cancelled) setLearningProgress(Math.min(100, Math.max(0, percent)));
      } catch (error) {
        if (!cancelled) setLearningError(getAnalyticsError(error, "Learning data unavailable."));
      } finally {
        if (!cancelled) setLearningLoading(false);
      }
    }

    async function loadRoadmap() {
      try {
        if (!token) throw new Error("Student login required.");
        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/roadmap`, config);
        const progress = response.data?.roadmap?.summary?.overallProgress;
        if (progress === null || progress === undefined || !Number.isFinite(Number(progress))) {
          throw new Error("Roadmap progress unavailable.");
        }
        if (!cancelled) setRoadmapProgress(Math.min(100, Math.max(0, Number(progress))));
      } catch (error) {
        if (!cancelled) setRoadmapError(getAnalyticsError(error, "Roadmap data unavailable."));
      } finally {
        if (!cancelled) setRoadmapLoading(false);
      }
    }

    loadLearning();
    loadRoadmap();
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    let cancelled = false;
    async function loadMockHistory() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");
        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/mock-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!Array.isArray(response.data?.attempts)) {
          throw new Error("Invalid mock assessment response.");
        }
        if (!cancelled) setMockAttempts(response.data.attempts);
      } catch (error) {
        if (!cancelled) setMockError(getAnalyticsError(error, "Unable to load mock assessments."));
      } finally {
        if (!cancelled) setMockLoading(false);
      }
    }
    loadMockHistory();
    return () => { cancelled = true; };
  }, []);

  // Coding Practice progress is cumulative, like Learning and Roadmap progress.
  // Only independent Coding Lab attempts count; mock-placement attempts are excluded.
  useEffect(() => {
    let cancelled = false;

    async function loadCodingProgress() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [historyResponse, problemsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/coding/history`, config),
          axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/coding/problems`, config),
        ]);

        const attempts = historyResponse.data?.attempts;
        const problems = problemsResponse.data?.problems;
        if (!Array.isArray(attempts) || !Array.isArray(problems)) {
          throw new Error("Invalid coding progress response.");
        }

        // The problems endpoint returns active problems. Count each active
        // problem at most once, regardless of repeated accepted submissions.
        const activeIds = new Set(problems.map((problem) => String(problem._id)));
        const solvedIds = new Set(
          attempts
            .filter((attempt) =>
              attempt.status === "Accepted" &&
              attempt.isMockAttempt !== true &&
              !attempt.mockAttempt &&
              !attempt.mockTest
            )
            .map((attempt) => {
              const problem = attempt.problem;
              return problem && String(problem._id || problem);
            })
            .filter((id) => id && activeIds.has(id))
        );

        const percent = activeIds.size > 0
          ? Math.round((solvedIds.size / activeIds.size) * 100)
          : 0;
        if (!cancelled) setCodingProgress(Math.min(100, Math.max(0, percent)));
      } catch (error) {
        if (!cancelled) setCodingError(
          getAnalyticsError(error, "Coding data unavailable.")
        );
      } finally {
        if (!cancelled) setCodingLoading(false);
      }
    }

    loadCodingProgress();
    return () => { cancelled = true; };
  }, []);

  // Interview readiness is the mean role-readiness score from completed sessions.
  // It is a performance measure, not a percentage of interview tasks completed.
  useEffect(() => {
    let cancelled = false;
    async function loadInterviews() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");
        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/ai-interview/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!Array.isArray(response.data?.interviews)) {
          throw new Error("Invalid interview history response.");
        }
        if (!cancelled) setInterviews(response.data.interviews);
      } catch (error) {
        if (!cancelled) setInterviewError(
          getAnalyticsError(error, "Interview data unavailable.")
        );
      } finally {
        if (!cancelled) setInterviewLoading(false);
      }
    }
    loadInterviews();
    return () => { cancelled = true; };
  }, []);

  // Skill gap is a current snapshot, not a dated historical assessment.
  useEffect(() => {
    let cancelled = false;

    async function loadSkillGap() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");

        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/skill-gap`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (!data?.success || !data.skillGap || typeof data.skillGap !== "object") {
          throw new Error(data?.message || "Invalid skill gap response.");
        }
        if (!cancelled) setSkillGap(data.skillGap);
      } catch (error) {
        if (!cancelled) setSkillGapError(
          getAnalyticsError(error, "Skill analysis unavailable.")
        );
      } finally {
        if (!cancelled) setSkillGapLoading(false);
      }
    }

    loadSkillGap();
    return () => { cancelled = true; };
  }, []);

  // Job compatibility is a current snapshot of active opportunities.
  // Limit matching to 24 opportunities, with no more than 4 requests in flight.
  useEffect(() => {
    let cancelled = false;

    async function loadJobCompatibility() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/opportunities`, config);
        if (!response.data?.success || !Array.isArray(response.data.opportunities)) {
          throw new Error("Invalid placement opportunities response.");
        }

        const opportunities = response.data.opportunities;
        if (cancelled) return;
        setJobOpportunityCount(opportunities.length);

        const selected = opportunities.slice(0, 24);
        const results = [];
        let nextIndex = 0;
        let failedCount = 0;

        async function worker() {
          while (!cancelled && nextIndex < selected.length) {
            const index = nextIndex++;
            const opportunity = selected[index];
            const id = opportunity?._id;
            if (!id) { failedCount++; continue; }
            try {
              const matchResponse = await axios.get(
                `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/opportunities/${encodeURIComponent(id)}/match`,
                config
              );
              const payload = matchResponse.data;
              const score = payload?.match?.score;
              if (payload?.success && Number.isFinite(score) && score >= 0 && score <= 100 &&
                  typeof payload?.eligibility?.isEligible === "boolean") {
                results.push({
                  id,
                  title: payload.opportunity?.title || opportunity.title || "Opportunity",
                  company: payload.opportunity?.companyName || opportunity.companyName || "",
                  score,
                  eligible: payload.eligibility.isEligible,
                  level: score >= 80 ? "High" : score >= 60 ? "Medium" : "Low",
                });
              } else {
                failedCount++;
              }
            } catch {
              failedCount++;
            }
          }
        }

        await Promise.all(Array.from({ length: Math.min(4, selected.length) }, () => worker()));
        if (cancelled) return;
        setJobMatches(results.sort((a, b) => b.score - a.score));
        setJobCheckedCount(selected.length);
        if (failedCount) {
          setJobMatchError(`${failedCount} match request(s) could not be evaluated.`);
        }
      } catch (error) {
        if (!cancelled) setJobMatchError(
          getAnalyticsError(error, "Job compatibility unavailable.")
        );
      } finally {
        if (!cancelled) setJobMatchLoading(false);
      }
    }

    loadJobCompatibility();
    return () => { cancelled = true; };
  }, []);

  // Read the last saved readiness result; do not recalculate on page load.
  // Readiness is cumulative and independent of the selected analytics period.
  useEffect(() => {
    let cancelled = false;

    async function loadReadiness() {
      try {
        const token = localStorage.getItem("placifyToken");
        if (!token) throw new Error("Student login required.");

        const response = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/readiness`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const record = response.data?.readiness;
        const score = record?.overallScore;
        if (!record || score === null || score === undefined ||
            !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) {
          throw new Error("Invalid placement readiness response.");
        }
        if (!cancelled) setReadiness(record);
      } catch (error) {
        if (cancelled) return;
        if (error.response?.status === 404) {
          setReadinessNotCalculated(true);
        } else {
          setReadinessError(getAnalyticsError(error, "Readiness unavailable."));
        }
      } finally {
        if (!cancelled) setReadinessLoading(false);
      }
    }

    loadReadiness();
    return () => { cancelled = true; };
  }, []);

  async function recalculateReadiness() {
    if (readinessRecalculating) return;
    setReadinessRecalculating(true);
    setReadinessError("");
    try {
      const token = localStorage.getItem("placifyToken");
      if (!token) throw new Error("Student login required.");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5000"}`}/api/student/readiness/calculate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const record = response.data?.readiness;
      const score = record?.overallScore;
      if (!record || score === null || score === undefined ||
          !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) {
        throw new Error("Invalid calculated readiness response.");
      }
      setReadiness(record);
      setReadinessNotCalculated(false);
    } catch (error) {
      setReadinessError(getAnalyticsError(error, "Unable to recalculate readiness."));
    } finally {
      setReadinessRecalculating(false);
    }
  }

  const jobMatchSummary = useMemo(() => {
    const count = jobMatches.length;
    const average = count
      ? Math.round(jobMatches.reduce((sum, item) => sum + item.score, 0) / count)
      : null;
    return {
      average,
      eligible: jobMatches.filter((item) => item.eligible).length,
      high: jobMatches.filter((item) => item.level === "High").length,
      medium: jobMatches.filter((item) => item.level === "Medium").length,
      low: jobMatches.filter((item) => item.level === "Low").length,
      best: jobMatches[0] || null,
    };
  }, [jobMatches]);

  const skillItems = (field) =>
    Array.isArray(skillGap?.[field])
      ? [...new Set(skillGap[field].filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))]
      : [];

  const completedInterviews = useMemo(() => interviews.filter((item) =>
    item.status === "Completed" &&
    isWithinPeriod(item.completedAt || item.updatedAt, activePeriod)
  ), [interviews, activePeriod]);

  const interviewReadinessScores = useMemo(() => completedInterviews
    .map((item) => item.scores?.roleReadinessScore ?? item.roleReadinessScore)
    .filter((score) => score !== null && score !== undefined && score !== "" &&
      Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 100),
  [completedInterviews]);

  const interviewReadiness = interviewReadinessScores.length
    ? Math.round(interviewReadinessScores.reduce((sum, score) => sum + Number(score), 0) /
        interviewReadinessScores.length)
    : null;

  const completedMocks = useMemo(() => mockAttempts.filter((attempt) =>
    completedStatuses.has(attempt.status) &&
    isWithinPeriod(assessmentDate(attempt), activePeriod)
  ), [mockAttempts, activePeriod]);

  // Demo attempts remain visible separately, but never affect Full scores.
  const fullMocks = useMemo(() => completedMocks.filter((attempt) =>
    attempt.practiceMode !== "Demo"
  ), [completedMocks]);
  const demoMocks = useMemo(() => completedMocks.filter((attempt) =>
    attempt.practiceMode === "Demo"
  ), [completedMocks]);

  const scoredMocks = useMemo(() => fullMocks.filter((attempt) =>
    attempt.overallPercentage !== null &&
    attempt.overallPercentage !== undefined &&
    Number.isFinite(Number(attempt.overallPercentage))
  ), [fullMocks]);

  const averageMockScore = scoredMocks.length
    ? Math.round(scoredMocks.reduce((sum, attempt) => sum + Number(attempt.overallPercentage), 0) / scoredMocks.length)
    : null;


  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      setApplicationsLoading(true);
      setApplicationsError("");

      try {
        const result = await fetchPlacementApplications();
        const payload = result?.data ?? result;

        if (!payload?.success || !Array.isArray(payload.applications)) {
          throw new Error(
            payload?.message || "Unable to load application analytics."
          );
        }

        if (!cancelled) {
          setApplications(payload.applications);
        }
      } catch (error) {
        if (!cancelled) {
          setApplicationsError(
            getAnalyticsError(error, "Unable to load applications.")
          );
        }
      } finally {
        if (!cancelled) {
          setApplicationsLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) =>
      isWithinPeriod(
        application.appliedAt ?? application.createdAt,
        activePeriod
      )
    );
  }, [applications, activePeriod]);

  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(
      applicationStages.map((stage) => [stage, 0])
    );

    filteredApplications.forEach((application) => {
      const stage = application.currentStage;

      if (Object.prototype.hasOwnProperty.call(counts, stage)) {
        counts[stage] += 1;
      }
    });

    return counts;
  }, [filteredApplications]);

  const preparationAreas = progressAreas.map((area) => {
    if (area.name === "Learning Progress") {
      return { ...area, value: learningProgress, loading: learningLoading, error: learningError };
    }
    if (area.name === "Coding Practice") {
      return { ...area, value: codingProgress, loading: codingLoading, error: codingError };
    }
    if (area.name === "Roadmap Completion") {
      return { ...area, value: roadmapProgress, loading: roadmapLoading, error: roadmapError };
    }
    return { ...area, value: interviewReadiness, loading: interviewLoading, error: interviewError };
  });

  const metrics = [
    {
      label: "Placement Readiness",
      value: readinessLoading || !readiness ? "—" : `${Math.round(Number(readiness.overallScore))}%`,
      icon: "◎",
      description: readinessLoading
        ? "Loading saved placement readiness..."
        : readinessNotCalculated
        ? "Not calculated yet"
        : !readiness
        ? "Saved readiness unavailable"
        : `${readiness.readinessLevel || "Readiness calculated"}${readiness.lastCalculatedAt && !Number.isNaN(new Date(readiness.lastCalculatedAt).getTime()) ? ` · Updated ${new Date(readiness.lastCalculatedAt).toLocaleDateString()}` : ""}`,
      color: "blue",
      status: readinessLoading ? "Loading readiness..." : readinessNotCalculated ? "Not calculated" : readinessError ? "Unable to load data" : "Saved placement readiness score",
    },
    {
      label: "Assessments Completed",
      value: mockLoading || mockError ? "—" : fullMocks.length,
      icon: "▤",
      description: "Completed Full mock assessments",
      color: "purple",
      status: mockLoading ? "Loading assessments..." : mockError ? "Unable to load data" : `${demoMocks.length} Demo attempt(s) tracked separately`,
    },
    {
      label: "Average Assessment Score",
      value: mockLoading || mockError ? "—" : averageMockScore === null ? "—" : `${averageMockScore}%`,
      icon: "↗",
      description: "Average across completed Full assessments",
      color: "cyan",
      status: mockLoading ? "Loading scores..." : mockError ? "Unable to load data" : scoredMocks.length ? "Full assessment scores" : "No scored Full assessments yet",
    },
    {
      label: "Job Applications",
      value: applicationsLoading || applicationsError
        ? "—"
        : filteredApplications.length,
      icon: "▣",
      description: "Applications started during the selected period",
      color: "green",
      status: applicationsLoading
        ? "Loading applications..."
        : applicationsError
        ? "Unable to load data"
        : "Live application data",
    },
  ];

  return (
    <StudentLayout>
      <div className="student-analytics">

        {/* HEADER */}
        <header className="analytics-header">
          <div>
            <p className="analytics-eyebrow">
              PLACIFY / PERFORMANCE
            </p>

            <h1>Placement Analytics</h1>

            <p>
              Understand your preparation, measure your progress,
              and improve your placement readiness.
            </p>
          </div>

          <select
            value={activePeriod}
            onChange={(event) => setActivePeriod(event.target.value)}
            className="analytics-period-select"
            aria-label="Analytics time period"
          >
            <option>7 Days</option>
            <option>30 Days</option>
            <option>90 Days</option>
            <option>All Time</option>
          </select>
        </header>

        {/* PERFORMANCE OVERVIEW */}
        <section className="analytics-overview">
          <div className="analytics-overview-heading">
            <h2>Performance Overview</h2>
            <span>
              {applicationsLoading || mockLoading
                ? "Loading student data"
                : applicationsError || mockError
                ? "Some data unavailable"
                : "Applications & assessments connected"}
            </span>
          </div>

          <div className="analytics-kpi-grid">
            {metrics.map((metric) => (
              <article
                className={`analytics-kpi-card analytics-kpi-${metric.color}`}
                key={metric.label}
              >
                <div className="analytics-kpi-top">
                  <span className="analytics-kpi-label">
                    {metric.label}
                  </span>

                  <span
                    className="analytics-kpi-icon"
                    aria-hidden="true"
                  >
                    {metric.icon}
                  </span>
                </div>

                <div className="analytics-kpi-value">
                  {metric.value}
                </div>

                <p className="analytics-kpi-description">
                  {metric.description}
                </p>

                <div className="analytics-kpi-bottom">
                  <span className="analytics-kpi-dot" />
                  {metric.status}
                </div>
                {metric.label === "Placement Readiness" && (
                  <button
                    type="button"
                    onClick={recalculateReadiness}
                    disabled={readinessLoading || readinessRecalculating}
                    aria-busy={readinessRecalculating}
                    style={{
                      marginTop: 12,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #3b82f6",
                      background: "rgba(59,130,246,0.12)",
                      color: "#bfdbfe",
                      fontWeight: 600,
                      cursor: readinessLoading || readinessRecalculating ? "not-allowed" : "pointer",
                      opacity: readinessLoading || readinessRecalculating ? 0.65 : 1,
                    }}
                  >
                    {readinessRecalculating ? "Recalculating..." : "Recalculate Readiness"}
                  </button>
                )}
              </article>
            ))}
          </div>

          {applicationsError && (
            <p className="analytics-data-error" role="alert">{applicationsError}</p>
          )}
          {mockError && (
            <p className="analytics-data-error" role="alert">{mockError}</p>
          )}
          {interviewError && (
            <p className="analytics-data-error" role="alert">{interviewError}</p>
          )}
          {readinessError && (
            <p className="analytics-data-error" role="alert">{readinessError}</p>
          )}
        </section>

        {/* PERFORMANCE INSIGHTS */}
        <section className="analytics-charts-section">
          <div className="analytics-section-heading">
            <h2>Performance Insights</h2>
            <p>
              Visualize your assessment results and preparation progress.
            </p>
          </div>

          <div className="analytics-charts-grid">

            <article className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div>
                  <h3>Assessment Performance Trend</h3>
                  <p>Your test scores over the selected period</p>
                </div>

                <span className="analytics-chart-icon">↗</span>
              </div>

              {mockLoading ? (
                <div className="analytics-chart-empty"><p>Loading assessment scores...</p></div>
              ) : mockError ? (
                <div className="analytics-chart-empty"><p role="alert">{mockError}</p></div>
              ) : (
                <AssessmentTrend attempts={scoredMocks} />
              )}

              <div className="analytics-chart-footer">
                <span className="analytics-kpi-dot" />
                {mockError ? "Assessment data unavailable" : `${fullMocks.length} Full · ${demoMocks.length} Demo completed in ${activePeriod.toLowerCase()}`}
              </div>
            </article>

            <article className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div>
                  <h3>Preparation Progress</h3>
                  <p>Learning, coding, roadmap progress and interview role readiness</p>
                </div>

                <span className="analytics-chart-icon">◎</span>
              </div>

              <div className="analytics-progress-list">
                {preparationAreas.map((area) => (
                  <div
                    className="analytics-progress-item"
                    key={area.name}
                  >
                    <div className="analytics-progress-info">
                      <span className="analytics-progress-name">
                        <span aria-hidden="true">{area.icon}</span>
                        {area.name === "Interview Preparation" ? "Interview Readiness" : area.name}
                      </span>

                      <span className="analytics-progress-value">
                        {area.loading ? "…" : area.error || area.value === null ? "—" : `${area.value}%`}
                      </span>
                    </div>

                    <div className="analytics-progress-track">
                      <div
                        className="analytics-progress-fill"
                        style={{ width: `${area.error || area.value === null ? 0 : area.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="analytics-chart-footer">
                <span className="analytics-kpi-dot" />
                {learningLoading || roadmapLoading || codingLoading || interviewLoading
                  ? "Loading preparation progress..."
                  : learningError || roadmapError || codingError || interviewError
                  ? "Some preparation data is unavailable"
                  : interviewReadiness === null
? "Learning, coding and roadmap connected · No interview readiness score available"
: "Learning, coding, roadmap and interview scores connected"}
              </div>
            </article>

          </div>
        </section>

        {/* APPLICATION STAGE BREAKDOWN */}
        <section className="analytics-overview">
          <div className="analytics-overview-heading">
            <h2>Application Stage Breakdown</h2>
            <span>{activePeriod}</span>
          </div>

          {applicationsLoading ? (
            <p className="analytics-breakdown-message">
              Loading application statistics...
            </p>
          ) : applicationsError ? (
            <p className="analytics-breakdown-message">
              Application statistics are unavailable.
            </p>
          ) : (
            <div className="analytics-stage-grid">
              {applicationStages.map((stage) => (
                <div className="analytics-stage-item" key={stage}>
                  <span>{stage}</span>
                  <strong>{stageCounts[stage]}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PERFORMANCE CATEGORIES */}
        <section className="analytics-sections">
          <div className="analytics-section-heading">
            <h2>Performance Categories</h2>
            <p>Six connected areas of your placement preparation.</p>
          </div>

          <div className="analytics-category-grid">
            {sections.map((section) => (
              <article
                className="analytics-category-card"
                key={section.title}
              >
                <div className="analytics-category-icon">
                  {section.icon}
                </div>

                <h3>{section.title}</h3>
                <p>{section.description}</p>

                <span className="analytics-category-status">
                  {section.title === "Application Analytics" && !applicationsLoading && !applicationsError
                    ? "Connected to placement tracker"
                    : section.title === "Assessment Performance" && !mockLoading && !mockError
                    ? "Connected to mock assessments"
                    : section.title === "Preparation Progress" && !learningLoading && !roadmapLoading && !codingLoading && !learningError && !roadmapError && !codingError
                    ? "Learning, coding and roadmap connected"
                    : section.title === "Skill Analysis"
                    ? skillGapLoading
                      ? "Loading skill analysis..."
                      : skillGapError
                      ? "Skill analysis unavailable"
                      : `${skillItems("strongAreas").length} strengths · ${skillItems("missingSkills").length} missing skills · ${skillItems("priorityAreas").length} priorities`
                    : section.title === "Interview Performance"
                    ? interviewLoading
                      ? "Loading interview history..."
                      : interviewError
                      ? "Interview data unavailable"
                      : completedInterviews.length
                      ? `${completedInterviews.length} completed interview(s) in ${activePeriod.toLowerCase()} · ${interviewReadiness === null ? "Readiness score unavailable" : `${interviewReadiness}% average role readiness`}`
                      : `No completed interviews in ${activePeriod.toLowerCase()}`
                    : section.title === "Job Compatibility"
                    ? jobMatchLoading
                      ? "Evaluating active opportunities..."
                      : jobOpportunityCount === null
                      ? "Job compatibility unavailable"
                      : jobOpportunityCount === 0
                      ? "No active opportunities available"
                      : jobMatches.length === 0
                      ? "No opportunities could be evaluated"
                      : `${jobMatches.length} evaluated of ${jobOpportunityCount} active · ${jobMatchSummary.average}% average match`
                    : "Awaiting activity data"}
                </span>
                {section.title === "Skill Analysis" && !skillGapLoading && !skillGapError && skillGap && (
                  <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.7, color: "#a9bfda" }}>
                    {[
                      ["Strong areas", skillItems("strongAreas")],
                      ["Missing skills", skillItems("missingSkills")],
                      ["Weak areas", skillItems("weakAreas")],
                      ["Priorities", skillItems("priorityAreas")],
                    ].map(([label, values]) => (
                      <p key={label} style={{ margin: "4px 0", overflowWrap: "anywhere" }}>
                        <strong style={{ color: "#dbeafe" }}>{label}:</strong>{" "}
                        {values.length ? values.slice(0, 3).join(", ") + (values.length > 3 ? ` +${values.length - 3} more` : "") : "None identified"}
                      </p>
                    ))}
                    {skillGap.targetRole && (
                      <p style={{ margin: "4px 0", overflowWrap: "anywhere" }}>
                        <strong style={{ color: "#dbeafe" }}>Target role:</strong> {skillGap.targetRole}
                      </p>
                    )}
                  </div>
                )}
                  {section.title === "Job Compatibility" && !jobMatchLoading && jobOpportunityCount !== null && (
                    <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.7, color: "#a9bfda" }}>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#dbeafe" }}>Active opportunities:</strong> {jobOpportunityCount}</p>
                      <p style={{ margin: "4px 0" }}><strong style={{ color: "#dbeafe" }}>Evaluated:</strong> {jobMatches.length} of {jobCheckedCount} checked (maximum 24)</p>
                      {jobMatches.length > 0 && (
                        <>
                          <p style={{ margin: "4px 0" }}><strong style={{ color: "#dbeafe" }}>Academically eligible:</strong> {jobMatchSummary.eligible} of {jobMatches.length} evaluated</p>
                          <p style={{ margin: "4px 0" }}><strong style={{ color: "#dbeafe" }}>Match levels:</strong> {jobMatchSummary.high} high · {jobMatchSummary.medium} medium · {jobMatchSummary.low} low</p>
                          <p style={{ margin: "4px 0", overflowWrap: "anywhere" }}><strong style={{ color: "#dbeafe" }}>Best match:</strong> {jobMatchSummary.best.title}{jobMatchSummary.best.company ? ` · ${jobMatchSummary.best.company}` : ""} ({jobMatchSummary.best.score}%)</p>
                        </>
                      )}
                      {jobMatchError && <p role="status" style={{ margin: "4px 0", color: "#fbbf24" }}>{jobMatchError}</p>}
                      {jobOpportunityCount > jobCheckedCount && <p style={{ margin: "4px 0" }}>Showing the first {jobCheckedCount} opportunities by deadline; results are not market-wide.</p>}
                    </div>
                  )}
                  {section.title === "Job Compatibility" && !jobMatchLoading && jobOpportunityCount === null && jobMatchError && (
                    <p className="analytics-data-error" role="alert">{jobMatchError}</p>
                  )}
                </article>
              ))}
          </div>
        </section>

        <footer className="analytics-footer">
          Analytics uses actual Placify records.
          Unavailable metrics are not estimated.
        </footer>

      </div>
    </StudentLayout>
  );
}
