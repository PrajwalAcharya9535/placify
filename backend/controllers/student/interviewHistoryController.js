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

    const interviews =
      sessions.map((session) => ({
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

        overallScore:
          session.overallScore,

        technicalScore:
          session.technicalScore,

        communicationScore:
          session.communicationScore,

        confidenceScore:
          session.confidenceScore,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,

        createdAt:
          session.createdAt,
      }));

    return res.status(200).json({
      success: true,

      message:
        "Interview history fetched successfully",

      count:
        interviews.length,

      interviews,
    });
  } catch (error) {
    console.error(
      "Interview History Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch interview history",

      error:
        error.message,
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
    const userId =
      req.user.id;

    const {
      sessionId,
    } = req.params;

    // ==============================
    // FIND STUDENT INTERVIEW SESSION
    // ==============================

    const session =
      await InterviewSession.findOne({
        _id:
          sessionId,

        user:
          userId,
      }).select(
        "interviewType targetRole targetCompany difficulty status totalQuestions answeredQuestions overallScore technicalScore communicationScore confidenceScore strengths weakAreas recommendations startedAt completedAt createdAt assignedQuestions"
      );

    if (!session) {
      return res.status(404).json({
        success: false,

        message:
          "Interview session not found",
      });
    }

    // ==============================
    // GET ONLY ASSIGNED ANSWERS
    // ==============================

    const answerFilter = {
      user:
        userId,

      session:
        sessionId,
    };

    if (
      Array.isArray(
        session.assignedQuestions
      ) &&
      session.assignedQuestions.length > 0
    ) {
      answerFilter.question = {
        $in:
          session.assignedQuestions,
      };
    }

    const answers =
      await InterviewAnswer.find(
        answerFilter
      )
        .populate({
          path:
            "question",

          select:
            "_id question interviewType questionMode category targetRole targetCompany difficulty maxScore codingProblem sqlProblem",
        })
        .sort({
          answeredAt: 1,
        });

    // ==============================
    // PREPARE SAFE ANSWER RESULTS
    // ==============================

    const answerResults =
      answers.map((answer) => {
        const question =
          answer.question;

        const maxScore =
          Number(
            question?.maxScore
          ) || 10;

        const obtainedScore =
          Number(
            answer.score
          ) || 0;

        const storedPercentage =
          Number(
            answer.scorePercentage
          );

        const percentage =
          Number.isFinite(
            storedPercentage
          )
            ? Math.round(
                storedPercentage
              )
            : maxScore > 0
            ? Math.round(
                (obtainedScore /
                  maxScore) *
                  100
              )
            : 0;

        const questionMode =
          question?.questionMode ||
          (answer.answerType ===
          "Coding"
            ? "Coding"
            : answer.answerType ===
              "SQL"
            ? "SQL"
            : "Theory");

        // ==============================
        // COMMON SAFE RESULT
        // ==============================

        const result = {
          answerId:
            answer._id,

          question: {
            id:
              question?._id,

            question:
              question?.question,

            interviewType:
              question?.interviewType,

            questionMode,

            category:
              question?.category,

            targetRole:
              question?.targetRole,

            targetCompany:
              question?.targetCompany,

            difficulty:
              question?.difficulty,

            maxScore,
          },

          answerType:
            answer.answerType,

          score:
            obtainedScore,

          scorePercentage:
            percentage,

          strengths:
            answer.strengths || [],

          weakAreas:
            answer.weakAreas || [],

          feedback:
            answer.feedback || [],

          answeredAt:
            answer.answeredAt,
        };

        // ==============================
        // THEORY / TEXT / VOICE RESULT
        // ==============================

        if (
          answer.answerType ===
            "Text" ||
          answer.answerType ===
            "Voice"
        ) {
          result.theoryAnswer = {
            answerText:
              answer.answerText || "",

            transcript:
              answer.transcript || "",

            relevanceScore:
              answer.relevanceScore ||
              0,

            completenessScore:
              answer.completenessScore ||
              0,

            communicationScore:
              answer.communicationScore ||
              0,

            matchedKeywords:
              answer.matchedKeywords ||
              [],

            missingKeywords:
              answer.missingKeywords ||
              [],
          };
        }

        // ==============================
        // CODING RESULT
        // ==============================

        if (
          answer.answerType ===
          "Coding"
        ) {
          result.codingAnswer = {
            problemId:
              answer.codingProblem ||
              question?.codingProblem ||
              null,

            language:
              answer.language ||
              null,

            sourceCode:
              answer.sourceCode ||
              "",

            executionStatus:
              answer.executionStatus ||
              "",

            totalTestCases:
              Number(
                answer.totalTestCases
              ) || 0,

            passedTestCases:
              Number(
                answer.passedTestCases
              ) || 0,

            failedTestCases:
              Number(
                answer.failedTestCases
              ) || 0,

            executionTimeMs:
              Number(
                answer.executionTimeMs
              ) || 0,

            errorMessage:
              answer.errorMessage ||
              "",
          };
        }

        // ==============================
        // SQL RESULT
        // ==============================

        if (
          answer.answerType ===
          "SQL"
        ) {
          result.sqlAnswer = {
            problemId:
              answer.sqlProblem ||
              question?.sqlProblem ||
              null,

            submittedQuery:
              answer.submittedQuery ||
              "",

            executionStatus:
              answer.executionStatus ||
              "",

            executionTimeMs:
              Number(
                answer.executionTimeMs
              ) || 0,

            errorMessage:
              answer.errorMessage ||
              "",
          };
        }

        return result;
      });

    // ==============================
    // RESPONSE
    // ==============================

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
            session.strengths ||
            [],

          weakAreas:
            session.weakAreas ||
            [],

          recommendations:
            session.recommendations ||
            [],

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
    console.error(
      "Interview Result Error:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid interview session ID",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch interview result",

      error:
        error.message,
    });
  }
};

module.exports = {
  getInterviewHistory,
  getInterviewResult,
};