const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ==========================================
// MODERN PROFESSIONAL THEME
// Matches StudentResume.css Modern preview
// ==========================================

const COLORS = {
  name: "#163d6b",
  primary: "#1769d2",
  body: "#4b5b70",
  skillText: "#354c69",
  contact: "#66758a",
  sectionRule: "#d8e5f5",
  link: "#1769d2",
};

// ==========================================
// BASIC HELPERS
// ==========================================

const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, {
      recursive: true,
    });
  }
};

const normalizeUrl = (value) => {
  const url = cleanText(value);

  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
};

const resetBodyStyle = (doc) => {
  doc
    .fillColor(COLORS.body)
    .font("Helvetica")
    .fontSize(9.3);
};

// ==========================================
// SECTION HEADING
// ==========================================

const addSectionHeading = (doc, title) => {
  const value = cleanText(title);

  if (!value) {
    return;
  }

  doc.moveDown(0.75);

  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(value.toUpperCase(), {
      characterSpacing: 0.8,
    });

  const lineY = doc.y + 3;

  doc
    .save()
    .strokeColor(COLORS.sectionRule)
    .lineWidth(0.8)
    .moveTo(
      doc.page.margins.left,
      lineY
    )
    .lineTo(
      doc.page.width -
        doc.page.margins.right,
      lineY
    )
    .stroke()
    .restore();

  doc.y = lineY + 6;

  resetBodyStyle(doc);
};

// ==========================================
// BASIC TEXT HELPERS
// ==========================================

const addPlainLine = (
  doc,
  text,
  options = {}
) => {
  const value = cleanText(text);

  if (!value) {
    return;
  }

  doc
    .fillColor(
      options.color || COLORS.body
    )
    .font(
      options.bold
        ? "Helvetica-Bold"
        : "Helvetica"
    )
    .fontSize(options.size || 9.3)
    .text(value, {
      paragraphGap:
        options.paragraphGap ?? 2,
      lineGap: options.lineGap ?? 1.5,
    });

  resetBodyStyle(doc);
};

const addBullet = (doc, text) => {
  const value = cleanText(text);

  if (!value) {
    return;
  }

  doc
    .fillColor(COLORS.body)
    .font("Helvetica")
    .fontSize(9.2)
    .text(`• ${value}`, {
      indent: 8,
      paragraphGap: 2,
      lineGap: 1.5,
    });
};

// ==========================================
// MODERN HEADER
// ==========================================

const addModernHeader = (
  doc,
  contact,
  targetRole
) => {
  const name =
    cleanText(contact?.name) || "Resume";

  const email = cleanText(
    contact?.email
  );

  const phone = cleanText(
    contact?.phone
  );

  const linkedin = cleanText(
    contact?.linkedin
  );

  const github = cleanText(
    contact?.github
  );

  const portfolio = cleanText(
    contact?.portfolio
  );

  // ========================================
  // NAME
  // ========================================

  doc
    .fillColor(COLORS.name)
    .font("Helvetica-Bold")
    .fontSize(23)
    .text(name, {
      align: "left",
    });

  // ========================================
  // TARGET ROLE
  // ========================================

  const role = cleanText(targetRole);

  if (role) {
    doc
      .moveDown(0.15)
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .fontSize(11.5)
      .text(role, {
        align: "left",
      });
  }

  // ========================================
  // CONTACT
  // ========================================

  const contactParts = [
    email,
    phone,
  ].filter(Boolean);

  if (contactParts.length) {
    doc
      .moveDown(0.4)
      .fillColor(COLORS.contact)
      .font("Helvetica")
      .fontSize(8.6)
      .text(
        contactParts.join("   |   "),
        {
          lineGap: 1,
        }
      );
  }

  // ========================================
  // PROFESSIONAL LINKS
  // ========================================

  const links = [];

  if (linkedin) {
    links.push({
      label: "LinkedIn",
      url: normalizeUrl(linkedin),
    });
  }

  if (github) {
    links.push({
      label: "GitHub",
      url: normalizeUrl(github),
    });
  }

  if (portfolio) {
    links.push({
      label: "Portfolio",
      url: normalizeUrl(portfolio),
    });
  }

  if (links.length) {
    doc.moveDown(0.15);

    const startX =
      doc.page.margins.left;

    let currentX = startX;
    const y = doc.y;

    doc
      .font("Helvetica")
      .fontSize(8.6);

    links.forEach(
      (item, index) => {
        doc.fillColor(COLORS.link);

        const labelWidth =
          doc.widthOfString(
            item.label
          );

        doc.text(
          item.label,
          currentX,
          y,
          {
            link: item.url,
            underline: true,
            lineBreak: false,
          }
        );

        currentX += labelWidth;

        if (
          index <
          links.length - 1
        ) {
          const separator = "   |   ";

          doc.fillColor(
            COLORS.contact
          );

          doc.text(
            separator,
            currentX,
            y,
            {
              lineBreak: false,
            }
          );

          currentX +=
            doc.widthOfString(
              separator
            );
        }
      }
    );

    doc.x = doc.page.margins.left;
    doc.y = y + 13;
  }

  // ========================================
  // BLUE MODERN DIVIDER
  // ========================================

  const dividerY = doc.y + 5;

  doc
    .save()
    .strokeColor(COLORS.primary)
    .lineWidth(2.2)
    .moveTo(
      doc.page.margins.left,
      dividerY
    )
    .lineTo(
      doc.page.width -
        doc.page.margins.right,
      dividerY
    )
    .stroke()
    .restore();

  doc.y = dividerY + 6;

  resetBodyStyle(doc);
};

// ==========================================
// SUMMARY
// ==========================================

const addSummary = (
  doc,
  summary
) => {
  const value = cleanText(summary);

  if (!value) {
    return;
  }

  addSectionHeading(
    doc,
    "Professional Summary"
  );

  doc
    .fillColor(COLORS.body)
    .font("Helvetica")
    .fontSize(9.3)
    .text(value, {
      align: "left",
      lineGap: 2,
      paragraphGap: 1,
    });
};

// ==========================================
// SKILLS
// ==========================================

const addSkills = (
  doc,
  skills
) => {
  if (
    !Array.isArray(skills) ||
    !skills.length
  ) {
    return;
  }

  const normalizedSkills =
    skills
      .map(cleanText)
      .filter(Boolean);

  if (!normalizedSkills.length) {
    return;
  }

  addSectionHeading(
    doc,
    "Skills"
  );

  // Match the Modern frontend preview:
  // clean continuous skills presentation
  // instead of the Classic grouped layout.

  doc
    .fillColor(COLORS.skillText)
    .font("Helvetica")
    .fontSize(9.3)
    .text(
      normalizedSkills.join("  ·  "),
      {
        lineGap: 2,
        paragraphGap: 1,
      }
    );

  resetBodyStyle(doc);
};

// ==========================================
// PROJECTS
// ==========================================

const addProjects = (
  doc,
  projects
) => {
  const items =
    Array.isArray(projects?.items)
      ? projects.items
      : [];

  const projectImpact =
    cleanText(
      projects?.studentProvidedImpact
    );

  if (
    !items.length &&
    !projectImpact
  ) {
    return;
  }

  addSectionHeading(
    doc,
    "Projects"
  );

  items.forEach(
    (item, index) => {
      const value =
        cleanText(item);

      if (!value) {
        return;
      }

      // First extracted line is the
      // first project/title entry.
      if (index === 0) {
        addPlainLine(
          doc,
          value,
          {
            bold: true,
            size: 9.5,
            color:
              COLORS.skillText,
            paragraphGap: 3,
          }
        );

        return;
      }

      // Keep project content clean and
      // paragraph-like to match web preview.
      addPlainLine(
        doc,
        value,
        {
          size: 9.2,
          color: COLORS.body,
          paragraphGap: 2,
          lineGap: 1.5,
        }
      );
    }
  );

  // ========================================
  // STUDENT-PROVIDED PROJECT IMPACT
  // ========================================

  if (projectImpact) {
    doc.moveDown(0.15);

    doc
      .fillColor(COLORS.skillText)
      .font("Helvetica-Bold")
      .fontSize(9.2)
      .text(
        "Project Impact: ",
        {
          continued: true,
        }
      );

    doc
      .fillColor(COLORS.body)
      .font("Helvetica")
      .fontSize(9.2)
      .text(projectImpact, {
        lineGap: 1.5,
      });
  }

  resetBodyStyle(doc);
};

// ==========================================
// EDUCATION
// ==========================================

const addEducation = (
  doc,
  education
) => {
  if (
    !Array.isArray(education) ||
    !education.length
  ) {
    return;
  }

  const values =
    education
      .map(cleanText)
      .filter(Boolean);

  if (!values.length) {
    return;
  }

  addSectionHeading(
    doc,
    "Education"
  );

  values.forEach(
    (value, index) => {
      const isDegree =
        index === 0 ||
        /bachelor|master|bca|bsc|mca|degree|pre-university|puc|sslc/i.test(
          value
        );

      addPlainLine(
        doc,
        value,
        {
          bold: isDegree,
          size: 9.2,
          paragraphGap:
            isDegree && index > 0
              ? 2
              : 1,
        }
      );
    }
  );
};

// ==========================================
// GENERIC LIST SECTION
// ==========================================

const addListSection = (
  doc,
  title,
  items
) => {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return;
  }

  const cleanItems =
    items
      .map(cleanText)
      .filter(Boolean);

  if (!cleanItems.length) {
    return;
  }

  addSectionHeading(
    doc,
    title
  );

  cleanItems.forEach(
    (item) => {
      addBullet(
        doc,
        item
      );
    }
  );
};

// ==========================================
// INLINE LIST SECTION
// ==========================================

const addInlineListSection = (
  doc,
  title,
  items
) => {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return;
  }

  const values =
    items
      .map(cleanText)
      .filter(Boolean);

  if (!values.length) {
    return;
  }

  addSectionHeading(
    doc,
    title
  );

  addPlainLine(
    doc,
    values.join(", "),
    {
      size: 9.2,
    }
  );
};

// ==========================================
// MODERN PROFESSIONAL PDF GENERATOR
// ==========================================

const generateModernProfessionalPdf = ({
  resumeData,
  outputPath,
}) => {
  return new Promise(
    (resolve, reject) => {
      try {
        if (!resumeData) {
          return resolve({
            success: false,
            errorMessage:
              "Resume data is required",
          });
        }

        if (!outputPath) {
          return resolve({
            success: false,
            errorMessage:
              "PDF output path is required",
          });
        }

        ensureDirectory(
          path.dirname(outputPath)
        );

        const studentName =
          cleanText(
            resumeData
              ?.contact
              ?.name
          );

        const doc =
          new PDFDocument({
            size: "A4",

            margins: {
              top: 34,
              bottom: 32,
              left: 48,
              right: 48,
            },

            info: {
              Title:
                `${studentName || "Student"} Modern Professional Resume`,

              Author:
                studentName,

              Subject:
                cleanText(
                  resumeData
                    ?.targetRole
                ),
            },
          });

        const stream =
          fs.createWriteStream(
            outputPath
          );

        doc.pipe(stream);

        // ==================================
        // HEADER
        // ==================================

        addModernHeader(
          doc,
          resumeData.contact || {},
          resumeData.targetRole
        );

        // ==================================
        // PROFESSIONAL SUMMARY
        // ==================================

        addSummary(
          doc,
          resumeData.summary
        );

        // ==================================
        // SKILLS
        // ==================================

        addSkills(
          doc,
          resumeData.skills
        );

        // ==================================
        // PROJECTS
        // ==================================

        addProjects(
          doc,
          resumeData.projects
        );

        // ==================================
        // EDUCATION
        // ==================================

        addEducation(
          doc,
          resumeData.education
        );

        // ==================================
        // INTERNSHIPS
        // ==================================

        addListSection(
          doc,
          "Internships",
          resumeData.internships
        );

        // ==================================
        // EXPERIENCE
        // ==================================

        addListSection(
          doc,
          "Experience",
          resumeData.experience
        );

        // ==================================
        // CERTIFICATIONS
        // ==================================

        addListSection(
          doc,
          "Certifications",
          resumeData.certifications
        );

        // ==================================
        // ACHIEVEMENTS
        // ==================================

        addListSection(
          doc,
          "Achievements",
          resumeData.achievements
        );

        // ==================================
        // LANGUAGES
        // ==================================

        addInlineListSection(
          doc,
          "Languages",
          resumeData.languages
        );

        // ==================================
        // INTERESTS
        // ==================================

        addInlineListSection(
          doc,
          "Interests",
          resumeData.interests
        );

        // ==================================
        // COMPLETE PDF
        // ==================================

        doc.end();

        stream.on(
          "finish",
          () => {
            resolve({
              success: true,
              outputPath,
            });
          }
        );

        stream.on(
          "error",
          (error) => {
            reject(error);
          }
        );

        doc.on(
          "error",
          (error) => {
            reject(error);
          }
        );
      } catch (error) {
        reject(error);
      }
    }
  );
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  generateModernProfessionalPdf,
};