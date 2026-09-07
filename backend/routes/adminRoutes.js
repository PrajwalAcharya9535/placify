const express = require("express");

const {
  createLearningTopic,
} = require("../controllers/admin/learningController");

const {
  createPracticeQuestion,
} = require("../controllers/admin/practiceController");

const {
  createCodingProblem,
} = require("../controllers/admin/codingController");

const {
  createSqlProblem,
} = require("../controllers/admin/sqlController");

const {
  createDebuggingProblem,
} = require("../controllers/admin/debuggingController");

const {
  createMockTest,
  getMockTests,
  getMockTestById,
} = require("../controllers/admin/mockTestController");

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==============================
// ADMIN LEARNING MODULE
// ==============================

// Create Learning Topic
router.post(
  "/learning",
  protect,
  authorizeRoles("admin"),
  createLearningTopic
);

// ==============================
// ADMIN PRACTICE MODULE
// ==============================

// Create Practice Question
router.post(
  "/practice/questions",
  protect,
  authorizeRoles("admin"),
  createPracticeQuestion
);

// ==============================
// ADMIN CODING MODULE
// ==============================

// Create Coding Problem
router.post(
  "/coding/problems",
  protect,
  authorizeRoles("admin"),
  createCodingProblem
);

// ==============================
// ADMIN SQL LAB MODULE
// ==============================

// Create SQL Problem
router.post(
  "/sql/problems",
  protect,
  authorizeRoles("admin"),
  createSqlProblem
);

// ==============================
// ADMIN DEBUGGING LAB MODULE
// ==============================

// Create Debugging Problem
router.post(
  "/debugging/problems",
  protect,
  authorizeRoles("admin"),
  createDebuggingProblem
);

// ==============================
// ADMIN MOCK PLACEMENT MODULE
// ==============================

// Create Mock Placement Test
router.post(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  createMockTest
);

// Get All Mock Placement Tests
router.get(
  "/mock-tests",
  protect,
  authorizeRoles("admin"),
  getMockTests
);

// Get Mock Placement Test By ID
router.get(
  "/mock-tests/:id",
  protect,
  authorizeRoles("admin"),
  getMockTestById
);

module.exports = router;