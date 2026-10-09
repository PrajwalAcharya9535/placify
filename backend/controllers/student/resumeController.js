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
// RESUME PROCESSING PROGRESS
// ==============================
//
// Sends real backend processing progress
// to the currently authenticated student's
// private Socket.IO room.
//
// This does NOT create artificial delays.
// Progress changes only when actual backend
// processing reaches a milestone.
// ==============================

const emitResumeProgress = (
  req,
  progress,
  stage,
  message,
  extra = {}
) => {
  try {
    const io = req.app.get("io");
    const userId = req.user?.id;

    if (!io || !userId) {
      return;
    }

    io.to(`user:${userId}`).emit(
      "resume:scan-progress",
      {
        progress: Math.min(
          Math.max(
            Number(progress) || 0,
            0
          ),
          100
        ),

        stage,

        message,

        timestamp: new Date(),

        ...extra,
      }
    );
  } catch (error) {
    // Socket progress must never interrupt
    // actual resume processing.
    console.log(
      "Resume progress emit error:",
      error.message
    );
  }
};

// ==============================
// RESUME PROCESSING ERROR
// ==============================

const emitResumeError = (
  req,
  stage,
  message
) => {
  try {
    const io = req.app.get("io");
    const userId = req.user?.id;

    if (!io || !userId) {
      return;
    }

    io.to(`user:${userId}`).emit(
      "resume:scan-error",
      {
        stage,
        message,
        timestamp: new Date(),
      }
    );
  } catch (error) {
    console.log(
      "Resume error emit failed:",
      error.message
    );
  }
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

    // ==============================
    // REAL PROGRESS — REQUEST STARTED
    // ==============================

    emitResumeProgress(
      req,
      5,
      "request_received",
      "Resume processing started"
    );

    const {
    targetRole,
    targetCompany,
    jobDescription,
    scanMode,
} = req.body;

    // ==============================
    // REAL PROGRESS — FILE RECEIVED
    // ==============================
    //
    // Multer has already completed the
    // upload before this controller runs.
    // Therefore this stage represents a
    // genuinely received backend file.
    // ==============================

    if (req.file) {
      emitResumeProgress(
        req,
        15,
        "file_received",
        "Resume uploaded successfully",
        {
          fileName: req.file.filename,
          fileType: req.file.mimetype,
          fileSize: req.file.size || 0,
        }
      );
    }

    // ==============================
// EXISTING RESUME
// ==============================
// Used to preserve the original target
// details during a Placify improved scan.

const existingResume =
    scanMode === "placify-improved"
        ? await Resume.findOne({
              user: userId,
          })
        : null;

    const updateData = {
      user: userId,

     targetRole:
    scanMode === "placify-improved"
        ? existingResume?.targetRole || targetRole || ""
        : targetRole || "",

targetCompany:
    scanMode === "placify-improved"
        ? existingResume?.targetCompany || targetCompany || ""
        : targetCompany || "",

jobDescription:
    scanMode === "placify-improved"
        ? existingResume?.jobDescription || jobDescription || ""
        : jobDescription || "",

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
// RESET ORIGINAL ATS BASELINE
// ==============================
//
// A newly uploaded PDF represents a new
// original resume. Its ATS baseline will
// be created on the first ATS analysis.
//

if (scanMode !== "placify-improved") {
    updateData.originalAtsAnalysis = {};
}
     // ==============================
// REAL PROGRESS — TEXT EXTRACTION
// ==============================

emitResumeProgress(
  req,
  25,
  "extracting_text",
  "Reading and extracting resume content"
);

// Actual PDF text extraction happens here.
// Progress remains at 25% until this work
// genuinely finishes.

const extractionResult =
  await extractResumeText(
    req.file.path
  );

// ==============================
// EXTRACTION FAILURE
// ==============================

if (!extractionResult.success) {
  emitResumeError(
    req,
    "text_extraction_failed",
    "Unable to extract readable text from the resume"
  );

  return res.status(400).json({
    message:
      "Resume uploaded but text extraction failed",

    error:
      extractionResult.errorMessage,
  });
}

// ==============================
// REAL PROGRESS — TEXT EXTRACTED
// ==============================

emitResumeProgress(
  req,
  45,
  "text_extracted",
  "Resume text extracted successfully",
  {
    pageCount:
      extractionResult.pages || 0,

    characterCount:
      extractionResult.text?.length || 0,
  }
);



      updateData.extractedText =
        extractionResult.text;

      updateData.pageCount =
        extractionResult.pages || 0;

// ==============================
// REAL PROGRESS — STRUCTURED
// RESUME EVALUATION
// ==============================

emitResumeProgress(
  req,
  55,
  "evaluating_resume",
  "Evaluating resume sections and information"
);

// Actual structured resume evaluation happens
// here. Progress remains at 55% until the
// extractor genuinely finishes.

const structuredResult =
  extractStructuredResume({
    resumeText:
      extractionResult.text,

    pageCount:
      extractionResult.pages ||
      0,
  });

// ==============================
// STRUCTURED EXTRACTION RESULT
// ==============================

if (structuredResult.success) {
  const structured =
    structuredResult.data;

  emitResumeProgress(
    req,
    75,
    "resume_evaluated",
    "Resume information evaluated successfully",
    {
      evaluatedSections: {
        contact:
          Boolean(
            structured.contact
          ),

        summary:
          Boolean(
            structured.summary
          ),

        skills:
          Array.isArray(
            structured.skills
          )
            ? structured.skills.length
            : 0,

        education:
          Array.isArray(
            structured.education
          )
            ? structured.education.length
            : 0,

        projects:
          Array.isArray(
            structured.projects
          )
            ? structured.projects.length
            : 0,

        internships:
          Array.isArray(
            structured.internships
          )
            ? structured.internships.length
            : 0,

        experience:
          Array.isArray(
            structured.experience
          )
            ? structured.experience.length
            : 0,

        certifications:
          Array.isArray(
            structured.certifications
          )
            ? structured.certifications.length
            : 0,

        achievements:
          Array.isArray(
            structured.achievements
          )
            ? structured.achievements.length
            : 0,

        languages:
          Array.isArray(
            structured.languages
          )
            ? structured.languages.length
            : 0,

        interests:
          Array.isArray(
            structured.interests
          )
            ? structured.interests.length
            : 0,
      },
    }
  );
}

    if (!structuredResult.success) {
  updateData.extractionStatus =
    "Failed";

  updateData.extractedAt =
    null;

  // ==============================
  // STRUCTURED EVALUATION FAILED
  // ==============================

  emitResumeError(
    req,
    "resume_evaluation_failed",
    structuredResult.errorMessage ||
      "Resume information could not be structured completely"
  );
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

updateData.projectImpact =
  structured.projectImpact || "";

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


    // ==============================
// REAL PROGRESS — DATABASE SAVE
// ==============================

emitResumeProgress(
  req,
  85,
  "saving_resume",
  "Saving evaluated resume information"
);

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

      // ==============================
// REAL PROGRESS — SAVE COMPLETE
// ==============================

emitResumeProgress(
  req,
  95,
  "resume_saved",
  "Resume information saved successfully"
);


      // ==============================
// REAL PROGRESS — COMPLETE
// ==============================

emitResumeProgress(
  req,
  100,
  "processing_complete",
  "Resume processing completed successfully",
  {
    extractionStatus:
      resume.extractionStatus,

    pageCount:
      resume.pageCount || 0,

    extractedLineCount:
      resume.extractedLineCount || 0,

    detectedSections:
      resume.detectedSections || [],
  }
);

  res.status(200).json({
    message:
        req.file
            ? scanMode === "placify-improved"
                ? "Placify improved resume scanned and structured information extracted successfully"
                : "Resume uploaded and structured information extracted successfully"
            : "Resume details saved successfully",

    scanMode:
        scanMode === "placify-improved"
            ? "placify-improved"
            : "original",

    resume,
});
 } catch (error) {
  emitResumeError(
    req,
    "resume_processing_failed",
    "Resume processing could not be completed"
  );

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

  // ==============================
// SAVE ORIGINAL ATS SNAPSHOT
// ==============================
//
// Preserve the first ATS analysis for the
// currently uploaded original resume.
// Re-running ATS must not replace it.
//

if (
  !resume.originalAtsAnalysis?.analyzedAt
) {
  resume.originalAtsAnalysis = {
    atsScore:
      analysis.atsScore,

    keywordScore:
      analysis.keywordScore,

    skillMatchScore:
      analysis.skillMatchScore,

    completenessScore:
      analysis.completenessScore,

    matchedKeywords:
      analysis.matchedKeywords || [],

    missingKeywords:
      analysis.missingKeywords || [],

    matchedSkills:
      analysis.matchedSkills || [],

    missingSkills:
      analysis.missingSkills || [],

    strengths:
      analysis.strengths || [],

    weaknesses:
      analysis.weaknesses || [],

    suggestions:
      analysis.suggestions || [],

    analyzedAt:
      new Date(),
  };
}

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