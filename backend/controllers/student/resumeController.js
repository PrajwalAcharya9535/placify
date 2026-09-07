const fs = require("fs");
const path = require("path");

const Resume = require("../../models/Resume");

const {
  extractResumeText,
} = require("../../services/resumeTextExtractionService");

const {
  analyzeResume,
} = require("../../services/atsAnalysisService");

// ==============================
// CREATE / UPDATE RESUME
// ==============================
const saveResumeDetails = async (req, res) => {
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
          ? "Resume uploaded and text extracted successfully"
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

    resume.extractedSkills =
      analysis.extractedSkills;

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
const deleteResume = async (req, res) => {
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
  getResume,
  deleteResume,
};