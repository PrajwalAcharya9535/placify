const InterviewSession = require(
  "../../models/InterviewSession"
);

const InterviewQuestion = require(
  "../../models/InterviewQuestion"
);

const InterviewAnswer = require(
  "../../models/InterviewAnswer"
);

const CodingProblem = require(
  "../../models/CodingProblem"
);

const SqlProblem = require(
  "../../models/SqlProblem"
);

const {
  executeCode,
} = require(
  "../../services/codeExecutionService"
);

const {
  executeSql,
} = require(
  "../../services/sqlExecutionService"
);

// ==============================
// NORMALIZE PROGRAM OUTPUT
// ==============================
const normalizeOutput = (output) => {
  return String(output || "")
    .replace(/\r\n/g, "\n")
    .trim();
};

// ==============================
// NORMALIZE SQL RESULT
// ==============================
const normalizeSqlResult = (result) => {
  if (!Array.isArray(result)) {
    return [];
  }

  return result.map((row) => {
    const normalizedRow = {};

    Object.keys(row)
      .sort()
      .forEach((key) => {
        normalizedRow[key] = row[key];
      });

    return normalizedRow;
  });
};

// ==============================
// COMPARE SQL RESULTS
// ==============================
const compareSqlResults = (
  actualResult,
  expectedResult
) => {
  const actual =
    normalizeSqlResult(actualResult);

  const expected =
    normalizeSqlResult(expectedResult);

  return (
    JSON.stringify(actual) ===
    JSON.stringify(expected)
  );
};

// ==============================
// GET AND VALIDATE SESSION
// ==============================
const getValidatedSession = async ({
  userId,
  sessionId,
  questionId,
  expectedMode,
}) => {
  const session =
    await InterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

  if (!session) {
    return {
      error: {
        status: 404,
        message:
          "Interview session not found",
      },
    };
  }

  if (session.status === "Completed") {
    return {
      error: {
        status: 400,
        message:
          "Interview session is already completed",
      },
    };
  }

  if (
    !session.assignedQuestions ||
    session.assignedQuestions.length === 0
  ) {
    return {
      error: {
        status: 400,
        message:
          "Interview questions have not been assigned yet",
      },
    };
  }

  const isAssigned =
    session.assignedQuestions.some(
      (assignedQuestionId) =>
        assignedQuestionId.toString() ===
        questionId.toString()
    );

  if (!isAssigned) {
    return {
      error: {
        status: 400,
        message:
          "This question is not assigned to this interview session",
      },
    };
  }

  const question =
    await InterviewQuestion.findOne({
      _id: questionId,
      isActive: true,
    });

  if (!question) {
    return {
      error: {
        status: 404,
        message:
          "Interview question not found",
      },
    };
  }

  if (
    question.interviewType !==
    session.interviewType
  ) {
    return {
      error: {
        status: 400,
        message:
          "Question does not belong to this interview type",
      },
    };
  }

  if (
    question.difficulty !==
    session.difficulty
  ) {
    return {
      error: {
        status: 400,
        message:
          "Question difficulty does not match this interview session",
      },
    };
  }

  if (
    session.targetRole &&
    question.targetRole &&
    question.targetRole !==
      session.targetRole
  ) {
    return {
      error: {
        status: 400,
        message:
          "Question does not match the target role",
      },
    };
  }

  if (
    session.targetCompany &&
    question.targetCompany &&
    question.targetCompany !==
      session.targetCompany
  ) {
    return {
      error: {
        status: 400,
        message:
          "Question does not match the target company",
      },
    };
  }

  if (
    question.questionMode !==
    expectedMode
  ) {
    return {
      error: {
        status: 400,
        message: `This is not a ${expectedMode} interview question`,
      },
    };
  }

  const existingAnswer =
    await InterviewAnswer.findOne({
      user: userId,
      session: sessionId,
      question: questionId,
    });

  if (existingAnswer) {
    return {
      error: {
        status: 409,
        message:
          "This interview question has already been answered",
      },
    };
  }

  return {
    session,
    question,
  };
};

// ==============================
// UPDATE SESSION ANSWER COUNT
// ==============================
const updateSessionAnswerCount = async (
  session,
  userId
) => {
  const answeredQuestions =
    await InterviewAnswer.countDocuments({
      user: userId,
      session: session._id,
      question: {
        $in: session.assignedQuestions,
      },
    });

  session.answeredQuestions =
    answeredQuestions;

  if (session.status === "Started") {
    session.status = "In Progress";
  }

  await session.save();
};

// ==============================
// SUBMIT INTERVIEW CODING ANSWER
// ==============================
const submitInterviewCodingAnswer =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const {
        sessionId,
        questionId,
      } = req.params;

      const {
        language,
        sourceCode,
      } = req.body;

      if (
        !language ||
        !sourceCode ||
        !sourceCode.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Programming language and source code are required",
        });
      }

      const validation =
        await getValidatedSession({
          userId,
          sessionId,
          questionId,
          expectedMode: "Coding",
        });

      if (validation.error) {
        return res
          .status(
            validation.error.status
          )
          .json({
            success: false,
            message:
              validation.error.message,
          });
      }

      const {
        session,
        question,
      } = validation;

      if (!question.codingProblem) {
        return res.status(400).json({
          success: false,
          message:
            "No coding problem is linked to this interview question",
        });
      }

      const problem =
        await CodingProblem.findOne({
          _id: question.codingProblem,
          isActive: true,
        });

      if (!problem) {
        return res.status(404).json({
          success: false,
          message:
            "Coding problem not found",
        });
      }

      if (
        !problem.supportedLanguages.includes(
          language
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected language is not supported for this problem",
        });
      }

      if (
        !problem.testCases ||
        problem.testCases.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No test cases are configured for this coding problem",
        });
      }

      let passedTestCases = 0;
      let failedTestCases = 0;
      let totalExecutionTimeMs = 0;

      let finalStatus = "Accepted";
      let finalErrorMessage = "";

      const publicResults = [];

      for (
        const testCase of
        problem.testCases
      ) {
        const executionResult =
          await executeCode({
            language,
            sourceCode,
            input:
              testCase.input || "",
            timeLimitSeconds:
              problem.timeLimitSeconds ||
              5,
          });

        totalExecutionTimeMs +=
          executionResult.executionTimeMs ||
          0;

        if (
          executionResult.status !==
          "Accepted"
        ) {
          failedTestCases++;

          if (
            finalStatus === "Accepted"
          ) {
            finalStatus =
              executionResult.status;

            finalErrorMessage =
              executionResult.errorMessage ||
              "";
          }

          if (!testCase.isHidden) {
            publicResults.push({
              input:
                testCase.input,

              expectedOutput:
                testCase.expectedOutput,

              actualOutput:
                executionResult.output ||
                "",

              passed: false,

              status:
                executionResult.status,

              errorMessage:
                executionResult.errorMessage ||
                "",
            });
          }

          continue;
        }

        const actualOutput =
          normalizeOutput(
            executionResult.output
          );

        const expectedOutput =
          normalizeOutput(
            testCase.expectedOutput
          );

        const passed =
          actualOutput ===
          expectedOutput;

        if (passed) {
          passedTestCases++;
        } else {
          failedTestCases++;

          if (
            finalStatus === "Accepted"
          ) {
            finalStatus =
              "Wrong Answer";
          }
        }

        // Never expose hidden test cases.
        if (!testCase.isHidden) {
          publicResults.push({
            input:
              testCase.input,

            expectedOutput:
              testCase.expectedOutput,

            actualOutput:
              executionResult.output ||
              "",

            passed,

            status: passed
              ? "Accepted"
              : "Wrong Answer",

            errorMessage: "",
          });
        }
      }

      const totalTestCases =
        problem.testCases.length;

      const scorePercentage =
        totalTestCases > 0
          ? Math.round(
              (passedTestCases /
                totalTestCases) *
                100
            )
          : 0;

      const marksAwarded =
        totalTestCases > 0
          ? Math.round(
              (question.maxScore *
                passedTestCases) /
                totalTestCases
            )
          : 0;

      if (
        passedTestCases ===
        totalTestCases
      ) {
        finalStatus = "Accepted";
        finalErrorMessage = "";
      } else if (
        finalStatus === "Accepted"
      ) {
        finalStatus =
          "Wrong Answer";
      }

      const strengths = [];
      const weakAreas = [];
      const feedback = [];

      if (scorePercentage === 100) {
        strengths.push(
          "Passed all coding test cases"
        );

        feedback.push(
          "The coding solution passed all configured test cases."
        );
      } else {
        weakAreas.push(
          "Coding solution did not pass all test cases"
        );

        feedback.push(
          `Passed ${passedTestCases} of ${totalTestCases} coding test cases.`
        );
      }

      if (finalErrorMessage) {
        feedback.push(
          finalErrorMessage
        );
      }

      const interviewAnswer =
        await InterviewAnswer.create({
          user: userId,

          session: session._id,

          question: question._id,

          answerType: "Coding",

          answerText: "",

          language,

          sourceCode,

          codingProblem:
            problem._id,

          totalTestCases,

          passedTestCases,

          failedTestCases,

          executionStatus:
            finalStatus,

          executionTimeMs:
            totalExecutionTimeMs,

          errorMessage:
            finalErrorMessage,

          score:
            marksAwarded,

          scorePercentage,

          strengths,

          weakAreas,

          feedback,

          communicationScore: 0,

          relevanceScore:
            scorePercentage,

          completenessScore:
            scorePercentage,

          answeredAt:
            new Date(),
        });

      await updateSessionAnswerCount(
        session,
        userId
      );

      return res.status(201).json({
        success: true,

        message:
          "Interview coding answer evaluated successfully",

        result: {
          answerId:
            interviewAnswer._id,

          questionId:
            question._id,

          problemId:
            problem._id,

          title:
            problem.title,

          language,

          status:
            finalStatus,

          totalTestCases,

          passedTestCases,

          failedTestCases,

          score:
            marksAwarded,

          maxScore:
            question.maxScore,

          scorePercentage,

          executionTimeMs:
            totalExecutionTimeMs,

          errorMessage:
            finalErrorMessage,

          testResults:
            publicResults,
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
          "Failed to submit interview coding answer",
        error: error.message,
      });
    }
  };

// ==============================
// SUBMIT INTERVIEW SQL ANSWER
// ==============================
const submitInterviewSqlAnswer =
  async (req, res) => {
    try {
      const userId = req.user.id;

      const {
        sessionId,
        questionId,
      } = req.params;

      const {
        submittedQuery,
      } = req.body;

      if (
        !submittedQuery ||
        !submittedQuery.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "SQL query is required",
        });
      }

      const validation =
        await getValidatedSession({
          userId,
          sessionId,
          questionId,
          expectedMode: "SQL",
        });

      if (validation.error) {
        return res
          .status(
            validation.error.status
          )
          .json({
            success: false,
            message:
              validation.error.message,
          });
      }

      const {
        session,
        question,
      } = validation;

      if (!question.sqlProblem) {
        return res.status(400).json({
          success: false,
          message:
            "No SQL problem is linked to this interview question",
        });
      }

      const problem =
        await SqlProblem.findOne({
          _id: question.sqlProblem,
          isActive: true,
        });

      if (!problem) {
        return res.status(404).json({
          success: false,
          message:
            "SQL problem not found",
        });
      }

      const executionResult =
        await executeSql({
          tables: problem.tables,
          query: submittedQuery,
        });

      let status =
        executionResult.status;

      let scorePercentage = 0;
      let marksAwarded = 0;

      if (executionResult.success) {
        const isCorrect =
          compareSqlResults(
            executionResult.result,
            problem.expectedResult
          );

        status = isCorrect
          ? "Correct"
          : "Wrong Answer";

        scorePercentage =
          isCorrect ? 100 : 0;

        marksAwarded =
          isCorrect
            ? question.maxScore
            : 0;
      }

      const strengths = [];
      const weakAreas = [];
      const feedback = [];

      if (scorePercentage === 100) {
        strengths.push(
          "SQL query produced the expected result"
        );

        feedback.push(
          "The SQL query returned the correct result."
        );
      } else {
        weakAreas.push(
          "SQL query did not produce the expected result"
        );

        if (
          executionResult.errorMessage
        ) {
          feedback.push(
            executionResult.errorMessage
          );
        } else {
          feedback.push(
            "Review the SQL query logic and expected output."
          );
        }
      }

      const interviewAnswer =
        await InterviewAnswer.create({
          user: userId,

          session: session._id,

          question: question._id,

          answerType: "SQL",

          answerText: "",

          submittedQuery,

          sqlProblem:
            problem._id,

          executionStatus:
            status,

          executionTimeMs:
            executionResult.executionTimeMs ||
            0,

          errorMessage:
            executionResult.errorMessage ||
            "",

          score:
            marksAwarded,

          scorePercentage,

          strengths,

          weakAreas,

          feedback,

          communicationScore: 0,

          relevanceScore:
            scorePercentage,

          completenessScore:
            scorePercentage,

          answeredAt:
            new Date(),
        });

      await updateSessionAnswerCount(
        session,
        userId
      );

      return res.status(201).json({
        success: true,

        message:
          "Interview SQL answer evaluated successfully",

        result: {
          answerId:
            interviewAnswer._id,

          questionId:
            question._id,

          problemId:
            problem._id,

          title:
            problem.title,

          status,

          score:
            marksAwarded,

          maxScore:
            question.maxScore,

          scorePercentage,

          executionTimeMs:
            executionResult.executionTimeMs ||
            0,

          errorMessage:
            executionResult.errorMessage ||
            "",

          result:
            executionResult.success
              ? executionResult.result
              : [],
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
          "Failed to submit interview SQL answer",
        error: error.message,
      });
    }
  };

module.exports = {
  submitInterviewCodingAnswer,
  submitInterviewSqlAnswer,
};