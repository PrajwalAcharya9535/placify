import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StudentLayout from "../../../components/student/StudentLayout";
import "./StudentLearning.css";

const API_BASE = "http://localhost:5000/api/student";

function StudentLearning() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState([]);
  const [progressSummary, setProgressSummary] = useState({
    totalStarted: 0,
    completedTopics: 0,
    inProgressTopics: 0,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingTopic, setUpdatingTopic] = useState(null);

  const token = localStorage.getItem("placifyToken");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const fetchLearningData = async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        topicsResponse,
        recommendationsResponse,
        progressResponse,
      ] = await Promise.all([
        axios.get(`${API_BASE}/learning`, authConfig),

        axios.get(
          `${API_BASE}/learning/recommendations`,
          authConfig
        ),

        axios.get(
          `${API_BASE}/learning-progress`,
          authConfig
        ),
      ]);

      setTopics(topicsResponse.data?.topics || []);

      setRecommendations(
        recommendationsResponse.data?.recommendations || []
      );

      setProgress(
        progressResponse.data?.progress || []
      );

      setProgressSummary(
        progressResponse.data?.summary || {
          totalStarted: 0,
          completedTopics: 0,
          inProgressTopics: 0,
        }
      );
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("placifyToken");
        localStorage.removeItem("placifyUser");

        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load learning data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningData();
  }, []);

  const progressMap = useMemo(() => {
    const map = {};

    progress.forEach((item) => {
      if (item.topic?._id) {
        map[item.topic._id] = item;
      } else if (item.topic) {
        map[String(item.topic)] = item;
      }
    });

    return map;
  }, [progress]);

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesSearch =
        !search ||
        topic.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        topic.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        !category || topic.category === category;

      const matchesDifficulty =
        !difficulty ||
        topic.difficulty === difficulty;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty
      );
    });
  }, [topics, search, category, difficulty]);

  const getTopicProgress = (topicId) => {
    return progressMap[topicId]?.progressPercentage ?? 0;
  };

  const getTopicStatus = (topicId) => {
    return (
      progressMap[topicId]?.status ||
      "Not Started"
    );
  };

  const updateProgress = async (topicId, percentage) => {
    try {
      setUpdatingTopic(topicId);

      await axios.put(
        `${API_BASE}/learning-progress`,
        {
          topicId,
          progressPercentage: percentage,
        },
        authConfig
      );

      await fetchLearningData();
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("placifyToken");
        localStorage.removeItem("placifyUser");

        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to update learning progress."
      );
    } finally {
      setUpdatingTopic(null);
    }
  };

  const handleStartTopic = (topic) => {
    const currentProgress = getTopicProgress(
      topic._id
    );

    if (currentProgress === 0) {
      updateProgress(topic._id, 1);
    }

    navigate(`/student/learning/${topic._id}`);
  };

  const handleCompleteTopic = (topic) => {
    updateProgress(topic._id, 100);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="learning-state">
          <div className="learning-loader"></div>

          <h2>Loading Learning Center</h2>

          <p>
            Preparing your personalized learning
            experience...
          </p>
        </div>
      </StudentLayout>
    );
  }

  if (error && !topics.length) {
    return (
      <StudentLayout>
        <div className="learning-state learning-error">
          <div className="learning-error-icon">
            !
          </div>

          <h2>Unable to load Learning Center</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={fetchLearningData}
          >
            Try Again
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="student-learning-page">

        {/* =========================
            PAGE HEADER
        ========================== */}

        <section className="learning-page-header">

          <div>
            <span className="learning-eyebrow">
              PREPARATION CENTER
            </span>

            <h1>
              Learning Center
            </h1>

            <p>
              Build the skills you need for your target
              placement role through structured learning.
            </p>
          </div>

          <div className="learning-header-badge">
            <span>PLACIFY LEARNING</span>

            <strong>
              Learn → Practice → Improve
            </strong>
          </div>

        </section>

        {/* =========================
            SUMMARY CARDS
        ========================== */}

        <section className="learning-summary">

          <article className="learning-summary-card">
            <div className="learning-summary-icon blue">
              T
            </div>

            <div>
              <span>Total Topics</span>

              <strong>{topics.length}</strong>

              <small>
                Available to learn
              </small>
            </div>
          </article>

          <article className="learning-summary-card">
            <div className="learning-summary-icon cyan">
              S
            </div>

            <div>
              <span>Started</span>

              <strong>
                {progressSummary.totalStarted}
              </strong>

              <small>
                Topics you've opened
              </small>
            </div>
          </article>

          <article className="learning-summary-card">
            <div className="learning-summary-icon purple">
              I
            </div>

            <div>
              <span>In Progress</span>

              <strong>
                {progressSummary.inProgressTopics}
              </strong>

              <small>
                Continue your learning
              </small>
            </div>
          </article>

          <article className="learning-summary-card">
            <div className="learning-summary-icon green">
              ✓
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {progressSummary.completedTopics}
              </strong>

              <small>
                Topics completed
              </small>
            </div>
          </article>

        </section>

        {/* =========================
            ERROR NOTICE
        ========================== */}

        {error && (
          <div className="learning-inline-error">
            {error}
          </div>
        )}

        {/* =========================
            RECOMMENDATIONS
        ========================== */}

        {recommendations.length > 0 && (
          <section className="learning-section">

            <div className="learning-section-heading">

              <div>
                <span>
                  PERSONALIZED FOR YOU
                </span>

                <h2>
                  Recommended Learning
                </h2>

                <p>
                  Topics selected from your skills,
                  placement goals and readiness data.
                </p>
              </div>

              <div className="recommendation-label">
                AI MATCH
              </div>

            </div>

            <div className="recommendation-grid">

              {recommendations
                .slice(0, 3)
                .map((item) => {
                  const topic = item.topic;

                  if (!topic) return null;

                  const topicProgress =
                    getTopicProgress(topic._id);

                  return (
                    <article
                      className="recommendation-card"
                      key={topic._id}
                    >

                      <div className="recommendation-top">

                        <span className="topic-category">
                          {topic.category}
                        </span>

                        <span className="match-score">
                          {item.matchScore}% match
                        </span>

                      </div>

                      <h3>
                        {topic.title}
                      </h3>

                      <p>
                        {topic.description}
                      </p>

                      {item.reasons?.length > 0 && (
                        <div className="recommendation-reason">
                          <strong>
                            Why this topic?
                          </strong>

                          {item.reasons
                            .slice(0, 2)
                            .map((reason, index) => (
                              <span
                                key={`${reason}-${index}`}
                              >
                                ✓ {reason}
                              </span>
                            ))}
                        </div>
                      )}

                      <div className="recommendation-footer">

                        <span>
                          {topic.estimatedMinutes} min
                        </span>

                        <span>
                          {topic.difficulty}
                        </span>

                      </div>

                      {topicProgress > 0 && (
                        <div className="topic-progress">
                          <div className="topic-progress-header">
                            <span>
                              Progress
                            </span>

                            <strong>
                              {topicProgress}%
                            </strong>
                          </div>

                          <div className="topic-progress-track">
                            <div
                              style={{
                                width: `${topicProgress}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleStartTopic(topic)
                        }
                      >
                        {topicProgress > 0
                          ? "Continue Learning"
                          : "Start Learning"}

                        <span>→</span>
                      </button>

                    </article>
                  );
                })}

            </div>

          </section>
        )}

        {/* =========================
            ALL TOPICS
        ========================== */}

        <section className="learning-section">

          <div className="learning-section-heading">

            <div>
              <span>
                LEARNING LIBRARY
              </span>

              <h2>
                Explore Topics
              </h2>

              <p>
                Choose a topic and continue building your
                placement skills.
              </p>
            </div>

            <span className="topic-count">
              {filteredTopics.length} topics
            </span>

          </div>

          {/* FILTERS */}

          <div className="learning-filters">

            <div className="learning-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search learning topics..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">
                All Categories
              </option>

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

              <option value="SQL">
                SQL
              </option>

              <option value="DSA">
                DSA
              </option>

              <option value="Technical Subject">
                Technical Subject
              </option>

              <option value="Communication">
                Communication
              </option>

              <option value="Interview">
                Interview
              </option>
            </select>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value)
              }
            >
              <option value="">
                All Levels
              </option>

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

            {(search ||
              category ||
              difficulty) && (
              <button
                type="button"
                className="clear-filters"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setDifficulty("");
                }}
              >
                Clear
              </button>
            )}

          </div>

          {/* TOPIC GRID */}

          {filteredTopics.length > 0 ? (
            <div className="topic-grid">

              {filteredTopics.map((topic) => {
                const topicProgress =
                  getTopicProgress(topic._id);

                const topicStatus =
                  getTopicStatus(topic._id);

                const isUpdating =
                  updatingTopic === topic._id;

                return (
                  <article
                    className="topic-card"
                    key={topic._id}
                  >

                    <div className="topic-card-top">

                      <span className="topic-category">
                        {topic.category}
                      </span>

                      <span
                        className={`difficulty-badge ${topic.difficulty
                          ?.toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {topic.difficulty}
                      </span>

                    </div>

                    <h3>
                      {topic.title}
                    </h3>

                    <p>
                      {topic.description}
                    </p>

                    <div className="topic-meta">

                      <span>
                        ◷ {topic.estimatedMinutes} min
                      </span>

                      <span>
                        {topic.skillsCovered?.length || 0}{" "}
                        skills
                      </span>

                    </div>

                    {topic.skillsCovered?.length > 0 && (
                      <div className="topic-skills">

                        {topic.skillsCovered
                          .slice(0, 3)
                          .map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                            >
                              {skill}
                            </span>
                          ))}

                        {topic.skillsCovered.length > 3 && (
                          <span>
                            +{topic.skillsCovered.length - 3}
                          </span>
                        )}

                      </div>
                    )}

                    <div className="topic-card-progress">

                      <div className="topic-progress-header">

                        <span>
                          {topicStatus}
                        </span>

                        <strong>
                          {topicProgress}%
                        </strong>

                      </div>

                      <div className="topic-progress-track">

                        <div
                          style={{
                            width: `${topicProgress}%`,
                          }}
                        ></div>

                      </div>

                    </div>

                    <div className="topic-card-actions">

                      <button
                        type="button"
                        className="topic-primary-button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStartTopic(topic)
                        }
                      >
                        {isUpdating
                          ? "Updating..."
                          : topicProgress > 0
                          ? "Continue"
                          : "Start Learning"}

                        {!isUpdating && (
                          <span>→</span>
                        )}
                      </button>

                      {topicProgress > 0 &&
                        topicProgress < 100 && (
                          <button
                            type="button"
                            className="topic-complete-button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleCompleteTopic(topic)
                            }
                          >
                            Complete
                          </button>
                        )}

                    </div>

                  </article>
                );
              })}

            </div>
          ) : (
            <div className="learning-empty">

              <div className="learning-empty-icon">
                ⌕
              </div>

              <h3>
                No learning topics found
              </h3>

              <p>
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setDifficulty("");
                }}
              >
                Reset Filters
              </button>

            </div>
          )}

        </section>

      </div>
    </StudentLayout>
  );
}

export default StudentLearning;