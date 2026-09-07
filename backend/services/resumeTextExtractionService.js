const fs = require("fs");
const {
  PDFParse,
} = require("pdf-parse");

// ==============================
// EXTRACT TEXT FROM PDF RESUME
// ==============================
const extractResumeText = async (filePath) => {
  let parser = null;

  try {
    if (!filePath) {
      throw new Error(
        "Resume file path is required"
      );
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(
        "Resume file not found"
      );
    }

    const fileBuffer =
      fs.readFileSync(filePath);

    parser = new PDFParse({
      data: fileBuffer,
    });

    const result =
      await parser.getText();

    const extractedText =
      String(
        result.text || ""
      ).trim();

    if (!extractedText) {
      throw new Error(
        "No readable text found in resume PDF"
      );
    }

    return {
      success: true,

      text:
        extractedText,

      pages:
        result.total || 0,
    };
  } catch (error) {
    return {
      success: false,

      text: "",

      pages: 0,

      errorMessage:
        error.message,
    };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
};

module.exports = {
  extractResumeText,
};