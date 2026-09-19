const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

const StudentProfile = require(
  "../../models/StudentProfile"
);

const Skill = require(
  "../../models/Skill"
);

const StudentGoal = require(
  "../../models/StudentGoal"
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
// CALCULATE SKILL SCORE
// ==============================

const calculateSkillScore = (
  opportunitySkills,
  studentSkillNames
) => {
  if (!opportunitySkills.length) {
    return {
      score: 100,
      matched: [],
      missing: [],
    };
  }

  const matched = opportunitySkills.filter(
    (skill) =>
      studentSkillNames.includes(
        normalize(skill)
      )
  );

  const missing = opportunitySkills.filter(
    (skill) =>
      !studentSkillNames.includes(
        normalize(skill)
      )
  );

  const score = Math.round(
    (matched.length /
      opportunitySkills.length) *
      100
  );

  return {
    score,
    matched,
    missing,
  };
};

// ==============================
// GET PERSONALIZED RECOMMENDATIONS
// ==============================

const getOpportunityRecommendations = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    // ==============================
    // GET STUDENT DATA
    // ==============================

    const [profile, skills, goal] =
      await Promise.all([
        StudentProfile.findOne({
          user: userId,
        }),

        Skill.find({
          user: userId,
        }),

        StudentGoal.findOne({
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
    // GET ACTIVE OPPORTUNITIES
    // ==============================

    const opportunities =
      await PlacementOpportunity.find({
        isActive: true,
        status: "Active",
        applicationDeadline: {
          $gte: new Date(),
        },
      }).sort({
        applicationDeadline: 1,
      });

    // ==============================
    // STUDENT SKILLS
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

    const recommendations = [];

    // ==============================
    // PROCESS EACH OPPORTUNITY
    // ==============================

    for (const opportunity of opportunities) {
      const eligibilityChecks = [];

      // ==============================
      // COURSE
      // ==============================

      let courseEligible = true;

      if (
        opportunity.eligibleCourses
          .length > 0
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
      });

      // ==============================
      // GRADUATION YEAR
      // ==============================

      let graduationYearEligible = true;

      if (
        opportunity
          .eligibleGraduationYears
          .length > 0
      ) {
        graduationYearEligible =
          opportunity.eligibleGraduationYears.includes(
            profile.graduationYear
          );
      }

      eligibilityChecks.push({
        criterion: "Graduation Year",
        eligible:
          graduationYearEligible,
      });

      // ==============================
      // CGPA
      // ==============================

      const cgpaEligible =
        Number(profile.cgpa || 0) >=
        Number(
          opportunity.minimumCGPA || 0
        );

      eligibilityChecks.push({
        criterion: "CGPA",
        eligible: cgpaEligible,
      });

      // ==============================
      // BACKLOGS
      // ==============================

      const backlogsEligible =
        Number(profile.backlogs || 0) <=
        Number(
          opportunity.maximumBacklogs ||
            0
        );

      eligibilityChecks.push({
        criterion: "Backlogs",
        eligible: backlogsEligible,
      });

      const isEligible =
        eligibilityChecks.every(
          (check) => check.eligible
        );

      const failedCriteria =
        eligibilityChecks
          .filter(
            (check) => !check.eligible
          )
          .map(
            (check) => check.criterion
          );

      // ==============================
      // ACADEMIC SCORE
      // ==============================

      const academicScore = Math.round(
        (eligibilityChecks.filter(
          (check) => check.eligible
        ).length /
          eligibilityChecks.length) *
          100
      );

      // ==============================
      // REQUIRED SKILLS
      // ==============================

      const requiredSkillMatch =
        calculateSkillScore(
          opportunity.requiredSkills || [],
          studentSkillNames
        );

      // ==============================
      // PREFERRED SKILLS
      // ==============================

      const preferredSkillMatch =
        calculateSkillScore(
          opportunity.preferredSkills || [],
          studentSkillNames
        );

      // ==============================
      // BASE MATCH SCORE
      // ==============================

      const baseMatchScore = Math.round(
        academicScore * 0.4 +
          requiredSkillMatch.score * 0.4 +
          preferredSkillMatch.score *
            0.2
      );

      // ==============================
      // GOAL / PREFERENCE MATCH
      // ==============================

      let goalPoints = 0;

      const goalReasons = [];

      if (goal) {
        // TARGET ROLE
        if (
          goal.targetRole &&
          (
            normalize(
              opportunity.jobRole
            ).includes(
              normalize(goal.targetRole)
            ) ||
            normalize(
              goal.targetRole
            ).includes(
              normalize(
                opportunity.jobRole
              )
            )
          )
        ) {
          goalPoints += 40;

          goalReasons.push(
            "Matches your target role"
          );
        }

        // TARGET COMPANY
        if (
          goal.targetCompanies?.some(
            (company) =>
              normalize(company) ===
              normalize(
                opportunity.companyName
              )
          )
        ) {
          goalPoints += 25;

          goalReasons.push(
            "Matches one of your target companies"
          );
        }

        // PREFERRED LOCATION
        if (
          goal.preferredLocation &&
          normalize(
            goal.preferredLocation
          ) ===
            normalize(
              opportunity.location
            )
        ) {
          goalPoints += 20;

          goalReasons.push(
            "Matches your preferred location"
          );
        }

        // PREFERRED SKILLS
        if (
          goal.preferredSkills?.length
        ) {
          const opportunitySkillSet =
            [
              ...(
                opportunity.requiredSkills ||
                []
              ),
              ...(
                opportunity.preferredSkills ||
                []
              ),
            ].map(normalize);

          const goalSkillMatches =
            goal.preferredSkills.filter(
              (skill) =>
                opportunitySkillSet.includes(
                  normalize(skill)
                )
            );

          if (
            goalSkillMatches.length > 0
          ) {
            goalPoints += 15;

            goalReasons.push(
              "Matches your preferred career skills"
            );
          }
        }
      }

      // Goal score maximum = 100
      const goalScore = Math.min(
        goalPoints,
        100
      );

      // ==============================
      // RECOMMENDATION SCORE
      // ==============================

      /*
        Base opportunity fit = 80%
        Career goal match     = 20%
      */

      const recommendationScore =
        Math.round(
          baseMatchScore * 0.8 +
            goalScore * 0.2
        );

      // ==============================
      // MATCH LEVEL
      // ==============================

      let matchLevel = "Low";

      if (baseMatchScore >= 80) {
        matchLevel = "High";
      } else if (
        baseMatchScore >= 60
      ) {
        matchLevel = "Medium";
      }

      // ==============================
      // RECOMMENDATION LEVEL
      // ==============================

      let recommendationLevel =
        "Low";

      if (
        recommendationScore >= 80
      ) {
        recommendationLevel =
          "Highly Recommended";
      } else if (
        recommendationScore >= 60
      ) {
        recommendationLevel =
          "Recommended";
      } else if (
        recommendationScore >= 40
      ) {
        recommendationLevel =
          "Possible Match";
      }

      // ==============================
      // ADD RESULT
      // ==============================

      recommendations.push({
        opportunity: {
          id: opportunity._id,
          title: opportunity.title,
          companyName:
            opportunity.companyName,
          jobRole:
            opportunity.jobRole,
          opportunityType:
            opportunity.opportunityType,
          location:
            opportunity.location,
          workMode:
            opportunity.workMode,
          salaryMin:
            opportunity.salaryMin,
          salaryMax:
            opportunity.salaryMax,
          stipend:
            opportunity.stipend,
          applicationDeadline:
            opportunity.applicationDeadline,
        },

        eligibility: {
          isEligible,
          failedCriteria,
        },

        skillMatch: {
          required: {
            score:
              requiredSkillMatch.score,
            matched:
              requiredSkillMatch.matched,
            missing:
              requiredSkillMatch.missing,
          },

          preferred: {
            score:
              preferredSkillMatch.score,
            matched:
              preferredSkillMatch.matched,
            missing:
              preferredSkillMatch.missing,
          },
        },

        opportunityMatch: {
          score: baseMatchScore,
          level: matchLevel,
        },

        careerGoalMatch: {
          score: goalScore,
          reasons: goalReasons,
        },

        recommendation: {
          score:
            recommendationScore,
          level:
            recommendationLevel,
        },
      });
    }

    // ==============================
    // SORT RECOMMENDATIONS
    // ==============================

    recommendations.sort(
      (a, b) => {
        // Eligible opportunities first
        if (
          a.eligibility.isEligible !==
          b.eligibility.isEligible
        ) {
          return a.eligibility
            .isEligible
            ? -1
            : 1;
        }

        // Higher recommendation score first
        return (
          b.recommendation.score -
          a.recommendation.score
        );
      }
    );

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      success: true,

      message:
        "Personalized placement opportunity recommendations fetched successfully",

      studentGoal: goal
        ? {
            targetRole:
              goal.targetRole || null,

            targetCompanies:
              goal.targetCompanies || [],

            preferredSkills:
              goal.preferredSkills || [],

            preferredLocation:
              goal.preferredLocation ||
              null,

            targetPackage:
              goal.targetPackage || null,
          }
        : null,

      totalOpportunities:
        recommendations.length,

      eligibleOpportunities:
        recommendations.filter(
          (item) =>
            item.eligibility.isEligible
        ).length,

      recommendations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch personalized opportunity recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  getOpportunityRecommendations,
};