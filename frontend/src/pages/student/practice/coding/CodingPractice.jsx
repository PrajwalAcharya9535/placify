import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../../components/student/StudentLayout";
import "./CodingPractice.css";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

function CodingPractice() {
  const navigate = useNavigate();

  const token = localStorage.getItem("placifyToken");

  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");

  const [language, setLanguage] = useState("");
  const [sourceCode, setSourceCode] = useState("");

  const [result, setResult] = useState(null);

  // ========================================================
  // EDITOR LINE NUMBERS
  // ========================================================

  const editorLineCount = useMemo(() => {
    return Math.max(1, sourceCode.split("\n").length);
  }, [sourceCode]);

  const editorLineNumbers = useMemo(() => {
    return Array.from(
      { length: editorLineCount },
      (_, index) => index + 1
    );
  }, [editorLineCount]);

  const syncEditorScroll = (event) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop =
        event.currentTarget.scrollTop;
    }
  };

  // ========================================================
  // AUTH ERROR
  // ========================================================

  const handleAuthError = (status) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("placifyToken");
      localStorage.removeItem("placifyUser");

      navigate("/login", {
        replace: true,
      });

      return true;
    }

    return false;
  };

  // ========================================================
  // FETCH CODING PROBLEMS
  // ========================================================

  const fetchProblems = async () => {
    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setLoadingProblems(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (difficulty) {
        params.difficulty = difficulty;
      }

      if (category) {
        params.category = category;
      }

      const response = await axios.get(
        `${API_BASE}/coding/problems`,
        {
          ...authConfig,
          params,
        }
      );

      setProblems(response.data?.problems || []);
    } catch (err) {
      const status = err.response?.status;

      if (handleAuthError(status)) {
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load coding problems."
      );
    } finally {
      setLoadingProblems(false);
    }
  };

  // ========================================================
  // INITIAL FETCH
  // ========================================================

  useEffect(() => {
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // FILTER CHANGE
  // ========================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProblems();
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty, category]);

  // ========================================================
  // AVAILABLE CATEGORIES
  // ========================================================

  const categories = useMemo(() => {
    const values = problems
      .map((problem) => problem.category)
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [problems]);

  // ========================================================
  // OPEN PROBLEM
  // ========================================================

  const openProblem = async (problemId) => {
    if (!problemId) {
      return;
    }

    try {
      setLoadingProblem(true);
      setError("");
      setResult(null);

      const response = await axios.get(
        `${API_BASE}/coding/problems/${problemId}`,
        authConfig
      );

      const problem = response.data?.problem;

      if (!problem) {
        setError("Coding problem could not be loaded.");
        return;
      }

      setSelectedProblem(problem);

      const supportedLanguages =
        problem.supportedLanguages || [];

      if (supportedLanguages.length > 0) {
        setLanguage(supportedLanguages[0]);
      } else {
        setLanguage("");
      }

      setSourceCode("");
    } catch (err) {
      const status = err.response?.status;

      if (handleAuthError(status)) {
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load coding problem."
      );
    } finally {
      setLoadingProblem(false);
    }
  };

  // ========================================================
  // CLOSE PROBLEM
  // ========================================================

  const closeProblem = () => {
    if (submitting) {
      return;
    }

    setSelectedProblem(null);
    setLanguage("");
    setSourceCode("");
    setResult(null);
    setError("");
  };

  // ========================================================
  // SUBMIT CODE
  // ========================================================

  const handlePasteDemoCode = () => {
  const solution = selectedProblem?.demoSolutions?.[language];

  if (!solution) {
    setError("Demo solution not available for this problem and language.");
    return;
  }

  setSourceCode(solution);
  setResult(null);
  setError("");
  editorRef.current?.focus();
};

  const submitCode = async () => {
    if (!selectedProblem?._id) {
      setError("Please select a coding problem.");
      return;
    }

    if (!language) {
      setError("Please select a programming language.");
      return;
    }

    if (!sourceCode.trim()) {
      setError("Please write your solution before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setResult(null);

      const response = await axios.post(
        `${API_BASE}/coding/submit`,
        {
          problemId: selectedProblem._id,
          language,
          sourceCode,
        },
        authConfig
      );

      setResult(response.data);
    } catch (err) {
      const status = err.response?.status;

      if (handleAuthError(status)) {
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to evaluate your code."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // STATUS CLASS
  // ========================================================

  const getStatusClass = (status = "") => {
    const normalized = status
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (normalized === "accepted") {
      return "accepted";
    }

    if (normalized === "wrong-answer") {
      return "wrong";
    }

    if (
      normalized.includes("error") ||
      normalized.includes("runtime") ||
      normalized.includes("compilation")
    ) {
      return "error";
    }

    return "neutral";
  };

  // ========================================================
  // PROBLEM LIST SCREEN
  // ========================================================

  if (!selectedProblem) {
    return (
      <StudentLayout>
        <div className="coding-practice-page">
          <button
            type="button"
            className="coding-back-button"
            onClick={() =>
              navigate("/student/practice")
            }
          >
            ← Back to Practice Center
          </button>

          <section className="coding-hero">
            <div>
              <span>CODING LAB</span>

              <h1>
                Practice Coding Problems
              </h1>

              <p>
                Solve real placement-style coding
                problems, execute your solution against
                test cases, and improve your programming
                skills.
              </p>
            </div>

            <div className="coding-hero-badge">
              <span>PLACIFY</span>
              <strong>Coding Practice</strong>
            </div>
          </section>

          <section className="coding-filter-card">
            <div className="coding-search-field">
              <label htmlFor="coding-search">
                Search Problems
              </label>

              <input
                id="coding-search"
                type="text"
                value={search}
                placeholder="Search by title or description..."
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="coding-difficulty">
                Difficulty
              </label>

              <select
                id="coding-difficulty"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value)
                }
              >
                <option value="">
                  All Difficulties
                </option>

                <option value="Easy">
                  Easy
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Hard">
                  Hard
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="coding-category">
                Category
              </label>

              <select
                id="coding-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option value="">
                  All Categories
                </option>

                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error && (
            <div className="coding-error-message">
              {error}
            </div>
          )}

          <section className="coding-library">
            <div className="coding-section-heading">
              <div>
                <span>PROBLEM LIBRARY</span>

                <h2>
                  Coding Challenges
                </h2>
              </div>

              <p>
                {loadingProblems
                  ? "Loading..."
                  : `${problems.length} problem${
                      problems.length === 1
                        ? ""
                        : "s"
                    } found`}
              </p>
            </div>

            {loadingProblems ? (
              <div className="coding-state-card">
                <div className="coding-loader" />

                <strong>
                  Loading coding problems...
                </strong>

                <span>
                  Preparing your coding practice
                  environment.
                </span>
              </div>
            ) : problems.length === 0 ? (
              <div className="coding-state-card">
                <div className="coding-state-icon">
                  {"</>"}
                </div>

                <strong>
                  No coding problems found
                </strong>

                <span>
                  Try changing your search or filter
                  options.
                </span>
              </div>
            ) : (
              <div className="coding-problem-grid">
                {problems.map((problem) => (
                  <article
                    key={problem._id}
                    className="coding-problem-card"
                  >
                    <div className="coding-problem-top">
                      <div>
                        <span
                          className={`coding-difficulty ${String(
                            problem.difficulty || ""
                          ).toLowerCase()}`}
                        >
                          {problem.difficulty ||
                            "Not Specified"}
                        </span>

                        {problem.category && (
                          <span className="coding-category-badge">
                            {problem.category}
                          </span>
                        )}
                      </div>

                      <span className="coding-marks">
                        {problem.marks || 0} Marks
                      </span>
                    </div>

                    <h3>
                      {problem.title}
                    </h3>

                    <p className="coding-problem-description">
                      {problem.description}
                    </p>

                    <div className="coding-problem-info">
                      <div>
                        <span>
                          Languages
                        </span>

                        <strong>
                          {problem.supportedLanguages
                            ?.length
                            ? problem.supportedLanguages.join(
                                ", "
                              )
                            : "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Time Limit
                        </span>

                        <strong>
                          {problem.timeLimitSeconds ||
                            0}
                          s
                        </strong>
                      </div>
                    </div>

                    {problem.skillsCovered?.length >
                      0 && (
                      <div className="coding-skill-list">
                        {problem.skillsCovered
                          .slice(0, 4)
                          .map((skill) => (
                            <span key={skill}>
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openProblem(problem._id)
                      }
                      disabled={loadingProblem}
                    >
                      {loadingProblem
                        ? "Opening..."
                        : "Solve Problem"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </StudentLayout>
    );
  }

  // ========================================================
  // CODING WORKSPACE
  // ========================================================

  return (
    <StudentLayout>
      <div className="coding-workspace">
        <header className="coding-workspace-header">
          <div className="coding-workspace-title">
            <button
              type="button"
              onClick={closeProblem}
              disabled={submitting}
            >
              ← Problems
            </button>

            <div>
              <span>CODING LAB</span>

              <h1>
                {selectedProblem.title}
              </h1>
            </div>
          </div>

          <div className="coding-workspace-meta">
            <span
              className={`coding-difficulty ${String(
                selectedProblem.difficulty || ""
              ).toLowerCase()}`}
            >
              {selectedProblem.difficulty}
            </span>

            {selectedProblem.category && (
              <span>
                {selectedProblem.category}
              </span>
            )}

            <span>
              {selectedProblem.marks || 0} Marks
            </span>

            <span>
              {selectedProblem.timeLimitSeconds ||
                0}
              s
            </span>
          </div>
        </header>

        {error && (
          <div className="coding-workspace-error">
            {error}
          </div>
        )}

        <div className="coding-workspace-grid">
          <section className="coding-problem-panel">
            <div className="coding-panel-heading">
              <span>PROBLEM</span>

              <h2>
                Problem Statement
              </h2>
            </div>

            <div className="coding-problem-scroll">
              <div className="coding-description-block">
                <h3>
                  Description
                </h3>

                <p>
                  {selectedProblem.description ||
                    "No description provided."}
                </p>
              </div>

              {selectedProblem.inputFormat && (
                <div className="coding-description-block">
                  <h3>
                    Input Format
                  </h3>

                  <p>
                    {selectedProblem.inputFormat}
                  </p>
                </div>
              )}

              {selectedProblem.outputFormat && (
                <div className="coding-description-block">
                  <h3>
                    Output Format
                  </h3>

                  <p>
                    {selectedProblem.outputFormat}
                  </p>
                </div>
              )}

              {selectedProblem.constraints && (
                <div className="coding-description-block">
                  <h3>
                    Constraints
                  </h3>

                  <pre>
                    {selectedProblem.constraints}
                  </pre>
                </div>
              )}

              <div className="coding-sample-grid">
                <div>
                  <span>
                    Sample Input
                  </span>

                  <pre>
                    {selectedProblem.sampleInput ||
                      "No sample input"}
                  </pre>
                </div>

                <div>
                  <span>
                    Sample Output
                  </span>

                  <pre>
                    {selectedProblem.sampleOutput ||
                      "No sample output"}
                  </pre>
                </div>
              </div>

              {selectedProblem.testCases?.length >
                0 && (
                <div className="coding-public-tests">
                  <h3>
                    Public Test Cases
                  </h3>

                  {selectedProblem.testCases.map(
                    (testCase, index) => (
                      <div
                        key={`${index}-${testCase.input}`}
                        className="coding-public-test"
                      >
                        <strong>
                          Test Case {index + 1}
                        </strong>

                        <div>
                          <span>Input</span>

                          <pre>
                            {testCase.input || "—"}
                          </pre>
                        </div>

                        <div>
                          <span>
                            Expected Output
                          </span>

                          <pre>
                            {testCase.expectedOutput ||
                              "—"}
                          </pre>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {selectedProblem.skillsCovered?.length >
                0 && (
                <div className="coding-description-block">
                  <h3>
                    Skills Covered
                  </h3>

                  <div className="coding-skill-list">
                    {selectedProblem.skillsCovered.map(
                      (skill) => (
                        <span key={skill}>
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="coding-editor-panel">
            <div className="coding-editor-toolbar">
              <div>
                <span>CODE EDITOR</span>

                <strong>
                  Write Your Solution
                </strong>
              </div>

              <label>
                <span>Language</span>

                <select
                  value={language}
                  onChange={(event) => {
                    setLanguage(
                      event.target.value
                    );

                    setResult(null);
                    setError("");
                  }}
                  disabled={submitting}
                >
                  {selectedProblem.supportedLanguages?.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="coding-editor-shell">
              <div
                ref={lineNumbersRef}
                className="coding-line-numbers"
                aria-hidden="true"
              >
                {editorLineNumbers.map((lineNumber) => (
                  <span key={lineNumber}>
                    {lineNumber}
                  </span>
                ))}
              </div>

              <textarea
                ref={editorRef}
                className="coding-editor"
                value={sourceCode}
                onScroll={syncEditorScroll}
                onChange={(event) => {
                  setSourceCode(event.target.value);

                  if (result) {
                    setResult(null);
                  }
                }}
                placeholder={`Write your ${language || ""} solution here...`}
                spellCheck="false"
                disabled={submitting}
              />
            </div>

            <div className="coding-submit-bar">
              <div>
                <span>
                  Your solution will be tested against
                  public and hidden test cases.
                </span>
              </div>

              <button
  type="button"
  onClick={handlePasteDemoCode}
  disabled={submitting || !selectedProblem || !language}
  title="Insert a sample solution for demonstration"
>
  Paste Demo Code
</button>

              <button
                type="button"
                onClick={submitCode}
                disabled={
                  submitting ||
                  !language ||
                  !sourceCode.trim()
                }
              >
                {submitting
                  ? "Evaluating..."
                  : "Submit Code"}
              </button>
            </div>

            {result && (
              <div className="coding-result-panel">
                <div className="coding-result-header">
                  <div>
                    <span>
                      EVALUATION RESULT
                    </span>

                    <h2>
                      Submission Result
                    </h2>
                  </div>

                  <span
                    className={`coding-status ${getStatusClass(
                      result.attempt?.status
                    )}`}
                  >
                    {result.attempt?.status ||
                      "Unknown"}
                  </span>
                </div>

                <div className="coding-result-stats">
                  <div>
                    <span>
                      Score
                    </span>

                    <strong>
                      {result.attempt
                        ?.scorePercentage || 0}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>
                      Test Cases
                    </span>

                    <strong>
                      {result.attempt
                        ?.passedTestCases || 0}
                      /
                      {result.attempt
                        ?.totalTestCases || 0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Marks
                    </span>

                    <strong>
                      {result.attempt
                        ?.marksAwarded || 0}
                      /
                      {result.attempt
                        ?.totalMarks || 0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Execution
                    </span>

                    <strong>
                      {result.attempt
                        ?.executionTimeMs || 0}
                      ms
                    </strong>
                  </div>
                </div>

                {result.attempt?.errorMessage && (
                  <div className="coding-execution-error">
                    <strong>
                      Execution Error
                    </strong>

                    <pre>
                      {
                        result.attempt
                          .errorMessage
                      }
                    </pre>
                  </div>
                )}

                {result.testResults?.length >
                  0 && (
                  <div className="coding-test-results">
                    <div className="coding-test-results-heading">
                      <strong>
                        Public Test Results
                      </strong>

                      <span>
                        Hidden test cases are
                        evaluated securely.
                      </span>
                    </div>

                    {result.testResults.map(
                      (testCase, index) => (
                        <article
                          key={index}
                          className={`coding-test-result ${
                            testCase.passed
                              ? "passed"
                              : "failed"
                          }`}
                        >
                          <div className="coding-test-result-top">
                            <strong>
                              Test Case{" "}
                              {index + 1}
                            </strong>

                            <span>
                              {testCase.passed
                                ? "Passed"
                                : testCase.status ||
                                  "Failed"}
                            </span>
                          </div>

                          <div className="coding-test-output-grid">
                            <div>
                              <span>
                                Input
                              </span>

                              <pre>
                                {testCase.input ||
                                  "—"}
                              </pre>
                            </div>

                            <div>
                              <span>
                                Expected
                              </span>

                              <pre>
                                {testCase.expectedOutput ||
                                  "—"}
                              </pre>
                            </div>

                            <div>
                              <span>
                                Your Output
                              </span>

                              <pre>
                                {testCase.actualOutput ||
                                  "—"}
                              </pre>
                            </div>
                          </div>

                          {testCase.errorMessage && (
                            <div className="coding-test-error">
                              {
                                testCase.errorMessage
                              }
                            </div>
                          )}
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}

export default CodingPractice;