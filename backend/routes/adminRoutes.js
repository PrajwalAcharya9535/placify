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
} = require("../controllers/admin/learningController");

// ==============================
// ADMIN PRACTICE CONTROLLER
// ==============================

const {
  createPracticeQuestion,
} = require("../controllers/admin/practiceController");

// ==============================
// ADMIN CODING CONTROLLER
// ==============================

const {
  createCodingProblem,
} = require("../controllers/admin/codingController");

// ==============================
// ADMIN SQL CONTROLLER
// ==============================

const {
  createSqlProblem,
} = require("../controllers/admin/sqlController");

// ==============================
// ADMIN DEBUGGING CONTROLLER
// ==============================

const {
  createDebuggingProblem,
} = require("../controllers/admin/debuggingController");

// ==============================
// ADMIN MOCK PLACEMENT CONTROLLER
// ==============================

const {
  createMockTest,
  getMockTests,
  getMockTestById,
} = require("../controllers/admin/mockTestController");

// ==============================
// ADMIN INTERVIEW CONTROLLER
// ==============================

const {
  createInterviewQuestion,
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

router.post(
  "/learning",
  protect,
  authorizeRoles("admin"),
  createLearningTopic
);

// ==============================
// ADMIN PRACTICE MODULE
// ==============================

router.post(
  "/practice/questions",
  protect,
  authorizeRoles("admin"),
  createPracticeQuestion
);

// ==============================
// ADMIN CODING MODULE
// ==============================

router.post(
  "/coding/problems",
  protect,
  authorizeRoles("admin"),
  createCodingProblem
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

// ==============================
// ADMIN DEBUGGING LAB MODULE
// ==============================

router.post(
  "/debugging/problems",
  protect,
  authorizeRoles("admin"),
  createDebuggingProblem
);

// ==============================
// ADMIN MOCK PLACEMENT MODULE
// ==============================

router.post(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  createMockTest
);

router.get(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  getMockTests
);

router.get(
  "/mock-tests/:id",
  protect,
  authorizeRoles("admin"),
  getMockTestById
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