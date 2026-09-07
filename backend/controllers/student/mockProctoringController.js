const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");

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
        message:
          "Active mock placement attempt not found",
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

    mockAttempt.proctoringViolations.push({
      type,
      message,
      roundName,
      occurredAt: new Date(),
    });

    mockAttempt.violationCount += 1;

    let autoSubmitted = false;

    // ==============================
    // TAB SWITCH LIMIT CHECK
    // ==============================
    if (type === "Tab Switch") {
      const tabSwitchCount =
        mockAttempt.proctoringViolations.filter(
          (violation) =>
            violation.type === "Tab Switch"
        ).length;

      if (
        mockTest.autoSubmitOnViolation &&
        tabSwitchCount >
          mockTest.maxTabSwitches
      ) {
        const now = new Date();

        mockAttempt.status =
          "Auto Submitted";

        mockAttempt.result = "Failed";

        mockAttempt.completedAt = now;
        mockAttempt.submittedAt = now;

        autoSubmitted = true;
      }
    }

    await mockAttempt.save();

    res.status(200).json({
      message: autoSubmitted
        ? "Mock placement test auto submitted due to proctoring violations"
        : "Proctoring violation logged successfully",

      violation: {
        type,
        message,
        roundName,
      },

      violationCount:
        mockAttempt.violationCount,

      status: mockAttempt.status,

      result: mockAttempt.result,

      autoSubmitted,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to log proctoring violation",
      error: error.message,
    });
  }
};

module.exports = {
  logProctoringViolation,
};