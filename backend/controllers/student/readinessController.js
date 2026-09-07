const StudentProfile = require("../../models/StudentProfile");
const Skill = require("../../models/Skill");
const StudentGoal = require("../../models/StudentGoal");
const Readiness = require("../../models/Readiness");
const Resume = require("../../models/Resume");

const PracticeAttempt = require("../../models/PracticeAttempt");
const CodingAttempt = require("../../models/CodingAttempt");
const SqlAttempt = require("../../models/SqlAttempt");
const DebuggingAttempt = require("../../models/DebuggingAttempt");
const MockAttempt = require("../../models/MockAttempt");

// ==============================
// CALCULATE PLACEMENT READINESS
// ==============================
const calculateReadiness = async (req, res) => {
  try {
    const userId = req.user.id;

    // ==============================
    // FETCH STUDENT DATA
    // ==============================
    const profile = await StudentProfile.findOne({
      user: userId,
    });

    const skills = await Skill.find({
      user: userId,
    });

    const goal = await StudentGoal.findOne({
      user: userId,
    });

    const resume = await Resume.findOne({
      user: userId,
    });

    const practiceAttempts = await PracticeAttempt.find({
      user: userId,
    });

    const codingAttempts = await CodingAttempt.find({
      user: userId,
    });

    const sqlAttempts = await SqlAttempt.find({
      user: userId,
    });

    const debuggingAttempts = await DebuggingAttempt.find({
      user: userId,
    });

    const mockAttempts = await MockAttempt.find({
      user: userId,
      status: "Completed",
    });

    // ==============================
    // SCORE VARIABLES
    // ==============================
    let profileScore = 0;
    let skillScore = 0;
    let goalScore = 0;
    let atsScore = 0;

    let mcqScore = 0;
    let codingScore = 0;
    let sqlScore = 0;
    let debuggingScore = 0;

    let practiceScore = 0;
    let mockScore = 0;

    const weakAreas = [];
    const strengths = [];
    const recommendations = [];

    // ==============================
    // PROFILE SCORE
    // ==============================
    if (profile) {
      let completedFields = 0;

      if (profile.phone) {
        completedFields++;
      }

      if (profile.course) {
        completedFields++;
      }

      if (profile.college) {
        completedFields++;
      }

      if (profile.graduationYear) {
        completedFields++;
      }

      if (profile.cgpa !== undefined) {
        completedFields++;
      }

      if (profile.location) {
        completedFields++;
      }

      if (profile.bio) {
        completedFields++;
      }

      profileScore = Math.round(
        (completedFields / 7) * 100
      );

      if (profileScore >= 70) {
        strengths.push(
          "Profile completion"
        );
      } else {
        weakAreas.push(
          "Incomplete profile"
        );

        recommendations.push(
          "Complete your student profile"
        );
      }
    } else {
      weakAreas.push(
        "Student profile not created"
      );

      recommendations.push(
        "Create your student profile"
      );
    }

    // ==============================
    // SKILL SCORE
    // ==============================
    if (skills.length > 0) {
      let totalSkillScore = 0;

      skills.forEach((skill) => {
        if (skill.level === "Beginner") {
          totalSkillScore += 40;
        } else if (
          skill.level === "Intermediate"
        ) {
          totalSkillScore += 70;
        } else if (
          skill.level === "Advanced"
        ) {
          totalSkillScore += 100;
        }
      });

      skillScore = Math.round(
        totalSkillScore /
          skills.length
      );

      if (skillScore >= 70) {
        strengths.push(
          "Technical skills"
        );
      } else {
        weakAreas.push(
          "Technical skills"
        );

        recommendations.push(
          "Improve your technical skills through regular practice"
        );
      }
    } else {
      weakAreas.push(
        "No skills added"
      );

      recommendations.push(
        "Add your technical and placement skills"
      );
    }

    // ==============================
    // GOAL SCORE
    // ==============================
    if (goal) {
      let completedGoalFields = 0;

      if (goal.targetRole) {
        completedGoalFields++;
      }

      if (
        goal.targetCompanies &&
        goal.targetCompanies.length > 0
      ) {
        completedGoalFields++;
      }

      if (
        goal.preferredSkills &&
        goal.preferredSkills.length > 0
      ) {
        completedGoalFields++;
      }

      if (goal.preferredLocation) {
        completedGoalFields++;
      }

      if (goal.targetPackage) {
        completedGoalFields++;
      }

      if (goal.preparationGoal) {
        completedGoalFields++;
      }

      goalScore = Math.round(
        (completedGoalFields / 6) *
          100
      );

      if (goalScore >= 70) {
        strengths.push(
          "Placement goal clarity"
        );
      } else {
        weakAreas.push(
          "Placement goals"
        );

        recommendations.push(
          "Complete your placement goals and preferences"
        );
      }
    } else {
      weakAreas.push(
        "Placement goal not set"
      );

      recommendations.push(
        "Set your placement goal"
      );
    }

    // ==============================
    // RESUME & ATS SCORE
    // ==============================
    if (
      resume &&
      resume.analysisStatus === "Analyzed"
    ) {
      atsScore = Number(
        resume.atsScore || 0
      );

      if (atsScore >= 80) {
        strengths.push(
          "Resume and ATS compatibility"
        );
      } else if (atsScore < 60) {
        weakAreas.push(
          "Resume ATS compatibility"
        );

        recommendations.push(
          "Improve your resume based on ATS suggestions and missing job-related skills"
        );
      } else {
        recommendations.push(
          "Improve your resume keyword and skill alignment to increase your ATS score"
        );
      }

      if (
        resume.missingSkills &&
        resume.missingSkills.length > 0
      ) {
        recommendations.push(
          `Review ATS skill gaps: ${resume.missingSkills.join(
            ", "
          )}`
        );
      }
    } else if (resume) {
      weakAreas.push(
        "Resume not analyzed"
      );

      recommendations.push(
        "Run ATS analysis on your uploaded resume"
      );
    } else {
      weakAreas.push(
        "Resume not uploaded"
      );

      recommendations.push(
        "Upload your resume and complete ATS analysis"
      );
    }

    // ==============================
    // MCQ PRACTICE SCORE
    // ==============================
    if (practiceAttempts.length > 0) {
      const correctAttempts =
        practiceAttempts.filter(
          (attempt) =>
            attempt.isCorrect === true
        ).length;

      mcqScore = Math.round(
        (correctAttempts /
          practiceAttempts.length) *
          100
      );

      if (mcqScore >= 80) {
        strengths.push(
          "MCQ practice performance"
        );
      } else if (mcqScore < 60) {
        weakAreas.push(
          "MCQ practice"
        );

        recommendations.push(
          "Improve aptitude, reasoning, verbal and technical practice accuracy"
        );
      }
    } else {
      weakAreas.push(
        "No MCQ practice attempts"
      );

      recommendations.push(
        "Start solving placement practice questions"
      );
    }

    // ==============================
    // CODING SCORE
    // ==============================
    if (codingAttempts.length > 0) {
      codingScore = Math.round(
        codingAttempts.reduce(
          (total, attempt) =>
            total +
            Number(
              attempt.scorePercentage ||
                0
            ),
          0
        ) / codingAttempts.length
      );

      if (codingScore >= 80) {
        strengths.push(
          "Coding performance"
        );
      } else if (codingScore < 60) {
        weakAreas.push(
          "Coding"
        );

        recommendations.push(
          "Practice coding problems and improve test case accuracy"
        );
      }
    } else {
      weakAreas.push(
        "No coding attempts"
      );

      recommendations.push(
        "Start solving Coding Lab problems"
      );
    }

    // ==============================
    // SQL SCORE
    // ==============================
    if (sqlAttempts.length > 0) {
      sqlScore = Math.round(
        sqlAttempts.reduce(
          (total, attempt) =>
            total +
            Number(
              attempt.scorePercentage ||
                0
            ),
          0
        ) / sqlAttempts.length
      );

      if (sqlScore >= 80) {
        strengths.push(
          "SQL performance"
        );
      } else if (sqlScore < 60) {
        weakAreas.push(
          "SQL"
        );

        recommendations.push(
          "Practice SQL queries and improve query accuracy"
        );
      }
    } else {
      weakAreas.push(
        "No SQL attempts"
      );

      recommendations.push(
        "Start solving SQL Lab problems"
      );
    }

    // ==============================
    // DEBUGGING SCORE
    // ==============================
    if (debuggingAttempts.length > 0) {
      debuggingScore =
        Math.round(
          debuggingAttempts.reduce(
            (total, attempt) =>
              total +
              Number(
                attempt.scorePercentage ||
                  0
              ),
            0
          ) /
            debuggingAttempts.length
        );

      if (debuggingScore >= 80) {
        strengths.push(
          "Debugging performance"
        );
      } else if (
        debuggingScore < 60
      ) {
        weakAreas.push(
          "Debugging"
        );

        recommendations.push(
          "Practice identifying and fixing programming errors"
        );
      }
    } else {
      weakAreas.push(
        "No debugging attempts"
      );

      recommendations.push(
        "Start solving Debugging Lab problems"
      );
    }

    // ==============================
    // COMBINED PRACTICE SCORE
    // ==============================
    const availablePracticeScores = [];

    if (practiceAttempts.length > 0) {
      availablePracticeScores.push(
        mcqScore
      );
    }

    if (codingAttempts.length > 0) {
      availablePracticeScores.push(
        codingScore
      );
    }

    if (sqlAttempts.length > 0) {
      availablePracticeScores.push(
        sqlScore
      );
    }

    if (debuggingAttempts.length > 0) {
      availablePracticeScores.push(
        debuggingScore
      );
    }

    if (
      availablePracticeScores.length >
      0
    ) {
      practiceScore = Math.round(
        availablePracticeScores.reduce(
          (total, score) =>
            total + score,
          0
        ) /
          availablePracticeScores.length
      );

      if (practiceScore >= 80) {
        strengths.push(
          "Overall practice performance"
        );
      } else if (
        practiceScore < 60
      ) {
        weakAreas.push(
          "Overall practice performance"
        );

        recommendations.push(
          "Increase regular practice across MCQ, Coding, SQL and Debugging"
        );
      }
    }

    // ==============================
    // MOCK PLACEMENT SCORE
    // ==============================
    if (mockAttempts.length > 0) {
      mockScore = Math.round(
        mockAttempts.reduce(
          (total, attempt) =>
            total +
            Number(
              attempt.overallPercentage ||
                0
            ),
          0
        ) / mockAttempts.length
      );

      if (mockScore >= 80) {
        strengths.push(
          "Mock placement performance"
        );
      } else if (mockScore < 60) {
        weakAreas.push(
          "Mock placement performance"
        );

        recommendations.push(
          "Take more mock placement tests and improve your round-wise performance"
        );
      } else {
        recommendations.push(
          "Continue mock placement practice to improve placement readiness"
        );
      }
    } else {
      weakAreas.push(
        "No completed mock placement tests"
      );

      recommendations.push(
        "Complete a mock placement test to measure your real placement preparation"
      );
    }

    // ==============================
    // OVERALL READINESS SCORE
    // ==============================
    /*
      Profile         = 10%
      Skills          = 25%
      Goals           = 10%
      Practice        = 25%
      Mock Placement  = 20%
      Resume ATS      = 10%

      Total           = 100%
    */

    const overallScore =
      Math.round(
        profileScore * 0.1 +
        skillScore * 0.25 +
        goalScore * 0.1 +
        practiceScore * 0.25 +
        mockScore * 0.2 +
        atsScore * 0.1
      );

    // ==============================
    // READINESS LEVEL
    // ==============================
    let readinessLevel =
      "Not Ready";

    if (overallScore >= 85) {
      readinessLevel =
        "Highly Ready";
    } else if (overallScore >= 70) {
      readinessLevel =
        "Placement Ready";
    } else if (overallScore >= 50) {
      readinessLevel =
        "Developing";
    } else if (overallScore >= 25) {
      readinessLevel =
        "Beginner";
    }

    // ==============================
    // SAVE READINESS
    // ==============================
    const readiness =
      await Readiness.findOneAndUpdate(
        {
          user: userId,
        },
        {
          user: userId,

          overallScore,

          profileScore,
          skillScore,
          goalScore,

          atsScore,

          practiceScore,

          codingScore,
          sqlScore,
          debuggingScore,

          mockScore,

          weakAreas,
          strengths,
          recommendations,

          readinessLevel,

          lastCalculatedAt:
            new Date(),
        },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
        }
      );

    // ==============================
    // RESPONSE
    // ==============================
    res.status(200).json({
      message:
        "Placement readiness calculated successfully",

      readiness,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to calculate placement readiness",

      error:
        error.message,
    });
  }
};

// ==============================
// GET PLACEMENT READINESS
// ==============================
const getReadiness = async (req, res) => {
  try {
    const readiness =
      await Readiness.findOne({
        user: req.user.id,
      });

    if (!readiness) {
      return res.status(404).json({
        message:
          "Placement readiness not calculated yet",
      });
    }

    res.status(200).json({
      message:
        "Placement readiness fetched successfully",

      readiness,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch placement readiness",

      error:
        error.message,
    });
  }
};

module.exports = {
  calculateReadiness,
  getReadiness,
};