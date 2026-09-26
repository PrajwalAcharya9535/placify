import React, { useState } from "react";
import axios from "axios";
import "./MockSqlWorkspace.css";

const API_BASE_URL = "http://localhost:5000/api/student";

const MockSqlWorkspace = ({
  attemptId,
  problem,
  roundData,
}) => {
  const [query, setQuery] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] =
    useState("");
  const [submissionResult, setSubmissionResult] =
    useState(null);

  const [completingRound, setCompletingRound] =
    useState(false);

  const [roundError, setRoundError] = useState("");
  const [roundResult, setRoundResult] = useState(null);

  if (!problem) {
    return null;
  }

  const tables = problem.tables || [];

  // ==============================
  // RESULT TABLE HELPERS
  // ==============================

  const resultRows = Array.isArray(
    submissionResult?.result
  )
    ? submissionResult.result
    : [];

  const resultColumns =
    resultRows.length > 0
      ? Object.keys(resultRows[0])
      : [];

  const attemptResult = submissionResult?.attempt;

  // ==============================
  // SUBMIT SQL QUERY
  // ==============================

  const handleSubmitQuery = async () => {
    if (!query.trim() || submitting || !attemptId) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmissionError("");
      setSubmissionResult(null);
      setRoundError("");

      const token = localStorage.getItem("placifyToken");

      if (!token) {
        setSubmissionError(
          "Your login session is unavailable. Please login again."
        );
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/mock-attempts/${attemptId}/current-round/sql-submit`,
        {
          problemId: problem._id,
          query: query.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubmissionResult({
        message:
          response.data.message ||
          "SQL query evaluated successfully.",
        attempt: response.data.attempt || null,
        result: response.data.result || [],
      });
    } catch (err) {
      const backendData = err.response?.data;

      // Query Error / Execution Error may still
      // contain evaluated attempt information.
      if (backendData?.attempt) {
        setSubmissionResult({
          message:
            backendData.message ||
            "SQL query evaluation completed.",
          attempt: backendData.attempt,
          result: backendData.result || [],
        });
      } else {
        setSubmissionError(
          backendData?.message ||
            "Failed to submit SQL query."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================
  // COMPLETE CURRENT ROUND
  // ==============================

  const handleCompleteRound = async () => {
    if (
      !attemptId ||
      completingRound ||
      !attemptResult ||
      roundResult
    ) {
      return;
    }

    try {
      setCompletingRound(true);
      setRoundError("");

      const token = localStorage.getItem("placifyToken");

      if (!token) {
        setRoundError(
          "Your login session is unavailable. Please login again."
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

      setRoundResult(response.data);
    } catch (err) {
      setRoundError(
        err.response?.data?.message ||
          "Failed to complete the SQL round."
      );
    } finally {
      setCompletingRound(false);
    }
  };

  return (
    <section className="mock-sql-workspace">
      {/* ==============================
          PROBLEM HEADER
      ============================== */}

      <div className="mock-sql-problem-header">
        <div className="mock-sql-problem-copy">
          <p className="mock-sql-eyebrow">
            SQL ASSESSMENT
          </p>

          <h2>{problem.title}</h2>

          <p className="mock-sql-description">
            {problem.description}
          </p>
        </div>

        <div className="mock-sql-problem-badges">
          <span>
            {problem.difficulty || "Standard"}
          </span>

          <span>{problem.category || "SQL"}</span>

          <span>
            {roundData?.totalMarks ??
              problem.marks ??
              0}{" "}
            Marks
          </span>

          {roundData?.durationMinutes != null && (
            <span>
              {roundData.durationMinutes} Minutes
            </span>
          )}
        </div>
      </div>

      {/* ==============================
          MAIN WORKSPACE
      ============================== */}

      <div className="mock-sql-layout">
        {/* ==============================
            LEFT SIDE - DATABASE
        ============================== */}

        <div className="mock-sql-database-panel">
          <div className="mock-sql-section-heading">
            <div>
              <p>DATABASE</p>
              <h3>Table Information</h3>
            </div>
          </div>

          <div className="mock-sql-database-content">
            {tables.length === 0 ? (
              <div className="mock-sql-empty">
                No table information available.
              </div>
            ) : (
              tables.map((table, tableIndex) => {
                const columns = table.columns || [];
                const sampleData =
                  table.sampleData || [];

                return (
                  <div
                    className="mock-sql-table-card"
                    key={
                      table.tableName ||
                      `table-${tableIndex}`
                    }
                  >
                    <div className="mock-sql-table-name">
                      <span>TABLE</span>

                      <strong>
                        {table.tableName ||
                          `Table ${tableIndex + 1}`}
                      </strong>
                    </div>

                    {/* COLUMN SCHEMA */}

                    <div className="mock-sql-schema">
                      <h4>Schema</h4>

                      <div className="mock-sql-schema-list">
                        {columns.map(
                          (
                            column,
                            columnIndex
                          ) => (
                            <div
                              className="mock-sql-schema-row"
                              key={`${column.name}-${columnIndex}`}
                            >
                              <span>
                                {column.name}
                              </span>

                              <code>
                                {column.dataType}
                              </code>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* SAMPLE DATA */}

                    <div className="mock-sql-sample">
                      <h4>Sample Data</h4>

                      {sampleData.length === 0 ? (
                        <div className="mock-sql-empty">
                          No sample rows available.
                        </div>
                      ) : (
                        <div className="mock-sql-table-scroll">
                          <table>
                            <thead>
                              <tr>
                                {columns.map(
                                  (
                                    column,
                                    columnIndex
                                  ) => (
                                    <th
                                      key={`${column.name}-${columnIndex}`}
                                    >
                                      {
                                        column.name
                                      }
                                    </th>
                                  )
                                )}
                              </tr>
                            </thead>

                            <tbody>
                              {sampleData.map(
                                (
                                  row,
                                  rowIndex
                                ) => (
                                  <tr
                                    key={
                                      rowIndex
                                    }
                                  >
                                    {columns.map(
                                      (
                                        column,
                                        columnIndex
                                      ) => (
                                        <td
                                          key={`${column.name}-${columnIndex}`}
                                        >
                                          {row[
                                            column
                                              .name
                                          ] ??
                                            "-"}
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
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==============================
            RIGHT SIDE - QUERY EDITOR
        ============================== */}

        <div className="mock-sql-editor-panel">
          <div className="mock-sql-section-heading">
            <div>
              <p>QUERY EDITOR</p>
              <h3>Write Your SQL Query</h3>
            </div>
          </div>

          <div className="mock-sql-editor-content">
            {/* ==============================
                EDITOR AREA
            ============================== */}

            <div className="mock-sql-editor-area">
              <div className="mock-sql-editor">
                <div className="mock-sql-editor-top">
                  <span>SQL</span>

                  <span>
                    {query.length} characters
                  </span>
                </div>

                <textarea
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);

                    if (submissionError) {
                      setSubmissionError("");
                    }

                    if (roundError) {
                      setRoundError("");
                    }
                  }}
                  placeholder={
                    "Write your SQL query here...\n\nExample:\nSELECT column_name\nFROM table_name;"
                  }
                  spellCheck="false"
                  disabled={submitting}
                />
              </div>

              <div className="mock-sql-editor-footer">
                <div>
                  <span>
                    Time Limit:{" "}
                    <strong>
                      {problem.timeLimitSeconds ??
                        0}
                      s
                    </strong>
                  </span>

                  {problem.skillsCovered?.length >
                    0 && (
                    <span>
                      Skills:{" "}
                      <strong>
                        {problem.skillsCovered.join(
                          ", "
                        )}
                      </strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="mock-sql-submit-button"
                  disabled={
                    !query.trim() ||
                    submitting ||
                    !attemptId
                  }
                  onClick={handleSubmitQuery}
                >
                  {submitting
                    ? "Evaluating..."
                    : "Submit Query"}
                </button>
              </div>
            </div>

            {/* ==============================
                RESULT AREA
            ============================== */}

            <div
              className={`mock-sql-feedback-area ${
                submissionResult ||
                submissionError ||
                roundError
                  ? "mock-sql-feedback-visible"
                  : ""
              }`}
            >
              {/* ==============================
                  SUBMISSION ERROR
              ============================== */}

              {submissionError && (
                <div className="mock-sql-result-error">
                  <strong>
                    Submission Error
                  </strong>

                  <p>{submissionError}</p>
                </div>
              )}

              {/* ==============================
                  EVALUATION RESULT
              ============================== */}

              {submissionResult &&
                attemptResult && (
                  <div
                    className={`mock-sql-result ${
                      attemptResult.status ===
                      "Correct"
                        ? "mock-sql-result-success"
                        : "mock-sql-result-warning"
                    }`}
                  >
                    <div className="mock-sql-result-header">
                      <div>
                        <span>
                          EVALUATION RESULT
                        </span>

                        <h3>
                          {attemptResult.status ||
                            "Evaluated"}
                        </h3>
                      </div>

                      <strong>
                        {attemptResult.scorePercentage ??
                          0}
                        %
                      </strong>
                    </div>

                    <p className="mock-sql-result-message">
                      {submissionResult.message}
                    </p>

                    <div className="mock-sql-result-stats">
                      <div>
                        <span>Marks</span>

                        <strong>
                          {attemptResult.marksAwarded ??
                            0}
                          /
                          {attemptResult.totalMarks ??
                            roundData?.totalMarks ??
                            problem.marks ??
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>Score</span>

                        <strong>
                          {attemptResult.scorePercentage ??
                            0}
                          %
                        </strong>
                      </div>

                      <div>
                        <span>Execution</span>

                        <strong>
                          {attemptResult.executionTimeMs ??
                            0}{" "}
                          ms
                        </strong>
                      </div>
                    </div>

                    {/* ==============================
                        QUERY OUTPUT
                    ============================== */}

                    {resultRows.length > 0 && (
                      <div className="mock-sql-output">
                        <h4>Query Output</h4>

                        <div className="mock-sql-table-scroll">
                          <table>
                            <thead>
                              <tr>
                                {resultColumns.map(
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
                              {resultRows.map(
                                (
                                  row,
                                  rowIndex
                                ) => (
                                  <tr
                                    key={
                                      rowIndex
                                    }
                                  >
                                    {resultColumns.map(
                                      (
                                        column
                                      ) => (
                                        <td
                                          key={`${rowIndex}-${column}`}
                                        >
                                          {row[
                                            column
                                          ] ??
                                            "-"}
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

                    {/* ==============================
                        ROUND ERROR
                    ============================== */}

                    {roundError && (
                      <div className="mock-sql-round-error">
                        <strong>
                          Unable to complete round
                        </strong>

                        <p>{roundError}</p>
                      </div>
                    )}

                    {/* ==============================
                        COMPLETE ROUND
                    ============================== */}

                    <div className="mock-sql-round-action">
                      <button
                        type="button"
                        className="mock-sql-complete-button"
                        onClick={
                          handleCompleteRound
                        }
                        disabled={
                          completingRound ||
                          Boolean(roundResult)
                        }
                      >
                        {completingRound
                          ? "Completing..."
                          : roundResult
                            ? "Round Completed"
                            : "Complete Round"}
                      </button>
                    </div>
                  </div>
                )}

              {/* Round error before a result card,
                  if ever returned separately */}

              {roundError &&
                !submissionResult && (
                  <div className="mock-sql-round-error mock-sql-round-error-standalone">
                    <strong>
                      Unable to complete round
                    </strong>

                    <p>{roundError}</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MockSqlWorkspace;