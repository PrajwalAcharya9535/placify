const StudentProfile = require("../../models/StudentProfile");
const Skill = require("../../models/Skill");
const StudentGoal = require("../../models/StudentGoal");
const Readiness = require("../../models/Readiness");
const LearningProgress = require("../../models/LearningProgress");
const PracticeAttempt = require("../../models/PracticeAttempt");
const Resume = require("../../models/Resume");
const MockAttempt = require("../../models/MockAttempt");
const InterviewSession = require("../../models/InterviewSession");
const GDSession = require("../../models/GDSession");
const PlacementApplication = require(
  "../../models/PlacementApplication"
);
const User = require("../../models/User");

// ==============================
// HELPER - ADD UNIQUE VALUE
// ==============================

const addUnique = (array, value) => {
  if (!value) return;

  const exists = array.some(
    (item) =>
      item.toLowerCase() ===
      value.toLowerCase()
  );

  if (!exists) {
    array.push(value);
  }
};

// ==============================
// HELPER - AVERAGE
// ==============================

const calculateAverage = (values) => {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (total, value) =>
        total + (Number(value) || 0),
      0
    ) / values.length
  );
};

// ==============================
// STUDENT DASHBOARD
// ==============================

const getStudentDashboard = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const [
      user,
      profile,
      skills,
      goal,
      readiness,
      learningProgress,
      practiceAttempts,
      resume,
      mockAttempts,
      interviewSessions,
      gdSessions,
      placementApplications,
    ] = await Promise.all([
      User.findById(userId).select(
        "name email role"
      ),

      StudentProfile.findOne({
        user: userId,
      }),

      Skill.find({
        user: userId,
      }).sort({ createdAt: -1 }),

      StudentGoal.findOne({
        user: userId,
      }),

      Readiness.findOne({
        user: userId,
      }),

      LearningProgress.find({
        user: userId,
      }).populate(
        "topic",
        "title category difficulty estimatedMinutes skillsCovered"
      ),

      PracticeAttempt.find({
        user: userId,
      }),

      Resume.findOne({
        user: userId,
      }),

      MockAttempt.find({
        user: userId,
      }),

      InterviewSession.find({
        user: userId,
      }).sort({
        createdAt: -1,
      }),

      GDSession.find({
        "participants.user": userId,
      }).sort({
        createdAt: -1,
      }),

      PlacementApplication.find({
        student: userId,
      })
        .populate(
          "opportunity",
          [
            "title",
            "companyName",
            "jobRole",
            "location",
            "workMode",
            "opportunityType",
            "applicationDeadline",
            "salaryMin",
            "salaryMax",
            "status",
            "isActive",
          ].join(" ")
        )
        .sort({
          updatedAt: -1,
        }),
    ]);

    // ==============================
    // LEARNING SUMMARY
    // ==============================

    const completedTopics =
      learningProgress.filter(
        (item) =>
          item.status === "Completed"
      ).length;

    const inProgressTopics =
      learningProgress.filter(
        (item) =>
          item.status === "In Progress"
      ).length;

    const totalLearningTopicsStarted =
      learningProgress.length;

    const averageLearningProgress =
      learningProgress.length > 0
        ? Math.round(
            learningProgress.reduce(
              (total, item) =>
                total +
                (item.progressPercentage ||
                  0),
              0
            ) /
              learningProgress.length
          )
        : 0;

    // ==============================
    // PRACTICE SUMMARY
    // ==============================

    const totalPracticeAttempts =
      practiceAttempts.length;

    const correctPracticeAttempts =
      practiceAttempts.filter(
        (attempt) =>
          attempt.isCorrect
      ).length;

    const incorrectPracticeAttempts =
      totalPracticeAttempts -
      correctPracticeAttempts;

    const practiceAccuracy =
      totalPracticeAttempts > 0
        ? Math.round(
            (correctPracticeAttempts /
              totalPracticeAttempts) *
              100
          )
        : 0;

    const totalPracticeTime =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.timeTakenSeconds || 0),
        0
      );

    const averagePracticeTime =
      totalPracticeAttempts > 0
        ? Math.round(
            totalPracticeTime /
              totalPracticeAttempts
          )
        : 0;

    const practiceMarksObtained =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.marksAwarded || 0),
        0
      );

    const practiceTotalMarks =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.totalMarks || 0),
        0
      );

    // ==============================
    // CATEGORY PERFORMANCE
    // ==============================

    const categoryMap = {};

    practiceAttempts.forEach(
      (attempt) => {
        const category =
          attempt.category || "Other";

        if (!categoryMap[category]) {
          categoryMap[category] = {
            totalAttempts: 0,
            correctAttempts: 0,
          };
        }

        categoryMap[
          category
        ].totalAttempts++;

        if (attempt.isCorrect) {
          categoryMap[
            category
          ].correctAttempts++;
        }
      }
    );

    const categoryPerformance =
      Object.entries(categoryMap).map(
        ([category, data]) => ({
          category,

          totalAttempts:
            data.totalAttempts,

          accuracy:
            data.totalAttempts > 0
              ? Math.round(
                  (data.correctAttempts /
                    data.totalAttempts) *
                    100
                )
              : 0,
        })
      );

    const practiceWeakAreas =
      categoryPerformance
        .filter(
          (item) =>
            item.totalAttempts >= 1 &&
            item.accuracy < 60
        )
        .map(
          (item) => item.category
        );

    const practiceStrengths =
      categoryPerformance
        .filter(
          (item) =>
            item.totalAttempts >= 1 &&
            item.accuracy >= 80
        )
        .map(
          (item) => item.category
        );

    // ==============================
    // INTERVIEW SUMMARY
    // ==============================

    const completedInterviews =
      interviewSessions.filter(
        (session) =>
          session.status === "Completed"
      );

    const interviewScores =
      completedInterviews.map(
        (session) =>
          Number(
            session.overallScore
          ) || 0
      );

    const interviewTechnicalScores =
      completedInterviews.map(
        (session) =>
          Number(
            session.technicalScore
          ) || 0
      );

    const interviewCommunicationScores =
      completedInterviews.map(
        (session) =>
          Number(
            session.communicationScore
          ) || 0
      );

    const averageInterviewScore =
      calculateAverage(
        interviewScores
      );

    const averageInterviewTechnicalScore =
      calculateAverage(
        interviewTechnicalScores
      );

    const averageInterviewCommunicationScore =
      calculateAverage(
        interviewCommunicationScores
      );

    const latestCompletedInterview =
      completedInterviews.length > 0
        ? completedInterviews[0]
        : null;

    // ==============================
    // GD SUMMARY
    // ==============================

    const completedGDSessions =
      gdSessions.filter(
        (session) =>
          session.status === "Completed"
      );

    const gdPerformanceRecords = [];

    completedGDSessions.forEach(
      (session) => {
        const participant =
          session.participants.find(
            (item) =>
              item.user.toString() ===
              userId.toString()
          );

        if (participant) {
          gdPerformanceRecords.push({
            session,
            participant,
          });
        }
      }
    );

    const gdOverallScores =
      gdPerformanceRecords.map(
        ({ participant }) =>
          Number(
            participant.overallScore
          ) || 0
      );

    const gdCommunicationScores =
      gdPerformanceRecords.map(
        ({ participant }) =>
          Number(
            participant.communicationScore
          ) || 0
      );

    const gdRelevanceScores =
      gdPerformanceRecords.map(
        ({ participant }) =>
          Number(
            participant.relevanceScore
          ) || 0
      );

    const gdStructureScores =
      gdPerformanceRecords.map(
        ({ participant }) =>
          Number(
            participant.structureScore
          ) || 0
      );

    const gdParticipationScores =
      gdPerformanceRecords.map(
        ({ participant }) =>
          Number(
            participant.participationScore
          ) || 0
      );

    const averageGDScore =
      calculateAverage(
        gdOverallScores
      );

    const averageGDCommunicationScore =
      calculateAverage(
        gdCommunicationScores
      );

    const averageGDRelevanceScore =
      calculateAverage(
        gdRelevanceScores
      );

    const averageGDStructureScore =
      calculateAverage(
        gdStructureScores
      );

    const averageGDParticipationScore =
      calculateAverage(
        gdParticipationScores
      );

    const latestGDPerformance =
      gdPerformanceRecords.length > 0
        ? gdPerformanceRecords[0]
        : null;

    // ==============================
    // PLACEMENT TRACKER SUMMARY
    // MODULE 9
    // ==============================

    const placementStageCounts = {
      Interested: 0,
      Applied: 0,
      Assessment: 0,
      Shortlisted: 0,
      Technical: 0,
      HR: 0,
      Selected: 0,
      Rejected: 0,
      Offer: 0,
      Placed: 0,
    };

    placementApplications.forEach(
      (application) => {
        if (
          Object.prototype.hasOwnProperty.call(
            placementStageCounts,
            application.currentStage
          )
        ) {
          placementStageCounts[
            application.currentStage
          ]++;
        }
      }
    );

    const activePlacementApplications =
      placementApplications.filter(
        (application) =>
          application.isActive === true
      );

    const placedApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage ===
          "Placed"
      );

    const rejectedApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage ===
          "Rejected"
      );

    const offerApplications =
      placementApplications.filter(
        (application) =>
          application.currentStage ===
            "Offer" ||
          application.currentStage ===
            "Placed"
      );

    const upcomingPlacementRounds =
      placementApplications
        .filter(
          (application) =>
            application.isActive ===
              true &&
            application.nextRoundDate &&
            new Date(
              application.nextRoundDate
            ) >= new Date()
        )
        .sort(
          (a, b) =>
            new Date(
              a.nextRoundDate
            ) -
            new Date(
              b.nextRoundDate
            )
        );

    const latestPlacementApplication =
      placementApplications.length > 0
        ? placementApplications[0]
        : null;

    const nextPlacementRound =
      upcomingPlacementRounds.length > 0
        ? upcomingPlacementRounds[0]
        : null;

    // ==============================
    // SKILL GAP ANALYSIS
    // ==============================

    const currentSkillNames =
      skills.map(
        (skill) => skill.name
      );

    const currentSkillsLower =
      currentSkillNames.map(
        (skill) =>
          skill.toLowerCase()
      );

    const preferredSkills =
      goal?.preferredSkills || [];

    const missingSkills = [];
    const skillGapWeakAreas = [];
    const priorityAreas = [];
    const skillGapRecommendations =
      [];

    // ------------------------------
    // Goal-based missing skills
    // ------------------------------

    preferredSkills.forEach(
      (preferredSkill) => {
        const alreadyOwned =
          currentSkillsLower.includes(
            preferredSkill.toLowerCase()
          );

        if (!alreadyOwned) {
          addUnique(
            missingSkills,
            preferredSkill
          );
        }
      }
    );

    // ------------------------------
    // ATS-based missing skills
    // ------------------------------

    if (
      resume &&
      resume.analysisStatus ===
        "Analyzed" &&
      Array.isArray(
        resume.missingSkills
      )
    ) {
      resume.missingSkills.forEach(
        (missingSkill) => {
          addUnique(
            missingSkills,
            missingSkill
          );
        }
      );
    }

    // ------------------------------
    // Practice weaknesses
    // ------------------------------

    categoryPerformance.forEach(
      (item) => {
        if (
          item.totalAttempts >= 1 &&
          item.accuracy < 60
        ) {
          addUnique(
            skillGapWeakAreas,
            `${item.category} practice performance (${item.accuracy}% accuracy)`
          );

          addUnique(
            priorityAreas,
            item.category
          );
        }
      }
    );

    // ------------------------------
    // Mock placement weakness
    // ------------------------------

    const completedMocks =
      mockAttempts.filter(
        (attempt) =>
          attempt.status ===
            "Completed" ||
          attempt.completedAt
      );

    if (completedMocks.length > 0) {
      const mockScores =
        completedMocks.map(
          (attempt) => {
            if (
              typeof attempt.percentage ===
              "number"
            ) {
              return attempt.percentage;
            }

            if (
              typeof attempt.score ===
              "number"
            ) {
              return attempt.score;
            }

            return 0;
          }
        );

      const averageMockScore =
        mockScores.reduce(
          (total, score) =>
            total + score,
          0
        ) / mockScores.length;

      if (averageMockScore < 60) {
        addUnique(
          skillGapWeakAreas,
          `Mock placement performance (${Math.round(
            averageMockScore
          )}%)`
        );

        addUnique(
          priorityAreas,
          "Mock Placement Preparation"
        );
      }
    }

    // ------------------------------
    // Skill recommendations
    // ------------------------------

    missingSkills.forEach(
      (skill) => {
        skillGapRecommendations.push(
          `Learn and practice ${skill} based on your placement requirements.`
        );
      }
    );

    // ------------------------------
    // Weak-area recommendations
    // ------------------------------

    skillGapWeakAreas.forEach(
      (area) => {
        skillGapRecommendations.push(
          `Improve ${area} through targeted learning and practice.`
        );
      }
    );

    // ------------------------------
    // Goal recommendation
    // ------------------------------

    if (!goal) {
      skillGapRecommendations.push(
        "Set a placement goal or target role to receive more accurate skill-gap recommendations."
      );
    }

    // ------------------------------
    // Resume recommendation
    // ------------------------------

    if (!resume) {
      skillGapRecommendations.push(
        "Upload and analyze your resume to identify ATS-based missing skills."
      );
    } else if (
      resume.analysisStatus !==
      "Analyzed"
    ) {
      skillGapRecommendations.push(
        "Run ATS analysis on your resume to identify missing skills."
      );
    }

    const uniqueSkillGapRecommendations =
      [
        ...new Set(
          skillGapRecommendations
        ),
      ];

    // ==============================
    // DASHBOARD RESPONSE
    // ==============================

    res.status(200).json({
      message:
        "Student dashboard fetched successfully",

      student: user,

      profile: profile || null,

      skills,

      goal: goal || null,

      readiness:
        readiness || null,

      // ==============================
      // LEARNING
      // ==============================

      learning: {
        progress:
          learningProgress,

        totalStarted:
          totalLearningTopicsStarted,

        completedTopics,

        inProgressTopics,

        averageProgress:
          averageLearningProgress,
      },

      // ==============================
      // PRACTICE
      // ==============================

      practice: {
        totalAttempts:
          totalPracticeAttempts,

        correctAttempts:
          correctPracticeAttempts,

        incorrectAttempts:
          incorrectPracticeAttempts,

        accuracy:
          practiceAccuracy,

        marksObtained:
          practiceMarksObtained,

        totalMarks:
          practiceTotalMarks,

        averageTimeSeconds:
          averagePracticeTime,

        categoryPerformance,

        weakAreas:
          practiceWeakAreas,

        strengths:
          practiceStrengths,
      },

      // ==============================
      // MODULE 7 - INTERVIEW
      // ==============================

      interview: {
        totalSessions:
          interviewSessions.length,

        completedSessions:
          completedInterviews.length,

        averageScore:
          averageInterviewScore,

        averageTechnicalScore:
          averageInterviewTechnicalScore,

        averageCommunicationScore:
          averageInterviewCommunicationScore,

        latestCompleted:
          latestCompletedInterview
            ? {
                sessionId:
                  latestCompletedInterview._id,

                interviewType:
                  latestCompletedInterview.interviewType,

                targetRole:
                  latestCompletedInterview.targetRole,

                targetCompany:
                  latestCompletedInterview.targetCompany,

                difficulty:
                  latestCompletedInterview.difficulty,

                overallScore:
                  latestCompletedInterview.overallScore ||
                  0,

                technicalScore:
                  latestCompletedInterview.technicalScore ||
                  0,

                communicationScore:
                  latestCompletedInterview.communicationScore ||
                  0,

                completedAt:
                  latestCompletedInterview.completedAt,
              }
            : null,
      },

      // ==============================
      // MODULE 7 - GROUP DISCUSSION
      // ==============================

      gd: {
        totalSessions:
          gdSessions.length,

        completedSessions:
          gdPerformanceRecords.length,

        averageScore:
          averageGDScore,

        averageCommunicationScore:
          averageGDCommunicationScore,

        averageRelevanceScore:
          averageGDRelevanceScore,

        averageStructureScore:
          averageGDStructureScore,

        averageParticipationScore:
          averageGDParticipationScore,

        latestCompleted:
          latestGDPerformance
            ? {
                sessionId:
                  latestGDPerformance
                    .session._id,

                roomCode:
                  latestGDPerformance
                    .session.roomCode,

                topic:
                  latestGDPerformance
                    .session.topic,

                category:
                  latestGDPerformance
                    .session.category,

                difficulty:
                  latestGDPerformance
                    .session.difficulty,

                targetRole:
                  latestGDPerformance
                    .session.targetRole,

                targetCompany:
                  latestGDPerformance
                    .session.targetCompany,

                overallScore:
                  latestGDPerformance
                    .participant
                    .overallScore ||
                  0,

                communicationScore:
                  latestGDPerformance
                    .participant
                    .communicationScore ||
                  0,

                relevanceScore:
                  latestGDPerformance
                    .participant
                    .relevanceScore ||
                  0,

                structureScore:
                  latestGDPerformance
                    .participant
                    .structureScore ||
                  0,

                participationScore:
                  latestGDPerformance
                    .participant
                    .participationScore ||
                  0,

                completedAt:
                  latestGDPerformance
                    .session.completedAt,
              }
            : null,
      },

      // ==============================
      // MODULE 9 - PLACEMENT TRACKER
      // ==============================

      placementTracker: {
        totalApplications:
          placementApplications.length,

        activeApplications:
          activePlacementApplications.length,

        placedApplications:
          placedApplications.length,

        rejectedApplications:
          rejectedApplications.length,

        offerApplications:
          offerApplications.length,

        stageCounts:
          placementStageCounts,

        upcomingRoundsCount:
          upcomingPlacementRounds.length,

        nextRound:
          nextPlacementRound
            ? {
                applicationId:
                  nextPlacementRound._id,

                currentStage:
                  nextPlacementRound.currentStage,

                nextRoundDate:
                  nextPlacementRound.nextRoundDate,

                companyName:
                  nextPlacementRound
                    .opportunity
                    ?.companyName ||
                  null,

                jobRole:
                  nextPlacementRound
                    .opportunity
                    ?.jobRole ||
                  null,

                opportunityTitle:
                  nextPlacementRound
                    .opportunity
                    ?.title ||
                  null,
              }
            : null,

        latestApplication:
          latestPlacementApplication
            ? {
                applicationId:
                  latestPlacementApplication._id,

                currentStage:
                  latestPlacementApplication.currentStage,

                isActive:
                  latestPlacementApplication.isActive,

                companyName:
                  latestPlacementApplication
                    .opportunity
                    ?.companyName ||
                  null,

                jobRole:
                  latestPlacementApplication
                    .opportunity
                    ?.jobRole ||
                  null,

                opportunityTitle:
                  latestPlacementApplication
                    .opportunity
                    ?.title ||
                  null,

                updatedAt:
                  latestPlacementApplication.updatedAt,
              }
            : null,
      },

      // ==============================
      // MODULE 6 - SKILL GAP
      // ==============================

      skillGap: {
        targetRole:
          goal?.targetRole || null,

        currentSkills:
          currentSkillNames,

        preferredSkills,

        missingSkills,

        weakAreas:
          skillGapWeakAreas,

        priorityAreas,

        recommendations:
          uniqueSkillGapRecommendations,
      },

      // ==============================
      // OVERALL DASHBOARD SUMMARY
      // ==============================

      summary: {
        totalSkills:
          skills.length,

        profileCompleted:
          !!profile,

        goalSet:
          !!goal,

        readinessCalculated:
          !!readiness,

        overallReadinessScore:
          readiness
            ? readiness.overallScore
            : 0,

        learningTopicsStarted:
          totalLearningTopicsStarted,

        learningTopicsCompleted:
          completedTopics,

        learningTopicsInProgress:
          inProgressTopics,

        averageLearningProgress:
          averageLearningProgress,

        practiceAttempts:
          totalPracticeAttempts,

        practiceAccuracy:
          practiceAccuracy,

        practiceAverageTimeSeconds:
          averagePracticeTime,

        practiceWeakAreas:
          practiceWeakAreas,

        practiceStrengths:
          practiceStrengths,

        // Skill Gap summary

        missingSkillsCount:
          missingSkills.length,

        weakAreasCount:
          skillGapWeakAreas.length,

        priorityAreasCount:
          priorityAreas.length,

        // Interview summary

        totalInterviewSessions:
          interviewSessions.length,

        completedInterviewSessions:
          completedInterviews.length,

        averageInterviewScore:
          averageInterviewScore,

        // GD summary

        totalGDSessions:
          gdSessions.length,

        completedGDSessions:
          gdPerformanceRecords.length,

        averageGDScore:
          averageGDScore,

        // Placement tracker summary

        totalPlacementApplications:
          placementApplications.length,

        activePlacementApplications:
          activePlacementApplications.length,

        placedApplications:
          placedApplications.length,

        rejectedApplications:
          rejectedApplications.length,

        offerApplications:
          offerApplications.length,

        upcomingPlacementRounds:
          upcomingPlacementRounds.length,
      },
    });

  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load student dashboard",

      error: error.message,
    });
  }
};

// ==============================
// CREATE / UPDATE STUDENT PROFILE
// ==============================

const saveStudentProfile = async (
  req,
  res
) => {
  try {
    const {
      phone,
      course,
      college,
      graduationYear,
      cgpa,
      backlogs,
      skills,
      location,
      bio,
    } = req.body;

    const profile =
      await StudentProfile.findOneAndUpdate(
        {
          user: req.user.id,
        },
        {
          user: req.user.id,
          phone,
          course,
          college,
          graduationYear,
          cgpa,
          backlogs,
          skills,
          location,
          bio,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      message:
        "Student profile saved successfully",

      profile,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to save student profile",

      error: error.message,
    });
  }
};

// ==============================
// GET STUDENT PROFILE
// ==============================

const getStudentProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await StudentProfile.findOne({
        user: req.user.id,
      }).populate(
        "user",
        "name email role"
      );

    if (!profile) {
      return res.status(404).json({
        message:
          "Student profile not found",
      });
    }

    res.status(200).json({
      message:
        "Student profile fetched successfully",

      profile,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch student profile",

      error: error.message,
    });
  }
};

module.exports = {
  getStudentDashboard,
  saveStudentProfile,
  getStudentProfile,
};