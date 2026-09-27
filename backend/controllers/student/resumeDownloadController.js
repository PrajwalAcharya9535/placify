const fs = require("fs");
const path = require("path");

const Resume = require("../../models/Resume");

// ==========================================
// DOWNLOAD GENERATED IMPROVED RESUME
// ==========================================
const downloadImprovedResume = async (req, res) => {
  try {
    const userId = req.user.id;

    // ======================================
    // FIND STUDENT RESUME
    // ======================================
    const resume = await Resume.findOne({
      user: userId,
    });

    if (!resume) {
      return res.status(404).json({
        message:
          "Resume not found. Upload your resume first.",
      });
    }

    // ======================================
    // CHECK GENERATED RESUME STATUS
    // ======================================
    if (
      !resume.improvedResume?.generated ||
      !resume.improvedResume?.generatedFileName
    ) {
      return res.status(404).json({
        message:
          "No generated improved resume is available. Generate your resume first.",
      });
    }

    // ======================================
    // SAFE FILE NAME
    // ======================================
    //
    // path.basename prevents a stored value
    // from escaping the generated-resumes
    // directory.
    // ======================================
    const fileName = path.basename(
      resume.improvedResume.generatedFileName
    );

    // ======================================
    // GENERATED RESUME DIRECTORY
    // ======================================
    const generatedResumeDirectory =
      path.join(
        __dirname,
        "../../uploads/generated-resumes"
      );

    const filePath = path.join(
      generatedResumeDirectory,
      fileName
    );

    // ======================================
    // VERIFY FILE EXISTS
    // ======================================
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message:
          "Generated resume file could not be found. Please generate the resume again.",
      });
    }

    const fileStats = fs.statSync(filePath);

    if (
      !fileStats.isFile() ||
      fileStats.size === 0
    ) {
      return res.status(404).json({
        message:
          "Generated resume file is unavailable or invalid. Please generate the resume again.",
      });
    }

    // ======================================
    // DOWNLOAD NAME
    // ======================================
    const studentName =
      String(resume.contact?.name || "Student")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const templateName =
      String(
        resume.improvedResume.template ||
          "Classic ATS"
      )
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const downloadName =
      `${studentName || "Student"}_${templateName || "Resume"}.pdf`;

    // ======================================
    // DOWNLOAD PDF
    // ======================================
    return res.download(
      filePath,
      downloadName,
      (error) => {
        if (error && !res.headersSent) {
          return res.status(500).json({
            message:
              "Failed to download generated resume",
            error: error.message,
          });
        }
      }
    );
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to download generated resume",

      error: error.message,
    });
  }
};

module.exports = {
  downloadImprovedResume,
};