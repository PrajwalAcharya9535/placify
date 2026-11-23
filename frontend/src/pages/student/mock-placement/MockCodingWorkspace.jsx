import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import "./MockCodingWorkspace.css";

const API_BASE_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

/* ==========================================
   LANGUAGE LABELS
========================================== */

const LANGUAGE_LABELS = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  cpp: "C++",
  c: "C",
};

/* ==========================================
   STARTER CODE
========================================== */

const getStarterCode = (language) => {
  switch (
    String(language || "").toLowerCase()
  ) {
    case "java":
      return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Write your solution here

    }
}`;

    case "python":
      return `# Write your solution here

`;

    case "javascript":
      return `// Write your solution here

`;

    case "cpp":
      return `#include <iostream>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`;

    case "c":
      return `#include <stdio.h>

int main() {
    // Write your solution here

    return 0;
}`;

    default:
      return `// Write your solution here

`;
  }
};

/* ==========================================
   COMPONENT
========================================== */

const MockCodingWorkspace = ({
  attemptId,
  codingProblem,
  onRoundCompleted,
}) => {
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  /* ========================================
     NORMALIZE PROBLEM
  ======================================== */

  const problem = useMemo(() => {
    return (
      codingProblem?.problem ||
      codingProblem?.codingProblem ||
      codingProblem ||
      {}
    );
  }, [codingProblem]);

  const problemId =
    problem?._id ||
    problem?.problemId ||
    codingProblem?.problemId ||
    null;

  const title =
    problem?.title ||
    "Coding Problem";

  const description =
    problem?.description ||
    "Problem description is not available.";

  const difficulty =
    problem?.difficulty ||
    "Assessment";

  const category =
    problem?.category ||
    "Coding";

  const marks =
    problem?.marks ??
    codingProblem?.round?.totalMarks ??
    codingProblem?.marks ??
    0;

  const constraints =
    problem?.constraints;

  const inputFormat =
    problem?.inputFormat;

  const outputFormat =
    problem?.outputFormat;

  const sampleInput =
    problem?.sampleInput;

  const sampleOutput =
    problem?.sampleOutput;

  const examples = Array.isArray(
    problem?.testCases
  )
    ? problem.testCases
    : [];

  /* ========================================
     SUPPORTED LANGUAGES
  ======================================== */

  const supportedLanguages =
    useMemo(() => {
      if (
        !Array.isArray(
          problem?.supportedLanguages
        )
      ) {
        return [];
      }

      return problem.supportedLanguages
        .filter(Boolean)
        .map((item) => String(item));
    }, [problem]);

  const firstSupportedLanguage =
    supportedLanguages[0] || "";

  /* ========================================
     STATE
  ======================================== */

  const [language, setLanguage] =
    useState("");

  const [sourceCode, setSourceCode] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [
    submissionResult,
    setSubmissionResult,
  ] = useState(null);

  const [submitError, setSubmitError] =
    useState("");

  const [
    completingRound,
    setCompletingRound,
  ] = useState(false);

  const [roundError, setRoundError] =
    useState("");

  /* ========================================
     INITIALIZE LANGUAGE
  ======================================== */

  useEffect(() => {
    if (!firstSupportedLanguage) {
      setLanguage("");
      setSourceCode("");
      return;
    }

    setLanguage(
      firstSupportedLanguage
    );

    setSourceCode(
      getStarterCode(
        firstSupportedLanguage
      )
    );

    setSubmissionResult(null);
    setSubmitError("");
    setRoundError("");
  }, [
    problemId,
    firstSupportedLanguage,
  ]);

  /* ========================================
     LINE NUMBERS
  ======================================== */

  const lineCount = useMemo(() => {
    return Math.max(
      sourceCode.split("\n").length,
      1
    );
  }, [sourceCode]);

  const lineNumbers = useMemo(() => {
    return Array.from(
      {
        length: lineCount,
      },
      (_, index) => index + 1
    );
  }, [lineCount]);

  /* ========================================
     LANGUAGE CHANGE
  ======================================== */

  const handleLanguageChange = (
    event
  ) => {
    const nextLanguage =
      event.target.value;

    setLanguage(nextLanguage);

    setSourceCode(
      getStarterCode(nextLanguage)
    );

    setSubmissionResult(null);
    setSubmitError("");
    setRoundError("");
  };

  /* ========================================
     EDITOR SCROLL
  ======================================== */

  const handleEditorScroll = () => {
    if (
      !editorRef.current ||
      !lineNumbersRef.current
    ) {
      return;
    }

    lineNumbersRef.current.scrollTop =
      editorRef.current.scrollTop;
  };

  /* ========================================
     TAB SUPPORT
  ======================================== */

  const handleEditorKeyDown = (
    event
  ) => {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea =
      event.currentTarget;

    const start =
      textarea.selectionStart;

    const end =
      textarea.selectionEnd;

    const indentation = "    ";

    const updatedCode =
      sourceCode.substring(
        0,
        start
      ) +
      indentation +
      sourceCode.substring(end);

    setSourceCode(updatedCode);

    requestAnimationFrame(() => {
      textarea.selectionStart =
        start + indentation.length;

      textarea.selectionEnd =
        start + indentation.length;
    });
  };

  /* ========================================
     SUBMIT CODE
  ======================================== */

  const handleSubmitCode = async () => {
    if (submitting) {
      return;
    }

    if (!problemId) {
      setSubmitError(
        "Coding problem ID is unavailable."
      );
      return;
    }

    if (!language) {
      setSubmitError(
        "No supported programming language is available for this problem."
      );
      return;
    }

    if (!sourceCode.trim()) {
      setSubmitError(
        "Write your solution before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setRoundError("");

      const token =
        localStorage.getItem(
          "placifyToken"
        );

      if (!token) {
        setSubmitError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response =
        await axios.post(
          `${API_BASE_URL}/mock-attempts/${attemptId}/current-round/coding-submit`,
          {
            problemId,
            language,
            sourceCode,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      /*
        IMPORTANT:
        Only after this succeeds does
        submissionResult become truthy.

        That causes:
        - editor to shrink
        - results to appear
        - Complete Round to appear
      */

      setSubmissionResult(
        response.data
      );
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "Failed to submit coding solution."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ========================================
     COMPLETE ROUND
  ======================================== */

  const handleCompleteRound =
    async () => {
      if (
        completingRound ||
        !submissionResult
      ) {
        return;
      }

      try {
        setCompletingRound(true);
        setRoundError("");

        const token =
          localStorage.getItem(
            "placifyToken"
          );

        if (!token) {
          setRoundError(
            "Your session has expired. Please login again."
          );
          return;
        }

        const response =
          await axios.post(
            `${API_BASE_URL}/mock-attempts/${attemptId}/round/complete`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const updatedMockAttempt =
          response.data.mockAttempt;

        const nextRound =
          response.data.nextRound ||
          null;

        if (onRoundCompleted) {
          onRoundCompleted(
            updatedMockAttempt,
            nextRound,
            response.data
          );
        }
      } catch (error) {
        setRoundError(
          error.response?.data?.message ||
            "Failed to complete coding round."
        );
      } finally {
        setCompletingRound(false);
      }
    };

  /* ========================================
     RESULT DATA
  ======================================== */

  const codingAttempt =
    submissionResult?.attempt ||
    null;

  const scorePercentage =
    codingAttempt?.scorePercentage ??
    null;

  const passedTestCases =
    codingAttempt?.passedTestCases ??
    null;

  const totalTestCases =
    codingAttempt?.totalTestCases ??
    null;

  const failedTestCases =
    codingAttempt?.failedTestCases ??
    null;

  const marksAwarded =
    codingAttempt?.marksAwarded ??
    null;

  const totalMarks =
    codingAttempt?.totalMarks ??
    marks;

  const submissionStatus =
    codingAttempt?.status ||
    "";

  const executionTimeMs =
    codingAttempt?.executionTimeMs ??
    null;

  const executionError =
    codingAttempt?.errorMessage ||
    "";

  const testCaseResults =
    Array.isArray(
      submissionResult?.testResults
    )
      ? submissionResult.testResults
      : [];

  /* ========================================
     UI
  ======================================== */

  return (
    <div
      className={`mock-coding-workspace ${
        submissionResult
          ? "mock-coding-after-submit"
          : "mock-coding-before-submit"
      }`}
    >
      {/* ==================================
          LEFT — PROBLEM
      ================================== */}

      <section className="mock-coding-problem-panel">

        <div className="mock-coding-panel-heading">
          <div>
            <p>
              CODING PROBLEM
            </p>

            <h2>
              {title}
            </h2>
          </div>

          <span className="mock-coding-marks">
            {marks} Marks
          </span>
        </div>

        <div className="mock-coding-tags">
          <span>
            {difficulty}
          </span>

          <span>
            {category}
          </span>
        </div>

        <div className="mock-coding-problem-scroll">

          <div className="mock-coding-section">
            <h3>
              Problem Statement
            </h3>

            <p>
              {description}
            </p>
          </div>

          {inputFormat && (
            <div className="mock-coding-section">
              <h3>
                Input Format
              </h3>

              <p>
                {inputFormat}
              </p>
            </div>
          )}

          {outputFormat && (
            <div className="mock-coding-section">
              <h3>
                Output Format
              </h3>

              <p>
                {outputFormat}
              </p>
            </div>
          )}

          {constraints && (
            <div className="mock-coding-section">
              <h3>
                Constraints
              </h3>

              {Array.isArray(
                constraints
              ) ? (
                <ul>
                  {constraints.map(
                    (
                      constraint,
                      index
                    ) => (
                      <li
                        key={`${constraint}-${index}`}
                      >
                        {constraint}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>
                  {constraints}
                </p>
              )}
            </div>
          )}

          {(sampleInput != null ||
            sampleOutput != null) && (
            <div className="mock-coding-section">
              <h3>
                Sample
              </h3>

              <div className="mock-coding-example">

                {sampleInput != null && (
                  <div>
                    <span>
                      Sample Input
                    </span>

                    <pre>
                      {String(
                        sampleInput
                      )}
                    </pre>
                  </div>
                )}

                {sampleOutput != null && (
                  <div>
                    <span>
                      Sample Output
                    </span>

                    <pre>
                      {String(
                        sampleOutput
                      )}
                    </pre>
                  </div>
                )}

              </div>
            </div>
          )}

          {examples.length > 0 && (
            <div className="mock-coding-section">
              <h3>
                Public Test Cases
              </h3>

              <div className="mock-coding-examples">

                {examples.map(
                  (
                    example,
                    index
                  ) => (
                    <div
                      className="mock-coding-example"
                      key={index}
                    >
                      <strong>
                        Test Case{" "}
                        {index + 1}
                      </strong>

                      <div>
                        <span>
                          Input
                        </span>

                        <pre>
                          {String(
                            example?.input ??
                              ""
                          )}
                        </pre>
                      </div>

                      <div>
                        <span>
                          Expected Output
                        </span>

                        <pre>
                          {String(
                            example?.expectedOutput ??
                              ""
                          )}
                        </pre>
                      </div>
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {problem?.timeLimitSeconds && (
            <div className="mock-coding-section">
              <h3>
                Time Limit
              </h3>

              <p>
                {
                  problem.timeLimitSeconds
                }{" "}
                seconds
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ==================================
          RIGHT — CODING
      ================================== */}

      <section className="mock-coding-editor-panel">

        {/* EDITOR HEADER */}

        <div className="mock-coding-editor-toolbar">

          <div>
            <p>
              CODE EDITOR
            </p>

            <span>
              Write and submit your
              solution
            </span>
          </div>

          <select
            value={language}
            onChange={
              handleLanguageChange
            }
            disabled={
              submitting ||
              supportedLanguages.length ===
                0
            }
          >
            {supportedLanguages.length ===
            0 ? (
              <option value="">
                No Language
              </option>
            ) : (
              supportedLanguages.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {LANGUAGE_LABELS[
                      String(
                        item
                      ).toLowerCase()
                    ] || item}
                  </option>
                )
              )
            )}
          </select>

        </div>

        {/* ==================================
            EDITOR
        ================================== */}

        <div className="mock-coding-editor-wrapper">

          <div
            ref={lineNumbersRef}
            className="mock-coding-line-numbers"
            aria-hidden="true"
          >
            {lineNumbers.map(
              (lineNumber) => (
                <div
                  key={lineNumber}
                  className="mock-coding-line-number"
                >
                  {lineNumber}
                </div>
              )
            )}
          </div>

          <textarea
            ref={editorRef}
            className="mock-coding-editor"
            value={sourceCode}
            onChange={(event) => {
              /*
                Do NOT hide the previous
                result just because the
                student edits code.

                Results remain visible
                until they submit again.
              */

              setSourceCode(
                event.target.value
              );

              setSubmitError("");
              setRoundError("");
            }}
            onScroll={
              handleEditorScroll
            }
            onKeyDown={
              handleEditorKeyDown
            }
            spellCheck="false"
            disabled={submitting}
          />

        </div>

        {/* ==================================
            SUBMIT BAR
        ================================== */}

        <div className="mock-coding-actions">

          <div className="mock-coding-action-message">

            {submitError && (
              <span className="mock-coding-error">
                {submitError}
              </span>
            )}

            {!submitError &&
              submissionResult && (
                <span className="mock-coding-success">
                  Evaluation completed.
                </span>
              )}

          </div>

          <button
            type="button"
            className="mock-coding-submit-button"
            onClick={
              handleSubmitCode
            }
            disabled={
              submitting ||
              !language
            }
          >
            {submitting
              ? "Running..."
              : submissionResult
                ? "Submit Again"
                : "Submit Code"}
          </button>

        </div>

        {/* ==================================
            AFTER SUBMIT ONLY
            RESULTS DO NOT EXIST BEFORE
            FIRST SUCCESSFUL SUBMISSION
        ================================== */}

        {submissionResult && (
          <>
            <div className="mock-coding-results">

              <div className="mock-coding-results-header">

                <div>
                  <p>
                    TEST RESULTS
                  </p>

                  <h3>
                    Submission Result
                  </h3>
                </div>

                {scorePercentage !=
                  null && (
                  <strong>
                    {
                      scorePercentage
                    }
                    %
                  </strong>
                )}

              </div>

              {/* ONLY RESULTS CONTENT SCROLLS */}

              <div className="mock-coding-result-content">

                <div className="mock-coding-score-row">

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {submissionStatus ||
                        "Evaluated"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Passed Tests
                    </span>

                    <strong>
                      {passedTestCases ??
                        0}
                      /
                      {totalTestCases ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Failed
                    </span>

                    <strong>
                      {failedTestCases ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Marks
                    </span>

                    <strong>
                      {marksAwarded ??
                        0}
                      /
                      {totalMarks ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Score
                    </span>

                    <strong>
                      {scorePercentage ??
                        0}
                      %
                    </strong>
                  </div>

                  {executionTimeMs !=
                    null && (
                    <div>
                      <span>
                        Execution
                      </span>

                      <strong>
                        {
                          executionTimeMs
                        }{" "}
                        ms
                      </strong>
                    </div>
                  )}

                </div>

                {executionError && (
                  <div className="mock-coding-error">
                    {executionError}
                  </div>
                )}

                {testCaseResults.length >
                0 ? (
                  <div className="mock-coding-test-list">

                    {testCaseResults.map(
                      (
                        testCase,
                        index
                      ) => (
                        <div
                          className="mock-coding-test-item"
                          key={index}
                        >

                          <div>
                            <strong>
                              Test Case{" "}
                              {index + 1}
                            </strong>

                            <span
                              className={
                                testCase?.passed
                                  ? "mock-coding-test-passed"
                                  : "mock-coding-test-failed"
                              }
                            >
                              {testCase?.status ||
                                (testCase?.passed
                                  ? "Accepted"
                                  : "Failed")}
                            </span>
                          </div>

                          <div className="mock-coding-test-details">

                            <div>
                              <span>
                                Input
                              </span>

                              <pre>
                                {String(
                                  testCase?.input ??
                                    ""
                                )}
                              </pre>
                            </div>

                            <div>
                              <span>
                                Expected
                              </span>

                              <pre>
                                {String(
                                  testCase?.expectedOutput ??
                                    ""
                                )}
                              </pre>
                            </div>

                            <div>
                              <span>
                                Your Output
                              </span>

                              <pre>
                                {String(
                                  testCase?.actualOutput ??
                                    ""
                                )}
                              </pre>
                            </div>

                          </div>

                          {testCase?.errorMessage && (
                            <div className="mock-coding-error">
                              {
                                testCase.errorMessage
                              }
                            </div>
                          )}

                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="mock-coding-empty-result">
                    Evaluation completed.
                    Hidden test case details
                    are not displayed.
                  </div>
                )}

              </div>
            </div>

            {/* ==============================
                COMPLETE ROUND
                AFTER SUBMIT ONLY
            ============================== */}

            <div className="mock-coding-footer">

              <div>
                {roundError && (
                  <span className="mock-coding-error">
                    {roundError}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="mock-coding-complete-button"
                onClick={
                  handleCompleteRound
                }
                disabled={
                  completingRound
                }
              >
                {completingRound
                  ? "Completing..."
                  : "Complete Round →"}
              </button>

            </div>
          </>
        )}

      </section>
    </div>
  );
};

export default MockCodingWorkspace;