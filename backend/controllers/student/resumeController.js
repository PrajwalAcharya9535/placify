const fs = require("fs");
const path = require("path");

const Resume = require("../../models/Resume");

const {
  extractResumeText,
} = require("../../services/resumeTextExtractionService");

const {
  extractStructuredResume,
} = require("../../services/resumeStructuredExtractionService");

const {
  analyzeResume,
} = require("../../services/atsAnalysisService");

const {
  reviewResume,
} = require("../../services/resumeAdvancedReviewService");

// ==============================
// NORMALIZE SKILL FOR COMPARISON
// ==============================
const normalizeSkill = (skill) => {
  return String(skill || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

// ==============================
// SKILL ALIAS GROUPS
// Used only while merging ATS skills
// with richer structured skills.
// ==============================
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

// ==============================
// CHECK IF TWO SKILLS ARE ALIASES
// ==============================
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
// MERGE STRUCTURED + ATS SKILLS
// ==============================
const mergeResumeSkills = (
  structuredSkills = [],
  atsSkills = []
) => {
  const merged = [];

  structuredSkills.forEach(
    (skill) => {
      const value =
        String(skill || "").trim();

      if (!value) {
        return;
      }

      const alreadyExists =
        merged.some(
          (existingSkill) =>
            areSkillAliases(
              existingSkill,
              value
            )
        );

      if (!alreadyExists) {
        merged.push(value);
      }
    }
  );

  atsSkills.forEach(
    (skill) => {
      const value =
        String(skill || "").trim();

      if (!value) {
        return;
      }

      const alreadyExists =
        merged.some(
          (existingSkill) =>
            areSkillAliases(
              existingSkill,
              value
            )
        );

      if (!alreadyExists) {
        merged.push(value);
      }
    }
  );

  return merged;
};

// ==============================
// CREATE / UPDATE RESUME
// ==============================
const saveResumeDetails = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      targetRole,
      targetCompany,
      jobDescription,
    } = req.body;

    const updateData = {
      user: userId,

      targetRole:
        targetRole || "",

      targetCompany:
        targetCompany || "",

      jobDescription:
        jobDescription || "",

      analysisStatus:
        "Not Analyzed",

      analyzedAt:
        null,
    };

    // ==============================
    // ACTUAL UPLOADED PDF
    // ==============================
    if (req.file) {
      updateData.fileName =
        req.file.filename;

      updateData.fileUrl =
        `/uploads/resumes/${req.file.filename}`;

      updateData.fileType =
        req.file.mimetype;

      // ==============================
      // RESET EXTRACTION STATUS
      // ==============================
      updateData.extractionStatus =
        "Not Extracted";

      updateData.extractedAt =
        null;

      // ==============================
      // RESET ADVANCED REVIEW
      // ==============================
      updateData.advancedReview = {
        reviewStatus:
          "Not Reviewed",

        reviewedAt:
          null,
      };

      // ==============================
      // EXTRACT PDF TEXT
      // ==============================
      const extractionResult =
        await extractResumeText(
          req.file.path
        );

      if (!extractionResult.success) {
        return res.status(400).json({
          message:
            "Resume uploaded but text extraction failed",

          error:
            extractionResult.errorMessage,
        });
      }

      updateData.extractedText =
        extractionResult.text;

      updateData.pageCount =
        extractionResult.pages || 0;

      // ==============================
      // STRUCTURED EXTRACTION
      // ==============================
      const structuredResult =
        extractStructuredResume({
          resumeText:
            extractionResult.text,

          pageCount:
            extractionResult.pages ||
            0,
        });

      if (!structuredResult.success) {
        updateData.extractionStatus =
          "Failed";

        updateData.extractedAt =
          null;
      } else {
        const structured =
          structuredResult.data;

        updateData.contact =
          structured.contact;

        updateData.summary =
          structured.summary;

        updateData.extractedSkills =
          structured.skills;

        updateData.education =
          structured.education;

        updateData.projects =
          structured.projects;

        updateData.internships =
          structured.internships;

        updateData.experience =
          structured.experience;

        updateData.certifications =
          structured.certifications;

        updateData.achievements =
          structured.achievements;

        updateData.languages =
          structured.languages;

        updateData.interests =
          structured.interests;

        updateData.sectionPresence =
          structured.sectionPresence;

        updateData.detectedSections =
          structured.detectedSections;

        updateData.extractedLineCount =
          structured.lineCount;

        updateData.extractionStatus =
          "Extracted";

        updateData.extractedAt =
          new Date();
      }
    }

    const resume =
      await Resume.findOneAndUpdate(
        {
          user: userId,
        },
        updateData,
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      message:
        req.file
          ? "Resume uploaded and structured information extracted successfully"
          : "Resume details saved successfully",

      resume,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to save resume",

      error:
        error.message,
    });
  }
};

// ==============================
// ANALYZE RESUME / ATS
// ==============================
const analyzeStudentResume = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const resume =
      await Resume.findOne({
        user: userId,
      });

    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found. Upload your resume first.",
      });
    }

    if (
      !resume.extractedText ||
      !resume.extractedText.trim()
    ) {
      return res.status(400).json({
        message:
          "Resume text is not available. Upload a readable PDF resume first.",
      });
    }

    if (
      !resume.jobDescription ||
      !resume.jobDescription.trim()
    ) {
      return res.status(400).json({
        message:
          "Job description is required for ATS analysis",
      });
    }

    // ==============================
    // RUN ATS ANALYSIS
    // ==============================
    const analysis =
      analyzeResume({
        resumeText:
          resume.extractedText,

        jobDescription:
          resume.jobDescription,
      });

    // ==============================
    // SAVE ANALYSIS
    // ==============================
    resume.atsScore =
      analysis.atsScore;

    resume.keywordScore =
      analysis.keywordScore;

    resume.skillMatchScore =
      analysis.skillMatchScore;

    resume.completenessScore =
      analysis.completenessScore;

    // ==============================
    // MERGE SKILLS WITHOUT DUPLICATES
    // ==============================
    resume.extractedSkills =
      mergeResumeSkills(
        resume.extractedSkills || [],
        analysis.extractedSkills || []
      );

    resume.matchedKeywords =
      analysis.matchedKeywords;

    resume.missingKeywords =
      analysis.missingKeywords;

    resume.matchedSkills =
      analysis.matchedSkills;

    resume.missingSkills =
      analysis.missingSkills;

    resume.strengths =
      analysis.strengths;

    resume.weaknesses =
      analysis.weaknesses;

    resume.suggestions =
      analysis.suggestions;

    resume.analysisStatus =
      "Analyzed";

    resume.analyzedAt =
      new Date();

    // ATS changes affect advanced review.
    resume.advancedReview = {
      reviewStatus:
        "Not Reviewed",

      reviewedAt:
        null,
    };

    await resume.save();

    res.status(200).json({
      message:
        "Resume ATS analysis completed successfully",

      analysis: {
        atsScore:
          resume.atsScore,

        keywordScore:
          resume.keywordScore,

        skillMatchScore:
          resume.skillMatchScore,

        completenessScore:
          resume.completenessScore,

        extractedSkills:
          resume.extractedSkills,

        matchedKeywords:
          resume.matchedKeywords,

        missingKeywords:
          resume.missingKeywords,

        matchedSkills:
          resume.matchedSkills,

        missingSkills:
          resume.missingSkills,

        strengths:
          resume.strengths,

        weaknesses:
          resume.weaknesses,

        suggestions:
          resume.suggestions,

        analysisStatus:
          resume.analysisStatus,

        analyzedAt:
          resume.analyzedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to analyze resume",

      error:
        error.message,
    });
  }
};

// ==============================
// ADVANCED RESUME REVIEW
// ==============================
const reviewStudentResume = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const resume =
      await Resume.findOne({
        user: userId,
      });

    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found. Upload your resume first.",
      });
    }

    if (
      !resume.extractedText ||
      !resume.extractedText.trim()
    ) {
      return res.status(400).json({
        message:
          "Resume text is not available. Upload a readable PDF resume first.",
      });
    }

    // ==============================
    // REQUIRE ATS FIRST
    // ==============================
    if (
      resume.analysisStatus !==
      "Analyzed"
    ) {
      return res.status(400).json({
        message:
          "Complete ATS analysis before running the advanced resume review",
      });
    }

    // ==============================
    // RUN ADVANCED REVIEW
    // ==============================
    const reviewResult =
      reviewResume({
        resume,
      });

    if (!reviewResult.success) {
      resume.advancedReview = {
        reviewStatus:
          "Failed",

        reviewedAt:
          null,
      };

      await resume.save();

      return res.status(400).json({
        message:
          "Advanced resume review failed",

        error:
          reviewResult.errorMessage,
      });
    }

    // ==============================
    // SAVE ADVANCED REVIEW
    // ==============================
    resume.advancedReview =
      reviewResult.data;

    await resume.save();

    res.status(200).json({
      message:
        "Advanced resume review completed successfully",

      review:
        resume.advancedReview,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to review resume",

      error:
        error.message,
    });
  }
};

// ==============================
// GET STUDENT RESUME
// ==============================
const getResume = async (req, res) => {
  try {
    const resume =
      await Resume.findOne({
        user: req.user.id,
      });

    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found",
      });
    }

    res.status(200).json({
      message:
        "Resume fetched successfully",

      resume,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch resume",

      error:
        error.message,
    });
  }
};

// ==============================
// DELETE STUDENT RESUME
// ==============================
const deleteResume = async (
  req,
  res
) => {
  try {
    const resume =
      await Resume.findOne({
        user: req.user.id,
      });

    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found",
      });
    }

    // ==============================
    // DELETE LOCAL PDF
    // ==============================
    if (resume.fileName) {
      const filePath =
        path.join(
          __dirname,
          "../../uploads/resumes",
          resume.fileName
        );

      if (
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);
      }
    }

    await Resume.deleteOne({
      _id: resume._id,
    });

    res.status(200).json({
      message:
        "Resume deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to delete resume",

      error:
        error.message,
    });
  }
};

module.exports = {
  saveResumeDetails,
  analyzeStudentResume,
  reviewStudentResume,
  getResume,
  deleteResume,
};