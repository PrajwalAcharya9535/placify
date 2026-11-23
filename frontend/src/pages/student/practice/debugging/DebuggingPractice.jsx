import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../../components/student/StudentLayout";
import "./DebuggingPractice.css";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

function DebuggingPractice() {
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [problemLoading, setProblemLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");

  const [fixedCode, setFixedCode] = useState("");
  const [result, setResult] = useState(null);

  // =========================================================
  // AUTH
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("placifyToken");
  };

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    };
  };

  const handleAuthFailure = () => {
    localStorage.removeItem("placifyToken");
    localStorage.removeItem("placifyUser");

    navigate("/login", {
      replace: true,
    });
  };

  // =========================================================
  // FETCH DEBUGGING PROBLEMS
  // =========================================================

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE}/debugging/problems`,
          getAuthConfig()
        );

        setProblems(
          response.data?.problems || []
        );
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          handleAuthFailure();
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load debugging problems."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // =========================================================
  // FILTER VALUES
  // =========================================================

  const categories = useMemo(() => {
    return [
      ...new Set(
        problems
          .map((problem) => problem.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [problems]);

  const languages = useMemo(() => {
    return [
      ...new Set(
        problems
          .map((problem) => problem.language)
          .filter(Boolean)
      ),
    ].sort();
  }, [problems]);

  // =========================================================
  // FILTERED PROBLEMS
  // =========================================================

  const filteredProblems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return problems.filter((problem) => {
      const matchesSearch =
        !normalizedSearch ||
        problem.title
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        problem.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesDifficulty =
        !difficulty ||
        problem.difficulty === difficulty;

      const matchesCategory =
        !category ||
        problem.category === category;

      const matchesLanguage =
        !language ||
        problem.language === language;

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesCategory &&
        matchesLanguage
      );
    });
  }, [
    problems,
    search,
    difficulty,
    category,
    language,
  ]);

  // =========================================================
  // OPEN PROBLEM
  // =========================================================

  const openProblem = async (problemId) => {
    try {
      setProblemLoading(true);
      setWorkspaceError("");
      setResult(null);

      const response = await axios.get(
        `${API_BASE}/debugging/problems/${problemId}`,
        getAuthConfig()
      );

      const problem =
        response.data?.problem || null;

      setSelectedProblem(problem);

    // Start with an empty editor.
// Students can paste the starter code using the button.
setFixedCode(problem?.buggyCode || "");
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        handleAuthFailure();
        return;
      }

      setWorkspaceError(
        err.response?.data?.message ||
          "Failed to load debugging problem."
      );
    } finally {
      setProblemLoading(false);
    }
  };

  // =========================================================
  // CLOSE WORKSPACE
  // =========================================================

  const closeWorkspace = () => {
    setSelectedProblem(null);
    setFixedCode("");
    setResult(null);
    setWorkspaceError("");
  };

  // =========================================================
  // RESET BUGGY CODE
  // =========================================================

const pasteCode = () => {
  if (!selectedProblem?.completionCode) {
    setWorkspaceError("Completion code is not available.");
    return;
  }

  setFixedCode(selectedProblem.completionCode);
  setResult(null);
  setWorkspaceError("");
};
  // =========================================================
  // SUBMIT FIXED CODE
  // =========================================================

  const submitFixedCode = async () => {
    if (!selectedProblem?._id) {
      return;
    }

    if (!fixedCode.trim()) {
      setWorkspaceError(
        "Please provide the fixed code before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      setWorkspaceError("");
      setResult(null);

      const response = await axios.post(
        `${API_BASE}/debugging/submit`,
        {
          problemId: selectedProblem._id,
          fixedCode,
        },
        getAuthConfig()
      );

      setResult(response.data);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        handleAuthFailure();
        return;
      }

      setWorkspaceError(
        err.response?.data?.message ||
          "Failed to evaluate debugging attempt."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // EDITOR LINE NUMBERS
  // =========================================================

  const editorLineCount = useMemo(() => {
    return Math.max(
      1,
      fixedCode.split("\n").length
    );
  }, [fixedCode]);

  const editorLineNumbers = useMemo(() => {
    return Array.from(
      {
        length: editorLineCount,
      },
      (_, index) => index + 1
    );
  }, [editorLineCount]);

  const syncEditorScroll = (event) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop =
        event.currentTarget.scrollTop;
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status = "") => {
    const normalized =
      status.toLowerCase();

    if (normalized === "accepted") {
      return "accepted";
    }

    if (
      normalized === "wrong answer"
    ) {
      return "wrong";
    }

    if (
      normalized.includes("error") ||
      normalized.includes("time")
    ) {
      return "error";
    }

    return "neutral";
  };

  // =========================================================
  // PROBLEM LIBRARY
  // =========================================================

  if (!selectedProblem) {
    return (
      <StudentLayout>
        <div className="debugging-practice-page">
          <button
            type="button"
            className="debugging-back-button"
            onClick={() =>
              navigate("/student/practice")
            }
          >
            ← Back to Practice
          </button>

          <section className="debugging-hero">
            <div>
              <span>
                PRACTICE ENVIRONMENT
              </span>

              <h1>Debugging Lab</h1>

              <p>
                Find bugs, understand broken
                logic and repair real code
                challenges using placement-style
                debugging exercises.
              </p>
            </div>

            <div className="debugging-hero-badge">
              <span>
                DEBUGGING PRACTICE
              </span>

              <strong>
                Inspect • Fix • Validate
              </strong>
            </div>
          </section>

          <section className="debugging-filter-card">
            <div className="debugging-search-field">
              <label>
                Search Problems
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search debugging problems..."
              />
            </div>

            <div>
              <label>
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value
                  )
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
              <label>
                Language
              </label>

              <select
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Languages
                </option>

                {languages.map(
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
            </div>

            <div>
              <label>
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Categories
                </option>

                {categories.map(
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
            </div>
          </section>

          {error && (
            <div className="debugging-error-message">
              {error}
            </div>
          )}

          <section className="debugging-library">
            <div className="debugging-section-heading">
              <div>
                <span>
                  PROBLEM LIBRARY
                </span>

                <h2>
                  Debugging Challenges
                </h2>
              </div>

              <p>
                {filteredProblems.length}{" "}
                problem
                {filteredProblems.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {loading ? (
              <div className="debugging-state-card">
                <div className="debugging-loader" />

                <strong>
                  Loading debugging problems...
                </strong>
              </div>
            ) : filteredProblems.length ===
              0 ? (
              <div className="debugging-state-card">
                <div className="debugging-state-icon">
                  {"</>"}
                </div>

                <strong>
                  No debugging problems found
                </strong>

                <span>
                  Try changing the current
                  filters.
                </span>
              </div>
            ) : (
              <div className="debugging-problem-grid">
                {filteredProblems.map(
                  (problem) => (
                    <article
                      className="debugging-problem-card"
                      key={problem._id}
                    >
                      <div className="debugging-problem-top">
                        <div>
                          <span
                            className={`debugging-difficulty ${
                              problem.difficulty
                                ?.toLowerCase() ||
                              ""
                            }`}
                          >
                            {problem.difficulty}
                          </span>

                          <span className="debugging-language-badge">
                            {problem.language}
                          </span>

                          <span className="debugging-category-badge">
                            {problem.category}
                          </span>
                        </div>

                        <span className="debugging-marks">
                          {problem.marks} Marks
                        </span>
                      </div>

                      <h3>
                        {problem.title}
                      </h3>

                      <p className="debugging-problem-description">
                        {problem.description}
                      </p>

                      <div className="debugging-problem-info">
                        <div>
                          <span>
                            SKILLS
                          </span>

                          <strong>
                            {problem.skillsCovered
                              ?.length
                              ? problem.skillsCovered.join(
                                  ", "
                                )
                              : "Debugging"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            TIME
                          </span>

                          <strong>
                            {problem.timeLimitSeconds ||
                              5}
                            s
                          </strong>
                        </div>
                      </div>

                      {problem.skillsCovered
                        ?.length > 0 && (
                        <div className="debugging-skill-list">
                          {problem.skillsCovered
                            .slice(0, 4)
                            .map((skill) => (
                              <span
                                key={skill}
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={
                          problemLoading
                        }
                        onClick={() =>
                          openProblem(
                            problem._id
                          )
                        }
                      >
                        {problemLoading
                          ? "Opening..."
                          : "Debug Problem"}
                      </button>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </StudentLayout>
    );
  }

  // =========================================================
  // DEBUGGING WORKSPACE
  // =========================================================

  return (
    <StudentLayout>
      <div className="debugging-workspace">
        <header className="debugging-workspace-header">
          <div className="debugging-workspace-title">
            <button
              type="button"
              disabled={submitting}
              onClick={closeWorkspace}
            >
              ← Problems
            </button>

            <div>
              <span>
                DEBUGGING LAB
              </span>

              <h1>
                {selectedProblem.title}
              </h1>
            </div>
          </div>

          <div className="debugging-workspace-meta">
            <span
              className={`debugging-difficulty ${
                selectedProblem.difficulty
                  ?.toLowerCase() || ""
              }`}
            >
              {selectedProblem.difficulty}
            </span>

            <span>
              {selectedProblem.language}
            </span>

            <span>
              {selectedProblem.category}
            </span>

            <span>
              {selectedProblem.marks} Marks
            </span>

            <span>
              {selectedProblem.timeLimitSeconds ||
                5}
              s
            </span>
          </div>
        </header>

        {workspaceError && (
          <div className="debugging-workspace-error">
            {workspaceError}
          </div>
        )}

        <div className="debugging-workspace-grid">
          {/* =========================================
              LEFT PANEL
          ========================================= */}

          <section className="debugging-problem-panel">
            <div className="debugging-panel-heading">
              <span>
                CHALLENGE
              </span>

              <h2>
                Find & Fix the Bug
              </h2>
            </div>

            <div className="debugging-problem-scroll">
              <div className="debugging-description-block">
                <h3>
                  Problem Statement
                </h3>

                <p>
                  {selectedProblem.description}
                </p>
              </div>

              {selectedProblem.bugDescription && (
                <div className="debugging-bug-card">
                  <span>
                    BUG INFORMATION
                  </span>

                  <h3>
                    What's wrong?
                  </h3>

                  <p>
                    {
                      selectedProblem.bugDescription
                    }
                  </p>
                </div>
              )}

              {selectedProblem.inputFormat && (
                <div className="debugging-description-block">
                  <h3>
                    Input Format
                  </h3>

                  <p>
                    {
                      selectedProblem.inputFormat
                    }
                  </p>
                </div>
              )}

              {selectedProblem.outputFormat && (
                <div className="debugging-description-block">
                  <h3>
                    Output Format
                  </h3>

                  <p>
                    {
                      selectedProblem.outputFormat
                    }
                  </p>
                </div>
              )}

              {selectedProblem.constraints && (
                <div className="debugging-description-block">
                  <h3>
                    Constraints
                  </h3>

                  <p>
                    {
                      selectedProblem.constraints
                    }
                  </p>
                </div>
              )}

              {selectedProblem.testCases
                ?.length > 0 && (
                <div className="debugging-test-section">
                  <h3>
                    Public Test Cases
                  </h3>

                  {selectedProblem.testCases.map(
                    (testCase, index) => (
                      <div
                        className="debugging-test-card"
                        key={index}
                      >
                        <div className="debugging-test-title">
                          Test Case{" "}
                          {index + 1}
                        </div>

                        <div className="debugging-test-grid">
                          <div>
                            <span>
                              INPUT
                            </span>

                            <pre>
                              {testCase.input ||
                                "No input"}
                            </pre>
                          </div>

                          <div>
                            <span>
                              EXPECTED OUTPUT
                            </span>

                            <pre>
                              {
                                testCase.expectedOutput
                              }
                            </pre>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <p className="debugging-hidden-note">
                    Hidden test cases are also
                    evaluated securely during
                    submission.
                  </p>
                </div>
              )}

              {selectedProblem.skillsCovered
                ?.length > 0 && (
                <div className="debugging-description-block">
                  <h3>
                    Skills Covered
                  </h3>

                  <div className="debugging-workspace-skills">
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

              {selectedProblem.companyTags
                ?.length > 0 && (
                <div className="debugging-description-block">
                  <h3>
                    Company Tags
                  </h3>

                  <div className="debugging-workspace-skills">
                    {selectedProblem.companyTags.map(
                      (company) => (
                        <span key={company}>
                          {company}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =========================================
              RIGHT PANEL
          ========================================= */}

          <section className="debugging-editor-panel">
            <div className="debugging-editor-toolbar">
              <div>
                <span>
                  FIX THE CODE
                </span>

                <strong>
                  {selectedProblem.language}
                </strong>
              </div>

           
            </div>

            <div className="debugging-editor-shell">
              <div
                ref={lineNumbersRef}
                className="debugging-line-numbers"
                aria-hidden="true"
              >
                {editorLineNumbers.map(
                  (lineNumber) => (
                    <span
                      key={lineNumber}
                    >
                      {lineNumber}
                    </span>
                  )
                )}
              </div>

              <textarea
                ref={editorRef}
                className="debugging-editor"
                value={fixedCode}
                onScroll={
                  syncEditorScroll
                }
                onChange={(event) => {
                  setFixedCode(
                    event.target.value
                  );

                  if (result) {
                    setResult(null);
                  }
                }}
                placeholder={`Fix the ${selectedProblem.language} code here...`}
                spellCheck="false"
                disabled={submitting}
              />
            </div>

         <div className="debugging-submit-bar">
  <span>
    Complete the missing code and execute it against all test cases.
  </span>

  <div className="debugging-submit-actions">
    <button
      type="button"
      onClick={pasteCode}
      disabled={submitting}
    >
      Paste Code
    </button>

    <button
      type="button"
      disabled={submitting || !fixedCode.trim()}
      onClick={submitFixedCode}
    >
      {submitting ? "Evaluating..." : "Submit Fix"}
    </button>
  </div>
</div>

            {result && (
              <div className="debugging-result-panel">
                <div className="debugging-result-header">
                  <div>
                    <span>
                      EVALUATION RESULT
                    </span>

                    <h2>
                      Debugging Result
                    </h2>
                  </div>

                  <span
                    className={`debugging-status ${getStatusClass(
                      result.attempt
                        ?.status
                    )}`}
                  >
                    {result.attempt
                      ?.status ||
                      "Evaluated"}
                  </span>
                </div>

                <div className="debugging-result-stats">
                  <div>
                    <span>
                      SCORE
                    </span>

                    <strong>
                      {result.attempt
                        ?.scorePercentage ??
                        0}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>
                      TEST CASES
                    </span>

                    <strong>
                      {result.attempt
                        ?.passedTestCases ??
                        0}
                      /
                      {result.attempt
                        ?.totalTestCases ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      MARKS
                    </span>

                    <strong>
                      {result.attempt
                        ?.marksAwarded ??
                        0}
                      /
                      {result.attempt
                        ?.totalMarks ??
                        selectedProblem.marks}
                    </strong>
                  </div>

                  <div>
                    <span>
                      EXECUTION
                    </span>

                    <strong>
                      {result.attempt
                        ?.executionTimeMs ??
                        0}
                      ms
                    </strong>
                  </div>
                </div>

                <div className="debugging-test-summary">
                  <div>
                    <span>
                      Passed
                    </span>

                    <strong className="debugging-passed">
                      {result.attempt
                        ?.passedTestCases ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Failed
                    </span>

                    <strong className="debugging-failed">
                      {result.attempt
                        ?.failedTestCases ??
                        0}
                    </strong>
                  </div>
                </div>

                {result.attempt
                  ?.errorMessage && (
                  <div className="debugging-execution-error">
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

                {!result.attempt
                  ?.errorMessage && (
                  <div className="debugging-result-message">
                    {result.attempt
                      ?.status ===
                    "Accepted" ? (
                      <>
                        <strong>
                          Bug fixed
                          successfully.
                        </strong>

                        <span>
                          Your corrected code
                          passed all configured
                          test cases.
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>
                          Keep debugging.
                        </strong>

                        <span>
                          Review the code and
                          failed test cases,
                          then submit another
                          fix.
                        </span>
                      </>
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

export default DebuggingPractice;