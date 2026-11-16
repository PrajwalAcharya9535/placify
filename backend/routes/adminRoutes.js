
const express = require("express");

// ==============================
// ADMIN DASHBOARD CONTROLLER
// ==============================

const {
  getAdminDashboardOverview,
  getRecentPlacementApplications,
  getAllPlacementApplications,
  getPlacementApplicationById,
  getApplicationStageAnalytics,
  getCompanyApplicationAnalytics,
  getPlacementPackageAnalytics,
  getMockPlacementAnalytics,
} = require("../controllers/admin/dashboardController");

// ==============================
// ADMIN STUDENT MANAGEMENT CONTROLLER
// ==============================

const {
  getAllStudents,
  getStudentById,
} = require("../controllers/admin/studentManagementController");

// ==============================
// ADMIN LEARNING CONTROLLER
// ==============================

const {
  createLearningTopic,
  getAllLearningTopics,
  getLearningTopicById,
  updateLearningTopic,
  deactivateLearningTopic,
} = require("../controllers/admin/learningController");

// ==============================
// ADMIN PRACTICE CONTROLLER
// ==============================

const {
  createPracticeQuestion,
  getAllPracticeQuestions,
  getPracticeQuestionById,
  updatePracticeQuestion,
  deactivatePracticeQuestion,
} = require("../controllers/admin/practiceController");

// ==============================
// ADMIN CODING CONTROLLER
// ==============================

const {
  createCodingProblem,
  getAllCodingProblems,
  getCodingProblemById,
  updateCodingProblem,
  deactivateCodingProblem,
} = require("../controllers/admin/codingController");

// ==============================
// ADMIN SQL CONTROLLER
// ==============================

const {
  createSqlProblem,
  getAllSqlProblems,
  getSqlProblemById,
  updateSqlProblem,
  deactivateSqlProblem,
} = require("../controllers/admin/sqlController");

// ==============================
// ADMIN DEBUGGING CONTROLLER
// ==============================

const {
  createDebuggingProblem,
  getAllDebuggingProblems,
  getDebuggingProblemById,
  updateDebuggingProblem,
  deactivateDebuggingProblem,
} = require("../controllers/admin/debuggingController");

// ==============================
// ADMIN MOCK PLACEMENT CONTROLLER
// ==============================

const {
  createMockTest,
  getMockTests,
  getMockTestById,
  deactivateMockTest,
} = require("../controllers/admin/mockTestController");

// ==============================
// ADMIN INTERVIEW CONTROLLER
// ==============================

const {
  createInterviewQuestion,
  getAllInterviewQuestions,
  getInterviewQuestionById,
  updateInterviewQuestion,
  deactivateInterviewQuestion,
} = require("../controllers/admin/interviewController");

// ==============================
// ADMIN GROUP DISCUSSION CONTROLLER
// ==============================

const {
  createGDTopic,
} = require("../controllers/admin/gdController");

// ==============================
// ADMIN PLACEMENT OPPORTUNITY CONTROLLER
// ==============================

const {
  createPlacementOpportunity,
  getAllPlacementOpportunities,
  getPlacementOpportunityById,
  updatePlacementOpportunity,
  closePlacementOpportunity,
} = require("../controllers/admin/placementOpportunityController");

// ==============================
// MIDDLEWARE
// ==============================

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==============================
// ADMIN DASHBOARD
// ==============================

router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  getAdminDashboardOverview
);

router.get(
  "/dashboard/recent-applications",
  protect,
  authorizeRoles("admin"),
  getRecentPlacementApplications
);

// ==============================
// ADMIN STUDENT MANAGEMENT
// ==============================

router.get(
  "/students",
  protect,
  authorizeRoles("admin"),
  getAllStudents
);

router.get(
  "/students/:studentId",
  protect,
  authorizeRoles("admin"),
  getStudentById
);

// ==============================
// ADMIN APPLICATION MANAGEMENT
// ==============================

router.get(
  "/applications",
  protect,
  authorizeRoles("admin"),
  getAllPlacementApplications
);

router.get(
  "/applications/analytics/stages",
  protect,
  authorizeRoles("admin"),
  getApplicationStageAnalytics
);

router.get(
  "/applications/analytics/companies",
  protect,
  authorizeRoles("admin"),
  getCompanyApplicationAnalytics
);

router.get(
  "/applications/analytics/packages",
  protect,
  authorizeRoles("admin"),
  getPlacementPackageAnalytics
);

router.get(
  "/applications/:applicationId",
  protect,
  authorizeRoles("admin"),
  getPlacementApplicationById
);

// ==============================
// ADMIN LEARNING MODULE
// ==============================

// Create learning topic
router.post(
  "/learning",
  protect,
  authorizeRoles("admin"),
  createLearningTopic
);

// Get all learning topics
router.get(
  "/learning",
  protect,
  authorizeRoles("admin"),
  getAllLearningTopics
);

// Get single learning topic
router.get(
  "/learning/:id",
  protect,
  authorizeRoles("admin"),
  getLearningTopicById
);

// Update learning topic
router.put(
  "/learning/:id",
  protect,
  authorizeRoles("admin"),
  updateLearningTopic
);

// Deactivate learning topic
router.patch(
  "/learning/:id/deactivate",
  protect,
  authorizeRoles("admin"),
  deactivateLearningTopic
);

// ==============================
// ADMIN PRACTICE MODULE
// ==============================

// Create practice question
router.post(
  "/practice/questions",
  protect,
  authorizeRoles("admin"),
  createPracticeQuestion
);

// Get all practice questions
router.get(
  "/practice/questions",
  protect,
  authorizeRoles("admin"),
  getAllPracticeQuestions
);

// Get single practice question
router.get(
  "/practice/questions/:id",
  protect,
  authorizeRoles("admin"),
  getPracticeQuestionById
);

// Update practice question
router.put(
  "/practice/questions/:id",
  protect,
  authorizeRoles("admin"),
  updatePracticeQuestion
);

// Deactivate practice question
router.patch(
  "/practice/questions/:id/deactivate",
  protect,
  authorizeRoles("admin"),
  deactivatePracticeQuestion
);

// ==============================
// ADMIN CODING MODULE
// ==============================

// Create coding problem
router.post(
  "/coding/problems",
  protect,
  authorizeRoles("admin"),
  createCodingProblem
);

// Get all coding problems
router.get(
  "/coding/problems",
  protect,
  authorizeRoles("admin"),
  getAllCodingProblems
);

// Get single coding problem
router.get(
  "/coding/problems/:id",
  protect,
  authorizeRoles("admin"),
  getCodingProblemById
);

// Update coding problem
router.put(
  "/coding/problems/:id",
  protect,
  authorizeRoles("admin"),
  updateCodingProblem
);

// Deactivate coding problem
router.patch(
  "/coding/problems/:id/deactivate",
  protect,
  authorizeRoles("admin"),
  deactivateCodingProblem
);

// ==============================
// ADMIN SQL LAB MODULE
// ==============================

router.post(
  "/sql/problems",
  protect,
  authorizeRoles("admin"),
  createSqlProblem
);


// Get all SQL problems
router.get(
  "/sql/problems",
  protect,
  authorizeRoles("admin"),
  getAllSqlProblems
);

// Get single SQL problem
router.get(
  "/sql/problems/:id",
  protect,
  authorizeRoles("admin"),
  getSqlProblemById
);

// Update SQL problem
router.put(
  "/sql/problems/:id",
  protect,
  authorizeRoles("admin"),
  updateSqlProblem
);

// Deactivate SQL problem
router.patch(
  "/sql/problems/:id/deactivate",
  protect,
  authorizeRoles("admin"),
  deactivateSqlProblem
);

// ==============================
// ADMIN DEBUGGING LAB MODULE
// ==============================

router.post(
  "/debugging/problems",
  protect,
  authorizeRoles("admin"),
  createDebuggingProblem
);


// Get all debugging problems
router.get("/debugging/problems", getAllDebuggingProblems);

// Get debugging problem details
router.get("/debugging/problems/:id", getDebuggingProblemById);

// Update debugging problem
router.put("/debugging/problems/:id", updateDebuggingProblem);

// Deactivate debugging problem
router.patch(
  "/debugging/problems/:id/deactivate",
  deactivateDebuggingProblem
);

// ==============================
// ADMIN MOCK PLACEMENT MODULE
// ==============================

// Create mock test
router.post(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  createMockTest
);

// Get all mock tests
router.get(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  getMockTests
);

// Get mock placement analytics
// IMPORTANT: Keep this above /mock-tests/:id
router.get(
  "/mock-tests/analytics/summary",
  protect,
  authorizeRoles("admin"),
  getMockPlacementAnalytics
);

// Get mock test by ID
router.get(
  "/mock-tests/:id",
  protect,
  authorizeRoles("admin"),
  getMockTestById
);

// Deactivate mock test
router.patch(
  "/mock-tests/:id/deactivate",
  protect,
  authorizeRoles("admin"),
  deactivateMockTest
);

// ==============================
// ADMIN INTERVIEW PREPARATION MODULE
// ==============================

router.post(
  "/interview/questions",
  protect,
  authorizeRoles("admin"),
  createInterviewQuestion
);


// Get all interview questions
router.get("/interview/questions", getAllInterviewQuestions);

// Get interview question by ID
router.get("/interview/questions/:id", getInterviewQuestionById);

// Update interview question
router.put("/interview/questions/:id", updateInterviewQuestion);

// Deactivate interview question
router.patch(
  "/interview/questions/:id/deactivate",
  deactivateInterviewQuestion
);


// ==============================
// ADMIN GROUP DISCUSSION MODULE
// ==============================

router.post(
  "/gd/topics",
  protect,
  authorizeRoles("admin"),
  createGDTopic
);

// ==============================
// ADMIN PLACEMENT OPPORTUNITY MODULE
// ==============================

// Create placement opportunity
router.post(
  "/opportunities",
  protect,
  authorizeRoles("admin"),
  createPlacementOpportunity
);

// Get all placement opportunities
router.get(
  "/opportunities",
  protect,
  authorizeRoles("admin"),
  getAllPlacementOpportunities
);

// Get placement opportunity by ID
router.get(
  "/opportunities/:id",
  protect,
  authorizeRoles("admin"),
  getPlacementOpportunityById
);

// Update placement opportunity
router.put(
  "/opportunities/:id",
  protect,
  authorizeRoles("admin"),
  updatePlacementOpportunity
);

// Close placement opportunity
router.patch(
  "/opportunities/:id/close",
  protect,
  authorizeRoles("admin"),
  closePlacementOpportunity
);

module.exports = router;
