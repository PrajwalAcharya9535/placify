import React, {
  useEffect,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./AIInterviewResult.css";
const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const AIInterviewResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const navigationResult =
  location.state?.interviewResult || null;

const [data, setData] =
  useState(navigationResult);

const [isLoading, setIsLoading] =
  useState(!navigationResult);

const [loadError, setLoadError] =
  useState("");

const candidate =
  data?.candidate ||
  location.state?.candidate ||
  null;

const target =
  data?.target ||
  location.state?.target ||
  {};

  const result =
    data?.result || {};

    const answerReviews = Array.isArray(data?.answerReviews)
  ? data.answerReviews
  : [];

  const summary =
    data?.interviewSummary || {};

  const communicationMetrics =
    result?.communicationMetrics || {};


    useEffect(() => {
  // Result already arrived from End Interview.
  // No extra request is needed.
 

  const loadInterviewResult = async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const token =
  localStorage.getItem("placifyToken");

      if (!token) {
        throw new Error(
          "Student authentication is required."
        );
      }

     const response = await fetch(
  `${API_BASE}/student/ai-interview/${sessionId}/result`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const responseData =
        await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            "Unable to load interview result."
        );
      }

      setData(responseData);
    } catch (error) {
      console.error(
        "Load AI interview result error:",
        error
      );

      setLoadError(
        error.message ||
          "Unable to load interview result."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionId) {
    loadInterviewResult();
  } else {
    setLoadError(
      "Interview session ID is missing."
    );

    setIsLoading(false);
  }
}, [sessionId, navigationResult]);

  const scoreItems = [
    {
      label: "Technical Knowledge",
      value: result.technicalScore,
    },
    {
      label: "Communication",
      value: result.communicationScore,
    },
    {
      label: "Relevance",
      value: result.relevanceScore,
    },
    {
      label: "Completeness",
      value: result.completenessScore,
    },
    {
      label: "Answer Structure",
      value: result.answerStructureScore,
    },
    {
      label: "Resume Knowledge",
      value: result.resumeKnowledgeScore,
    },
    {
      label: "Role Readiness",
      value: result.roleReadinessScore,
    },
  ];

  const formatScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
};


  if (isLoading) {
  return (
    <div className="ai-result-page">
      <div className="result-empty-state">
        <h2>Loading Interview Result</h2>

        <p>
          Placify is retrieving your completed
          interview report.
        </p>
      </div>
    </div>
  );
}

  if (!data) {
    return (
      <div className="ai-result-page">
        <div className="result-empty-state">
          <h2>
            Interview Result Unavailable
          </h2>

         <p>
  {loadError ||
    "The completed interview result is not available on this page."}
</p>

          <button
            type="button"
            onClick={() =>
              navigate("/student/interview")
            }
          >
            Back to AI Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-result-page">
      {/* ==============================
          HEADER
      ============================== */}

      <header className="ai-result-header">
        <div>
          <span className="result-eyebrow">
            PLACIFY AI INTERVIEW
          </span>

          <h1>
            Interview Performance Report
          </h1>

          <p>
            Resume-aware adaptive interview
            evaluation
          </p>
        </div>

        <div className="result-header-actions">
          <button
            type="button"
            className="secondary-result-button"
            onClick={() =>
              navigate("/student/interview")
            }
          >
            Interview Home
          </button>

          <button
            type="button"
            className="primary-result-button"
            onClick={() =>
              navigate("/student/roadmap")
            }
          >
            View Roadmap
          </button>
        </div>
      </header>

      {/* ==============================
          CANDIDATE / TARGET
      ============================== */}

      <section className="result-context-card">
        <div>
          <span>Candidate</span>

          <strong>
            {candidate?.name || "Student"}
          </strong>
        </div>

        <div>
          <span>Target Role</span>

          <strong>
            {target?.role ||
              "Not specified"}
          </strong>
        </div>

        <div>
          <span>Target Company</span>

          <strong>
            {target?.company ||
              "Not specified"}
          </strong>
        </div>

        <div>
          <span>Questions Answered</span>

          <strong>
            {summary?.answeredQuestions || 0}
          </strong>
        </div>
      </section>

      {/* ==============================
          OVERALL SCORE
      ============================== */}

      <section className="overall-result-card">
        <div className="overall-score-circle">
         <strong>
  {formatScore(result.overallScore) ?? "N/A"}
</strong>

<span>
  {formatScore(result.overallScore) === null
    ? "Not Evaluated"
    : "/100"}
</span>
        </div>

        <div className="overall-score-content">
          <span className="result-eyebrow">
            OVERALL INTERVIEW SCORE
          </span>

          <h2>
            Interview Completed
          </h2>

          <p>
            Your score is based on your
            completed interview answers,
            technical discussion,
            communication, relevance,
            completeness and answer
            structure.
          </p>
        </div>
      </section>

      {/* ==============================
          SCORE BREAKDOWN
      ============================== */}

      <section className="result-section">
        <div className="result-section-heading">
          <span className="result-eyebrow">
            PERFORMANCE
          </span>

          <h2>Score Breakdown</h2>
        </div>

        <div className="score-grid">
          {scoreItems.map((item) => {
            const score =
              formatScore(item.value);

            return (
              <div
                className="score-card"
                key={item.label}
              >
                <div className="score-card-top">
                  <span>
                    {item.label}
                  </span>

                <strong>
  {score === null ? "N/A" : score}
</strong>
                </div>

                <div className="score-track">
                  <div
                    className="score-fill"
                    style={{
                      width: `${score ?? 0}%`,
                    }}
                  />
                </div>

             <small>
  {score === null ? "Not Evaluated" : `${score}/100`}
</small>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==============================
          STRENGTHS + WEAK AREAS
      ============================== */}

      <section className="result-two-column">
        <div className="result-list-card strength-card">
          <span className="result-eyebrow">
            STRONG AREAS
          </span>

          <h2>What Went Well</h2>

          {result.strengths?.length ? (
            <ul>
              {result.strengths.map(
                (item, index) => (
                  <li
                    key={`${item}-${index}`}
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="empty-result-text">
              No specific strong areas were
              recorded.
            </p>
          )}
        </div>

        <div className="result-list-card weakness-card">
          <span className="result-eyebrow">
            NEEDS IMPROVEMENT
          </span>

          <h2>Areas to Improve</h2>

          {result.weakAreas?.length ? (
            <ul>
              {result.weakAreas.map(
                (item, index) => (
                  <li
                    key={`${item}-${index}`}
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="empty-result-text">
              No major weak areas were
              recorded.
            </p>
          )}
        </div>
      </section>

      {/* ==============================
          COMMUNICATION METRICS
      ============================== */}

      <section className="result-section">
        <div className="result-section-heading">
          <span className="result-eyebrow">
            VOICE & COMMUNICATION
          </span>

          <h2>
            Communication Metrics
          </h2>
        </div>

        <div className="communication-grid">
          <div>
            <span>
              Average Speaking Pace
            </span>

            <strong>
              {communicationMetrics
                ?.averageWordsPerMinute ||
                0}
            </strong>

            <small>words/min</small>
          </div>

          <div>
            <span>
              Filler Words
            </span>

            <strong>
              {communicationMetrics
                ?.totalFillerWords || 0}
            </strong>

            <small>
              detected during answers
            </small>
          </div>

          <div>
            <span>
              Long Pauses
            </span>

            <strong>
              {communicationMetrics
                ?.totalLongPauses || 0}
            </strong>

            <small>
              detected pauses
            </small>
          </div>

          <div>
            <span>
              Speaking Duration
            </span>

            <strong>
              {communicationMetrics
                ?.totalDurationSeconds ||
                0}
            </strong>

            <small>seconds</small>
          </div>
        </div>
      </section>

      {/* ==============================
          TOPICS / SKILLS TESTED
      ============================== */}

      <section className="result-two-column">
        <div className="result-list-card">
          <span className="result-eyebrow">
            INTERVIEW COVERAGE
          </span>

          <h2>Topics Covered</h2>

          <div className="result-chip-list">
            {summary?.topicsCovered?.length ? (
              summary.topicsCovered.map(
                (topic, index) => (
                  <span
                    key={`${topic}-${index}`}
                  >
                    {topic}
                  </span>
                )
              )
            ) : (
              <p className="empty-result-text">
                No topics recorded.
              </p>
            )}
          </div>
        </div>

        <div className="result-list-card">
          <span className="result-eyebrow">
            TECHNICAL COVERAGE
          </span>

          <h2>Skills Tested</h2>

          <div className="result-chip-list">
            {summary?.skillsTested?.length ? (
              summary.skillsTested.map(
                (skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                )
              )
            ) : (
              <p className="empty-result-text">
                No technical skills recorded.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==============================
    DETAILED ANSWER REVIEW
============================== */}

<section className="result-section">
  <div className="result-section-heading">
    <span className="result-eyebrow">
      AI ANSWER ANALYSIS
    </span>

    <h2>Question-by-Question Review</h2>
  </div>

  {answerReviews.length > 0 ? (
    <div className="recommendation-list">
      {answerReviews.map((review, index) => (
        <div
          className="result-list-card"
          key={review.turnNumber || index}
          style={{ marginBottom: "18px" }}
        >
          <span className="result-eyebrow">
            QUESTION {review.turnNumber}
            {review.stage ? ` • ${review.stage}` : ""}
          </span>

          <h3>{review.question}</h3>

          <p>
            <strong>Your Answer:</strong>{" "}
            {review.candidateAnswer}
          </p>

          <p>
            <strong>Answer Quality:</strong>{" "}
            {review.answerQuality}
          </p>

          {review.feedback && (
            <p>
              <strong>AI Feedback:</strong>{" "}
              {review.feedback}
            </p>
          )}

          {review.missingKeyPoints?.length > 0 && (
            <div>
              <h4>Missing Key Concepts</h4>
              <ul>
                {review.missingKeyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {review.incorrectClaims?.length > 0 && (
            <div>
              <h4>Incorrect Statements</h4>
              <ul>
                {review.incorrectClaims.map((claim, i) => (
                  <li key={i}>{claim}</li>
                ))}
              </ul>
            </div>
          )}

          {review.improvementTips?.length > 0 && (
            <div>
              <h4>How to Improve</h4>
              <ul>
                {review.improvementTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {review.suggestedAnswer && (
            <div>
              <h4>Suggested Answer</h4>
              <p>{review.suggestedAnswer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p className="empty-result-text">
      Detailed answer reviews are not available
      for this interview.
    </p>
  )}
</section>

{/* ==============================
    PERSONALIZED ANSWER SUGGESTIONS
============================== */}

{result.answerSuggestions?.length > 0 && (
  <section className="result-list-card">
    <span className="result-eyebrow">
      PERSONALIZED FEEDBACK
    </span>

    <h2>Answer Improvement Plan</h2>

    <ul>
      {result.answerSuggestions.map((tip, index) => (
        <li key={index}>{tip}</li>
      ))}
    </ul>
  </section>
)}

      {/* ==============================
          RECOMMENDATIONS
      ============================== */}

      <section className="recommendation-card">
        <span className="result-eyebrow">
          NEXT STEPS
        </span>

        <h2>
          Placify Recommendations
        </h2>

        {result.recommendations?.length ? (
          <div className="recommendation-list">
            {result.recommendations.map(
              (item, index) => (
                <div
                  className="recommendation-item"
                  key={`${item}-${index}`}
                >
                  <span>
                    {index + 1}
                  </span>

                  <p>{item}</p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="empty-result-text">
            Continue practicing and retake
            the interview to track your
            improvement.
          </p>
        )}
      </section>

      {/* ==============================
          ACTIONS
      ============================== */}

      <section className="result-action-bar">
        <div>
          <strong>
            Continue improving your
            placement readiness
          </strong>

          <span>
            Use this interview feedback in
            your next preparation cycle.
          </span>
        </div>

        <div className="result-action-buttons">
          <button
            type="button"
            className="secondary-result-button"
            onClick={() =>
              navigate("/student/practice")
            }
          >
            Practice Skills
          </button>

          <button
            type="button"
            className="secondary-result-button"
            onClick={() =>
              navigate("/student/interview")
            }
          >
            Retake Interview
          </button>

          <button
            type="button"
            className="primary-result-button"
            onClick={() =>
              navigate("/student/roadmap")
            }
          >
            Open Roadmap
          </button>
        </div>
      </section>

      {/* Development reference only */}
      <div
        style={{
          display: "none",
        }}
      >
        {sessionId}
      </div>
    </div>
  );
};

export default AIInterviewResult;