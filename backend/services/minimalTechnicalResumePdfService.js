const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ==========================================
// MINIMAL TECHNICAL THEME
// Matches StudentResume.css technical preview
// ==========================================

const COLORS = {
  name: "#172033",
  role: "#52657a",
  contact: "#596779",
  heading: "#1f344d",
  strongHeading: "#102f50",
  body: "#3f4c5c",
  skillLabel: "#263b53",
  divider: "#263445",
  sectionRule: "#9ca9b8",
  strongRule: "#314e6d",
  link: "#314e6d",
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
    .font("Courier")
    .fontSize(8.6);
};

// ==========================================
// SECTION HEADING
// ==========================================

const addSectionHeading = (
  doc,
  title,
  options = {}
) => {
  const value = cleanText(title);

  if (!value) {
    return;
  }

  const strong =
    options.strong === true;

  doc.moveDown(
    strong ? 0.4 : 0.32
  );

  doc
    .fillColor(
      strong
        ? COLORS.strongHeading
        : COLORS.heading
    )
    .font("Courier-Bold")
    .fontSize(
      strong ? 9.4 : 9.1
    )
    .text(value.toUpperCase(), {
      characterSpacing: 0.45,
    });

  const lineY = doc.y + 2;

  doc
    .save()
    .strokeColor(
      strong
        ? COLORS.strongRule
        : COLORS.sectionRule
    )
    .lineWidth(
      strong ? 1.35 : 0.65
    )
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

  doc.y = lineY + 5;

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
      options.color ||
        COLORS.body
    )
    .font(
      options.bold
        ? "Courier-Bold"
        : "Courier"
    )
    .fontSize(
      options.size || 8.6
    )
    .text(value, {
      paragraphGap:
        options.paragraphGap ?? 1.3,

      lineGap:
        options.lineGap ?? 0.7,
    });

  resetBodyStyle(doc);
};

const addBullet = (
  doc,
  text
) => {
  const value = cleanText(text);

  if (!value) {
    return;
  }

  doc
    .fillColor(COLORS.body)
    .font("Courier")
    .fontSize(8.35)
    .text(`- ${value}`, {
      indent: 7,
      paragraphGap: 1.2,
      lineGap: 0.6,
    });
};

// ==========================================
// MINIMAL TECHNICAL HEADER
// ==========================================

const addTechnicalHeader = (
  doc,
  contact,
  targetRole
) => {
  const name =
    cleanText(contact?.name) ||
    "Resume";

  const email =
    cleanText(contact?.email);

  const phone =
    cleanText(contact?.phone);

  const linkedin =
    cleanText(contact?.linkedin);

  const github =
    cleanText(contact?.github);

  const portfolio =
    cleanText(contact?.portfolio);

  const role =
    cleanText(targetRole);

  // ========================================
  // NAME
  // ========================================

  doc
    .fillColor(COLORS.name)
    .font("Courier-Bold")
    .fontSize(19)
    .text(name, {
      align: "left",
    });

  // ========================================
  // TARGET ROLE
  // ========================================

  if (role) {
    doc
      .moveDown(0.05)
      .fillColor(COLORS.role)
      .font("Courier-Bold")
      .fontSize(9)
      .text(
        role.toUpperCase()
      );
  }

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  const contactParts = [
    email,
    phone,
  ].filter(Boolean);

  if (contactParts.length) {
    doc
      .moveDown(0.15)
      .fillColor(COLORS.contact)
      .font("Courier")
      .fontSize(7.9)
      .text(
        contactParts.join(
          " | "
        ),
        {
          lineGap: 0.5,
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
      url: normalizeUrl(
        linkedin
      ),
    });
  }

  if (github) {
    links.push({
      label: "GitHub",
      url: normalizeUrl(
        github
      ),
    });
  }

  if (portfolio) {
    links.push({
      label: "Portfolio",
      url: normalizeUrl(
        portfolio
      ),
    });
  }

  if (links.length) {
    doc.moveDown(0.08);

    doc
      .font("Courier")
      .fontSize(7.9);

    const startX =
      doc.page.margins.left;

    let currentX = startX;

    const y = doc.y;

    links.forEach(
      (item, index) => {
        doc.fillColor(
          COLORS.link
        );

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

        currentX +=
          labelWidth;

        if (
          index <
          links.length - 1
        ) {
          const separator =
            " | ";

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

    doc.x =
      doc.page.margins.left;

    doc.y =
      y + 10;
  }

  // ========================================
  // HEADER DIVIDER
  // ========================================

  const dividerY =
    doc.y + 3;

  doc
    .save()
    .strokeColor(
      COLORS.divider
    )
    .lineWidth(1.4)
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

  doc.y =
    dividerY + 4;

  resetBodyStyle(doc);
};

// ==========================================
// TECHNICAL SKILLS
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
    "Technical Skills",
    {
      strong: true,
    }
  );

  // Match frontend technical preview:
  // compact continuous technical stack.

  doc
    .fillColor(
      COLORS.skillLabel
    )
    .font("Courier")
    .fontSize(8.4)
    .text(
      normalizedSkills.join(
        " | "
      ),
      {
        lineGap: 0.8,
        paragraphGap: 1,
      }
    );

  resetBodyStyle(doc);
};

// ==========================================
// TECHNICAL PROJECTS
// ==========================================

const addProjects = (
  doc,
  projects
) => {
  const items =
    Array.isArray(
      projects?.items
    )
      ? projects.items
      : [];

  const projectImpact =
    cleanText(
      projects
        ?.studentProvidedImpact
    );

  if (
    !items.length &&
    !projectImpact
  ) {
    return;
  }

  addSectionHeading(
    doc,
    "Technical Projects",
    {
      strong: true,
    }
  );

  items.forEach(
    (item, index) => {
      const value =
        cleanText(item);

      if (!value) {
        return;
      }

      // First extracted project
      // entry receives title emphasis.
      if (index === 0) {
        addPlainLine(
          doc,
          value,
          {
            bold: true,
            size: 8.9,
            color:
              COLORS.skillLabel,
            paragraphGap: 2,
          }
        );

        return;
      }

      // Keep project information
      // paragraph-based, matching
      // the browser preview.
      addPlainLine(
        doc,
        value,
        {
          size: 8.35,
          lineGap: 0.7,
          paragraphGap: 1.3,
        }
      );
    }
  );

  // ========================================
  // PROJECT IMPACT
  // ========================================

  if (projectImpact) {
    doc.moveDown(0.1);

    doc
      .fillColor(
        COLORS.skillLabel
      )
      .font("Courier-Bold")
      .fontSize(8.35)
      .text(
        "Project Impact: ",
        {
          continued: true,
        }
      );

    doc
      .fillColor(COLORS.body)
      .font("Courier")
      .fontSize(8.35)
      .text(
        projectImpact,
        {
          lineGap: 0.7,
        }
      );
  }

  resetBodyStyle(doc);
};

// ==========================================
// PROFILE
// ==========================================

const addSummary = (
  doc,
  summary
) => {
  const value =
    cleanText(summary);

  if (!value) {
    return;
  }

  addSectionHeading(
    doc,
    "Profile"
  );

  doc
    .fillColor(COLORS.body)
    .font("Courier")
    .fontSize(8.4)
    .text(
      value,
      {
        align: "left",
        lineGap: 0.9,
      }
    );

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
    !Array.isArray(
      education
    ) ||
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
          size: 8.3,
          paragraphGap: 1,
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
      size: 8.3,
    }
  );
};

// ==========================================
// MINIMAL TECHNICAL PDF GENERATOR
// ==========================================

const generateMinimalTechnicalPdf = ({
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
          path.dirname(
            outputPath
          )
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
              top: 28,
              bottom: 28,
              left: 40,
              right: 40,
            },

            info: {
              Title:
                `${studentName || "Student"} Technical Resume`,

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

        addTechnicalHeader(
          doc,
          resumeData.contact || {},
          resumeData.targetRole
        );

        // ==================================
        // TECHNICAL SKILLS
        // ==================================

        addSkills(
          doc,
          resumeData.skills
        );

        // ==================================
        // TECHNICAL PROJECTS
        // ==================================

        addProjects(
          doc,
          resumeData.projects
        );

        // ==================================
        // PROFILE
        // ==================================

        addSummary(
          doc,
          resumeData.summary
        );

        // ==================================
        // EDUCATION
        // ==================================

        addEducation(
          doc,
          resumeData.education
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
        // INTERNSHIPS
        // ==================================

        addListSection(
          doc,
          "Internships",
          resumeData.internships
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
  generateMinimalTechnicalPdf,
};