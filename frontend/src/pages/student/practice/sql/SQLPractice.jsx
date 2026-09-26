import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../../components/student/StudentLayout";
import "./SQLPractice.css";

const API_BASE = "http://localhost:5000/api/student";

function SQLPractice() {
  const navigate = useNavigate();

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

  const [submittedQuery, setSubmittedQuery] = useState("");
  const [result, setResult] = useState(null);

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
    navigate("/login", { replace: true });
  };

  // =========================================================
  // FETCH SQL PROBLEMS
  // =========================================================

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE}/sql/problems`,
          getAuthConfig()
        );

        setProblems(response.data?.problems || []);
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
            "Failed to load SQL problems."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // =========================================================
  // UNIQUE CATEGORIES
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

  // =========================================================
  // FILTER PROBLEMS
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

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesCategory
      );
    });
  }, [
    problems,
    search,
    difficulty,
    category,
  ]);

  // =========================================================
  // OPEN SQL PROBLEM
  // =========================================================

  const openProblem = async (problemId) => {
    try {
      setProblemLoading(true);
      setWorkspaceError("");
      setResult(null);
      setSubmittedQuery("");

      const response = await axios.get(
        `${API_BASE}/sql/problems/${problemId}`,
        getAuthConfig()
      );

      setSelectedProblem(
        response.data?.problem || null
      );
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
          "Failed to load SQL problem."
      );
    } finally {
      setProblemLoading(false);
    }
  };

  // =========================================================
  // BACK TO SQL LIBRARY
  // =========================================================

  const closeWorkspace = () => {
    setSelectedProblem(null);
    setSubmittedQuery("");
    setResult(null);
    setWorkspaceError("");
  };

  // =========================================================
  // SUBMIT SQL QUERY
  // =========================================================

  const submitQuery = async () => {
    if (!selectedProblem?._id) {
      return;
    }

    if (!submittedQuery.trim()) {
      setWorkspaceError(
        "Please write an SQL query before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      setWorkspaceError("");
      setResult(null);

      const response = await axios.post(
        `${API_BASE}/sql/submit`,
        {
          problemId: selectedProblem._id,
          submittedQuery:
            submittedQuery.trim(),
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
          "Failed to evaluate SQL query."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status = "") => {
    const normalized =
      status.toLowerCase();

    if (normalized === "correct") {
      return "correct";
    }

    if (
      normalized === "wrong answer"
    ) {
      return "wrong";
    }

    if (
      normalized === "query error" ||
      normalized === "execution error"
    ) {
      return "error";
    }

    return "neutral";
  };

  // =========================================================
  // TABLE RESULT COLUMNS
  // =========================================================

  const getResultColumns = (rows = []) => {
    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      return [];
    }

    const columns = new Set();

    rows.forEach((row) => {
      if (
        row &&
        typeof row === "object" &&
        !Array.isArray(row)
      ) {
        Object.keys(row).forEach((key) => {
          columns.add(key);
        });
      }
    });

    return [...columns];
  };

  // =========================================================
  // PROBLEM LIBRARY
  // =========================================================

  if (!selectedProblem) {
    return (
      <StudentLayout>
        <div className="sql-practice-page">
          <button
            type="button"
            className="sql-back-button"
            onClick={() =>
              navigate("/student/practice")
            }
          >
            ← Back to Practice
          </button>

          <section className="sql-hero">
            <div>
              <span>
                PRACTICE ENVIRONMENT
              </span>

              <h1>SQL Lab</h1>

              <p>
                Strengthen your database
                skills by solving practical
                SQL challenges using real
                table structures and sample
                datasets.
              </p>
            </div>

            <div className="sql-hero-badge">
              <span>
                DATABASE PRACTICE
              </span>

              <strong>
                Query • Analyze • Improve
              </strong>
            </div>
          </section>

          <section className="sql-filter-card">
            <div className="sql-search-field">
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
                placeholder="Search SQL problems..."
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
            <div className="sql-error-message">
              {error}
            </div>
          )}

          <section className="sql-library">
            <div className="sql-section-heading">
              <div>
                <span>
                  PROBLEM LIBRARY
                </span>

                <h2>
                  SQL Challenges
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
              <div className="sql-state-card">
                <div className="sql-loader" />

                <strong>
                  Loading SQL problems...
                </strong>
              </div>
            ) : filteredProblems.length ===
              0 ? (
              <div className="sql-state-card">
                <div className="sql-state-icon">
                  SQL
                </div>

                <strong>
                  No SQL problems found
                </strong>

                <span>
                  Try changing the current
                  filters.
                </span>
              </div>
            ) : (
              <div className="sql-problem-grid">
                {filteredProblems.map(
                  (problem) => (
                    <article
                      className="sql-problem-card"
                      key={problem._id}
                    >
                      <div className="sql-problem-top">
                        <div>
                          <span
                            className={`sql-difficulty ${
                              problem.difficulty
                                ?.toLowerCase() ||
                              ""
                            }`}
                          >
                            {problem.difficulty}
                          </span>

                          <span className="sql-category-badge">
                            {problem.category}
                          </span>
                        </div>

                        <span className="sql-marks">
                          {problem.marks} Marks
                        </span>
                      </div>

                      <h3>
                        {problem.title}
                      </h3>

                      <p className="sql-problem-description">
                        {problem.description}
                      </p>

                      <div className="sql-problem-info">
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
                              : "SQL"}
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
                        <div className="sql-skill-list">
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
                          : "Solve Problem"}
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
  // SQL WORKSPACE
  // =========================================================

  const executionRows =
    Array.isArray(result?.result)
      ? result.result
      : [];

  const executionColumns =
    getResultColumns(executionRows);

  return (
    <StudentLayout>
      <div className="sql-workspace">
        <header className="sql-workspace-header">
          <div className="sql-workspace-title">
            <button
              type="button"
              disabled={submitting}
              onClick={closeWorkspace}
            >
              ← Problems
            </button>

            <div>
              <span>
                SQL LAB
              </span>

              <h1>
                {selectedProblem.title}
              </h1>
            </div>
          </div>

          <div className="sql-workspace-meta">
            <span
              className={`sql-difficulty ${
                selectedProblem.difficulty
                  ?.toLowerCase() || ""
              }`}
            >
              {selectedProblem.difficulty}
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
          <div className="sql-workspace-error">
            {workspaceError}
          </div>
        )}

        <div className="sql-workspace-grid">
          {/* =========================================
              LEFT - PROBLEM
          ========================================= */}

          <section className="sql-problem-panel">
            <div className="sql-panel-heading">
              <span>
                CHALLENGE
              </span>

              <h2>
                Problem Statement
              </h2>
            </div>

            <div className="sql-problem-scroll">
              <div className="sql-description-block">
                <h3>Description</h3>

                <p>
                  {selectedProblem.description}
                </p>
              </div>

              {selectedProblem.tables?.length >
                0 && (
                <div className="sql-table-section">
                  <h3>
                    Database Tables
                  </h3>

                  {selectedProblem.tables.map(
                    (table, tableIndex) => (
                      <div
                        className="sql-schema-card"
                        key={`${table.tableName}-${tableIndex}`}
                      >
                        <div className="sql-schema-header">
                          <span>
                            TABLE
                          </span>

                          <strong>
                            {table.tableName}
                          </strong>
                        </div>

                        {table.columns?.length >
                          0 && (
                          <div className="sql-schema-columns">
                            <div className="sql-schema-row sql-schema-row-header">
                              <span>
                                Column
                              </span>

                              <span>
                                Data Type
                              </span>
                            </div>

                            {table.columns.map(
                              (
                                column,
                                columnIndex
                              ) => (
                                <div
                                  className="sql-schema-row"
                                  key={`${column.name}-${columnIndex}`}
                                >
                                  <span>
                                    {
                                      column.name
                                    }
                                  </span>

                                  <span>
                                    {
                                      column.dataType
                                    }
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {table.sampleData
                          ?.length > 0 && (
                          <div className="sql-sample-data">
                            <div className="sql-sample-heading">
                              Sample Data
                            </div>

                            <div className="sql-data-table-wrapper">
                              <table className="sql-data-table">
                                <thead>
                                  <tr>
                                    {Object.keys(
                                      table
                                        .sampleData[0] ||
                                        {}
                                    ).map(
                                      (column) => (
                                        <th
                                          key={
                                            column
                                          }
                                        >
                                          {
                                            column
                                          }
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>

                                <tbody>
                                  {table.sampleData.map(
                                    (
                                      row,
                                      rowIndex
                                    ) => (
                                      <tr
                                        key={
                                          rowIndex
                                        }
                                      >
                                        {Object.keys(
                                          table
                                            .sampleData[0] ||
                                            {}
                                        ).map(
                                          (
                                            column
                                          ) => (
                                            <td
                                              key={
                                                column
                                              }
                                            >
                                              {String(
                                                row[
                                                  column
                                                ] ??
                                                  ""
                                              )}
                                            </td>
                                          )
                                        )}
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {selectedProblem.skillsCovered
                ?.length > 0 && (
                <div className="sql-description-block">
                  <h3>
                    Skills Covered
                  </h3>

                  <div className="sql-workspace-skills">
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
                <div className="sql-description-block">
                  <h3>
                    Company Tags
                  </h3>

                  <div className="sql-workspace-skills">
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
              RIGHT - SQL EDITOR
          ========================================= */}

          <section className="sql-editor-panel">
            <div className="sql-editor-toolbar">
              <div>
                <span>
                  QUERY EDITOR
                </span>

                <strong>
                  SQL
                </strong>
              </div>

              <span className="sql-editor-hint">
                Write a query using the
                provided tables
              </span>
            </div>

            <textarea
              className="sql-editor"
              value={submittedQuery}
              onChange={(event) => {
                setSubmittedQuery(
                  event.target.value
                );

                if (result) {
                  setResult(null);
                }
              }}
              placeholder={
                "SELECT ...\nFROM ...\nWHERE ...;"
              }
              spellCheck="false"
              disabled={submitting}
            />

            <div className="sql-submit-bar">
              <span>
                Your query will be executed
                against the problem dataset.
              </span>

              <button
                type="button"
                disabled={
                  submitting ||
                  !submittedQuery.trim()
                }
                onClick={submitQuery}
              >
                {submitting
                  ? "Evaluating..."
                  : "Run & Submit"}
              </button>
            </div>

            {result && (
              <div className="sql-result-panel">
                <div className="sql-result-header">
                  <div>
                    <span>
                      EVALUATION RESULT
                    </span>

                    <h2>
                      Query Result
                    </h2>
                  </div>

                  <span
                    className={`sql-status ${getStatusClass(
                      result.attempt
                        ?.status
                    )}`}
                  >
                    {result.attempt
                      ?.status ||
                      "Evaluated"}
                  </span>
                </div>

                <div className="sql-result-stats">
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

                {result.attempt
                  ?.errorMessage && (
                  <div className="sql-execution-error">
                    <strong>
                      Query Error
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
                  <div className="sql-output-section">
                    <div className="sql-output-heading">
                      <strong>
                        Output
                      </strong>

                      <span>
                        {
                          executionRows.length
                        }{" "}
                        row
                        {executionRows.length ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    {executionRows.length ===
                    0 ? (
                      <div className="sql-empty-output">
                        Query executed with
                        no rows returned.
                      </div>
                    ) : (
                      <div className="sql-result-table-wrapper">
                        <table className="sql-result-table">
                          <thead>
                            <tr>
                              {executionColumns.map(
                                (column) => (
                                  <th
                                    key={
                                      column
                                    }
                                  >
                                    {column}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {executionRows.map(
                              (
                                row,
                                rowIndex
                              ) => (
                                <tr
                                  key={
                                    rowIndex
                                  }
                                >
                                  {executionColumns.map(
                                    (
                                      column
                                    ) => (
                                      <td
                                        key={
                                          column
                                        }
                                      >
                                        {String(
                                          row[
                                            column
                                          ] ??
                                            ""
                                        )}
                                      </td>
                                    )
                                  )}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
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

export default SQLPractice;