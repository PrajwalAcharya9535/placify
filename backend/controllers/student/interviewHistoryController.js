const InterviewSession = require(
  "../../models/InterviewSession"
);

const InterviewAnswer = require(
  "../../models/InterviewAnswer"
);

// ==============================
// GET INTERVIEW HISTORY
// ==============================
const getInterviewHistory = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const sessions =
      await InterviewSession.find({
        user: userId,
      })
        .select(
          "interviewType targetRole targetCompany difficulty status totalQuestions answeredQuestions overallScore technicalScore communicationScore confidenceScore startedAt completedAt createdAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      message:
        "Interview history fetched successfully",

      count: sessions.length,

      interviews: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch interview history",

      error: error.message,
    });
  }
};

// ==============================
// GET SINGLE INTERVIEW RESULT
// ==============================
const getInterviewResult = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // ------------------------------
    // FIND STUDENT INTERVIEW SESSION
    // ------------------------------
    const session =
      await InterviewSession.findOne({
        _id: sessionId,
        user: userId,
      }).select(
        "interviewType targetRole targetCompany difficulty status totalQuestions answeredQuestions overallScore technicalScore communicationScore confidenceScore strengths weakAreas recommendations startedAt completedAt createdAt"
      );

    if (!session) {
      return res.status(404).json({
        success: false,

        message:
          "Interview session not found",
      });
    }

    // ------------------------------
    // GET INTERVIEW ANSWERS
    // ------------------------------
    const answers =
      await InterviewAnswer.find({
        user: userId,
        session: sessionId,
      })
        .populate({
          path: "question",
          select:
            "_id question interviewType category targetRole targetCompany difficulty maxScore",
        })
        .sort({
          answeredAt: 1,
        });

    // ------------------------------
    // PREPARE SAFE ANSWER RESULTS
    // ------------------------------
    const answerResults =
      answers.map((answer) => {
        const maxScore =
          Number(
            answer.question?.maxScore
          ) || 10;

        const obtainedScore =
          Number(answer.score) || 0;

        const percentage =
          maxScore > 0
            ? Math.round(
                (obtainedScore /
                  maxScore) *
                  100
              )
            : 0;

        return {
          answerId:
            answer._id,

          question: {
            id:
              answer.question?._id,

            question:
              answer.question?.question,

            interviewType:
              answer.question
                ?.interviewType,

            category:
              answer.question?.category,

            difficulty:
              answer.question
                ?.difficulty,

            maxScore,
          },

          answerText:
            answer.answerText,

          answerType:
            answer.answerType,

          transcript:
            answer.transcript,

          score:
            obtainedScore,

          percentage,

          relevanceScore:
            answer.relevanceScore,

          completenessScore:
            answer.completenessScore,

          communicationScore:
            answer.communicationScore,

          matchedKeywords:
            answer.matchedKeywords,

          missingKeywords:
            answer.missingKeywords,

          strengths:
            answer.strengths,

          weakAreas:
            answer.weakAreas,

          feedback:
            answer.feedback,

          answeredAt:
            answer.answeredAt,
        };
      });

    // ------------------------------
    // RESPONSE
    // ------------------------------
    return res.status(200).json({
      success: true,

      message:
        "Interview result fetched successfully",

      result: {
        session: {
          id:
            session._id,

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

          startedAt:
            session.startedAt,

          completedAt:
            session.completedAt,

          createdAt:
            session.createdAt,
        },

        answersCount:
          answerResults.length,

        answers:
          answerResults,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch interview result",

      error: error.message,
    });
  }
};

module.exports = {
  getInterviewHistory,
  getInterviewResult,
};