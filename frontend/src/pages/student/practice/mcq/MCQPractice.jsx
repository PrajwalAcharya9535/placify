import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../../components/student/StudentLayout";
import "./MCQPractice.css";

const API_BASE = "http://localhost:5000/api/student";

function MCQPractice() {
  const navigate = useNavigate();

  /* =========================================================
     SESSION SETTINGS
  ========================================================= */

  const [settings, setSettings] = useState({
    title: "Placement Practice",
    category: "Mixed",
    difficulty: "Mixed",
    questionType: "MCQ",
    numberOfQuestions: 10,
    durationSeconds: 600,
  });

  /* =========================================================
     SESSION STATE
  ========================================================= */

  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);

  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const questionStartedAt = useRef(Date.now());
  const submittingRef = useRef(false);

  /* =========================================================
     AUTH
  ========================================================= */

  const token = localStorage.getItem("placifyToken");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  /* =========================================================
     HELPERS
  ========================================================= */

  const handleUnauthorized = () => {
    localStorage.removeItem("placifyToken");
    localStorage.removeItem("placifyUser");

    navigate("/login", {
      replace: true,
    });
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const getQuestionId = (question) => {
    return question?._id || question?.id || "";
  };

  const getOptionValue = (option) => {
    if (typeof option === "string") {
      return option;
    }

    if (option && typeof option === "object") {
      return (
        option.value ??
        option.text ??
        option.label ??
        option.option ??
        ""
      );
    }

    return String(option ?? "");
  };

  const getOptionLabel = (option) => {
    if (typeof option === "string") {
      return option;
    }

    if (option && typeof option === "object") {
      return (
        option.text ??
        option.label ??
        option.value ??
        option.option ??
        ""
      );
    }

    return String(option ?? "");
  };

  const currentQuestion =
    session?.questions?.[currentQuestionIndex] || null;

  const currentQuestionId = getQuestionId(currentQuestion);

  const answeredCount = session?.questions
    ? session.questions.filter((question) => {
        const questionId = getQuestionId(question);

        return (
          questionId &&
          answers[questionId] !== undefined &&
          answers[questionId] !== ""
        );
      }).length
    : 0;

  const totalQuestions = session?.questions?.length || 0;

  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  /* =========================================================
     SETTINGS
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]:
        name === "numberOfQuestions" ||
        name === "durationSeconds"
          ? Number(value)
          : value,
    }));
  };

  /* =========================================================
     START SESSION
  ========================================================= */

  const handleStartPractice = async () => {
    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setStarting(true);
      setError("");
      setResult(null);

      const response = await axios.post(
        `${API_BASE}/practice/session/start`,
        settings,
        authConfig
      );

      const startedSession = response.data?.session;

      if (
        !startedSession?.sessionId ||
        !Array.isArray(startedSession?.questions)
      ) {
        throw new Error(
          "Practice session could not be started."
        );
      }

      if (startedSession.questions.length === 0) {
        throw new Error(
          "No questions were returned for this practice session."
        );
      }

      setSession(startedSession);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuestionTimes({});

      setTimeLeft(
        Number(startedSession.durationSeconds) ||
          Number(settings.durationSeconds) ||
          600
      );

      questionStartedAt.current = Date.now();
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start practice session."
      );
    } finally {
      setStarting(false);
    }
  };

  /* =========================================================
     QUESTION TIME TRACKING
  ========================================================= */

  const recordCurrentQuestionTime = () => {
    if (!currentQuestionId) {
      return;
    }

    const now = Date.now();

    const elapsedSeconds = Math.max(
      0,
      Math.round(
        (now - questionStartedAt.current) / 1000
      )
    );

    setQuestionTimes((current) => ({
      ...current,
      [currentQuestionId]:
        (current[currentQuestionId] || 0) +
        elapsedSeconds,
    }));

    questionStartedAt.current = now;
  };

  /* =========================================================
     ANSWER SELECTION
  ========================================================= */

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  };

  /* =========================================================
     QUESTION NAVIGATION
  ========================================================= */

  const goToQuestion = (index) => {
    if (
      !session ||
      index < 0 ||
      index >= session.questions.length
    ) {
      return;
    }

    recordCurrentQuestionTime();

    setCurrentQuestionIndex(index);
    questionStartedAt.current = Date.now();
  };

  const handlePrevious = () => {
    goToQuestion(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    goToQuestion(currentQuestionIndex + 1);
  };

  /* =========================================================
     SUBMIT SESSION
  ========================================================= */

  const submitPracticeSession = async (
    automatic = false
  ) => {
    if (
      !session?.sessionId ||
      submittingRef.current
    ) {
      return;
    }

    submittingRef.current = true;

    try {
      setSubmitting(true);
      setError("");

      const now = Date.now();

      const latestQuestionTimes = {
        ...questionTimes,
      };

      if (currentQuestionId) {
        const elapsedSeconds = Math.max(
          0,
          Math.round(
            (now - questionStartedAt.current) / 1000
          )
        );

        latestQuestionTimes[currentQuestionId] =
          (latestQuestionTimes[currentQuestionId] || 0) +
          elapsedSeconds;
      }

      const submittedAnswers = session.questions
        .map((question) => {
          const questionId = getQuestionId(question);

          if (
            !questionId ||
            answers[questionId] === undefined ||
            answers[questionId] === ""
          ) {
            return null;
          }

          return {
            questionId,
            answer: answers[questionId],
            timeTakenSeconds:
              latestQuestionTimes[questionId] || 0,
          };
        })
        .filter(Boolean);

      const duration =
        Number(session.durationSeconds) ||
        Number(settings.durationSeconds) ||
        0;

      const calculatedTimeSpent =
        automatic && timeLeft <= 0
          ? duration
          : Math.max(0, duration - timeLeft);

      const response = await axios.post(
        `${API_BASE}/practice/session/complete`,
        {
          sessionId: session.sessionId,
          answers: submittedAnswers,
          timeSpentSeconds: calculatedTimeSpent,
        },
        authConfig
      );

      const completedResult =
        response.data?.result;

      if (!completedResult) {
        throw new Error(
          "Practice result could not be loaded."
        );
      }

      setQuestionTimes(latestQuestionTimes);
      setResult(completedResult);
      setSession(null);
      setTimeLeft(0);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to submit practice session."
      );
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    await submitPracticeSession(false);
  };

  /* =========================================================
     TIMER
  ========================================================= */

  useEffect(() => {
    if (
      !session ||
      result ||
      submitting ||
      timeLeft <= 0
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session, result, submitting, timeLeft]);

  useEffect(() => {
    if (
      session &&
      !result &&
      timeLeft === 0 &&
      !submittingRef.current
    ) {
      submitPracticeSession(true);
    }
  }, [timeLeft, session, result]);

  /* =========================================================
     RESULT ACTIONS
  ========================================================= */

  const handlePracticeAgain = () => {
    setResult(null);
    setSession(null);
    setAnswers({});
    setQuestionTimes({});
    setCurrentQuestionIndex(0);
    setError("");
    setTimeLeft(0);
  };

  /* =========================================================
     RESULT SCREEN
  ========================================================= */

  if (result) {
    const resultAnswers = Array.isArray(result.answers)
      ? result.answers
      : [];

    return (
      <StudentLayout>
        <div className="mcq-practice-page">
          <button
            type="button"
            onClick={() =>
              navigate("/student/practice")
            }
          >
            ← Back to Practice Center
          </button>

          <div>
            <span>MCQ PRACTICE RESULT</span>

            <h1>Practice Completed</h1>

            <p>
              Review your performance and understand
              where you can improve before your next
              practice session.
            </p>
          </div>

          {error && <div>{error}</div>}

          <section className="mcq-result-summary">
            <div>
              <span>Score</span>

              <strong>
                {result.marksObtained ?? 0}/
                {result.totalMarks ?? 0}
              </strong>
            </div>

            <div>
              <span>Accuracy</span>

              <strong>
                {Math.round(
                  Number(result.accuracy) || 0
                )}
                %
              </strong>
            </div>

            <div>
              <span>Correct</span>

              <strong>
                {result.correctAnswers ?? 0}
              </strong>
            </div>

            <div>
              <span>Incorrect</span>

              <strong>
                {result.incorrectAnswers ?? 0}
              </strong>
            </div>
          </section>

          <section className="mcq-result-details">
            <div className="mcq-result-heading">
              <div>
                <span>ANSWER REVIEW</span>
                <h2>Question Analysis</h2>
              </div>

              <p>
                Attempted{" "}
                {result.attemptedQuestions ?? 0} of{" "}
                {result.totalQuestions ?? 0} questions
              </p>
            </div>

            {resultAnswers.length === 0 ? (
              <div className="mcq-result-empty">
                No answer details are available for
                this session.
              </div>
            ) : (
              <div className="mcq-answer-review-list">
                {resultAnswers.map(
                  (answer, index) => (
                    <article
                      className={`mcq-answer-review-card ${
                        answer.isCorrect
                          ? "correct"
                          : "incorrect"
                      }`}
                      key={
                        answer.questionId ||
                        `answer-${index}`
                      }
                    >
                      <div className="mcq-answer-review-top">
                        <strong>
                          Question {index + 1}
                        </strong>

                        <span>
                          {answer.isCorrect
                            ? "Correct"
                            : "Incorrect"}
                        </span>
                      </div>

                      <div className="mcq-answer-review-grid">
                        <div>
                          <span>Your Answer</span>
                          <strong>
                            {String(
                              answer.submittedAnswer ??
                                "Not Answered"
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Correct Answer</span>
                          <strong>
                            {String(
                              answer.correctAnswer ??
                                "—"
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Marks</span>
                          <strong>
                            {answer.marksAwarded ?? 0}/
                            {answer.totalMarks ?? 0}
                          </strong>
                        </div>
                      </div>

                      {answer.explanation && (
                        <div className="mcq-explanation">
                          <span>Explanation</span>

                          <p>
                            {answer.explanation}
                          </p>
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          <div className="mcq-result-actions">
            <button
              type="button"
              onClick={handlePracticeAgain}
            >
              Practice Again
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/student/practice")
              }
            >
              Back to Practice Center
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  /* =========================================================
     LIVE TEST SCREEN
  ========================================================= */

  if (session) {
    const options = Array.isArray(
      currentQuestion?.options
    )
      ? currentQuestion.options
      : [];

    const isLastQuestion =
      currentQuestionIndex ===
      session.questions.length - 1;

    return (
      <StudentLayout>
        <div className="mcq-live-page">

          <header className="mcq-live-header">
            <div>
              <span>MCQ PRACTICE</span>

              <h1>
                {session.title ||
                  "Placement Practice"}
              </h1>

              <p>
                {session.category || "Mixed"} •{" "}
                {session.difficulty || "Mixed"} •{" "}
                {totalQuestions} Questions
              </p>
            </div>

            <div
              className={`mcq-timer ${
                timeLeft <= 60 ? "warning" : ""
              }`}
            >
              <span>Time Remaining</span>
              <strong>
                {formatTime(timeLeft)}
              </strong>
            </div>
          </header>

          {error && (
            <div className="mcq-live-error">
              {error}
            </div>
          )}

          <div className="mcq-live-progress">
            <div>
              <span>
                {answeredCount} of {totalQuestions}{" "}
                answered
              </span>

              <strong>
                {progressPercentage}%
              </strong>
            </div>

            <div className="mcq-live-progress-track">
              <div
                style={{
                  width: `${progressPercentage}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="mcq-test-layout">

            <aside className="mcq-question-palette">
              <span className="mcq-palette-label">
                QUESTIONS
              </span>

              <div className="mcq-question-numbers">
                {session.questions.map(
                  (question, index) => {
                    const questionId =
                      getQuestionId(question);

                    const answered =
                      answers[questionId] !==
                        undefined &&
                      answers[questionId] !== "";

                    const active =
                      index ===
                      currentQuestionIndex;

                    return (
                      <button
                        key={
                          questionId ||
                          `question-${index}`
                        }
                        type="button"
                        className={`${active ? "active" : ""} ${
                          answered ? "answered" : ""
                        }`}
                        onClick={() =>
                          goToQuestion(index)
                        }
                      >
                        {index + 1}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mcq-palette-legend">
                <div>
                  <span className="legend-box current"></span>
                  Current
                </div>

                <div>
                  <span className="legend-box answered"></span>
                  Answered
                </div>

                <div>
                  <span className="legend-box pending"></span>
                  Not Answered
                </div>
              </div>
            </aside>

            <main className="mcq-question-card">
              <div className="mcq-question-meta">
                <span>
                  Question{" "}
                  {currentQuestionIndex + 1} of{" "}
                  {totalQuestions}
                </span>

                <div>
                  {currentQuestion?.category && (
                    <span>
                      {currentQuestion.category}
                    </span>
                  )}

                  {currentQuestion?.difficulty && (
                    <span>
                      {currentQuestion.difficulty}
                    </span>
                  )}

                  <span>
                    {currentQuestion?.marks ?? 1} Mark
                    {Number(
                      currentQuestion?.marks ?? 1
                    ) === 1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </div>

              <h2>
                {currentQuestion?.questionText ||
                  "Question"}
              </h2>

              {options.length === 0 ? (
                <div className="mcq-no-options">
                  No options are available for this
                  question.
                </div>
              ) : (
                <div className="mcq-options">
                  {options.map((option, index) => {
                    const value =
                      getOptionValue(option);

                    const label =
                      getOptionLabel(option);

                    const selected =
                      answers[currentQuestionId] ===
                      value;

                    return (
                      <button
                        key={`${currentQuestionId}-${index}`}
                        type="button"
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          handleAnswerSelect(
                            currentQuestionId,
                            value
                          )
                        }
                      >
                        <span className="mcq-option-letter">
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span className="mcq-option-text">
                          {label}
                        </span>

                        <span className="mcq-option-check">
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mcq-question-actions">
                <button
                  type="button"
                  disabled={
                    currentQuestionIndex === 0
                  }
                  onClick={handlePrevious}
                >
                  ← Previous
                </button>

                <div>
                  {!isLastQuestion && (
                    <button
                      type="button"
                      onClick={handleNext}
                    >
                      Next →
                    </button>
                  )}

                  {isLastQuestion && (
                    <button
                      type="button"
                      className="submit"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      {submitting
                        ? "Submitting..."
                        : "Submit Practice"}
                    </button>
                  )}
                </div>
              </div>
            </main>

          </div>
        </div>
      </StudentLayout>
    );
  }

  /* =========================================================
     SETUP SCREEN
  ========================================================= */

  return (
    <StudentLayout>
      <div className="mcq-practice-page">
        <button
          type="button"
          onClick={() =>
            navigate("/student/practice")
          }
        >
          ← Back to Practice Center
        </button>

        <div>
          <span>MCQ PRACTICE</span>

          <h1>Start Practice Session</h1>

          <p>
            Configure your practice session before
            starting the timed assessment.
          </p>
        </div>

        {error && <div>{error}</div>}

        <div>
          <label>
            Category

            <select
              name="category"
              value={settings.category}
              onChange={handleChange}
            >
              <option value="Mixed">Mixed</option>
              <option value="Aptitude">
                Aptitude
              </option>
              <option value="Reasoning">
                Reasoning
              </option>
              <option value="Verbal">
                Verbal
              </option>
              <option value="Programming">
                Programming
              </option>
              <option value="SQL">SQL</option>
              <option value="DSA">DSA</option>
              <option value="Technical Subject">
                Technical Subject
              </option>
            </select>
          </label>

          <label>
            Difficulty

            <select
              name="difficulty"
              value={settings.difficulty}
              onChange={handleChange}
            >
              <option value="Mixed">Mixed</option>
              <option value="Beginner">
                Beginner
              </option>
              <option value="Intermediate">
                Intermediate
              </option>
              <option value="Advanced">
                Advanced
              </option>
            </select>
          </label>

          <label>
            Questions

            <select
              name="numberOfQuestions"
              value={settings.numberOfQuestions}
              onChange={handleChange}
            >
              <option value={5}>
                5 Questions
              </option>
              <option value={10}>
                10 Questions
              </option>
              <option value={15}>
                15 Questions
              </option>
              <option value={20}>
                20 Questions
              </option>
            </select>
          </label>

          <label>
            Duration

            <select
              name="durationSeconds"
              value={settings.durationSeconds}
              onChange={handleChange}
            >
              <option value={300}>
                5 Minutes
              </option>
              <option value={600}>
                10 Minutes
              </option>
              <option value={900}>
                15 Minutes
              </option>
              <option value={1200}>
                20 Minutes
              </option>
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={starting}
          onClick={handleStartPractice}
        >
          {starting
            ? "Starting Session..."
            : "Start Practice Session"}
        </button>
      </div>
    </StudentLayout>
  );
}

export default MCQPractice;