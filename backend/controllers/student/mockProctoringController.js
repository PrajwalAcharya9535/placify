
const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");

// ==============================
// PROCTORING CONFIGURATION
// ==============================
const MAX_WARNINGS = 3;

// ==============================
// LOG PROCTORING VIOLATION
// ==============================
const logProctoringViolation = async (req, res) => {
  try {
    const {
      type,
      message = "",
      roundName = "",
    } = req.body;

    const allowedTypes = [
      "Tab Switch",
      "Fullscreen Exit",
      "Camera Disabled",
      "Face Not Detected",
      "Multiple Faces",
      "Copy Attempt",
      "Paste Attempt",
      "Suspicious Activity",
      "Other",
    ];

    if (!type) {
      return res.status(400).json({
        message: "Violation type is required",
      });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid proctoring violation type",
      });
    }

    const mockAttempt = await MockAttempt.findOne({
      _id: req.params.attemptId,
      user: req.user.id,
      status: "In Progress",
    });

    if (!mockAttempt) {
      return res.status(404).json({
        message: "Active mock placement attempt not found",
      });
    }

    const mockTest = await MockTest.findById(
      mockAttempt.mockTest
    );

    if (!mockTest) {
      return res.status(404).json({
        message: "Mock placement test not found",
      });
    }

    if (!mockTest.proctoringEnabled) {
      return res.status(400).json({
        message:
          "Proctoring is not enabled for this mock test",
      });
    }

    // ==============================
    // RECORD VIOLATION
    // ==============================
    mockAttempt.proctoringViolations.push({
      type,
      message,
      roundName,
      occurredAt: new Date(),
    });

    mockAttempt.violationCount =
      mockAttempt.proctoringViolations.length;

    const warningCount = mockAttempt.violationCount;

    const remainingWarnings = Math.max(
      0,
      MAX_WARNINGS - warningCount
    );

    let autoSubmitted = false;

    // ==============================
    // EXISTING TAB SWITCH RULE
    // ==============================
    const tabSwitchCount =
      mockAttempt.proctoringViolations.filter(
        (violation) =>
          violation.type === "Tab Switch"
      ).length;

    const tabSwitchLimitExceeded =
      type === "Tab Switch" &&
      mockTest.autoSubmitOnViolation &&
      tabSwitchCount > mockTest.maxTabSwitches;

    // ==============================
    // THREE WARNING RULE
    // ==============================
    const warningLimitReached =
      warningCount >= MAX_WARNINGS;

    if (
      tabSwitchLimitExceeded ||
      warningLimitReached
    ) {
      const now = new Date();

      mockAttempt.status = "Auto Submitted";
      mockAttempt.result = "Failed";
      mockAttempt.completedAt = now;
      mockAttempt.submittedAt = now;

      autoSubmitted = true;
    }

    await mockAttempt.save();

    return res.status(200).json({
      message: autoSubmitted
        ? "Assessment ended due to proctoring violations."
        : `Proctoring warning ${warningCount} of ${MAX_WARNINGS}.`,

      violation: {
        type,
        message,
        roundName,
      },

      violationCount: mockAttempt.violationCount,
      warningCount,
      maxWarnings: MAX_WARNINGS,
      remainingWarnings,

      status: mockAttempt.status,
      result: mockAttempt.result,
      autoSubmitted,
    });
  } catch (error) {
    console.error(
      "Proctoring violation error:",
      error
    );

    return res.status(500).json({
      message: "Failed to log proctoring violation",
      error: error.message,
    });
  }
};

module.exports = {
  logProctoringViolation,
};
