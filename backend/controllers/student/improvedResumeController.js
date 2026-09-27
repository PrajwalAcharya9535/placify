const fs = require("fs");
const path = require("path");

const Resume = require("../../models/Resume");

const {
  buildImprovedResume,
} = require("../../services/improvedResumeBuilderService");

const {
  generateResumePdf,
} = require("../../services/resumePdfGenerationService");

// ==========================================
// ALLOWED RESUME TEMPLATES
// ==========================================

const ALLOWED_TEMPLATES = [
  "Classic ATS",
  "Modern Professional",
  "Minimal Technical",
];

// ==========================================
// CURRENT PDF-SUPPORTED TEMPLATES
// ==========================================

const PDF_SUPPORTED_TEMPLATES = [
  "Classic ATS",
  "Modern Professional",
  "Minimal Technical",
];

// ==========================================
// BUILD IMPROVED RESUME PREVIEW
// ==========================================

const generateImprovedResumePreview = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

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
    // REQUIRE ADVANCED REVIEW FIRST
    // ======================================

    if (
      resume.advancedReview?.reviewStatus !==
      "Reviewed"
    ) {
      return res.status(400).json({
        message:
          "Complete the advanced resume review before generating an improved resume",
      });
    }

    // ======================================
    // TEMPLATE
    // ======================================

    const requestedTemplate = String(
      req.body?.template || "Classic ATS"
    ).trim();

    if (
      !ALLOWED_TEMPLATES.includes(
        requestedTemplate
      )
    ) {
      return res.status(400).json({
        message: "Invalid resume template",
        allowedTemplates:
          ALLOWED_TEMPLATES,
      });
    }

    // ======================================
    // BUILD VERIFIED RESUME DATA
    // ======================================

    const buildResult =
      buildImprovedResume({
        resume,
        template:
          requestedTemplate,
      });

    if (!buildResult.success) {
      return res.status(400).json({
        message:
          buildResult.errorMessage ||
          "Unable to build improved resume",

        missingRequiredData:
          buildResult.missingRequiredData ||
          [],
      });
    }

    // ======================================
    // PREVIEW DOES NOT CREATE A FILE
    // ======================================

    resume.improvedResume.template =
      requestedTemplate;

    resume.improvedResume.generated =
      false;

    resume.improvedResume.generatedFileName =
      "";

    resume.improvedResume.generatedFileUrl =
      "";

    resume.improvedResume.generatedFileType =
      "";

    resume.improvedResume.generatedAt =
      null;

    await resume.save();

    return res.status(200).json({
      message:
        "Improved resume preview generated successfully",

      preview:
        buildResult.data,

      generationStatus: {
        template:
          resume.improvedResume
            .template,

        generated:
          resume.improvedResume
            .generated,

        fileAvailable: false,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to generate improved resume preview",

      error: error.message,
    });
  }
};

// ==========================================
// GENERATE IMPROVED RESUME PDF
// ==========================================

const generateImprovedResumePdf = async (
  req,
  res
) => {
  let generatedFilePath = "";

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

    // ======================================
    // REQUIRE ADVANCED REVIEW
    // ======================================

    if (
      resume.advancedReview
        ?.reviewStatus !==
      "Reviewed"
    ) {
      return res.status(400).json({
        message:
          "Complete the advanced resume review before generating the improved resume",
      });
    }

    // ======================================
    // TEMPLATE
    // ======================================

    const requestedTemplate =
      String(
        req.body?.template ||
          "Classic ATS"
      ).trim();

    if (
      !ALLOWED_TEMPLATES.includes(
        requestedTemplate
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid resume template",

        allowedTemplates:
          ALLOWED_TEMPLATES,
      });
    }

    // ======================================
    // CHECK PDF TEMPLATE SUPPORT
    // ======================================

    if (
      !PDF_SUPPORTED_TEMPLATES.includes(
        requestedTemplate
      )
    ) {
      return res.status(400).json({
        message:
          `PDF generation for "${requestedTemplate}" is not implemented yet`,

        availablePdfTemplates:
          PDF_SUPPORTED_TEMPLATES,
      });
    }

    // ======================================
    // BUILD VERIFIED RESUME
    // ======================================

    const buildResult =
      buildImprovedResume({
        resume,
        template:
          requestedTemplate,
      });

    if (!buildResult.success) {
      return res.status(400).json({
        message:
          buildResult.errorMessage ||
          "Unable to build improved resume",

        missingRequiredData:
          buildResult
            .missingRequiredData ||
          [],
      });
    }

    // ======================================
    // OUTPUT DIRECTORY
    // ======================================

    const outputDirectory =
      path.join(
        __dirname,
        "../../uploads/generated-resumes"
      );

    if (
      !fs.existsSync(
        outputDirectory
      )
    ) {
      fs.mkdirSync(
        outputDirectory,
        {
          recursive: true,
        }
      );
    }

    // ======================================
    // SAFE STUDENT NAME
    // ======================================

    const studentName =
      String(
        buildResult.data
          ?.contact?.name ||
          "student"
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase() ||
      "student";

    // ======================================
    // SAFE TEMPLATE NAME
    // ======================================

    const templateSlug =
      requestedTemplate
        .trim()
        .replace(
          /[^a-zA-Z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase();

    const timestamp =
      Date.now();

    const fileName =
      `${studentName}-${templateSlug}-${timestamp}.pdf`;

    generatedFilePath =
      path.join(
        outputDirectory,
        fileName
      );

    // ======================================
    // GENERATE PDF
    // ======================================

    const pdfResult =
      await generateResumePdf({
        resumeData:
          buildResult.data,

        outputPath:
          generatedFilePath,
      });

    if (!pdfResult.success) {
      return res.status(500).json({
        message:
          "Failed to generate improved resume PDF",

        error:
          pdfResult.errorMessage ||
          "Unknown PDF generation error",
      });
    }

    // ======================================
    // VERIFY FILE EXISTS
    // ======================================

    if (
      !fs.existsSync(
        generatedFilePath
      )
    ) {
      return res.status(500).json({
        message:
          "Resume PDF generation completed but the output file could not be found",
      });
    }

    const fileStats =
      fs.statSync(
        generatedFilePath
      );

    if (
      !fileStats.size
    ) {
      try {
        fs.unlinkSync(
          generatedFilePath
        );
      } catch {
        // Ignore cleanup failure.
      }

      return res.status(500).json({
        message:
          "Generated resume PDF is empty",
      });
    }

    // ======================================
    // DELETE PREVIOUS GENERATED FILE
    // ======================================

    const previousFileName =
      resume.improvedResume
        ?.generatedFileName;

    if (
      previousFileName &&
      previousFileName !==
        fileName
    ) {
      const previousFilePath =
        path.join(
          outputDirectory,
          path.basename(
            previousFileName
          )
        );

      if (
        fs.existsSync(
          previousFilePath
        )
      ) {
        try {
          fs.unlinkSync(
            previousFilePath
          );
        } catch {
          // Old file cleanup should not
          // fail the new generation.
        }
      }
    }

    // ======================================
    // PUBLIC API FILE URL
    //
    // Stored as an application path instead
    // of a hard-coded localhost URL.
    // ======================================

    const generatedFileUrl =
      `/uploads/generated-resumes/${fileName}`;

    // ======================================
    // SAVE GENERATION STATUS
    // ======================================

    resume.improvedResume.template =
      requestedTemplate;

    resume.improvedResume.generated =
      true;

    resume.improvedResume.generatedFileName =
      fileName;

    resume.improvedResume.generatedFileUrl =
      generatedFileUrl;

    resume.improvedResume.generatedFileType =
      "application/pdf";

    resume.improvedResume.generatedAt =
      new Date();

    await resume.save();

    return res.status(200).json({
      message:
        "Improved resume PDF generated successfully",

      generatedResume: {
        template:
          resume.improvedResume
            .template,

        generated:
          resume.improvedResume
            .generated,

        fileName:
          resume.improvedResume
            .generatedFileName,

        fileUrl:
          resume.improvedResume
            .generatedFileUrl,

        fileType:
          resume.improvedResume
            .generatedFileType,

        fileSize:
          fileStats.size,

        generatedAt:
          resume.improvedResume
            .generatedAt,
      },
    });
  } catch (error) {
    // ======================================
    // CLEAN UP PARTIAL FILE ON FAILURE
    // ======================================

    if (
      generatedFilePath &&
      fs.existsSync(
        generatedFilePath
      )
    ) {
      try {
        fs.unlinkSync(
          generatedFilePath
        );
      } catch {
        // Ignore cleanup failure.
      }
    }

    return res.status(500).json({
      message:
        "Failed to generate improved resume PDF",

      error:
        error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  generateImprovedResumePreview,
  generateImprovedResumePdf,
};