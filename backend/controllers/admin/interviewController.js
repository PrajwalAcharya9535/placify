const InterviewQuestion = require(
  "../../models/InterviewQuestion"
);

// ==============================
// CREATE INTERVIEW QUESTION
// ==============================
const createInterviewQuestion = async (
  req,
  res
) => {
  try {
    const {
      question,
      interviewType,
      category,
      targetRole,
      targetCompany,
      difficulty,
      expectedKeywords,
      sampleAnswer,
      evaluationPoints,
      maxScore,
    } = req.body;

    if (!question || !interviewType) {
      return res.status(400).json({
        success: false,
        message:
          "Question and interview type are required",
      });
    }

    const allowedInterviewTypes = [
      "Technical",
      "HR",
      "Behavioral",
      "Communication",
    ];

    if (
      !allowedInterviewTypes.includes(
        interviewType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid interview type",
      });
    }

    const allowedDifficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

    if (
      difficulty &&
      !allowedDifficulties.includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid difficulty level",
      });
    }

    const interviewQuestion =
      await InterviewQuestion.create({
        question,
        interviewType,
        category: category || null,
        targetRole: targetRole || null,
        targetCompany:
          targetCompany || null,
        difficulty:
          difficulty || "Medium",

        expectedKeywords:
          Array.isArray(expectedKeywords)
            ? expectedKeywords
            : [],

        sampleAnswer:
          sampleAnswer || null,

        evaluationPoints:
          Array.isArray(evaluationPoints)
            ? evaluationPoints
            : [],

        maxScore:
          maxScore || 10,

        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message:
        "Interview question created successfully",
      question: interviewQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to create interview question",
      error: error.message,
    });
  }
};

module.exports = {
  createInterviewQuestion,
};