const InterviewSession = require(
  "../../models/InterviewSession"
);

const InterviewQuestion = require(
  "../../models/InterviewQuestion"
);

const InterviewAnswer = require(
  "../../models/InterviewAnswer"
);

const {
  evaluateInterviewAnswer,
} = require(
  "../../services/interviewEvaluationService"
);

// ==============================
// START INTERVIEW SESSION
// ==============================
const startInterviewSession = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      interviewType,
      targetRole,
      targetCompany,
      difficulty,
    } = req.body;

    if (!interviewType) {
      return res.status(400).json({
        success: false,
        message:
          "Interview type is required",
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

    const session =
      await InterviewSession.create({
        user: userId,

        interviewType,

        targetRole:
          targetRole || null,

        targetCompany:
          targetCompany || null,

        difficulty:
          difficulty || "Medium",

        status: "Started",

        totalQuestions: 0,

        answeredQuestions: 0,

        overallScore: 0,

        technicalScore: 0,

        communicationScore: 0,

        confidenceScore: 0,

        strengths: [],

        weakAreas: [],

        recommendations: [],

        startedAt: new Date(),

        completedAt: null,
      });

    return res.status(201).json({
      success: true,

      message:
        "Interview session started successfully",

      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        "Failed to start interview session",

      error: error.message,
    });
  }
};

// ==============================
// GET INTERVIEW SESSION QUESTIONS
// ==============================
const getInterviewQuestions = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session =
      await InterviewSession.findOne({
        _id: sessionId,
        user: userId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Interview session not found",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        success: false,
        message:
          "Interview session is already completed",
      });
    }

    const query = {
      interviewType:
        session.interviewType,

      difficulty:
        session.difficulty,

      isActive: true,
    };

    if (session.targetRole) {
      query.$or = [
        {
          targetRole:
            session.targetRole,
        },
        {
          targetRole: {
            $in: [null, ""],
          },
        },
      ];
    }

    let questions =
      await InterviewQuestion.find(query)
        .select(
          "_id question interviewType category targetRole targetCompany difficulty maxScore"
        )
        .sort({
          createdAt: 1,
        });

    if (session.targetCompany) {
      questions = questions.filter(
        (question) =>
          !question.targetCompany ||
          question.targetCompany ===
            session.targetCompany
      );
    }

    const totalQuestions =
      questions.length;

    if (
      session.totalQuestions !==
        totalQuestions ||
      session.status === "Started"
    ) {
      session.totalQuestions =
        totalQuestions;

      session.status =
        totalQuestions > 0
          ? "In Progress"
          : "Started";

      await session.save();
    }

    return res.status(200).json({
      success: true,

      message:
        "Interview questions fetched successfully",

      session: {
        id: session._id,

        interviewType:
          session.interviewType,

        targetRole:
          session.targetRole,

        targetCompany:
          session.targetCompany,

        difficulty:
          session.difficulty,

        status:
          session.status,

        totalQuestions:
          session.totalQuestions,

        answeredQuestions:
          session.answeredQuestions,
      },

      questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch interview questions",

      error: error.message,
    });
  }
};

// ==============================
// SUBMIT INTERVIEW ANSWER
// ==============================
const submitInterviewAnswer = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      sessionId,
      questionId,
    } = req.params;

    const {
      answerText,
      answerType,
      transcript,
    } = req.body;

    if (
      !answerText ||
      !answerText.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Interview answer is required",
      });
    }

    const allowedAnswerTypes = [
      "Text",
      "Voice",
    ];

    if (
      answerType &&
      !allowedAnswerTypes.includes(
        answerType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid answer type",
      });
    }

    const session =
      await InterviewSession.findOne({
        _id: sessionId,
        user: userId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Interview session not found",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        success: false,
        message:
          "Interview session is already completed",
      });
    }

    const question =
      await InterviewQuestion.findOne({
        _id: questionId,
        isActive: true,
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message:
          "Interview question not found",
      });
    }

    if (
      question.interviewType !==
      session.interviewType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question does not belong to this interview type",
      });
    }

    if (
      question.difficulty !==
      session.difficulty
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question difficulty does not match this interview session",
      });
    }

    if (
      session.targetRole &&
      question.targetRole &&
      question.targetRole !==
        session.targetRole
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question does not match the target role",
      });
    }

    if (
      session.targetCompany &&
      question.targetCompany &&
      question.targetCompany !==
        session.targetCompany
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Question does not match the target company",
      });
    }

    const existingAnswer =
      await InterviewAnswer.findOne({
        user: userId,
        session: sessionId,
        question: questionId,
      });

    if (existingAnswer) {
      return res.status(409).json({
        success: false,
        message:
          "This interview question has already been answered",
      });
    }

    const evaluation =
      evaluateInterviewAnswer({
        answerText:
          answerText.trim(),
        question,
      });

    const interviewAnswer =
      await InterviewAnswer.create({
        user: userId,

        session: sessionId,

        question: questionId,

        answerText:
          answerText.trim(),

        answerType:
          answerType || "Text",

        transcript:
          transcript || null,

        score:
          evaluation.score,

        matchedKeywords:
          evaluation.matchedKeywords,

        missingKeywords:
          evaluation.missingKeywords,

        strengths:
          evaluation.strengths,

        weakAreas:
          evaluation.weakAreas,

        feedback:
          evaluation.feedback,

        communicationScore:
          evaluation.communicationScore,

        relevanceScore:
          evaluation.relevanceScore,

        completenessScore:
          evaluation.completenessScore,

        answeredAt:
          new Date(),
      });

    const answeredQuestions =
      await InterviewAnswer.countDocuments({
        user: userId,
        session: sessionId,
      });

    session.answeredQuestions =
      answeredQuestions;

    if (
      session.status === "Started"
    ) {
      session.status =
        "In Progress";
    }

    await session.save();

    return res.status(201).json({
      success: true,

      message:
        "Interview answer submitted successfully",

      result: {
        answerId:
          interviewAnswer._id,

        questionId:
          question._id,

        score:
          evaluation.score,

        maxScore:
          question.maxScore,

        percentage:
          evaluation.finalPercentage,

        relevanceScore:
          evaluation.relevanceScore,

        completenessScore:
          evaluation.completenessScore,

        communicationScore:
          evaluation.communicationScore,

        matchedKeywords:
          evaluation.matchedKeywords,

        missingKeywords:
          evaluation.missingKeywords,

        strengths:
          evaluation.strengths,

        weakAreas:
          evaluation.weakAreas,

        feedback:
          evaluation.feedback,
      },

      session: {
        id:
          session._id,

        status:
          session.status,

        totalQuestions:
          session.totalQuestions,

        answeredQuestions:
          session.answeredQuestions,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This interview question has already been answered",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to submit interview answer",

      error: error.message,
    });
  }
};

// ==============================
// COMPLETE INTERVIEW SESSION
// ==============================
const completeInterviewSession = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session =
      await InterviewSession.findOne({
        _id: sessionId,
        user: userId,
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message:
          "Interview session not found",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        success: false,
        message:
          "Interview session is already completed",
      });
    }

    if (session.totalQuestions === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Interview session has no questions",
      });
    }

    const answers =
      await InterviewAnswer.find({
        user: userId,
        session: sessionId,
      }).populate({
        path: "question",
        select:
          "maxScore interviewType",
      });

    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No interview answers submitted",
      });
    }

    if (
      answers.length <
      session.totalQuestions
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please answer all interview questions before completing the session",
      });
    }

    let totalObtainedScore = 0;
    let totalMaximumScore = 0;
    let totalCommunicationScore = 0;

    const strengths = [];
    const weakAreas = [];
    const recommendations = [];

    for (const answer of answers) {
      totalObtainedScore +=
        Number(answer.score) || 0;

      totalMaximumScore +=
        Number(
          answer.question?.maxScore
        ) || 10;

      totalCommunicationScore +=
        Number(
          answer.communicationScore
        ) || 0;

      if (
        Array.isArray(
          answer.strengths
        )
      ) {
        strengths.push(
          ...answer.strengths
        );
      }

      if (
        Array.isArray(
          answer.weakAreas
        )
      ) {
        weakAreas.push(
          ...answer.weakAreas
        );
      }

      if (
        Array.isArray(
          answer.feedback
        )
      ) {
        recommendations.push(
          ...answer.feedback
        );
      }
    }

    const overallScore =
      totalMaximumScore > 0
        ? Math.round(
            (totalObtainedScore /
              totalMaximumScore) *
              100
          )
        : 0;

    const communicationScore =
      answers.length > 0
        ? Math.round(
            totalCommunicationScore /
              answers.length
          )
        : 0;

    const technicalScore =
      session.interviewType ===
      "Technical"
        ? overallScore
        : 0;

    // Voice-based confidence analysis
    // will be implemented later.
    const confidenceScore = 0;

    const uniqueStrengths = [
      ...new Set(strengths),
    ];

    const uniqueWeakAreas = [
      ...new Set(weakAreas),
    ];

    let uniqueRecommendations = [
      ...new Set(recommendations),
    ];

    if (overallScore >= 80) {
      uniqueRecommendations.push(
        "Maintain this level of preparation and practice more company-specific interview questions."
      );
    } else if (
      overallScore >= 60
    ) {
      uniqueRecommendations.push(
        "Improve answer depth and revise weaker interview concepts."
      );
    } else {
      uniqueRecommendations.push(
        "Strengthen core concepts and practice structured interview answers regularly."
      );
    }

    if (
      communicationScore < 60
    ) {
      uniqueRecommendations.push(
        "Practice clear, structured and concise communication."
      );
    }

    uniqueRecommendations = [
      ...new Set(
        uniqueRecommendations
      ),
    ];

    session.answeredQuestions =
      answers.length;

    session.overallScore =
      overallScore;

    session.technicalScore =
      technicalScore;

    session.communicationScore =
      communicationScore;

    session.confidenceScore =
      confidenceScore;

    session.strengths =
      uniqueStrengths;

    session.weakAreas =
      uniqueWeakAreas;

    session.recommendations =
      uniqueRecommendations;

    session.status = "Completed";

    session.completedAt =
      new Date();

    await session.save();

    return res.status(200).json({
      success: true,

      message:
        "Interview session completed successfully",

      result: {
        sessionId:
          session._id,

        interviewType:
          session.interviewType,

        targetRole:
          session.targetRole,

        targetCompany:
          session.targetCompany,

        difficulty:
          session.difficulty,

        totalQuestions:
          session.totalQuestions,

        answeredQuestions:
          session.answeredQuestions,

        overallScore:
          session.overallScore,

        technicalScore:
          session.technicalScore,

        communicationScore:
          session.communicationScore,

        confidenceScore:
          session.confidenceScore,

        strengths:
          session.strengths,

        weakAreas:
          session.weakAreas,

        recommendations:
          session.recommendations,

        status:
          session.status,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        "Failed to complete interview session",

      error: error.message,
    });
  }
};

module.exports = {
  startInterviewSession,
  getInterviewQuestions,
  submitInterviewAnswer,
  completeInterviewSession,
};