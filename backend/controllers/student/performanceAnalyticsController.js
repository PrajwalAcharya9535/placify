const PracticeAttempt = require("../../models/PracticeAttempt");
const CodingAttempt = require("../../models/CodingAttempt");
const SqlAttempt = require("../../models/SqlAttempt");
const DebuggingAttempt = require("../../models/DebuggingAttempt");
const MockAttempt = require("../../models/MockAttempt");
const InterviewSession = require("../../models/InterviewSession");
const GDSession = require("../../models/GDSession");
const Readiness = require("../../models/Readiness");
const PlacementApplication = require("../../models/PlacementApplication");


// ==============================
// HELPER
// SAFE AVERAGE
// ==============================

const calculateAverage = (values = []) => {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  return Math.round(total / values.length);
};


// ==============================
// HELPER
// SAFE DATE
// ==============================

const getSafeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};


// ============================================================
// GET OVERALL PERFORMANCE ANALYTICS
// MODULE 10
// ============================================================

const getOverallPerformanceAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // ==============================
    // LOAD PERFORMANCE DATA
    // ==============================

    const [
      practiceAttempts,
      codingAttempts,
      sqlAttempts,
      debuggingAttempts,
      mockAttempts,
      interviewSessions,
      gdSessions,
      readiness,
      placementApplications,
    ] = await Promise.all([
      PracticeAttempt.find({
        user: userId,
      }).lean(),

      // Exclude Mock Placement attempts from normal Coding analytics.
      CodingAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      // Exclude Mock Placement attempts from normal SQL analytics.
      SqlAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      DebuggingAttempt.find({
        user: userId,
      }).lean(),

      MockAttempt.find({
        user: userId,
        status: {
          $in: [
            "Completed",
            "Auto Submitted",
            "Disqualified",
          ],
        },
      }).lean(),

      InterviewSession.find({
        user: userId,
        status: "Completed",
      }).lean(),

      GDSession.find({
        status: "Completed",
        "participants.user": userId,
      }).lean(),

      Readiness.findOne({
        user: userId,
      }).lean(),

      PlacementApplication.find({
        student: userId,
      }).lean(),
    ]);


    // ==============================
    // PRACTICE ANALYTICS
    // ==============================

    const practiceCorrect = practiceAttempts.filter(
      (attempt) => attempt.isCorrect
    ).length;

    const practiceAccuracy =
      practiceAttempts.length > 0
        ? Math.round(
            (practiceCorrect / practiceAttempts.length) * 100
          )
        : 0;


    // ==============================
    // CODING ANALYTICS
    // ==============================

    const codingAccepted = codingAttempts.filter(
      (attempt) => attempt.status === "Accepted"
    ).length;

    const codingAverageScore = calculateAverage(
      codingAttempts.map(
        (attempt) => attempt.scorePercentage || 0
      )
    );


    // ==============================
    // SQL ANALYTICS
    // ==============================

    const sqlCorrect = sqlAttempts.filter(
      (attempt) => attempt.status === "Correct"
    ).length;

    const sqlAverageScore = calculateAverage(
      sqlAttempts.map(
        (attempt) => attempt.scorePercentage || 0
      )
    );


    // ==============================
    // DEBUGGING ANALYTICS
    // ==============================

    const debuggingAccepted = debuggingAttempts.filter(
      (attempt) => attempt.status === "Accepted"
    ).length;

    const debuggingAverageScore = calculateAverage(
      debuggingAttempts.map(
        (attempt) => attempt.scorePercentage || 0
      )
    );


    // ==============================
    // MOCK PLACEMENT ANALYTICS
    // ==============================

    const mockPassed = mockAttempts.filter(
      (attempt) => attempt.result === "Passed"
    ).length;

    const mockFailed = mockAttempts.filter(
      (attempt) =>
        attempt.result === "Failed" ||
        attempt.result === "Disqualified"
    ).length;

    const mockAverageScore = calculateAverage(
      mockAttempts.map(
        (attempt) => attempt.overallPercentage || 0
      )
    );


    // ==============================
    // INTERVIEW ANALYTICS
    // ==============================

    const interviewAverageScore = calculateAverage(
      interviewSessions.map(
        (session) => session.overallScore || 0
      )
    );

    const interviewTechnicalScore = calculateAverage(
      interviewSessions.map(
        (session) => session.technicalScore || 0
      )
    );

    const interviewCommunicationScore = calculateAverage(
      interviewSessions.map(
        (session) => session.communicationScore || 0
      )
    );

    const interviewConfidenceScore = calculateAverage(
      interviewSessions.map(
        (session) => session.confidenceScore || 0
      )
    );


    // ==============================
    // GD ANALYTICS
    // ==============================

    const gdParticipantResults = [];

    gdSessions.forEach((session) => {
      const participant = session.participants.find(
        (item) =>
          item.user &&
          item.user.toString() === userId.toString()
      );

      if (participant) {
        gdParticipantResults.push(participant);
      }
    });

    const gdAverageScore = calculateAverage(
      gdParticipantResults.map(
        (participant) => participant.overallScore || 0
      )
    );

    const gdCommunicationScore = calculateAverage(
      gdParticipantResults.map(
        (participant) =>
          participant.communicationScore || 0
      )
    );

    const gdParticipationScore = calculateAverage(
      gdParticipantResults.map(
        (participant) =>
          participant.participationScore || 0
      )
    );


    // ==============================
    // PLACEMENT TRACKER ANALYTICS
    // ==============================

    const activeApplications =
      placementApplications.filter(
        (application) => application.isActive
      ).length;

    const placedApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage === "Placed"
      ).length;

    const rejectedApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage === "Rejected"
      ).length;

    const offerApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage === "Offer" ||
          application.currentStage === "Placed"
      ).length;


    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      message:
        "Overall performance analytics fetched successfully",

      practice: {
        totalAttempts: practiceAttempts.length,
        correctAttempts: practiceCorrect,
        incorrectAttempts:
          practiceAttempts.length - practiceCorrect,
        accuracy: practiceAccuracy,
      },

      coding: {
        totalAttempts: codingAttempts.length,
        acceptedAttempts: codingAccepted,
        unsuccessfulAttempts:
          codingAttempts.length - codingAccepted,
        averageScore: codingAverageScore,
      },

      sql: {
        totalAttempts: sqlAttempts.length,
        correctAttempts: sqlCorrect,
        incorrectAttempts:
          sqlAttempts.length - sqlCorrect,
        averageScore: sqlAverageScore,
      },

      debugging: {
        totalAttempts: debuggingAttempts.length,
        acceptedAttempts: debuggingAccepted,
        unsuccessfulAttempts:
          debuggingAttempts.length - debuggingAccepted,
        averageScore: debuggingAverageScore,
      },

      mockPlacement: {
        totalAttempts: mockAttempts.length,
        passedAttempts: mockPassed,
        failedAttempts: mockFailed,
        averageScore: mockAverageScore,
      },

      interview: {
        completedInterviews: interviewSessions.length,
        averageScore: interviewAverageScore,
        technicalScore: interviewTechnicalScore,
        communicationScore:
          interviewCommunicationScore,
        confidenceScore: interviewConfidenceScore,
      },

      groupDiscussion: {
        completedSessions: gdParticipantResults.length,
        averageScore: gdAverageScore,
        communicationScore: gdCommunicationScore,
        participationScore: gdParticipationScore,
      },

      readiness: {
        overallScore: readiness?.overallScore || 0,

        readinessLevel:
          readiness?.readinessLevel || "Not Ready",

        profileScore:
          readiness?.profileScore || 0,

        skillScore:
          readiness?.skillScore || 0,

        goalScore:
          readiness?.goalScore || 0,

        atsScore:
          readiness?.atsScore || 0,

        practiceScore:
          readiness?.practiceScore || 0,

        codingScore:
          readiness?.codingScore || 0,

        sqlScore:
          readiness?.sqlScore || 0,

        debuggingScore:
          readiness?.debuggingScore || 0,

        mockScore:
          readiness?.mockScore || 0,

        interviewScore:
          readiness?.interviewScore || 0,

        gdScore:
          readiness?.gdScore || 0,

        strengths:
          readiness?.strengths || [],

        weakAreas:
          readiness?.weakAreas || [],

        recommendations:
          readiness?.recommendations || [],

        lastCalculatedAt:
          readiness?.lastCalculatedAt || null,
      },

      placement: {
        totalApplications:
          placementApplications.length,

        activeApplications,

        offerApplications,

        placedApplications,

        rejectedApplications,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch overall performance analytics",

      error: error.message,
    });
  }
};


// ============================================================
// GET PERFORMANCE TRENDS
// MODULE 10
// ============================================================

const getPerformanceTrends = async (req, res) => {
  try {
    const userId = req.user.id;

    // ==============================
    // LOAD TREND DATA
    // ==============================

    const [
      practiceAttempts,
      codingAttempts,
      sqlAttempts,
      debuggingAttempts,
      mockAttempts,
      interviewSessions,
      gdSessions,
    ] = await Promise.all([
      PracticeAttempt.find({
        user: userId,
      })
        .sort({ attemptedAt: 1 })
        .lean(),

      CodingAttempt.find({
        user: userId,
        isMockAttempt: false,
      })
        .sort({ submittedAt: 1 })
        .lean(),

      SqlAttempt.find({
        user: userId,
        isMockAttempt: false,
      })
        .sort({ submittedAt: 1 })
        .lean(),

      DebuggingAttempt.find({
        user: userId,
      })
        .sort({ submittedAt: 1 })
        .lean(),

      MockAttempt.find({
        user: userId,
        status: {
          $in: [
            "Completed",
            "Auto Submitted",
            "Disqualified",
          ],
        },
      })
        .sort({
          completedAt: 1,
          submittedAt: 1,
        })
        .lean(),

      InterviewSession.find({
        user: userId,
        status: "Completed",
      })
        .sort({ completedAt: 1 })
        .lean(),

      GDSession.find({
        status: "Completed",
        "participants.user": userId,
      })
        .sort({ completedAt: 1 })
        .lean(),
    ]);


    // ==============================
    // PRACTICE TREND
    // RUNNING ACCURACY
    // ==============================

    let practiceCorrectCount = 0;

    const practiceTrend = practiceAttempts
      .map((attempt, index) => {
        if (attempt.isCorrect) {
          practiceCorrectCount++;
        }

        const date = getSafeDate(
          attempt.attemptedAt ||
            attempt.createdAt
        );

        if (!date) {
          return null;
        }

        const attemptNumber = index + 1;

        const runningAccuracy = Math.round(
          (practiceCorrectCount / attemptNumber) * 100
        );

        return {
          attemptNumber,

          date,

          isCorrect:
            Boolean(attempt.isCorrect),

          marksAwarded:
            Number(attempt.marksAwarded) || 0,

          totalMarks:
            Number(attempt.totalMarks) || 0,

          runningAccuracy,
        };
      })
      .filter(Boolean);


    // ==============================
    // CODING TREND
    // ==============================

    const codingTrend = codingAttempts
      .map((attempt, index) => {
        const date = getSafeDate(
          attempt.submittedAt ||
            attempt.createdAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          status:
            attempt.status || null,

          score:
            Number(attempt.scorePercentage) || 0,

          passedTestCases:
            Number(attempt.passedTestCases) || 0,

          totalTestCases:
            Number(attempt.totalTestCases) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // SQL TREND
    // ==============================

    const sqlTrend = sqlAttempts
      .map((attempt, index) => {
        const date = getSafeDate(
          attempt.submittedAt ||
            attempt.createdAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          status:
            attempt.status || null,

          score:
            Number(attempt.scorePercentage) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // DEBUGGING TREND
    // ==============================

    const debuggingTrend = debuggingAttempts
      .map((attempt, index) => {
        const date = getSafeDate(
          attempt.submittedAt ||
            attempt.createdAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          status:
            attempt.status || null,

          score:
            Number(attempt.scorePercentage) || 0,

          passedTestCases:
            Number(attempt.passedTestCases) || 0,

          totalTestCases:
            Number(attempt.totalTestCases) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // MOCK PLACEMENT TREND
    // ==============================

    const mockTrend = mockAttempts
      .map((attempt, index) => {
        const date = getSafeDate(
          attempt.completedAt ||
            attempt.submittedAt ||
            attempt.updatedAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          status:
            attempt.status || null,

          result:
            attempt.result || null,

          score:
            Number(
              attempt.overallPercentage
            ) || 0,

          totalScore:
            Number(attempt.totalScore) || 0,

          totalMarks:
            Number(attempt.totalMarks) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // INTERVIEW TREND
    // ==============================

    const interviewTrend = interviewSessions
      .map((session, index) => {
        const date = getSafeDate(
          session.completedAt ||
            session.updatedAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          interviewType:
            session.interviewType || null,

          difficulty:
            session.difficulty || null,

          overallScore:
            Number(session.overallScore) || 0,

          technicalScore:
            Number(session.technicalScore) || 0,

          communicationScore:
            Number(
              session.communicationScore
            ) || 0,

          confidenceScore:
            Number(session.confidenceScore) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // GD TREND
    // ==============================

    const gdTrend = gdSessions
      .map((session, index) => {
        const participant =
          session.participants.find(
            (item) =>
              item.user &&
              item.user.toString() ===
                userId.toString()
          );

        if (!participant) {
          return null;
        }

        const date = getSafeDate(
          session.completedAt ||
            session.updatedAt
        );

        if (!date) {
          return null;
        }

        return {
          attemptNumber: index + 1,

          date,

          topic:
            session.topic || null,

          overallScore:
            Number(
              participant.overallScore
            ) || 0,

          communicationScore:
            Number(
              participant.communicationScore
            ) || 0,

          relevanceScore:
            Number(
              participant.relevanceScore
            ) || 0,

          structureScore:
            Number(
              participant.structureScore
            ) || 0,

          participationScore:
            Number(
              participant.participationScore
            ) || 0,
        };
      })
      .filter(Boolean);


    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      message:
        "Performance trends fetched successfully",

      summary: {
        practiceAttempts:
          practiceTrend.length,

        codingAttempts:
          codingTrend.length,

        sqlAttempts:
          sqlTrend.length,

        debuggingAttempts:
          debuggingTrend.length,

        mockAttempts:
          mockTrend.length,

        completedInterviews:
          interviewTrend.length,

        completedGDSessions:
          gdTrend.length,
      },

      trends: {
        practice:
          practiceTrend,

        coding:
          codingTrend,

        sql:
          sqlTrend,

        debugging:
          debuggingTrend,

        mockPlacement:
          mockTrend,

        interview:
          interviewTrend,

        groupDiscussion:
          gdTrend,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch performance trends",

      error: error.message,
    });
  }
};


// ============================================================
// GET STRENGTH & WEAKNESS ANALYTICS
// MODULE 10
// ============================================================

const getStrengthWeaknessAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // ==============================
    // LOAD PERFORMANCE DATA
    // ==============================

    const [
      practiceAttempts,
      codingAttempts,
      sqlAttempts,
      debuggingAttempts,
      mockAttempts,
      interviewSessions,
      gdSessions,
    ] = await Promise.all([
      PracticeAttempt.find({
        user: userId,
      }).lean(),

      CodingAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      SqlAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      DebuggingAttempt.find({
        user: userId,
      }).lean(),

      MockAttempt.find({
        user: userId,
        status: {
          $in: [
            "Completed",
            "Auto Submitted",
            "Disqualified",
          ],
        },
      }).lean(),

      InterviewSession.find({
        user: userId,
        status: "Completed",
      }).lean(),

      GDSession.find({
        status: "Completed",
        "participants.user": userId,
      }).lean(),
    ]);


    // ==============================
    // RESULT COLLECTIONS
    // ==============================

    const evaluatedAreas = [];

    const notAttemptedAreas = [];


    // ==============================
    // ADD EVALUATED AREA
    // ==============================

    const addEvaluatedArea = (
      area,
      score,
      source,
      attempts,
      details = {}
    ) => {
      const safeScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(Number(score) || 0)
        )
      );

      let classification = "Developing";

      if (safeScore >= 80) {
        classification = "Strength";
      } else if (safeScore < 60) {
        classification = "Weak Area";
      }

      evaluatedAreas.push({
        area,

        score: safeScore,

        classification,

        source,

        attempts,

        ...details,
      });
    };


    // ==============================
    // ADD NOT ATTEMPTED AREA
    // ==============================

    const addNotAttemptedArea = (
      area,
      source
    ) => {
      notAttemptedAreas.push({
        area,

        classification:
          "Not Attempted",

        source,
      });
    };


    // ==============================
    // PRACTICE ANALYTICS
    // CATEGORY WISE
    // ==============================

    if (practiceAttempts.length === 0) {
      addNotAttemptedArea(
        "Practice",
        "Practice Environment"
      );
    } else {
      const practiceCategoryMap = {};

      practiceAttempts.forEach(
        (attempt) => {
          const category =
            attempt.category?.trim() ||
            "Other";

          if (
            !practiceCategoryMap[
              category
            ]
          ) {
            practiceCategoryMap[
              category
            ] = {
              totalAttempts: 0,

              correctAttempts: 0,
            };
          }

          practiceCategoryMap[
            category
          ].totalAttempts++;

          if (attempt.isCorrect) {
            practiceCategoryMap[
              category
            ].correctAttempts++;
          }
        }
      );

      Object.entries(
        practiceCategoryMap
      ).forEach(
        ([category, data]) => {
          const accuracy =
            data.totalAttempts > 0
              ? Math.round(
                  (data.correctAttempts /
                    data.totalAttempts) *
                    100
                )
              : 0;

          addEvaluatedArea(
            `Practice - ${category}`,

            accuracy,

            "Practice Environment",

            data.totalAttempts,

            {
              correctAttempts:
                data.correctAttempts,

              accuracy,
            }
          );
        }
      );
    }


    // ==============================
    // CODING ANALYTICS
    // ==============================

    if (codingAttempts.length === 0) {
      addNotAttemptedArea(
        "Coding",
        "Coding Lab"
      );
    } else {
      const codingAverageScore =
        calculateAverage(
          codingAttempts.map(
            (attempt) =>
              attempt.scorePercentage ||
              0
          )
        );

      const acceptedAttempts =
        codingAttempts.filter(
          (attempt) =>
            attempt.status ===
            "Accepted"
        ).length;

      addEvaluatedArea(
        "Coding",

        codingAverageScore,

        "Coding Lab",

        codingAttempts.length,

        {
          acceptedAttempts,
        }
      );
    }


    // ==============================
    // SQL ANALYTICS
    // ==============================

    if (sqlAttempts.length === 0) {
      addNotAttemptedArea(
        "SQL",
        "SQL Lab"
      );
    } else {
      const sqlAverageScore =
        calculateAverage(
          sqlAttempts.map(
            (attempt) =>
              attempt.scorePercentage ||
              0
          )
        );

      const correctAttempts =
        sqlAttempts.filter(
          (attempt) =>
            attempt.status ===
            "Correct"
        ).length;

      addEvaluatedArea(
        "SQL",

        sqlAverageScore,

        "SQL Lab",

        sqlAttempts.length,

        {
          correctAttempts,
        }
      );
    }


    // ==============================
    // DEBUGGING ANALYTICS
    // ==============================

    if (
      debuggingAttempts.length === 0
    ) {
      addNotAttemptedArea(
        "Debugging",
        "Debugging Lab"
      );
    } else {
      const debuggingAverageScore =
        calculateAverage(
          debuggingAttempts.map(
            (attempt) =>
              attempt.scorePercentage ||
              0
          )
        );

      const acceptedAttempts =
        debuggingAttempts.filter(
          (attempt) =>
            attempt.status ===
            "Accepted"
        ).length;

      addEvaluatedArea(
        "Debugging",

        debuggingAverageScore,

        "Debugging Lab",

        debuggingAttempts.length,

        {
          acceptedAttempts,
        }
      );
    }


    // ==============================
    // MOCK PLACEMENT ANALYTICS
    // ROUND WISE
    // ==============================

    const mockRoundMap = {};

    mockAttempts.forEach(
      (attempt) => {
        (
          attempt.roundResults || []
        ).forEach((round) => {
          const roundName =
            round.roundName ||
            round.roundType ||
            "Other";

          if (
            !mockRoundMap[
              roundName
            ]
          ) {
            mockRoundMap[
              roundName
            ] = [];
          }

          mockRoundMap[
            roundName
          ].push(
            Number(
              round.percentage
            ) || 0
          );
        });
      }
    );

    if (mockAttempts.length === 0) {
      addNotAttemptedArea(
        "Mock Placement",
        "Mock Placement"
      );
    } else if (
      Object.keys(
        mockRoundMap
      ).length === 0
    ) {
      addNotAttemptedArea(
        "Mock Placement Rounds",
        "Mock Placement"
      );
    } else {
      Object.entries(
        mockRoundMap
      ).forEach(
        ([roundName, scores]) => {
          addEvaluatedArea(
            `Mock - ${roundName}`,

            calculateAverage(
              scores
            ),

            "Mock Placement",

            scores.length
          );
        }
      );
    }


    // ==============================
    // INTERVIEW ANALYTICS
    // ==============================

    if (
      interviewSessions.length === 0
    ) {
      addNotAttemptedArea(
        "Interview",
        "Interview Preparation"
      );
    } else {
      // Overall

      addEvaluatedArea(
        "Interview - Overall",

        calculateAverage(
          interviewSessions.map(
            (session) =>
              session.overallScore ||
              0
          )
        ),

        "Interview Preparation",

        interviewSessions.length
      );


      // Technical

      const technicalScores =
        interviewSessions
          .map(
            (session) =>
              Number(
                session.technicalScore
              ) || 0
          )
          .filter(
            (score) => score > 0
          );

      if (
        technicalScores.length > 0
      ) {
        addEvaluatedArea(
          "Interview - Technical",

          calculateAverage(
            technicalScores
          ),

          "Interview Preparation",

          technicalScores.length
        );
      } else {
        addNotAttemptedArea(
          "Interview - Technical",

          "Interview Preparation"
        );
      }


      // Communication

      const communicationScores =
        interviewSessions
          .map(
            (session) =>
              Number(
                session.communicationScore
              ) || 0
          )
          .filter(
            (score) => score > 0
          );

      if (
        communicationScores.length > 0
      ) {
        addEvaluatedArea(
          "Interview - Communication",

          calculateAverage(
            communicationScores
          ),

          "Interview Preparation",

          communicationScores.length
        );
      } else {
        addNotAttemptedArea(
          "Interview - Communication",

          "Interview Preparation"
        );
      }


      // Confidence

      const confidenceScores =
        interviewSessions
          .map(
            (session) =>
              Number(
                session.confidenceScore
              ) || 0
          )
          .filter(
            (score) => score > 0
          );

      if (
        confidenceScores.length > 0
      ) {
        addEvaluatedArea(
          "Interview - Confidence",

          calculateAverage(
            confidenceScores
          ),

          "Interview Preparation",

          confidenceScores.length
        );
      } else {
        addNotAttemptedArea(
          "Interview - Confidence",

          "Interview Preparation"
        );
      }
    }


    // ==============================
    // GROUP DISCUSSION ANALYTICS
    // ==============================

    const gdParticipantResults = [];

    gdSessions.forEach(
      (session) => {
        const participant =
          session.participants.find(
            (item) =>
              item.user &&
              item.user.toString() ===
                userId.toString()
          );

        if (participant) {
          gdParticipantResults.push(
            participant
          );
        }
      }
    );

    if (
      gdParticipantResults.length === 0
    ) {
      addNotAttemptedArea(
        "Group Discussion",
        "Group Discussion"
      );
    } else {
      // Overall

      addEvaluatedArea(
        "GD - Overall",

        calculateAverage(
          gdParticipantResults.map(
            (participant) =>
              participant.overallScore ||
              0
          )
        ),

        "Group Discussion",

        gdParticipantResults.length
      );


      // Communication

      addEvaluatedArea(
        "GD - Communication",

        calculateAverage(
          gdParticipantResults.map(
            (participant) =>
              participant.communicationScore ||
              0
          )
        ),

        "Group Discussion",

        gdParticipantResults.length
      );


      // Relevance

      addEvaluatedArea(
        "GD - Relevance",

        calculateAverage(
          gdParticipantResults.map(
            (participant) =>
              participant.relevanceScore ||
              0
          )
        ),

        "Group Discussion",

        gdParticipantResults.length
      );


      // Structure

      addEvaluatedArea(
        "GD - Structure",

        calculateAverage(
          gdParticipantResults.map(
            (participant) =>
              participant.structureScore ||
              0
          )
        ),

        "Group Discussion",

        gdParticipantResults.length
      );


      // Participation

      addEvaluatedArea(
        "GD - Participation",

        calculateAverage(
          gdParticipantResults.map(
            (participant) =>
              participant.participationScore ||
              0
          )
        ),

        "Group Discussion",

        gdParticipantResults.length
      );
    }


    // ==============================
    // FINAL CLASSIFICATION
    // ==============================

    const strengths =
      evaluatedAreas
        .filter(
          (item) =>
            item.classification ===
            "Strength"
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const developingAreas =
      evaluatedAreas
        .filter(
          (item) =>
            item.classification ===
            "Developing"
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const weakAreas =
      evaluatedAreas
        .filter(
          (item) =>
            item.classification ===
            "Weak Area"
        )
        .sort(
          (a, b) =>
            a.score - b.score
        );


    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      message:
        "Strength and weakness analytics fetched successfully",

      thresholds: {
        strength:
          "80-100",

        developing:
          "60-79",

        weakArea:
          "0-59",
      },

      summary: {
        evaluatedAreas:
          evaluatedAreas.length,

        strengths:
          strengths.length,

        developingAreas:
          developingAreas.length,

        weakAreas:
          weakAreas.length,

        notAttemptedAreas:
          notAttemptedAreas.length,
      },

      strengths,

      developingAreas,

      weakAreas,

      notAttemptedAreas,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch strength and weakness analytics",

      error:
        error.message,
    });
  }
};



// ============================================================
// GET PERFORMANCE RECOMMENDATIONS
// MODULE 10
// ============================================================

const getPerformanceRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // ==============================
    // LOAD PERFORMANCE DATA
    // ==============================

    const [
      practiceAttempts,
      codingAttempts,
      sqlAttempts,
      debuggingAttempts,
      mockAttempts,
      interviewSessions,
      gdSessions,
      readiness,
    ] = await Promise.all([
      PracticeAttempt.find({
        user: userId,
      }).lean(),

      CodingAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      SqlAttempt.find({
        user: userId,
        isMockAttempt: false,
      }).lean(),

      DebuggingAttempt.find({
        user: userId,
      }).lean(),

      MockAttempt.find({
        user: userId,
        status: {
          $in: [
            "Completed",
            "Auto Submitted",
            "Disqualified",
          ],
        },
      }).lean(),

      InterviewSession.find({
        user: userId,
        status: "Completed",
      }).lean(),

      GDSession.find({
        status: "Completed",
        "participants.user": userId,
      }).lean(),

      Readiness.findOne({
        user: userId,
      }).lean(),
    ]);

    // ==============================
    // RECOMMENDATION COLLECTION
    // ==============================

    const recommendations = [];

    const addRecommendation = ({
      priority,
      area,
      currentScore = null,
      recommendation,
      actionModule,
      reason,
    }) => {
      recommendations.push({
        priority,
        area,
        currentScore,
        recommendation,
        actionModule,
        reason,
      });
    };

    // ==============================
    // SCORE-BASED RECOMMENDATION
    // ==============================

    const addScoreRecommendation = ({
      area,
      score,
      actionModule,
      weakRecommendation,
      developingRecommendation,
      strengthRecommendation,
      reasonPrefix,
    }) => {
      const safeScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(Number(score) || 0)
        )
      );

      if (safeScore < 60) {
        addRecommendation({
          priority: "High",
          area,
          currentScore: safeScore,
          recommendation: weakRecommendation,
          actionModule,
          reason: `${reasonPrefix}: ${safeScore}/100. This is currently a weak area.`,
        });

        return;
      }

      if (safeScore < 80) {
        addRecommendation({
          priority: "Medium",
          area,
          currentScore: safeScore,
          recommendation: developingRecommendation,
          actionModule,
          reason: `${reasonPrefix}: ${safeScore}/100. This area is developing.`,
        });

        return;
      }

      addRecommendation({
        priority: "Maintain",
        area,
        currentScore: safeScore,
        recommendation: strengthRecommendation,
        actionModule,
        reason: `${reasonPrefix}: ${safeScore}/100. This is currently a strength.`,
      });
    };

    // ==============================
    // PRACTICE
    // ==============================

    if (practiceAttempts.length === 0) {
      addRecommendation({
        priority: "Start",
        area: "Practice",
        recommendation:
          "Start Practice Environment questions to establish your aptitude, reasoning, verbal and technical practice baseline.",
        actionModule: "Practice Environment",
        reason:
          "No normal practice attempts are available yet.",
      });
    } else {
      const practiceCategoryMap = {};

      practiceAttempts.forEach((attempt) => {
        const category =
          attempt.category?.trim() || "Other";

        if (!practiceCategoryMap[category]) {
          practiceCategoryMap[category] = {
            totalAttempts: 0,
            correctAttempts: 0,
          };
        }

        practiceCategoryMap[
          category
        ].totalAttempts++;

        if (attempt.isCorrect) {
          practiceCategoryMap[
            category
          ].correctAttempts++;
        }
      });

      Object.entries(
        practiceCategoryMap
      ).forEach(([category, data]) => {
        const accuracy =
          data.totalAttempts > 0
            ? Math.round(
                (data.correctAttempts /
                  data.totalAttempts) *
                  100
              )
            : 0;

        addScoreRecommendation({
          area: `Practice - ${category}`,
          score: accuracy,
          actionModule:
            "Practice Environment",

          weakRecommendation:
            `Prioritize ${category} practice and review incorrect answers before attempting another timed set.`,

          developingRecommendation:
            `Continue ${category} practice and focus on improving accuracy above 80%.`,

          strengthRecommendation:
            `Maintain your ${category} performance with regular timed practice.`,

          reasonPrefix:
            `${category} practice accuracy`,
        });
      });
    }

    // ==============================
    // CODING
    // ==============================

    if (codingAttempts.length === 0) {
      addRecommendation({
        priority: "Start",
        area: "Coding",
        recommendation:
          "Start Coding Lab problems to establish your coding performance baseline.",
        actionModule: "Coding Lab",
        reason:
          "No normal Coding Lab attempts are available yet.",
      });
    } else {
      const codingAverageScore =
        calculateAverage(
          codingAttempts.map(
            (attempt) =>
              attempt.scorePercentage || 0
          )
        );

      addScoreRecommendation({
        area: "Coding",
        score: codingAverageScore,
        actionModule: "Coding Lab",

        weakRecommendation:
          "Practice more coding problems and review failed test cases to improve problem solving and implementation accuracy.",

        developingRecommendation:
          "Continue Coding Lab practice and target consistent successful solutions above 80%.",

        strengthRecommendation:
          "Maintain your coding strength with harder problems and broader problem-solving patterns.",

        reasonPrefix:
          "Coding Lab average score",
      });
    }

    // ==============================
    // SQL
    // ==============================

    if (sqlAttempts.length === 0) {
      addRecommendation({
        priority: "Start",
        area: "SQL",
        recommendation:
          "Start SQL Lab problems to establish your SQL performance baseline.",
        actionModule: "SQL Lab",
        reason:
          "No normal SQL Lab attempts are available yet.",
      });
    } else {
      const sqlAverageScore =
        calculateAverage(
          sqlAttempts.map(
            (attempt) =>
              attempt.scorePercentage || 0
          )
        );

      addScoreRecommendation({
        area: "SQL",
        score: sqlAverageScore,
        actionModule: "SQL Lab",

        weakRecommendation:
          "Practice SQL queries regularly and review incorrect query logic, joins, filtering and aggregation concepts.",

        developingRecommendation:
          "Continue SQL Lab practice and improve query accuracy and consistency above 80%.",

        strengthRecommendation:
          "Maintain your SQL strength with advanced joins, subqueries, grouping and interview-style SQL problems.",

        reasonPrefix:
          "SQL Lab average score",
      });
    }

    // ==============================
    // DEBUGGING
    // ==============================

    if (debuggingAttempts.length === 0) {
      addRecommendation({
        priority: "Start",
        area: "Debugging",
        recommendation:
          "Start Debugging Lab exercises to build error identification and code-fixing skills.",
        actionModule: "Debugging Lab",
        reason:
          "No Debugging Lab attempts are available yet.",
      });
    } else {
      const debuggingAverageScore =
        calculateAverage(
          debuggingAttempts.map(
            (attempt) =>
              attempt.scorePercentage || 0
          )
        );

      addScoreRecommendation({
        area: "Debugging",
        score: debuggingAverageScore,
        actionModule: "Debugging Lab",

        weakRecommendation:
          "Practice identifying syntax, logical and runtime errors and review failed debugging attempts.",

        developingRecommendation:
          "Continue debugging exercises and improve your ability to identify and fix errors efficiently.",

        strengthRecommendation:
          "Maintain your debugging strength with more complex debugging scenarios.",

        reasonPrefix:
          "Debugging Lab average score",
      });
    }

    // ==============================
    // MOCK PLACEMENT
    // ==============================

    if (mockAttempts.length === 0) {
      addRecommendation({
        priority: "Start",
        area: "Mock Placement",
        recommendation:
          "Complete a Mock Placement test to measure your performance across placement-style rounds.",
        actionModule: "Mock Placement",
        reason:
          "No completed Mock Placement attempt is available yet.",
      });
    } else {
      const roundMap = {};

      mockAttempts.forEach((attempt) => {
        (
          attempt.roundResults || []
        ).forEach((round) => {
          const roundName =
            round.roundName ||
            round.roundType ||
            "Other";

          if (!roundMap[roundName]) {
            roundMap[roundName] = [];
          }

          roundMap[roundName].push(
            Number(
              round.percentage
            ) || 0
          );
        });
      });

      if (
        Object.keys(roundMap).length === 0
      ) {
        addRecommendation({
          priority: "Start",
          area:
            "Mock Placement Rounds",
          recommendation:
            "Complete Mock Placement rounds so Placify can identify round-wise strengths and weaknesses.",
          actionModule:
            "Mock Placement",
          reason:
            "Completed mock records do not contain round performance yet.",
        });
      } else {
        Object.entries(
          roundMap
        ).forEach(
          ([roundName, scores]) => {
            addScoreRecommendation({
              area:
                `Mock - ${roundName}`,

              score:
                calculateAverage(
                  scores
                ),

              actionModule:
                "Mock Placement",

              weakRecommendation:
                `Prioritize the ${roundName} round before your next mock placement and practice the related skills separately.`,

              developingRecommendation:
                `Continue improving the ${roundName} round and target a consistent score above 80%.`,

              strengthRecommendation:
                `Maintain your ${roundName} round performance while focusing more time on weaker rounds.`,

              reasonPrefix:
                `${roundName} mock-round average`,
            });
          }
        );
      }
    }

    // ==============================
    // INTERVIEW
    // ==============================

    if (
      interviewSessions.length === 0
    ) {
      addRecommendation({
        priority: "Start",
        area: "Interview",
        recommendation:
          "Complete a mock interview to establish your technical and communication interview baseline.",
        actionModule:
          "Interview Preparation",
        reason:
          "No completed interview session is available yet.",
      });
    } else {
      // Overall interview score

      addScoreRecommendation({
        area:
          "Interview - Overall",

        score:
          calculateAverage(
            interviewSessions.map(
              (session) =>
                session.overallScore ||
                0
            )
          ),

        actionModule:
          "Interview Preparation",

        weakRecommendation:
          "Practice structured interview answers and strengthen the concepts identified in your interview feedback.",

        developingRecommendation:
          "Continue mock interviews and improve answer depth, clarity and consistency.",

        strengthRecommendation:
          "Maintain your interview performance with company-specific and higher-difficulty interview sessions.",

        reasonPrefix:
          "Overall interview average",
      });

      // Technical score
      // Only Technical interview sessions
      // should contribute because other
      // interview types intentionally store
      // technicalScore as 0.

      const technicalScores =
        interviewSessions
          .filter(
            (session) =>
              session.interviewType ===
              "Technical"
          )
          .map(
            (session) =>
              Number(
                session.technicalScore
              ) || 0
          );

      if (
        technicalScores.length > 0
      ) {
        addScoreRecommendation({
          area:
            "Interview - Technical",

          score:
            calculateAverage(
              technicalScores
            ),

          actionModule:
            "Interview Preparation",

          weakRecommendation:
            "Revise core technical concepts and practice explaining solutions clearly in technical interviews.",

          developingRecommendation:
            "Continue technical mock interviews and strengthen weaker concepts from previous feedback.",

          strengthRecommendation:
            "Maintain your technical interview strength with advanced and company-specific questions.",

          reasonPrefix:
            "Technical interview average",
        });
      }

      // Communication score
      // Zero values are excluded because
      // Coding/SQL interview questions do
      // not produce communication scores.

      const communicationScores =
        interviewSessions
          .map(
            (session) =>
              Number(
                session.communicationScore
              ) || 0
          )
          .filter(
            (score) => score > 0
          );

      if (
        communicationScores.length > 0
      ) {
        addScoreRecommendation({
          area:
            "Interview - Communication",

          score:
            calculateAverage(
              communicationScores
            ),

          actionModule:
            "Interview Preparation",

          weakRecommendation:
            "Practice clear, concise and structured spoken answers during mock interviews.",

          developingRecommendation:
            "Continue communication-focused interview practice and improve clarity and answer structure.",

          strengthRecommendation:
            "Maintain strong interview communication through regular mock sessions.",

          reasonPrefix:
            "Interview communication average",
        });
      }

      // confidenceScore is intentionally
      // excluded because the current
      // interview implementation keeps it
      // at 0 until an objectively defensible
      // confidence evaluation method exists.
    }

    // ==============================
    // GROUP DISCUSSION
    // ==============================

    const gdParticipants = [];

    gdSessions.forEach(
      (session) => {
        const participant =
          session.participants.find(
            (item) =>
              item.user &&
              item.user.toString() ===
                userId.toString()
          );

        if (participant) {
          gdParticipants.push(
            participant
          );
        }
      }
    );

    if (
      gdParticipants.length === 0
    ) {
      addRecommendation({
        priority: "Start",
        area:
          "Group Discussion",
        recommendation:
          "Complete a Group Discussion practice session to establish communication, relevance, structure and participation scores.",
        actionModule:
          "Group Discussion",
        reason:
          "No completed Group Discussion result is available yet.",
      });
    } else {
      const gdMetrics = [
        {
          area: "GD - Overall",
          field: "overallScore",

          weak:
            "Increase regular GD practice and work on balanced communication, relevance, structure and participation.",

          developing:
            "Continue GD practice and improve consistency across all evaluation dimensions.",

          strength:
            "Maintain your overall GD performance while refining weaker GD dimensions.",
        },

        {
          area:
            "GD - Communication",

          field:
            "communicationScore",

          weak:
            "Practice speaking clearly, concisely and confidently during group discussions.",

          developing:
            "Continue improving clarity and fluency during GD responses.",

          strength:
            "Maintain strong GD communication while helping the discussion remain productive.",
        },

        {
          area:
            "GD - Relevance",

          field:
            "relevanceScore",

          weak:
            "Focus on topic-relevant points and support contributions with clear reasoning or examples.",

          developing:
            "Improve the depth and relevance of your GD contributions.",

          strength:
            "Maintain relevant contributions and add stronger supporting examples.",
        },

        {
          area:
            "GD - Structure",

          field:
            "structureScore",

          weak:
            "Practice structuring GD responses with a clear opening, supporting points and a concise conclusion.",

          developing:
            "Improve the flow and organization of your GD responses.",

          strength:
            "Maintain well-structured GD responses while adapting naturally to the discussion.",
        },

        {
          area:
            "GD - Participation",

          field:
            "participationScore",

          weak:
            "Participate more consistently in GD sessions without dominating other participants.",

          developing:
            "Increase meaningful participation and respond constructively to other viewpoints.",

          strength:
            "Maintain balanced participation and continue engaging constructively with others.",
        },
      ];

      gdMetrics.forEach(
        (metric) => {
          addScoreRecommendation({
            area: metric.area,

            score:
              calculateAverage(
                gdParticipants.map(
                  (participant) =>
                    Number(
                      participant[
                        metric.field
                      ]
                    ) || 0
                )
              ),

            actionModule:
              "Group Discussion",

            weakRecommendation:
              metric.weak,

            developingRecommendation:
              metric.developing,

            strengthRecommendation:
              metric.strength,

            reasonPrefix:
              metric.area.replace(
                "GD - ",
                "GD "
              ),
          });
        }
      );
    }

    // ==============================
    // PRIORITY ORDER
    // ==============================

    const priorityOrder = {
      High: 1,
      Start: 2,
      Medium: 3,
      Maintain: 4,
    };

    recommendations.sort(
      (a, b) => {
        const priorityDifference =
          (
            priorityOrder[
              a.priority
            ] || 99
          ) -
          (
            priorityOrder[
              b.priority
            ] || 99
          );

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        if (
          a.currentScore === null &&
          b.currentScore === null
        ) {
          return a.area.localeCompare(
            b.area
          );
        }

        if (
          a.currentScore === null
        ) {
          return 1;
        }

        if (
          b.currentScore === null
        ) {
          return -1;
        }

        return (
          a.currentScore -
          b.currentScore
        );
      }
    );

    // ==============================
    // SUMMARY
    // ==============================

    const highPriority =
      recommendations.filter(
        (item) =>
          item.priority === "High"
      ).length;

    const startPriority =
      recommendations.filter(
        (item) =>
          item.priority === "Start"
      ).length;

    const mediumPriority =
      recommendations.filter(
        (item) =>
          item.priority === "Medium"
      ).length;

    const maintainPriority =
      recommendations.filter(
        (item) =>
          item.priority ===
          "Maintain"
      ).length;

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      message:
        "Performance recommendations fetched successfully",

      summary: {
        totalRecommendations:
          recommendations.length,

        highPriority,

        startPriority,

        mediumPriority,

        maintainPriority,

        readinessScore:
          readiness?.overallScore ||
          0,

        readinessLevel:
          readiness?.readinessLevel ||
          "Not Ready",
      },

      recommendations,

      readinessRecommendations:
        readiness?.recommendations ||
        [],
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch performance recommendations",

      error: error.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getOverallPerformanceAnalytics,
  getPerformanceTrends,
  getStrengthWeaknessAnalytics,
  getPerformanceRecommendations,
};