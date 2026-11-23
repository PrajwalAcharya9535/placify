
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import "./MockMcqWorkspace.css";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

const MockMcqWorkspace = ({
  attemptId,
  questions = [],
  roundData = null,
  onRoundCompleted,
}) => {
  // ==========================================
  // QUESTION STATE
  // ==========================================

  const [questionList, setQuestionList] = useState(questions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [answerResult, setAnswerResult] = useState(null);

  const [completingRound, setCompletingRound] = useState(false);
  const [roundError, setRoundError] = useState("");

  // ==========================================
  // TIMER AND REQUEST SAFETY
  // ==========================================

  const expiresAt = roundData?.expiresAt || null;

  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const completingRoundRef = useRef(false);
  const submittingAnswerRef = useRef(false);
  const autoSubmitAttemptedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setQuestionList(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");
    autoSubmitAttemptedRef.current = false;
  }, [questions]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const deadline = new Date(expiresAt).getTime();

    if (!Number.isFinite(deadline)) {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      setRemainingSeconds(seconds);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const timeExpired = remainingSeconds === 0;

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  // ==========================================
  // QUESTION INFORMATION
  // ==========================================

  const currentQuestion =
    questionList[currentQuestionIndex] || null;

  const answeredCount = useMemo(
    () => questionList.filter((question) => question.answered).length,
    [questionList]
  );

  const totalQuestions = questionList.length;

  const allQuestionsAnswered =
    totalQuestions > 0 && answeredCount === totalQuestions;

  const progressPercentage =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  const currentSelectedAnswer = currentQuestion
    ? selectedAnswers[currentQuestion.mockQuestionAttemptId] || ""
    : "";

  const controlsDisabled =
    submittingAnswer || completingRound || timeExpired;

  // ==========================================
  // SELECT OPTION
  // ==========================================

  const handleOptionSelect = (option) => {
    if (
      !currentQuestion ||
      currentQuestion.answered ||
      controlsDisabled
    ) {
      return;
    }

    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");

    setSelectedAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.mockQuestionAttemptId]: option,
    }));
  };

  // ==========================================
  // SUBMIT CURRENT ANSWER
  // ==========================================

  const handleSubmitAnswer = async () => {
    if (
      !currentQuestion ||
      currentQuestion.answered ||
      submittingAnswerRef.current ||
      completingRoundRef.current ||
      timeExpired
    ) {
      return;
    }

    if (!currentSelectedAnswer) {
      setAnswerError("Please select an option before submitting.");
      return;
    }

    const token = localStorage.getItem("placifyToken");

    if (!token) {
      setAnswerError(
        "Your login session is unavailable. Please log in again."
      );
      return;
    }

    const questionId = currentQuestion.mockQuestionAttemptId;
    const submittedAnswer = currentSelectedAnswer;

    submittingAnswerRef.current = true;

    try {
      setSubmittingAnswer(true);
      setAnswerError("");
      setAnswerResult(null);
      setRoundError("");

      const response = await axios.post(
        `${API_BASE_URL}/mock-question-attempts/${questionId}/answer`,
        { answer: submittedAnswer },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!mountedRef.current) return;

      const result = response.data.result;

      setQuestionList((previousQuestions) =>
        previousQuestions.map((question) =>
          question.mockQuestionAttemptId === questionId
            ? {
                ...question,
                answered: true,
                submittedAnswer,
              }
            : question
        )
      );

      setAnswerResult({
        questionAttemptId: result?.mockQuestionAttemptId || null,
        isCorrect: result?.isCorrect ?? false,
        marksAwarded: result?.marksAwarded ?? 0,
        totalMarks:
          result?.totalMarks ?? currentQuestion.marks ?? 0,
      });
    } catch (err) {
      if (mountedRef.current) {
        setAnswerError(
          err.response?.data?.message ||
            "Failed to submit the answer."
        );
      }
    } finally {
      submittingAnswerRef.current = false;

      if (mountedRef.current) {
        setSubmittingAnswer(false);
      }
    }
  };

  // ==========================================
  // COMPLETE ROUND
  // ==========================================

  const handleCompleteRound = useCallback(async () => {
    if (
      !attemptId ||
      completingRoundRef.current ||
      submittingAnswerRef.current
    ) {
      return false;
    }

    const token = localStorage.getItem("placifyToken");

    if (!token) {
      setRoundError(
        "Your login session is unavailable. Please log in again."
      );
      return false;
    }

    completingRoundRef.current = true;

    try {
      setCompletingRound(true);
      setRoundError("");
      setAnswerError("");

      const response = await axios.post(
        `${API_BASE_URL}/mock-attempts/${attemptId}/round/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedMockAttempt =
        response.data.mockAttempt || null;

      const nextRound = response.data.nextRound || null;

      if (onRoundCompleted) {
        onRoundCompleted(
          updatedMockAttempt,
          nextRound,
          response.data
        );
      }

      return true;
    } catch (err) {
      if (mountedRef.current) {
        setRoundError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to complete the current round."
        );
      }

      return false;
    } finally {
      completingRoundRef.current = false;

      if (mountedRef.current) {
        setCompletingRound(false);
      }
    }
  }, [attemptId, onRoundCompleted]);

  // ==========================================
  // AUTOMATIC SUBMISSION WHEN TIME EXPIRES
  // ==========================================

  useEffect(() => {
    if (
      !timeExpired ||
      !expiresAt ||
      submittingAnswer ||
      completingRound ||
      autoSubmitAttemptedRef.current
    ) {
      return;
    }

    autoSubmitAttemptedRef.current = true;
    handleCompleteRound();
  }, [
    timeExpired,
    expiresAt,
    submittingAnswer,
    completingRound,
    handleCompleteRound,
  ]);

  // ==========================================
  // QUESTION NAVIGATION
  // ==========================================

  const handleQuestionChange = (index) => {
    if (
      controlsDisabled ||
      index < 0 ||
      index >= totalQuestions
    ) {
      return;
    }

    setCurrentQuestionIndex(index);
    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");
  };

  const handlePrevious = () => {
    handleQuestionChange(
      Math.max(currentQuestionIndex - 1, 0)
    );
  };

  const handleNext = () => {
    handleQuestionChange(
      Math.min(currentQuestionIndex + 1, totalQuestions - 1)
    );
  };

  // ==========================================
  // EMPTY WORKSPACE
  // ==========================================

  if (!currentQuestion) {
    return (
      <section className="mock-mcq-empty">
        <h2>No questions available</h2>
        <p>
          Questions for this assessment round could not be loaded.
        </p>

        <button
          type="button"
          className="mock-mcq-nav-button primary"
          onClick={handleCompleteRound}
          disabled={completingRound}
        >
          {completingRound
            ? "Submitting..."
            : "Continue to Next Round →"}
        </button>

        {roundError && (
          <div className="mock-mcq-submit-message error">
            {roundError}
          </div>
        )}
      </section>
    );
  }

  // ==========================================
  // ASSESSMENT WORKSPACE
  // ==========================================

  return (
    <section className="mock-mcq-workspace">
      {/* ======================================
          LEFT QUESTION NAVIGATOR
      ====================================== */}

      <aside className="mock-mcq-sidebar">
        <div className="mock-mcq-sidebar-header">
          <div>
            <span className="mock-mcq-eyebrow">
              QUESTION NAVIGATOR
            </span>

            <h2>
              {roundData?.roundName || "Assessment Round"}
            </h2>
          </div>

          <span className="mock-mcq-count">
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        <div className="mock-mcq-progress">
          <div className="mock-mcq-progress-track">
            <div
              className="mock-mcq-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          <div className="mock-mcq-progress-info">
            <span>{progressPercentage}% completed</span>

            <span>
              {totalQuestions - answeredCount} remaining
            </span>
          </div>
        </div>

        <div className="mock-mcq-question-grid">
          {questionList.map((question, index) => {
            const isCurrent =
              index === currentQuestionIndex;

            const isAnswered = question.answered;

            const hasSelection =
              !isAnswered &&
              Boolean(
                selectedAnswers[
                  question.mockQuestionAttemptId
                ]
              );

            return (
              <button
                key={question.mockQuestionAttemptId}
                type="button"
                className={`mock-mcq-question-number ${
                  isCurrent ? "active" : ""
                } ${
                  isAnswered ? "answered" : ""
                } ${
                  hasSelection ? "selected" : ""
                }`}
                onClick={() =>
                  handleQuestionChange(index)
                }
                disabled={controlsDisabled}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="mock-mcq-legend">
          <div>
            <span className="mock-mcq-legend-dot current" />
            Current
          </div>

          <div>
            <span className="mock-mcq-legend-dot answered" />
            Answered
          </div>

          <div>
            <span className="mock-mcq-legend-dot unanswered" />
            Unanswered
          </div>
        </div>
      </aside>

      {/* ======================================
          MAIN QUESTION AREA
      ====================================== */}

      <div className="mock-mcq-main">
        <div className="mock-mcq-question-topbar">
          <div>
            <span>
              Question {currentQuestionIndex + 1} of{" "}
              {totalQuestions}
            </span>

            <strong>

{Number(currentQuestion.marks || 0).toFixed(2)}{" "}

              {currentQuestion.marks === 1
                ? "Mark"
                : "Marks"}
            </strong>
          </div>

          {/* LIVE COUNTDOWN */}

          <div
            role="timer"
            aria-label="Remaining assessment time"
            style={{
              padding: "9px 16px",
              borderRadius: "9px",
              background:
                remainingSeconds !== null &&
                remainingSeconds <= 30
                  ? "#fee2e2"
                  : "#eaf2ff",
              color:
                remainingSeconds !== null &&
                remainingSeconds <= 30
                  ? "#b91c1c"
                  : "#1d4ed8",
              fontSize: "18px",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timeExpired
              ? "Time Up"
              : `Time Left: ${formatTime(
                  remainingSeconds
                )}`}
          </div>

          <div className="mock-mcq-question-tags">
            <span>{currentQuestion.category}</span>
            <span>{currentQuestion.difficulty}</span>
          </div>
        </div>

        {/* ======================================
            QUESTION CONTENT
        ====================================== */}

        <div className="mock-mcq-question-content">
          <div className="mock-mcq-question-heading">
            <span className="mock-mcq-question-label">
              QUESTION {currentQuestionIndex + 1}
            </span>

            <h3>{currentQuestion.questionText}</h3>
          </div>

          <div className="mock-mcq-options">
            {(currentQuestion.options || []).map(
              (option, optionIndex) => {
                const optionLetter =
                  String.fromCharCode(65 + optionIndex);

                const isSubmitted =
                  currentQuestion.answered &&
                  currentQuestion.submittedAnswer ===
                    option;

                const isSelected =
                  !currentQuestion.answered &&
                  currentSelectedAnswer === option;

                return (
                  <button
                    key={`${currentQuestion.mockQuestionAttemptId}-${optionIndex}`}
                    type="button"
                    className={`mock-mcq-option ${
                      isSelected ? "selected" : ""
                    } ${
                      isSubmitted ? "submitted" : ""
                    }`}
                    disabled={
                      currentQuestion.answered ||
                      controlsDisabled
                    }
                    onClick={() =>
                      handleOptionSelect(option)
                    }
                  >
                    <span className="mock-mcq-option-letter">
                      {optionLetter}
                    </span>

                    <span className="mock-mcq-option-text">
                      {option}
                    </span>

                    {(isSelected || isSubmitted) && (
                      <span className="mock-mcq-option-check">
                        ✓
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* ======================================
              ANSWER FEEDBACK
          ====================================== */}

          {answerError && (
            <div className="mock-mcq-submit-message error">
              {answerError}
            </div>
          )}

          {answerResult && (
            <div
              className={`mock-mcq-submit-message ${
                answerResult.isCorrect
                  ? "success"
                  : "warning"
              }`}
            >
              <strong>
                {answerResult.isCorrect
                  ? "Correct answer."
                  : "Answer submitted."}
              </strong>

              <span>
                Marks: {answerResult.marksAwarded}/
                {answerResult.totalMarks}
              </span>
            </div>
          )}

          {roundError && (
            <div className="mock-mcq-submit-message error">
              {roundError}
            </div>
          )}

          {timeExpired && completingRound && (
            <div className="mock-mcq-submit-message warning">
              Time expired. Submitting your saved answers...
            </div>
          )}
        </div>

        {/* ======================================
            QUESTION FOOTER
        ====================================== */}

        <div className="mock-mcq-footer">
          <button
            type="button"
            className="mock-mcq-nav-button secondary"
            onClick={handlePrevious}
            disabled={
              currentQuestionIndex === 0 ||
              controlsDisabled
            }
          >
            ← Previous
          </button>

          <div className="mock-mcq-answer-note">
            {allQuestionsAnswered ? (
              <span className="answered">
                ✓ All questions answered
              </span>
            ) : currentQuestion.answered ? (
              <span className="answered">
                ✓ Answer submitted
              </span>
            ) : currentSelectedAnswer && !timeExpired ? (
              <button
                type="button"
                className="mock-mcq-submit-answer-button"
                onClick={handleSubmitAnswer}
                disabled={controlsDisabled}
              >
                {submittingAnswer
                  ? "Submitting..."
                  : "Submit Answer"}
              </button>
            ) : timeExpired ? (
              <span>Assessment time has expired.</span>
            ) : (
              <span>
                Select an option to answer this question.
              </span>
            )}
          </div>

          {/* ======================================
              NEXT / SUBMIT ROUND
          ====================================== */}

          <button
            type="button"
            className="mock-mcq-nav-button secondary"
            onClick={handleNext}
            disabled={
              currentQuestionIndex ===
                totalQuestions - 1 ||
              controlsDisabled
            }
          >
            Next →
          </button>

          <button
            type="button"
            className="mock-mcq-nav-button primary"
            onClick={handleCompleteRound}
            disabled={
              completingRound || submittingAnswer
            }
          >
            {completingRound
              ? "Submitting Round..."
              : timeExpired
              ? "Retry Round Submission →"
              : "Submit Round →"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MockMcqWorkspace;
