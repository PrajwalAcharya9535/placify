const express = require("express");

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
// MIDDLEWARE
// ==============================

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

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

module.exports = router;