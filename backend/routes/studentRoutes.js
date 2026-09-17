const express = require("express");

// ==============================
// STUDENT CONTROLLERS
// ==============================

const {
  getStudentDashboard,
  saveStudentProfile,
  getStudentProfile,
} = require("../controllers/student/studentController");

const {
  addSkill,
  getSkills,
  updateSkill,
  deleteSkill,
} = require("../controllers/student/skillController");

const {
  saveStudentGoal,
  getStudentGoal,
} = require("../controllers/student/goalController");

const {
  calculateReadiness,
  getReadiness,
} = require("../controllers/student/readinessController");

const {
  analyzeSkillGap,
} = require("../controllers/student/skillGapController");

// ==============================
// LEARNING CONTROLLERS
// ==============================

const {
  getLearningTopics,
  getLearningTopicById,
} = require("../controllers/student/learningController");

const {
  updateLearningProgress,
  getLearningProgress,
} = require("../controllers/student/learningProgressController");

const {
  getLearningRecommendations,
} = require("../controllers/student/learningRecommendationController");

// ==============================
// PRACTICE CONTROLLERS
// ==============================

const {
  getPracticeQuestions,
  submitPracticeAnswer,
  getPracticeHistory,
} = require("../controllers/student/practiceController");

const {
  getPracticePerformance,
} = require("../controllers/student/practicePerformanceController");

const {
  startPracticeSession,
  completePracticeSession,
  getPracticeSessions,
} = require("../controllers/student/practiceSessionController");

// ==============================
// CODING CONTROLLER
// ==============================

const {
  getCodingProblems,
  getCodingProblemById,
  submitCodingAttempt,
  getCodingHistory,
} = require("../controllers/student/codingController");

// ==============================
// SQL CONTROLLER
// ==============================

const {
  getSqlProblems,
  getSqlProblemById,
  submitSqlAttempt,
  getSqlHistory,
} = require("../controllers/student/sqlController");

// ==============================
// DEBUGGING CONTROLLER
// ==============================

const {
  getDebuggingProblems,
  getDebuggingProblemById,
  submitDebuggingAttempt,
  getDebuggingHistory,
} = require("../controllers/student/debuggingController");

// ==============================
// MOCK PLACEMENT CONTROLLERS
// ==============================

const {
  getAvailableMockTests,
  getMockTestDetails,
  startMockAttempt,
  completeMockRound,
} = require("../controllers/student/mockTestController");

const {
  getMockHistory,
} = require("../controllers/student/mockHistoryController");

const {
  logProctoringViolation,
} = require("../controllers/student/mockProctoringController");

const {
  getCurrentMockRoundQuestions,
} = require("../controllers/student/mockQuestionController");

const {
  submitMockAnswer,
} = require("../controllers/student/mockAnswerController");

const {
  getCurrentMockCodingProblem,
  submitMockCodingAttempt,
} = require("../controllers/student/mockCodingController");

const {
  getCurrentMockSqlProblem,
  submitMockSqlAttempt,
} = require("../controllers/student/mockSqlController");

// ==============================
// RESUME & ATS CONTROLLER
// ==============================

const {
  saveResumeDetails,
  analyzeStudentResume,
  getResume,
  deleteResume,
} = require("../controllers/student/resumeController");

// ==============================
// INTERVIEW PREPARATION CONTROLLERS
// ==============================

const {
  startInterviewSession,
  getInterviewQuestions,
  submitInterviewAnswer,
  completeInterviewSession,
} = require("../controllers/student/interviewController");

const {
  getInterviewHistory,
  getInterviewResult,
} = require("../controllers/student/interviewHistoryController");

const {
  submitVoiceInterviewAnswer,
} = require("../controllers/student/interviewVoiceController");

// ==============================
// GROUP DISCUSSION CONTROLLERS
// ==============================

const {
  getGDTopics,
  startGDSession,
  joinGDSession,
} = require("../controllers/student/gdController");

const {
  joinGDQueue,
} = require("../controllers/student/gdMatchmakingController");

const {
  getGDRoomDetails,
  markGDParticipantReady,
  startGDRoom,
  leaveGDRoom,
  completeGDRoom,
} = require("../controllers/student/gdRoomController");

const {
  transcribeGDAudio,
} = require("../controllers/student/gdTranscriptionController");

const {
  evaluateGDParticipantPerformance,
} = require("../controllers/student/gdEvaluationController");

const {
  getGDHistory,
  getGDResult,
} = require("../controllers/student/gdHistoryController");

// ==============================
// MIDDLEWARE
// ==============================

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const resumeUpload = require("../middleware/resumeUploadMiddleware");

const interviewAudioUpload = require(
  "../middleware/interviewAudioUploadMiddleware"
);

const gdAudioUpload = require(
  "../middleware/gdAudioUploadMiddleware"
);

const router = express.Router();

// ==============================
// STUDENT DASHBOARD
// ==============================

router.get(
  "/dashboard",
  protect,
  authorizeRoles("student"),
  getStudentDashboard
);

// ==============================
// STUDENT PROFILE
// ==============================

router.put(
  "/profile",
  protect,
  authorizeRoles("student"),
  saveStudentProfile
);

router.get(
  "/profile",
  protect,
  authorizeRoles("student"),
  getStudentProfile
);

// ==============================
// STUDENT SKILLS
// ==============================

router.post(
  "/skills",
  protect,
  authorizeRoles("student"),
  addSkill
);

router.get(
  "/skills",
  protect,
  authorizeRoles("student"),
  getSkills
);

router.put(
  "/skills/:id",
  protect,
  authorizeRoles("student"),
  updateSkill
);

router.delete(
  "/skills/:id",
  protect,
  authorizeRoles("student"),
  deleteSkill
);

// ==============================
// STUDENT GOALS
// ==============================

router.put(
  "/goal",
  protect,
  authorizeRoles("student"),
  saveStudentGoal
);

router.get(
  "/goal",
  protect,
  authorizeRoles("student"),
  getStudentGoal
);

// ==============================
// PLACEMENT READINESS
// ==============================

router.post(
  "/readiness/calculate",
  protect,
  authorizeRoles("student"),
  calculateReadiness
);

router.get(
  "/readiness",
  protect,
  authorizeRoles("student"),
  getReadiness
);

// ==============================
// SKILL GAP ANALYSIS
// ==============================

router.get(
  "/skill-gap",
  protect,
  authorizeRoles("student"),
  analyzeSkillGap
);

// ==============================
// LEARNING MODULE
// ==============================

router.get(
  "/learning",
  protect,
  authorizeRoles("student"),
  getLearningTopics
);

router.get(
  "/learning/recommendations",
  protect,
  authorizeRoles("student"),
  getLearningRecommendations
);

router.get(
  "/learning/:id",
  protect,
  authorizeRoles("student"),
  getLearningTopicById
);

// ==============================
// LEARNING PROGRESS
// ==============================

router.put(
  "/learning-progress",
  protect,
  authorizeRoles("student"),
  updateLearningProgress
);

router.get(
  "/learning-progress",
  protect,
  authorizeRoles("student"),
  getLearningProgress
);

// ==============================
// PRACTICE ENVIRONMENT
// ==============================

router.get(
  "/practice/questions",
  protect,
  authorizeRoles("student"),
  getPracticeQuestions
);

router.get(
  "/practice/history",
  protect,
  authorizeRoles("student"),
  getPracticeHistory
);

router.get(
  "/practice/performance",
  protect,
  authorizeRoles("student"),
  getPracticePerformance
);

router.post(
  "/practice/submit",
  protect,
  authorizeRoles("student"),
  submitPracticeAnswer
);

router.post(
  "/practice/session/start",
  protect,
  authorizeRoles("student"),
  startPracticeSession
);

router.post(
  "/practice/session/complete",
  protect,
  authorizeRoles("student"),
  completePracticeSession
);

router.get(
  "/practice/session/history",
  protect,
  authorizeRoles("student"),
  getPracticeSessions
);

// ==============================
// STUDENT CODING LAB
// ==============================

router.get(
  "/coding/problems",
  protect,
  authorizeRoles("student"),
  getCodingProblems
);

router.get(
  "/coding/problems/:id",
  protect,
  authorizeRoles("student"),
  getCodingProblemById
);

router.post(
  "/coding/submit",
  protect,
  authorizeRoles("student"),
  submitCodingAttempt
);

router.get(
  "/coding/history",
  protect,
  authorizeRoles("student"),
  getCodingHistory
);

// ==============================
// STUDENT SQL LAB
// ==============================

router.get(
  "/sql/problems",
  protect,
  authorizeRoles("student"),
  getSqlProblems
);

router.get(
  "/sql/problems/:id",
  protect,
  authorizeRoles("student"),
  getSqlProblemById
);

router.post(
  "/sql/submit",
  protect,
  authorizeRoles("student"),
  submitSqlAttempt
);

router.get(
  "/sql/history",
  protect,
  authorizeRoles("student"),
  getSqlHistory
);

// ==============================
// STUDENT DEBUGGING LAB
// ==============================

router.get(
  "/debugging/problems",
  protect,
  authorizeRoles("student"),
  getDebuggingProblems
);

router.get(
  "/debugging/problems/:id",
  protect,
  authorizeRoles("student"),
  getDebuggingProblemById
);

router.post(
  "/debugging/submit",
  protect,
  authorizeRoles("student"),
  submitDebuggingAttempt
);

router.get(
  "/debugging/history",
  protect,
  authorizeRoles("student"),
  getDebuggingHistory
);

// ==============================
// STUDENT MOCK PLACEMENT MODULE
// ==============================

router.get(
  "/mock-tests",
  protect,
  authorizeRoles("student"),
  getAvailableMockTests
);

router.get(
  "/mock-tests/:id",
  protect,
  authorizeRoles("student"),
  getMockTestDetails
);

router.post(
  "/mock-tests/:id/start",
  protect,
  authorizeRoles("student"),
  startMockAttempt
);

router.post(
  "/mock-attempts/:attemptId/round/complete",
  protect,
  authorizeRoles("student"),
  completeMockRound
);

router.post(
  "/mock-attempts/:attemptId/proctoring/violation",
  protect,
  authorizeRoles("student"),
  logProctoringViolation
);

router.get(
  "/mock-attempts/:attemptId/current-round/questions",
  protect,
  authorizeRoles("student"),
  getCurrentMockRoundQuestions
);

router.get(
  "/mock-history",
  protect,
  authorizeRoles("student"),
  getMockHistory
);

router.post(
  "/mock-question-attempts/:mockQuestionAttemptId/answer",
  protect,
  authorizeRoles("student"),
  submitMockAnswer
);

router.get(
  "/mock-attempts/:attemptId/current-round/coding-problem",
  protect,
  authorizeRoles("student"),
  getCurrentMockCodingProblem
);

router.post(
  "/mock-attempts/:attemptId/current-round/coding-submit",
  protect,
  authorizeRoles("student"),
  submitMockCodingAttempt
);

router.get(
  "/mock-attempts/:attemptId/current-round/sql-problem",
  protect,
  authorizeRoles("student"),
  getCurrentMockSqlProblem
);

router.post(
  "/mock-attempts/:attemptId/current-round/sql-submit",
  protect,
  authorizeRoles("student"),
  submitMockSqlAttempt
);

// ==============================
// RESUME & ATS MODULE
// ==============================

router.post(
  "/resume",
  protect,
  authorizeRoles("student"),
  resumeUpload.single("resume"),
  saveResumeDetails
);

router.post(
  "/resume/analyze",
  protect,
  authorizeRoles("student"),
  analyzeStudentResume
);

router.get(
  "/resume",
  protect,
  authorizeRoles("student"),
  getResume
);

router.delete(
  "/resume",
  protect,
  authorizeRoles("student"),
  deleteResume
);

// ==============================
// INTERVIEW PREPARATION MODULE
// ==============================

router.post(
  "/interview/start",
  protect,
  authorizeRoles("student"),
  startInterviewSession
);

router.get(
  "/interview/history",
  protect,
  authorizeRoles("student"),
  getInterviewHistory
);

router.get(
  "/interview/:sessionId/result",
  protect,
  authorizeRoles("student"),
  getInterviewResult
);

router.get(
  "/interview/:sessionId/questions",
  protect,
  authorizeRoles("student"),
  getInterviewQuestions
);

router.post(
  "/interview/:sessionId/questions/:questionId/answer",
  protect,
  authorizeRoles("student"),
  submitInterviewAnswer
);

router.post(
  "/interview/:sessionId/complete",
  protect,
  authorizeRoles("student"),
  completeInterviewSession
);

router.post(
  "/interview/:sessionId/questions/:questionId/voice-answer",
  protect,
  authorizeRoles("student"),
  interviewAudioUpload.single("audio"),
  submitVoiceInterviewAnswer
);

// ==============================
// GROUP DISCUSSION MODULE
// ==============================

// GD HISTORY
router.get(
  "/gd/history",
  protect,
  authorizeRoles("student"),
  getGDHistory
);

// GD RESULT
router.get(
  "/gd/rooms/:roomCode/result",
  protect,
  authorizeRoles("student"),
  getGDResult
);

// GD TOPICS
router.get(
  "/gd/topics",
  protect,
  authorizeRoles("student"),
  getGDTopics
);

// MANUAL GD SESSION
router.post(
  "/gd/sessions",
  protect,
  authorizeRoles("student"),
  startGDSession
);

router.post(
  "/gd/sessions/join",
  protect,
  authorizeRoles("student"),
  joinGDSession
);

// ==============================
// GD MATCHMAKING
// ==============================

router.post(
  "/gd/matchmaking/join",
  protect,
  authorizeRoles("student"),
  joinGDQueue
);

// ==============================
// GD ROOM LIFECYCLE
// ==============================

router.get(
  "/gd/rooms/:roomCode",
  protect,
  authorizeRoles("student"),
  getGDRoomDetails
);

router.post(
  "/gd/rooms/:roomCode/ready",
  protect,
  authorizeRoles("student"),
  markGDParticipantReady
);

router.post(
  "/gd/rooms/:roomCode/start",
  protect,
  authorizeRoles("student"),
  startGDRoom
);

router.post(
  "/gd/rooms/:roomCode/leave",
  protect,
  authorizeRoles("student"),
  leaveGDRoom
);

router.post(
  "/gd/rooms/:roomCode/complete",
  protect,
  authorizeRoles("student"),
  completeGDRoom
);

// ==============================
// GD AUDIO TRANSCRIPTION
// ==============================

router.post(
  "/gd/rooms/:roomCode/transcribe",
  protect,
  authorizeRoles("student"),
  gdAudioUpload.single("audio"),
  transcribeGDAudio
);

// ==============================
// GD PARTICIPANT EVALUATION
// ==============================

router.post(
  "/gd/rooms/:roomCode/evaluate",
  protect,
  authorizeRoles("student"),
  evaluateGDParticipantPerformance
);

module.exports = router;