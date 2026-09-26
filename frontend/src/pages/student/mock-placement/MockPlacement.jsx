import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MockPlacement.css";

const API_BASE_URL =
  "http://localhost:5000/api/student";

const MockPlacement = () => {
  const navigate = useNavigate();

  const [mockTests, setMockTests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchMockTests = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem(
            "placifyToken"
          );

        if (!token) {
          navigate("/login");
          return;
        }

        const response =
          await axios.get(
            `${API_BASE_URL}/mock-tests`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setMockTests(
          response.data.mockTests || []
        );
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem(
            "placifyToken"
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load mock placement tests."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMockTests();
  }, [navigate]);

  return (
    <div className="mock-placement-page">
      <div className="mock-placement-container">

        <div className="mock-placement-header">

          <div>
            <p className="mock-placement-eyebrow">
              PLACEMENT SIMULATION
            </p>

            <h1>
              Mock Placement
            </h1>

            <p className="mock-placement-subtitle">
              Experience company-style placement
              rounds and measure your readiness in
              a realistic test environment.
            </p>
          </div>

          <div className="mock-placement-header-actions">
            <button
              type="button"
              className="mock-history-button"
              onClick={() =>
                navigate(
                  "/student/mock-placement/history"
                )
              }
            >
              <span className="mock-history-button-icon">
                ↗
              </span>

              <span>
                View History & Results
              </span>
            </button>
          </div>

        </div>

        {loading && (
          <div className="mock-placement-state">
            Loading mock placement tests...
          </div>
        )}

        {!loading && error && (
          <div className="mock-placement-state mock-placement-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          mockTests.length === 0 && (
            <div className="mock-placement-state">
              <h3>
                No mock tests available
              </h3>

              <p>
                There are currently no active
                mock placement tests available
                for you.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          mockTests.length > 0 && (
            <div className="mock-test-grid">

              {mockTests.map((test) => (
                <article
                  className="mock-test-card"
                  key={test._id}
                >

                  <div className="mock-test-card-top">

                    <span className="mock-test-company">
                      {test.companyName ||
                        "Placement Mock"}
                    </span>

                    <span className="mock-test-difficulty">
                      {test.difficulty ||
                        "Standard"}
                    </span>

                  </div>

                  <h2>
                    {test.title}
                  </h2>

                  <p className="mock-test-description">
                    {test.description ||
                      "Complete all configured placement rounds and evaluate your overall performance."}
                  </p>

                  <div className="mock-test-meta">

                    <div>
                      <span>
                        Rounds
                      </span>

                      <strong>
                        {test.rounds?.length ||
                          0}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Marks
                      </span>

                      <strong>
                        {test.totalMarks ?? 0}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Pass Score
                      </span>

                      <strong>
                        {test.passingPercentage ??
                          0}
                        %
                      </strong>
                    </div>

                    <div>
                      <span>
                        Attempts
                      </span>

                      <strong>
                        {test.maxAttempts ?? 1}
                      </strong>
                    </div>

                  </div>

                  <button
                    type="button"
                    className="mock-test-view-button"
                    onClick={() =>
                      navigate(
                        `/student/mock-placement/${test._id}`
                      )
                    }
                  >
                    View Mock Test
                  </button>

                </article>
              ))}

            </div>
          )}

      </div>
    </div>
  );
};

export default MockPlacement;