import React, { useMemo, useState } from "react";
import axios from "axios";
import "./MockMcqWorkspace.css";

const API_BASE_URL = "http://localhost:5000/api/student";

const MockMcqWorkspace = ({
  attemptId,
  questions = [],
  roundData = null,
  onRoundCompleted,
}) => {
  // ==============================
  // LOCAL QUESTION STATE
  // ==============================

  const [questionList, setQuestionList] =
    useState(questions);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [selectedAnswers, setSelectedAnswers] =
    useState({});

  const [submittingAnswer, setSubmittingAnswer] =
    useState(false);

  const [answerError, setAnswerError] =
    useState("");

  const [answerResult, setAnswerResult] =
    useState(null);

  const [completingRound, setCompletingRound] =
    useState(false);

  const [roundError, setRoundError] =
    useState("");

  // ==============================
  // CURRENT QUESTION
  // ==============================

  const currentQuestion =
    questionList[currentQuestionIndex] || null;

  const answeredCount = useMemo(
    () =>
      questionList.filter(
        (question) => question.answered
      ).length,
    [questionList]
  );

  const totalQuestions = questionList.length;

  const allQuestionsAnswered =
    totalQuestions > 0 &&
    answeredCount === totalQuestions;

  const progressPercentage =
    totalQuestions > 0
      ? Math.round(
          (answeredCount / totalQuestions) * 100
        )
      : 0;

  const currentSelectedAnswer = currentQuestion
    ? selectedAnswers[
        currentQuestion.mockQuestionAttemptId
      ] || ""
    : "";

  // ==============================
  // SELECT OPTION LOCALLY
  // ==============================

  const handleOptionSelect = (option) => {
    if (!currentQuestion) {
      return;
    }

    if (
      currentQuestion.answered ||
      submittingAnswer ||
      completingRound
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

  // ==============================
  // SUBMIT CURRENT ANSWER
  // ==============================

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestion.answered) {
      return;
    }

    if (!currentSelectedAnswer) {
      setAnswerError(
        "Please select an option before submitting."
      );
      return;
    }

    try {
      setSubmittingAnswer(true);
      setAnswerError("");
      setAnswerResult(null);
      setRoundError("");

      const token =
        localStorage.getItem("placifyToken");

      if (!token) {
        setAnswerError(
          "Your login session is unavailable. Please log in again."
        );
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/mock-question-attempts/${currentQuestion.mockQuestionAttemptId}/answer`,
        {
          answer: currentSelectedAnswer,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data.result;

      setQuestionList((previousQuestions) =>
        previousQuestions.map((question) =>
          question.mockQuestionAttemptId ===
          currentQuestion.mockQuestionAttemptId
            ? {
                ...question,
                answered: true,
                submittedAnswer:
                  currentSelectedAnswer,
              }
            : question
        )
      );

      setAnswerResult({
        questionAttemptId:
          result?.mockQuestionAttemptId || null,

        isCorrect:
          result?.isCorrect ?? false,

        marksAwarded:
          result?.marksAwarded ?? 0,

        totalMarks:
          result?.totalMarks ??
          currentQuestion.marks ??
          0,
      });
    } catch (err) {
      setAnswerError(
        err.response?.data?.message ||
          "Failed to submit the answer."
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ==============================
  // COMPLETE CURRENT ROUND
  // ==============================

  const handleCompleteRound = async () => {
    if (
      !attemptId ||
      completingRound ||
      submittingAnswer ||
      !allQuestionsAnswered
    ) {
      return;
    }

    try {
      setCompletingRound(true);
      setRoundError("");
      setAnswerError("");

      const token =
        localStorage.getItem("placifyToken");

      if (!token) {
        setRoundError(
          "Your login session is unavailable. Please log in again."
        );
        return;
      }

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

      const nextRound =
        response.data.nextRound || null;

      // ==============================
      // NEXT ROUND AVAILABLE
      // ==============================

      if (nextRound) {
        if (onRoundCompleted) {
          onRoundCompleted(
            updatedMockAttempt,
            nextRound
          );
        }

        return;
      }

      // ==============================
      // FINAL ROUND COMPLETED
      // ==============================

      if (updatedMockAttempt) {
        if (onRoundCompleted) {
          onRoundCompleted(
            updatedMockAttempt,
            null
          );
        }
      }

      setRoundError(
        "Mock placement assessment completed."
      );
    } catch (err) {
      setRoundError(
        err.response?.data?.message ||
          "Failed to complete the current round."
      );
    } finally {
      setCompletingRound(false);
    }
  };

  // ==============================
  // NAVIGATION
  // ==============================

  const handleQuestionChange = (index) => {
    if (
      submittingAnswer ||
      completingRound
    ) {
      return;
    }

    setCurrentQuestionIndex(index);
    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");
  };

  const handlePrevious = () => {
    if (
      submittingAnswer ||
      completingRound
    ) {
      return;
    }

    setCurrentQuestionIndex((previousIndex) =>
      Math.max(previousIndex - 1, 0)
    );

    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");
  };

  const handleNext = () => {
    if (
      submittingAnswer ||
      completingRound
    ) {
      return;
    }

    setCurrentQuestionIndex((previousIndex) =>
      Math.min(
        previousIndex + 1,
        totalQuestions - 1
      )
    );

    setAnswerError("");
    setAnswerResult(null);
    setRoundError("");
  };

  // ==============================
  // EMPTY
  // ==============================

  if (!currentQuestion) {
    return (
      <section className="mock-mcq-empty">
        <h2>No questions available</h2>

        <p>
          Questions for this assessment round could not be
          loaded.
        </p>
      </section>
    );
  }

  // ==============================
  // PAGE
  // ==============================

  return (
    <section className="mock-mcq-workspace">
      {/* ==============================
          LEFT QUESTION NAVIGATION
      ============================== */}

      <aside className="mock-mcq-sidebar">
        <div className="mock-mcq-sidebar-header">
          <div>
            <span className="mock-mcq-eyebrow">
              QUESTION NAVIGATOR
            </span>

            <h2>
              {roundData?.roundName ||
                "Assessment Round"}
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
            <span>
              {progressPercentage}% completed
            </span>

            <span>
              {totalQuestions - answeredCount} remaining
            </span>
          </div>
        </div>

        <div className="mock-mcq-question-grid">
          {questionList.map((question, index) => {
            const isCurrent =
              index === currentQuestionIndex;

            const isAnswered =
              question.answered;

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
                disabled={
                  submittingAnswer ||
                  completingRound
                }
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

      {/* ==============================
          MAIN QUESTION AREA
      ============================== */}

      <div className="mock-mcq-main">
        <div className="mock-mcq-question-topbar">
          <div>
            <span>
              Question {currentQuestionIndex + 1} of{" "}
              {totalQuestions}
            </span>

            <strong>
              {currentQuestion.marks}{" "}
              {currentQuestion.marks === 1
                ? "Mark"
                : "Marks"}
            </strong>
          </div>

          <div className="mock-mcq-question-tags">
            <span>
              {currentQuestion.category}
            </span>

            <span>
              {currentQuestion.difficulty}
            </span>
          </div>
        </div>

        {/* ==============================
            QUESTION CONTENT
        ============================== */}

        <div className="mock-mcq-question-content">
          <div className="mock-mcq-question-heading">
            <span className="mock-mcq-question-label">
              QUESTION {currentQuestionIndex + 1}
            </span>

            <h3>
              {currentQuestion.questionText}
            </h3>
          </div>

          <div className="mock-mcq-options">
            {currentQuestion.options.map(
              (option, optionIndex) => {
                const optionLetter =
                  String.fromCharCode(
                    65 + optionIndex
                  );

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
                      isSubmitted
                        ? "submitted"
                        : ""
                    }`}
                    disabled={
                      currentQuestion.answered ||
                      submittingAnswer ||
                      completingRound
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

                    {(isSelected ||
                      isSubmitted) && (
                      <span className="mock-mcq-option-check">
                        ✓
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* ==============================
              ANSWER FEEDBACK
          ============================== */}

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
                Marks:{" "}
                {answerResult.marksAwarded}/
                {answerResult.totalMarks}
              </span>
            </div>
          )}

          {roundError && (
            <div className="mock-mcq-submit-message error">
              {roundError}
            </div>
          )}
        </div>

        {/* ==============================
            QUESTION FOOTER
        ============================== */}

        <div className="mock-mcq-footer">
          <button
            type="button"
            className="mock-mcq-nav-button secondary"
            onClick={handlePrevious}
            disabled={
              currentQuestionIndex === 0 ||
              submittingAnswer ||
              completingRound
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
            ) : currentSelectedAnswer ? (
              <button
                type="button"
                className="mock-mcq-submit-answer-button"
                onClick={handleSubmitAnswer}
                disabled={
                  submittingAnswer ||
                  completingRound
                }
              >
                {submittingAnswer
                  ? "Submitting..."
                  : "Submit Answer"}
              </button>
            ) : (
              <span>
                Select an option to answer this question.
              </span>
            )}
          </div>

          {/* ==============================
              NEXT / COMPLETE ROUND
          ============================== */}

          {allQuestionsAnswered ? (
            <button
              type="button"
              className="mock-mcq-nav-button primary"
              onClick={handleCompleteRound}
              disabled={
                completingRound ||
                submittingAnswer
              }
            >
              {completingRound
                ? "Completing..."
                : "Complete Round →"}
            </button>
          ) : (
            <button
              type="button"
              className="mock-mcq-nav-button primary"
              onClick={handleNext}
              disabled={
                currentQuestionIndex ===
                  totalQuestions - 1 ||
                submittingAnswer ||
                completingRound
              }
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default MockMcqWorkspace;