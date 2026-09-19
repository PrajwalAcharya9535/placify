const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

const StudentProfile = require(
  "../../models/StudentProfile"
);

const Skill = require(
  "../../models/Skill"
);

// ==============================
// NORMALIZE TEXT
// ==============================

const normalize = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// ==============================
// CALCULATE OPPORTUNITY MATCH
// ==============================

const getOpportunityMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const opportunityId = req.params.id;

    // ==============================
    // GET OPPORTUNITY
    // ==============================

    const opportunity =
      await PlacementOpportunity.findOne({
        _id: opportunityId,
        isActive: true,
        status: "Active",
      });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Placement opportunity not found",
      });
    }

    // ==============================
    // CHECK DEADLINE
    // ==============================

    if (
      opportunity.applicationDeadline <
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application deadline has expired",
      });
    }

    // ==============================
    // GET STUDENT DATA
    // ==============================

    const [profile, skills] =
      await Promise.all([
        StudentProfile.findOne({
          user: userId,
        }),

        Skill.find({
          user: userId,
        }),
      ]);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found. Complete your profile first.",
      });
    }

    // ==============================
    // STUDENT SKILL NAMES
    // ==============================

    const studentSkillNames = [
      ...new Set(
        skills
          .map((skill) =>
            normalize(skill.name)
          )
          .filter(Boolean)
      ),
    ];

    // ==============================
    // ELIGIBILITY CHECKS
    // ==============================

    const eligibilityChecks = [];

    // COURSE
    let courseEligible = true;

    if (
      opportunity.eligibleCourses.length > 0
    ) {
      courseEligible =
        opportunity.eligibleCourses.some(
          (course) =>
            normalize(course) ===
            normalize(profile.course)
        );
    }

    eligibilityChecks.push({
      criterion: "Course",
      eligible: courseEligible,
      studentValue:
        profile.course || null,
      requiredValue:
        opportunity.eligibleCourses,
    });

    // GRADUATION YEAR
    let graduationYearEligible = true;

    if (
      opportunity
        .eligibleGraduationYears.length > 0
    ) {
      graduationYearEligible =
        opportunity.eligibleGraduationYears.includes(
          profile.graduationYear
        );
    }

    eligibilityChecks.push({
      criterion: "Graduation Year",
      eligible: graduationYearEligible,
      studentValue:
        profile.graduationYear || null,
      requiredValue:
        opportunity.eligibleGraduationYears,
    });

    // CGPA
    const studentCGPA =
      Number(profile.cgpa) || 0;

    const minimumCGPA =
      Number(opportunity.minimumCGPA) || 0;

    const cgpaEligible =
      studentCGPA >= minimumCGPA;

    eligibilityChecks.push({
      criterion: "CGPA",
      eligible: cgpaEligible,
      studentValue: studentCGPA,
      requiredValue: minimumCGPA,
    });

    // BACKLOGS
    const studentBacklogs =
      Number(profile.backlogs) || 0;

    const maximumBacklogs =
      Number(
        opportunity.maximumBacklogs
      ) || 0;

    const backlogsEligible =
      studentBacklogs <= maximumBacklogs;

    eligibilityChecks.push({
      criterion: "Backlogs",
      eligible: backlogsEligible,
      studentValue: studentBacklogs,
      requiredValue: maximumBacklogs,
    });

    // ==============================
    // FINAL ACADEMIC ELIGIBILITY
    // ==============================

    const isEligible =
      eligibilityChecks.every(
        (check) => check.eligible
      );

    const failedEligibilityCriteria =
      eligibilityChecks
        .filter(
          (check) => !check.eligible
        )
        .map(
          (check) => check.criterion
        );

    // ==============================
    // REQUIRED SKILLS
    // ==============================

    const requiredSkills =
      opportunity.requiredSkills || [];

    const matchedRequiredSkills =
      requiredSkills.filter((skill) =>
        studentSkillNames.includes(
          normalize(skill)
        )
      );

    const missingRequiredSkills =
      requiredSkills.filter(
        (skill) =>
          !studentSkillNames.includes(
            normalize(skill)
          )
      );

    // ==============================
    // PREFERRED SKILLS
    // ==============================

    const preferredSkills =
      opportunity.preferredSkills || [];

    const matchedPreferredSkills =
      preferredSkills.filter((skill) =>
        studentSkillNames.includes(
          normalize(skill)
        )
      );

    const missingPreferredSkills =
      preferredSkills.filter(
        (skill) =>
          !studentSkillNames.includes(
            normalize(skill)
          )
      );

    // ==============================
    // MATCH SCORE
    // ==============================

    let requiredSkillScore = 100;

    if (requiredSkills.length > 0) {
      requiredSkillScore =
        (matchedRequiredSkills.length /
          requiredSkills.length) *
        100;
    }

    let preferredSkillScore = 100;

    if (preferredSkills.length > 0) {
      preferredSkillScore =
        (matchedPreferredSkills.length /
          preferredSkills.length) *
        100;
    }

    /*
      MATCH SCORE WEIGHTS

      Academic eligibility = 40%
      Required skills      = 40%
      Preferred skills     = 20%
    */

    const academicScore =
      (eligibilityChecks.filter(
        (check) => check.eligible
      ).length /
        eligibilityChecks.length) *
      100;

    const matchScore = Math.round(
      academicScore * 0.4 +
        requiredSkillScore * 0.4 +
        preferredSkillScore * 0.2
    );

    // ==============================
    // MATCH LEVEL
    // ==============================

    let matchLevel = "Low";

    if (matchScore >= 80) {
      matchLevel = "High";
    } else if (matchScore >= 60) {
      matchLevel = "Medium";
    }

    // ==============================
    // RESPONSE
    // ==============================

    res.status(200).json({
      success: true,

      message:
        "Opportunity eligibility and match calculated successfully",

      opportunity: {
        id: opportunity._id,
        title: opportunity.title,
        companyName:
          opportunity.companyName,
        jobRole: opportunity.jobRole,
        opportunityType:
          opportunity.opportunityType,
        location:
          opportunity.location,
        applicationDeadline:
          opportunity.applicationDeadline,
      },

      eligibility: {
        isEligible,
        checks: eligibilityChecks,
        failedCriteria:
          failedEligibilityCriteria,
      },

      skillMatch: {
        studentSkills:
          skills.map((skill) => ({
            name: skill.name,
            category: skill.category,
            level: skill.level,
            score: skill.score,
          })),

        required: {
          total:
            requiredSkills.length,
          matched:
            matchedRequiredSkills,
          missing:
            missingRequiredSkills,
          score:
            Math.round(
              requiredSkillScore
            ),
        },

        preferred: {
          total:
            preferredSkills.length,
          matched:
            matchedPreferredSkills,
          missing:
            missingPreferredSkills,
          score:
            Math.round(
              preferredSkillScore
            ),
        },
      },

      match: {
        score: matchScore,
        level: matchLevel,

        breakdown: {
          academicEligibility:
            Math.round(academicScore),

          requiredSkills:
            Math.round(
              requiredSkillScore
            ),

          preferredSkills:
            Math.round(
              preferredSkillScore
            ),
        },
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid placement opportunity ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to calculate opportunity match",
      error: error.message,
    });
  }
};

module.exports = {
  getOpportunityMatch,
};