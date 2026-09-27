const fs = require("fs");
const path = require("path");

const Resume = require("../../models/Resume");
const {
  reviewResume,
} = require("../../services/resumeAdvancedReviewService");

// ==============================
// BASIC HELPERS
// ==============================
const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanList = (value) => {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((item) => cleanText(item))
          .filter(Boolean)
      ),
    ];
  }

  if (typeof value === "string") {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => cleanText(item))
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

// ==============================
// SKILL NORMALIZATION
// ==============================
const normalizeSkill = (skill) => {
  return cleanText(skill).toLowerCase();
};

const SKILL_ALIAS_GROUPS = [
  ["html", "html5"],
  ["css", "css3"],
  ["react", "react.js", "reactjs"],
  ["node.js", "nodejs", "node js"],
  ["express.js", "expressjs", "express js"],
  [
    "rest api",
    "rest apis",
    "restful api",
    "restful apis",
  ],
  ["jwt", "jwt authentication"],
  [
    "data structures",
    "data structure",
    "dsa",
  ],
  ["mern", "mern stack"],
];

const areSkillAliases = (
  firstSkill,
  secondSkill
) => {
  const first =
    normalizeSkill(firstSkill);

  const second =
    normalizeSkill(secondSkill);

  if (!first || !second) {
    return false;
  }

  if (first === second) {
    return true;
  }

  return SKILL_ALIAS_GROUPS.some(
    (group) =>
      group.includes(first) &&
      group.includes(second)
  );
};

// ==============================
// ADD SKILLS WITHOUT DUPLICATES
// ==============================
const mergeConfirmedSkills = (
  existingSkills = [],
  confirmedSkills = []
) => {
  const merged = [
    ...existingSkills,
  ];

  confirmedSkills.forEach(
    (skill) => {
      const value =
        cleanText(skill);

      if (!value) {
        return;
      }

      const exists =
        merged.some(
          (existingSkill) =>
            areSkillAliases(
              existingSkill,
              value
            )
        );

      if (!exists) {
        merged.push(value);
      }
    }
  );

  return merged;
};

// ==============================
// FIND IMPROVEMENT FIELD
// ==============================
const findImprovementField = (
  resume,
  key
) => {
  return (
    resume.advancedReview
      ?.improvementFields || []
  ).find(
    (field) =>
      field.key === key
  );
};

// ==============================
// UPDATE FIELD STATUS
// ==============================
const updateImprovementField = (
  resume,
  key,
  value
) => {
  const field =
    findImprovementField(
      resume,
      key
    );

  if (!field) {
    return;
  }

  field.studentValue =
    Array.isArray(value)
      ? value.join(", ")
      : cleanText(value);

  field.status =
    field.studentValue
      ? "Provided"
      : field.required
        ? "Missing"
        : "Skipped";
};

// ==============================
// SAVE RESUME IMPROVEMENTS
// ==============================
const saveResumeImprovements =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const resume =
        await Resume.findOne({
          user: userId,
        });

      if (!resume) {
        return res
          .status(404)
          .json({
            message:
              "Resume not found. Upload your resume first.",
          });
      }

      if (
        resume.advancedReview
          ?.reviewStatus !==
        "Reviewed"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Complete the advanced resume review before submitting improvements",
          });
      }

      const {
        contactName,
        contactEmail,
        contactPhone,
        portfolio,
        professionalSummary,
        languages,
        projectImpact,
        confirmedTargetSkills,
      } = req.body;

      // ==============================
      // CONTACT NAME
      // ==============================
      if (
        contactName !==
        undefined
      ) {
        const value =
          cleanText(
            contactName
          );

        if (value) {
          resume.contact.name =
            value;
        }

        updateImprovementField(
          resume,
          "contactName",
          value
        );
      }

      // ==============================
      // CONTACT EMAIL
      // ==============================
      if (
        contactEmail !==
        undefined
      ) {
        const value =
          cleanText(
            contactEmail
          );

        if (
          value &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Please provide a valid email address",
            });
        }

        if (value) {
          resume.contact.email =
            value;
        }

        updateImprovementField(
          resume,
          "contactEmail",
          value
        );
      }

      // ==============================
      // CONTACT PHONE
      // ==============================
      if (
        contactPhone !==
        undefined
      ) {
        const value =
          cleanText(
            contactPhone
          );

        if (value) {
          resume.contact.phone =
            value;
        }

        updateImprovementField(
          resume,
          "contactPhone",
          value
        );
      }

      // ==============================
      // PORTFOLIO
      // ==============================
      if (
        portfolio !== undefined
      ) {
        const value =
          cleanText(portfolio);

        if (value) {
          try {
            const parsedUrl =
              new URL(value);

            if (
              ![
                "http:",
                "https:",
              ].includes(
                parsedUrl.protocol
              )
            ) {
              throw new Error(
                "Invalid protocol"
              );
            }
          } catch {
            return res
              .status(400)
              .json({
                message:
                  "Please provide a valid portfolio URL starting with http:// or https://",
              });
          }

          resume.contact.portfolio =
            value;
        }

        updateImprovementField(
          resume,
          "portfolio",
          value
        );
      }

      // ==============================
      // PROFESSIONAL SUMMARY
      // ==============================
      if (
        professionalSummary !==
        undefined
      ) {
        const value =
          cleanText(
            professionalSummary
          );

        if (value) {
          resume.summary =
            value;

          resume.sectionPresence.summary =
            true;
        }

        updateImprovementField(
          resume,
          "professionalSummary",
          value
        );
      }

      // ==============================
      // LANGUAGES
      // ==============================
      if (
        languages !==
        undefined
      ) {
        const values =
          cleanList(languages);

        if (values.length) {
          resume.languages =
            values;

          resume.sectionPresence.languages =
            true;
        }

        updateImprovementField(
          resume,
          "languages",
          values
        );
      }

      // ==============================
      // PROJECT IMPACT
      //
      // IMPORTANT:
      // Store the student's answer in
      // the improvement field.
      //
      // Do NOT automatically rewrite
      // the original extracted project
      // text because we do not yet know
      // which project the impact belongs
      // to.
      // ==============================
      if (
        projectImpact !==
        undefined
      ) {
        const value =
          cleanText(
            projectImpact
          );

        updateImprovementField(
          resume,
          "projectImpact",
          value
        );
      }

      // ==============================
      // CONFIRMED TARGET SKILLS
      //
      // Student explicitly confirms
      // these skills are genuinely
      // possessed before they are added.
      // ==============================
      if (
        confirmedTargetSkills !==
        undefined
      ) {
        const values =
          cleanList(
            confirmedTargetSkills
          );

        resume.extractedSkills =
          mergeConfirmedSkills(
            resume.extractedSkills ||
              [],
            values
          );

        if (values.length) {
          resume.sectionPresence.skills =
            true;
        }

        updateImprovementField(
          resume,
          "confirmedTargetSkills",
          values
        );
      }

      // ==============================
      // IMPROVED RESUME IS NOW STALE
      //
      // If student changes information,
      // any previously generated resume
      // must be generated again.
      // ==============================

const previousGeneratedFileName =
  resume.improvedResume
    ?.generatedFileName;

if (previousGeneratedFileName) {
  const safeFileName =
    path.basename(
      previousGeneratedFileName
    );

  const generatedResumeDirectory =
    path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      "generated-resumes"
    );

  const previousGeneratedFilePath =
    path.join(
      generatedResumeDirectory,
      safeFileName
    );

  if (
    fs.existsSync(
      previousGeneratedFilePath
    )
  ) {
    fs.unlinkSync(
      previousGeneratedFilePath
    );
  }
}

      resume.improvedResume = {
        template:
          resume.improvedResume
            ?.template ||
          "Classic ATS",

        generated: false,

        generatedFileName: "",

        generatedFileUrl: "",

        generatedFileType: "",

        generatedAt: null,
      };
// ==============================
// REFRESH ADVANCED REVIEW
//
// Resume data may have changed after
// the student submitted improvements.
// Recalculate the review so scores,
// section reviews and suggestions reflect
// the latest verified resume data.
// ==============================


const previousImprovementValues =
  new Map(
    (
      resume.advancedReview
        ?.improvementFields || []
    ).map((field) => [
      field.key,
      {
        studentValue:
          field.studentValue || "",
        status:
          field.status || "",
      },
    ])
  );

const refreshedReview =
  reviewResume({
    resume,
  });

if (!refreshedReview.success) {
  return res.status(500).json({
    message:
      "Resume improvements were processed but the advanced review could not be refreshed",

    error:
      refreshedReview.errorMessage ||
      "Advanced review refresh failed",
  });
}


refreshedReview.data.improvementFields =
  (
    refreshedReview.data
      .improvementFields || []
  ).map((field) => {
    const previous =
      previousImprovementValues.get(
        field.key
      );

    if (
      previous?.studentValue
    ) {
      field.studentValue =
        previous.studentValue;

      field.status = "Provided";
    }

    return field;
  });

resume.advancedReview =
  refreshedReview.data;
      await resume.save();

      return res
        .status(200)
        .json({
          message:
            "Resume improvements saved successfully",

          improvements:
            resume.advancedReview
              .improvementFields,

          updatedResume: {
            contact:
              resume.contact,

            summary:
              resume.summary,

            skills:
              resume.extractedSkills,

            languages:
              resume.languages,

            projects:
              resume.projects,

            improvedResume:
              resume.improvedResume,
          },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          message:
            "Failed to save resume improvements",

          error:
            error.message,
        });
    }
  };

module.exports = {
  saveResumeImprovements,
};