
    import {
    useEffect,
    useRef,
    useState,
    } from "react";

    import {
    useNavigate,
    useParams,
    } from "react-router-dom";

    import axios from "axios";

    const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/student`;

    const TABS = [
    ["lessons", "Lessons"],
    ["videos", "Videos"],
    ["quizzes", "MCQs"],
    ["exercises", "Practice"],
    ["resources", "Resources"],
    ];

    const panel = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 20,
    minWidth: 0,
    minHeight: 0,
    };

    const linkStyle = {
    color: "#2563eb",
    fontWeight: 600,
    textDecoration: "none",
    };

    function NavButton({
    children,
    onClick,
    disabled = false,
    primary = false,
    }) {
    return (
        <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`plt-nav-button ${
            primary ? "plt-primary" : ""
        }`}
        >
        {children}
        </button>
    );
    }

    export default function StudentLearningTopic() {
    const { topicId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] =
        useState("lessons");

    const [activeLessonId, setActiveLessonId] =
        useState(null);

    const [selectedAnswers, setSelectedAnswers] =
        useState({});

        const [quizResult, setQuizResult] = useState(null);
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizError, setQuizError] = useState("");


    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [reviewMistakeIndex, setReviewMistakeIndex] = useState(0);


    const workspaceRef = useRef(null);
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);
    const tabStripRef = useRef(null);

    const lessonRefs = useRef({});
    const tabRefs = useRef({});

    useEffect(() => {
        let cancelled = false;

        async function loadContent() {
        try {
            setLoading(true);
            setError("");

            const token =
            localStorage.getItem("placifyToken");

            const response = await axios.get(
            `${API}/learning/${topicId}/content`,
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            );

            if (cancelled) return;

            const result = response.data;

            setData(result);
            setActiveTab("lessons");
            setActiveLessonId(
            result.lessons?.[0]?._id || null
            );

    setSelectedAnswers({});

    setQuizResult(null);
    setQuizError("");
    setQuizSubmitting(false);
    setCurrentQuizIndex(0);
    setReviewMistakeIndex(0);

        } catch (err) {
            if (!cancelled) {
            setError(
                err.response?.data?.message ||
                "Unable to load learning content."
            );
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        }

        loadContent();

        return () => {
        cancelled = true;
        };
    }, [topicId]);

    const lessons = data?.lessons || [];
    const videos = data?.videos || [];
    const quizzes = data?.quizzes || [];
    const exercises = data?.exercises || [];
    const resources = data?.resources || [];

    const activeLesson =
        lessons.find(
        (lesson) => lesson._id === activeLessonId
        ) ||
        lessons[0] ||
        null;

    const lessonIndex = lessons.findIndex(
        (lesson) => lesson._id === activeLesson?._id
    );

    function changeLesson(direction) {
        if (!lessons.length) return;

        const nextIndex = Math.max(
        0,
        Math.min(
            lessons.length - 1,
            Math.max(lessonIndex, 0) + direction
        )
        );

        setActiveLessonId(lessons[nextIndex]._id);
    }

    function changeTab(direction) {
        const currentIndex = TABS.findIndex(
        ([key]) => key === activeTab
        );

        const nextIndex = Math.max(
        0,
        Math.min(
            TABS.length - 1,
            currentIndex + direction
        )
        );

        setActiveTab(TABS[nextIndex][0]);
    }

    useEffect(() => {
        if (
        activeTab !== "lessons" ||
        !activeLesson
        ) {
        return;
        }

        const button =
        lessonRefs.current[activeLesson._id];

        const sidebar = sidebarRef.current;

        if (button && sidebar) {
        const buttonTop = button.offsetTop;
        const buttonBottom =
            buttonTop + button.offsetHeight;

        const visibleTop = sidebar.scrollTop;
        const visibleBottom =
            visibleTop + sidebar.clientHeight;

        if (buttonTop < visibleTop) {
            sidebar.scrollTo({
            top: buttonTop - 16,
            behavior: "smooth",
            });
        } else if (buttonBottom > visibleBottom) {
            sidebar.scrollTo({
            top:
                buttonBottom -
                sidebar.clientHeight +
                16,
            behavior: "smooth",
            });
        }
        }

        if (contentRef.current) {
        contentRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        }
    }, [activeLessonId, activeTab, activeLesson?._id]);

    useEffect(() => {
        const strip = tabStripRef.current;
        const button = tabRefs.current[activeTab];

        if (strip && button) {
        const left = button.offsetLeft;
        const right = left + button.offsetWidth;

        if (left < strip.scrollLeft) {
            strip.scrollTo({
            left,
            behavior: "smooth",
            });
        } else if (
            right >
            strip.scrollLeft + strip.clientWidth
        ) {
            strip.scrollTo({
            left: right - strip.clientWidth,
            behavior: "smooth",
            });
        }
        }

        if (contentRef.current) {
        contentRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        }
    }, [activeTab]);

    function handleKeyDown(event) {


    if (activeTab === "quizzes") {
        return;
    }

        if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
        ) {
        return;
        }

        if (
        event.target.closest(
            'input, textarea, select, [contenteditable="true"]'
        )
        ) {
        return;
        }

        if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeTab(-1);
        } else if (event.key === "ArrowRight") {
        event.preventDefault();
        changeTab(1);
        } else if (
        activeTab === "lessons" &&
        event.key === "ArrowUp"
        ) {
        event.preventDefault();
        changeLesson(-1);
        } else if (
        activeTab === "lessons" &&
        event.key === "ArrowDown"
        ) {
        event.preventDefault();
        changeLesson(1);
        }
    }


    const answeredCount = quizzes.filter(
    (quiz) =>
        Number.isInteger(selectedAnswers[quiz._id])
    ).length;

    const allQuestionsAnswered =
    quizzes.length > 0 &&
    answeredCount === quizzes.length;

    async function submitQuiz() {
    if (
        quizSubmitting ||
        quizResult ||
        !allQuestionsAnswered
    ) {
        return;
    }

    try {
        setQuizSubmitting(true);
        setQuizError("");

        const token = localStorage.getItem("placifyToken");

        const answers = quizzes.map((quiz) => ({
        quizId: quiz._id,
        selectedAnswer: selectedAnswers[quiz._id],
        }));

        const response = await axios.post(
        `${API}/learning/${topicId}/quiz/submit`,
        { answers },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );

        setQuizResult(response.data);
    setReviewMistakeIndex(0);
    } catch (err) {
        setQuizError(
        err.response?.data?.message ||
            "Unable to submit quiz. Please try again."
        );
    } finally {
        setQuizSubmitting(false);
    }
    }


    function retryQuiz() {
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizError("");
    setQuizSubmitting(false);
    setCurrentQuizIndex(0);
    setReviewMistakeIndex(0);

    if (contentRef.current) {
        contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
        });
    }
    }


    const quizResultsById = Object.fromEntries(
    (quizResult?.results || []).map((result) => [
        String(result.quizId),
        result,
    ])
    );



    const currentQuiz = quizzes[currentQuizIndex];

    const incorrectQuestions = quizzes.filter((quiz) => {
    const result = quizResultsById[quiz._id];
    return result && !result.isCorrect;
    });

    const currentMistake = incorrectQuestions[reviewMistakeIndex];



    const topic = data?.topic;

    return (
        <main
        ref={workspaceRef}
        className="plt-workspace"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        >
        <style>{`
            .plt-workspace {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100vh;
            height: 100dvh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #f5f7fc;
            color: #17243b;
            font-family: Inter, system-ui, sans-serif;
            padding: 12px clamp(14px, 2.5vw, 42px);
            box-sizing: border-box;
            outline: none;
            }

            .plt-workspace * {
            box-sizing: border-box;
            }

            .plt-workspace button {
            font: inherit;
            }

            .plt-workspace button:focus-visible,
            .plt-workspace a:focus-visible {
            outline: 3px solid #93c5fd;
            outline-offset: 2px;
            }

            .plt-top {
            flex: 0 0 auto;
            min-height: 0;
            }

            .plt-back {
            background: transparent;
            border: none;
            color: #2563eb;
            cursor: pointer;
            padding: 5px 0;
            margin: 0 0 8px;
            font-weight: 600;
            font-size: 14px;
            }

            .plt-header {
            background: linear-gradient(
                115deg,
                #142b5e,
                #2563eb
            );
            color: white;
            border-radius: 14px;
            padding: 15px 24px;
            margin-bottom: 12px;
            }

            .plt-category {
            opacity: 0.85;
            font-size: 13px;
            margin: 0 0 6px;
            }

            .plt-title {
            font-size: clamp(21px, 2vw, 27px);
            line-height: 1.25;
            margin: 0 0 7px;
            font-weight: 750;
            }

            .plt-description {
            opacity: 0.9;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 8px;
            }

            .plt-duration {
            font-size: 12px;
            opacity: 0.85;
            margin: 0;
            }

            .plt-tabs {
            flex: 0 0 auto;
            display: flex;
            gap: 9px;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 2px 2px 8px;
            margin-bottom: 5px;
            scrollbar-width: thin;
            scroll-behavior: smooth;
            }

            .plt-tab {
            flex: 0 0 auto;
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid #dbe3ef;
            background: white;
            color: #334155;
            cursor: pointer;
            font-weight: 600;
            white-space: nowrap;
            transition:
                background 0.18s ease,
                color 0.18s ease,
                border-color 0.18s ease;
            }

            .plt-tab.active {
            background: #2563eb;
            border-color: #2563eb;
            color: white;
            }

            .plt-tab:hover:not(.active) {
            background: #eff6ff;
            }

            .plt-body {
            flex: 1 1 0;
            display: grid;
            grid-template-columns:
                minmax(225px, 300px)
                minmax(0, 1fr);
            gap: 16px;
            min-height: 0;
            overflow: hidden;
            }

            .plt-scroll-panel {
            min-height: 0;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            scrollbar-width: thin;
            scrollbar-color: #b8c7dd transparent;
            scroll-behavior: smooth;
            }

            .plt-scroll-panel::-webkit-scrollbar {
            width: 7px;
            }

            .plt-scroll-panel::-webkit-scrollbar-thumb {
            background: #b8c7dd;
            border-radius: 12px;
            }

            .plt-sidebar {
            position: relative;
            }

            .plt-sidebar-header {
            position: sticky;
            top: -20px;
            z-index: 2;
            background: white;
            padding: 4px 0 13px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            }

            .plt-sidebar-header h3 {
            margin: 0 0 5px;
            font-size: 18px;
            }

            .plt-sidebar-header p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
            }

            .plt-lesson {
            display: block;
            width: 100%;
            text-align: left;
            padding: 12px 13px;
            margin-bottom: 9px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: white;
            color: #17243b;
            cursor: pointer;
            line-height: 1.5;
            transition:
                background 0.15s ease,
                border-color 0.15s ease;
            }

            .plt-lesson.active {
            background: #eff6ff;
            border-color: #2563eb;
            color: #1d4ed8;
            font-weight: 600;
            }

            .plt-lesson:hover:not(.active) {
            background: #f8fbff;
            border-color: #93c5fd;
            }

            .plt-content {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            line-height: 1.8;
            }

            .plt-section {
            flex: 1 1 0;
            min-height: 0;
            overflow: hidden;
            }

            .plt-item {
            padding: 16px 0;
            border-bottom: 1px solid #e2e8f0;
            }

            .plt-item:last-child {
            border-bottom: none;
            }

            .plt-item h3 {
            margin-top: 0;
            }

            .plt-option {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            margin: 8px 0;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            cursor: pointer;
            }

            .plt-option.selected {
            background: #eff6ff;
            border-color: #93c5fd;
            }



    /* Fixed MCQ workspace */
    .plt-quiz-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px 16px !important;
    }

    .plt-quiz-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 6px;
    overflow: hidden;
    }

    .plt-quiz-layout > h2 {
    margin: 0 0 2px !important;
    font-size: 21px;
    line-height: 1.2;
    flex-shrink: 0;
    }

    .plt-quiz-question-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 8px;
    }

    .plt-quiz-counter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 9px 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    flex-shrink: 0;
    }

    .plt-quiz-question-card {
    flex: 1;
    min-height: 0;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    }

    .plt-quiz-question-card h3 {
    margin: 0 0 10px;
    font-size: 18px;
    line-height: 1.35;
    }

    .plt-quiz-question-card .plt-option {
    padding: 8px 12px;
    min-height: 38px;
    margin: 4px 0;
    align-items: center;
    }

    .plt-quiz-question-area > .plt-nav {
    margin: 0 !important;
    padding-top: 10px !important;
    padding-bottom: 0;
    flex-shrink: 0;
    }

    .plt-quiz-question-area > .plt-nav .plt-nav-button {
    padding: 8px 14px;
    }

    .plt-quiz-hint {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    flex-shrink: 0;
    }

    .plt-quiz-section-button {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
    padding-top: 10px;
    }


    /* Fixed quiz results and mistake review */
    .plt-quiz-results {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 10px;
    overflow: hidden;
    }


.plt-quiz-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 14px;
  min-height: 64px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  flex-shrink: 0;
}

.plt-quiz-score > div:first-child p {
  margin: 2px 0 0 !important;
}

.plt-quiz-score > div:last-child {
  padding: 4px 12px !important;
}


    .plt-quiz-mistake-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-height: 0;
    gap: 9px;
    padding: 12px 16px;
    border: 1px solid #fecaca;
    border-radius: 12px;
    background: #ffffff;
    overflow: hidden;
    }

    .plt-quiz-mistake-card h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.35;
    }

    .plt-quiz-answer-box {
    padding: 9px 12px;
    border-radius: 9px;
    }

    .plt-quiz-answer-box p {
    margin: 4px 0 0;
    line-height: 1.4;
    }

    .plt-quiz-answer-wrong {
    background: #fef2f2;
    border: 1px solid #fecaca;
    }

    .plt-quiz-answer-correct {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    }

    .plt-quiz-explanation {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    }

    .plt-quiz-review-nav {
    margin: 0 !important;
    padding-top: 10px !important;
    flex-shrink: 0;
    }





/* FINAL PLACIFY MISTAKE REVIEW */

.plt-quiz-results {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 8px;
  overflow: hidden;
}

.plt-quiz-score {
  flex-shrink: 0;
  padding: 4px 12px;
  min-height: 0;
}

.plt-quiz-mistake-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
  min-height: 0;
  gap: 7px;
  padding: 8px 16px 14px;
  overflow: visible;
}

.plt-quiz-mistake-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  flex-shrink: 0;
}

.plt-quiz-mistake-header strong {
  color: #dc2626;
}

.plt-quiz-mistake-header span {
  color: #64748b;
}

.plt-quiz-mistake-card .plt-quiz-mistake-question {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  flex-shrink: 0;
}

.plt-quiz-mistake-answers {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
}

.plt-quiz-mistake-answers .plt-mistake-option {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 9px 12px;
  min-height: 42px;
  border-radius: 9px;
  cursor: default;
}

.plt-mistake-option input {
  flex-shrink: 0;
  accent-color: #2563eb;
}

.plt-mistake-option-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  line-height: 1.35;
}

.plt-quiz-mistake-answers .plt-mistake-wrong-option {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.plt-quiz-mistake-answers .plt-mistake-correct-option {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.plt-mistake-wrong-label,
.plt-mistake-correct-label {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.plt-mistake-wrong-label {
  color: #b91c1c;
}

.plt-mistake-correct-label {
  color: #15803d;
}


.plt-quiz-mistake-explanation {
  flex: 0 0 auto;
  min-height: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #2563eb;
  border-radius: 9px;
  padding: 6px 12px;
  overflow: visible;
}


.plt-quiz-mistake-explanation strong {
  color: #1e40af;
  font-size: 13px;
}

.plt-quiz-mistake-explanation p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.plt-quiz-review-nav {
  margin: 0 !important;
  padding-top: 8px !important;
  flex-shrink: 0;
}



    @media (max-height: 700px), (max-width: 760px) {
    .plt-quiz-results {
        flex: none;
        overflow: visible;
    }

    .plt-quiz-mistake-card {
        flex: none;
        overflow: visible;
    }
    }


    /* Short screens: allow scrolling rather than hiding answers */
    @media (max-height: 700px), (max-width: 760px) {
    .plt-quiz-panel {
        overflow-y: auto;
    }

    .plt-quiz-layout,
    .plt-quiz-question-area {
        flex: none;
        overflow: visible;
    }

    .plt-quiz-question-card {
        flex: none;
    }
    }


           .plt-nav {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  margin-top: 26px;
}

            .plt-nav-button {
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: white;
            color: #334155;
            padding: 9px 14px;
            cursor: pointer;
            font-weight: 600;
            }

            .plt-nav-button.plt-primary {
            background: #2563eb;
            border-color: #2563eb;
            color: white;
            }

            .plt-nav-button:disabled {
            background: #f1f5f9;
            border-color: #e2e8f0;
            color: #94a3b8;
            cursor: not-allowed;
            }

            .plt-footer {
            flex: 0 0 auto;
            color: #64748b;
            font-size: 11px;
            padding: 8px 2px 0;
            }

            @media (max-width: 760px) {
            .plt-workspace {
                padding: 9px 12px;
            }

            .plt-header {
                padding: 12px 15px;
                margin-bottom: 9px;
            }

            .plt-title {
                font-size: 21px;
            }

            .plt-tabs {
                gap: 6px;
            }

            .plt-tab {
                padding: 9px 12px;
                font-size: 13px;
            }

            .plt-body {
                grid-template-columns: minmax(0, 1fr);
                grid-template-rows:
                minmax(105px, 30%)
                minmax(0, 1fr);
                gap: 10px;
            }

            .plt-footer {
                font-size: 10px;
            }
            }

            @media (max-height: 650px) {
            .plt-workspace {
                padding-top: 7px;
                padding-bottom: 7px;
            }

            .plt-header {
                padding: 10px 18px;
                margin-bottom: 8px;
            }

            .plt-description {
                margin-bottom: 5px;
            }

            .plt-tabs {
                margin-bottom: 2px;
            }

            .plt-footer {
                padding-top: 4px;
            }
            }
        `}</style>

        {loading ? (
            <div style={{ padding: 24 }}>
            Loading learning workspace...
            </div>
        ) : error || !data ? (
            <div style={{ padding: 24 }}>
            <p>
                {error || "Learning content unavailable."}
            </p>

            <NavButton
                onClick={() =>
                navigate("/student/learning")
                }
            >
                Back to Learning
            </NavButton>
            </div>
        ) : (
            <>
            <div className="plt-top">
                <button
                type="button"
                className="plt-back"
                onClick={() =>
                    navigate("/student/learning")
                }
                >
                ← Back to Learning
                </button>

                <header className="plt-header">
                <p className="plt-category">
                    {topic.category} · {topic.difficulty}
                </p>

                <h1 className="plt-title">
                    {topic.title}
                </h1>

                <p className="plt-description">
                    {topic.description}
                </p>

                <p className="plt-duration">
                    Estimated duration:{" "}
                    {topic.estimatedMinutes} minutes
                </p>
                </header>

                <nav
                ref={tabStripRef}
                className="plt-tabs"
                aria-label="Learning sections"
                >
                {TABS.map(([key, label]) => (
                    <button
                    key={key}
                    ref={(element) => {
                        tabRefs.current[key] = element;
                    }}
                    type="button"
                    className={`plt-tab ${
                        activeTab === key
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setActiveTab(key)}
                    aria-current={
                        activeTab === key
                        ? "page"
                        : undefined
                    }
                    >
                    {label} (
                    {data[key]?.length || 0})
                    </button>
                ))}
                </nav>
            </div>

            {activeTab === "lessons" ? (
                <section className="plt-body">
                <aside
                    ref={sidebarRef}
                    className="plt-scroll-panel plt-sidebar"
                    style={panel}
                >
                    <div className="plt-sidebar-header">
                    <h3>Course lessons</h3>
                    <p>
                        {lessons.length} lessons · ↑ ↓ to
                        navigate
                    </p>
                    </div>

                    {lessons.map((lesson, index) => (
                    <button
                        key={lesson._id}
                        ref={(element) => {
                        lessonRefs.current[
                            lesson._id
                        ] = element;
                        }}
                        type="button"
                        className={`plt-lesson ${
                        activeLesson?._id === lesson._id
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                        setActiveLessonId(lesson._id)
                        }
                        aria-current={
                        activeLesson?._id === lesson._id
                            ? "step"
                            : undefined
                        }
                    >
                        {lesson.order || index + 1}.{" "}
                        {lesson.title}
                    </button>
                    ))}

                    {!lessons.length && (
                    <p>No lessons published yet.</p>
                    )}
                </aside>

                <article
                    ref={contentRef}
                    className="plt-scroll-panel"
                    style={panel}
                >
                    {activeLesson ? (
                    <>
                        <div
                        style={{
                            display: "flex",
                            justifyContent:
                            "space-between",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                        }}
                        >
                        <span
                            style={{
                            color: "#2563eb",
                            fontSize: 12,
                            fontWeight: 700,
                            }}
                        >
                            LESSON {lessonIndex + 1} OF{" "}
                            {lessons.length}
                        </span>

                        <span
                            style={{
                            color: "#64748b",
                            fontSize: 12,
                            }}
                        >
                            {activeLesson.estimatedMinutes ||
                            10}{" "}
                            min
                        </span>
                        </div>

                        <h2
                        style={{
                            margin: "0 0 10px",
                            fontSize: 24,
                        }}
                        >
                        {activeLesson.title}
                        </h2>

                        {activeLesson.description && (
                        <p
                            style={{
                            color: "#64748b",
                            margin: "0 0 18px",
                            }}
                        >
                            {activeLesson.description}
                        </p>
                        )}

                        <div className="plt-content">
                        {activeLesson.content}
                        </div>

                        {activeLesson.examples?.map(
                        (example, index) => (
                            <div
                            key={index}
                            style={{ marginTop: 24 }}
                            >
                            <h3>{example.title}</h3>
                            <p>
                                {example.explanation}
                            </p>

                            {example.code && (
                                <pre
                                style={{
                                    background: "#0f172a",
                                    color: "#e2e8f0",
                                    padding: 18,
                                    borderRadius: 12,
                                    overflowX: "auto",
                                    lineHeight: 1.6,
                                    fontSize: 13,
                                }}
                                >
                                <code>
                                    {example.code}
                                </code>
                                </pre>
                            )}
                            </div>
                        )
                        )}

                        <div className="plt-nav">
                        <NavButton
                            disabled={lessonIndex <= 0}
                            onClick={() =>
                            changeLesson(-1)
                            }
                        >
                            ← Previous lesson
                        </NavButton>

                        {lessonIndex <
                        lessons.length - 1 ? (
                            <NavButton
                            primary
                            onClick={() =>
                                changeLesson(1)
                            }
                            >
                            Next lesson →
                            </NavButton>
                        ) : (
                            <NavButton
                            primary
                            onClick={() =>
                                setActiveTab("videos")
                            }
                            >
                            Go to Videos →
                            </NavButton>
                        )}
                        </div>
                    </>
                    ) : (
                    <p>Select a lesson to begin.</p>
                    )}
                </article>
                </section>
            ) : (
                <section className="plt-section">

    <div
    ref={contentRef}
    className={`plt-scroll-panel ${
        activeTab === "quizzes" ? "plt-quiz-panel" : ""
    }`}
    style={panel}
    >

                    {activeTab === "videos" && (
                    <>
                        <h2 style={{ marginTop: 0 }}>
                        Video tutorials
                        </h2>

                        {videos.map((video) => (
                        <article
                            key={video._id}
                            className="plt-item"
                        >
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>

                            {video.durationMinutes > 0 && (
                            <p
                                style={{
                                color: "#64748b",
                                fontSize: 13,
                                }}
                            >
                                {video.durationMinutes} minutes
                            </p>
                            )}

                            <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={linkStyle}
                            >
                            Watch on YouTube ↗
                            </a>
                        </article>
                        ))}

                        {!videos.length && (
                        <p>No videos published yet.</p>
                        )}
                    </>
                    )}




    {activeTab === "quizzes" && (
    <div className="plt-quiz-layout">
        <h2 style={{ marginTop: 0 }}>
        Knowledge check
        </h2>


        {!quizzes.length && (
        <p>No MCQs published yet.</p>
        )}

    {!!quizzes.length && !quizResult && (
    <div className="plt-quiz-question-area">
    <div className="plt-quiz-counter">
            <strong>
                Question {currentQuizIndex + 1} of {quizzes.length}
            </strong>

            <span style={{ color: "#475569", fontSize: 13 }}>
                {answeredCount} answered
            </span>
            </div>

        {currentQuiz && (
    <article
        key={currentQuiz._id}
        className="plt-quiz-question-card"
    >
                <h3 style={{ marginTop: 0, lineHeight: 1.6 }}>
                {currentQuizIndex + 1}. {currentQuiz.question}
                </h3>

                {currentQuiz.options.map((option, optionIndex) => {
                const isSelected =
                    selectedAnswers[currentQuiz._id] === optionIndex;

                return (
                    <label
                    key={optionIndex}
                    className={`plt-option ${isSelected ? "selected" : ""}`}
                    style={{
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                        cursor: "pointer",
                    }}
                    >
                    <input
                        type="radio"
                        name={`quiz-${currentQuiz._id}`}
                        checked={isSelected}
                        disabled={quizSubmitting}
                        onChange={() => {
                        setSelectedAnswers((previous) => ({
                            ...previous,
                            [currentQuiz._id]: optionIndex,
                        }));
                        setQuizError("");
                        }}
                    />

                    <span>{option}</span>
                    </label>
                );
                })}
            </article>
            )}

            {quizError && (
            <p
                role="alert"
                style={{ color: "#dc2626", fontWeight: 600 }}
            >
                {quizError}
            </p>
            )}

        <div className="plt-nav">
            <NavButton
                disabled={currentQuizIndex === 0 || quizSubmitting}
                onClick={() => {
                setCurrentQuizIndex((index) => index - 1);
                setQuizError("");
                }}
            >
                ← Previous
            </NavButton>

            {currentQuizIndex < quizzes.length - 1 ? (
                <NavButton
                primary
                disabled={
                    !Number.isInteger(
                    selectedAnswers[currentQuiz?._id]
                    ) || quizSubmitting
                }
                onClick={() => {
                    setCurrentQuizIndex((index) => index + 1);
                    setQuizError("");
                }}
                >
                Next Question →
                </NavButton>
            ) : (
                <NavButton
                primary
                disabled={!allQuestionsAnswered || quizSubmitting}
                onClick={submitQuiz}
                >
                {quizSubmitting ? "Evaluating..." : "Submit Quiz"}
                </NavButton>
            )}
            </div>

            <p className="plt-quiz-hint">
            Select an answer before moving to the next question.
            Your previous answers will be preserved.
            </p>
        </div>
    )}


    {!!quizResult && (
    <div className="plt-quiz-results">
        <div className="plt-quiz-score">

            <div>
                <strong style={{ fontSize: 15 }}>Quiz Results</strong>
                <p style={{ margin: "5px 0 0", color: "#475569", fontSize: 13 }}>
                {quizResult.correctAnswers} correct ·{" "}
                {quizResult.incorrectAnswers} incorrect
                </p>
            </div>

            <div
                style={{
                padding: "8px 14px",
                borderRadius: 9,
                background: "#ffffff",
                border: "1px solid #bfdbfe",
                textAlign: "center",
                minWidth: 90,
                }}
            >
                <strong style={{ fontSize: 23, color: "#2563eb" }}>
                {quizResult.score}%
                </strong>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                Final score
                </div>
            </div>
            </div>

            {incorrectQuestions.length === 0 ? (
            <div
                style={{
                padding: 20,
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 12,
                marginBottom: 20,
                }}
            >
                <h3 style={{ color: "#15803d", marginTop: 0 }}>
                Excellent! All answers are correct.
                </h3>
                <p>You have no mistakes to review.</p>
            </div>
            ) : reviewMistakeIndex < incorrectQuestions.length ? (
            (() => {
                const mistake = currentMistake;


const result = quizResultsById[mistake._id];

return (
  <>

<article
  key={mistake._id}
  className="plt-quiz-mistake-card"
>
  <div className="plt-quiz-mistake-header">
    <strong>
      Mistake {reviewMistakeIndex + 1} of{" "}
      {incorrectQuestions.length}
    </strong>

    <span>
      Question{" "}
      {quizzes.findIndex(
        (quiz) => quiz._id === mistake._id
      ) + 1}
    </span>
  </div>

  <h3 className="plt-quiz-mistake-question">
    {quizzes.findIndex(
      (quiz) => quiz._id === mistake._id
    ) + 1}.{" "}
    {mistake.question}
  </h3>


<div className="plt-quiz-mistake-answers">
  <div className="plt-option plt-mistake-option plt-mistake-wrong-option">
    <input
      type="radio"
      checked
      readOnly
      disabled
    />

    <span className="plt-mistake-option-text">
      {mistake.options[selectedAnswers[mistake._id]] ??
        "No answer recorded"}
    </span>

    <strong className="plt-mistake-wrong-label">
      Your answer
    </strong>
  </div>

  <div className="plt-option plt-mistake-option plt-mistake-correct-option">
    <input
      type="radio"
      checked={false}
      readOnly
      disabled
    />

    <span className="plt-mistake-option-text">
      {mistake.options[Number(result.correctAnswer)] ??
        "Correct answer unavailable"}
    </span>

    <strong className="plt-mistake-correct-label">
      Correct answer
    </strong>
  </div>
</div>


  <div className="plt-quiz-mistake-explanation">
    <strong>Explanation</strong>
    <p>
      {result.explanation ||
        "No explanation available."}
    </p>
  </div>
</article>


    <div className="plt-nav plt-quiz-review-nav">
      <NavButton
        disabled={reviewMistakeIndex === 0}
        onClick={() =>
          setReviewMistakeIndex((index) =>
            Math.max(0, index - 1)
          )
        }
      >
        ← Previous Mistake
      </NavButton>

      <NavButton
        primary
        onClick={() =>
          setReviewMistakeIndex((index) => index + 1)
        }
      >
        {reviewMistakeIndex <
        incorrectQuestions.length - 1
          ? "Next Mistake →"
          : "Finish Review"}
      </NavButton>
    </div>
  </>
);

    })()

            ) : (
            <div
                style={{
                padding: 20,
                borderRadius: 12,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                marginBottom: 20,
                }}
            >
                <h3 style={{ color: "#15803d", marginTop: 0 }}>
                Mistake review completed
                </h3>
                <p>You have reviewed all your incorrect answers.</p>
            </div>
            )}



  {(incorrectQuestions.length === 0 ||
  reviewMistakeIndex >= incorrectQuestions.length) && (
  <div className="plt-nav plt-quiz-review-nav">
    <NavButton onClick={retryQuiz}>
      Try Again
    </NavButton>

    <NavButton
      primary
      onClick={() => setActiveTab("exercises")}
    >
      Next Section: Practice →
    </NavButton>
  </div>
)}

    </div>
    )}



    </div>
    )}




                    {activeTab === "exercises" && (
                    <>
                        <h2 style={{ marginTop: 0 }}>
                        Practical exercises
                        </h2>

                        {exercises.map((exercise) => (
                        <article
                            key={exercise._id}
                            className="plt-item"
                        >
                            <h3>{exercise.title}</h3>
                            <p>
                            {exercise.description}
                            </p>

                            <p
                            style={{
                                color: "#2563eb",
                                fontWeight: 600,
                                fontSize: 13,
                            }}
                            >
                            {exercise.type} ·{" "}
                            {exercise.difficulty}
                            </p>

                            <div className="plt-content">
                            {exercise.instructions}
                            </div>
                        </article>
                        ))}

                        {!exercises.length && (
                        <p>
                            No exercises published yet.
                        </p>
                        )}
                    </>
                    )}

                    {activeTab === "resources" && (
                    <>
                        <h2 style={{ marginTop: 0 }}>
                        Additional resources
                        </h2>

                        {resources.map((resource) => (
                        <article
                            key={resource._id}
                            className="plt-item"
                        >
                            <h3>{resource.title}</h3>
                            <p>
                            {resource.description}
                            </p>

                            <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={linkStyle}
                            >
                            Open {resource.type} ↗
                            </a>
                        </article>
                        ))}

                        {!resources.length && (
                        <p>
                            No resources published yet.
                        </p>
                        )}
                    </>
                    )}


    {activeTab !== "quizzes" && (
    <div className="plt-nav">
        <NavButton
        disabled={activeTab === TABS[0][0]}
        onClick={() => changeTab(-1)}
        >
        ← Previous section
        </NavButton>

        <NavButton
        primary
        disabled={
            activeTab === TABS[TABS.length - 1][0]
        }
        onClick={() => changeTab(1)}
        >
        Next section →
        </NavButton>
    </div>
    )}

                </div>
                </section>
            )}

            <div className="plt-footer">
                ↑ ↓ Change lessons · ← → Change tabs ·
                Scroll within the content panels
            </div>
            </>
        )}
        </main>
    );
    }
