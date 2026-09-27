const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

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

// ==========================================
// SECTION HEADING
// ==========================================

const addSectionHeading = (doc, title) => {
  const value = cleanText(title);

  if (!value) {
    return;
  }

  doc.moveDown(0.45);

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(value.toUpperCase());

  const lineY = doc.y + 2;

  doc
    .moveTo(doc.page.margins.left, lineY)
    .lineTo(
      doc.page.width - doc.page.margins.right,
      lineY
    )
    .lineWidth(0.7)
    .stroke();

  doc.moveDown(0.35);
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
    .font(
      options.bold
        ? "Helvetica-Bold"
        : "Helvetica"
    )
    .fontSize(options.size || 9.2)
    .text(value, {
      paragraphGap:
        options.paragraphGap ?? 2,
      lineGap: options.lineGap ?? 1,
    });
};

const addBullet = (doc, text) => {
  const value = cleanText(text);

  if (!value) {
    return;
  }

  doc
    .font("Helvetica")
    .fontSize(9.1)
    .text(`• ${value}`, {
      indent: 8,
      paragraphGap: 2,
      lineGap: 1,
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
  const name = cleanText(contact?.name);
  const email = cleanText(contact?.email);
  const phone = cleanText(contact?.phone);

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
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(name || "Resume", {
      align: "left",
    });

  // ========================================
  // TARGET ROLE
  // ========================================

  const role = cleanText(targetRole);

  if (role) {
    doc
      .moveDown(0.1)
      .font("Helvetica")
      .fontSize(10.5)
      .text(role, {
        align: "left",
      });
  }

  // ========================================
  // DIVIDER
  // ========================================

  const dividerY = doc.y + 5;

  doc
    .moveTo(
      doc.page.margins.left,
      dividerY
    )
    .lineTo(
      doc.page.width -
        doc.page.margins.right,
      dividerY
    )
    .lineWidth(1.2)
    .stroke();

  doc.y = dividerY + 7;

  // ========================================
  // EMAIL + PHONE
  // ========================================

  const contactParts = [
    email,
    phone,
  ].filter(Boolean);

  if (contactParts.length) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        contactParts.join("  |  ")
      );
  }

  // ========================================
  // CLICKABLE PROFESSIONAL LINKS
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

    doc
      .font("Helvetica")
      .fontSize(9);

    const startX =
      doc.page.margins.left;

    let currentX = startX;

    const y = doc.y;

    links.forEach(
      (item, index) => {
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
          const separator = "  |  ";

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

    // Important:
    // Restore normal PDF cursor position
    // after manually positioned links.

    doc.x = doc.page.margins.left;
    doc.y = y + 13;
  }
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
    .font("Helvetica")
    .fontSize(9.3)
    .text(value, {
      align: "justify",
      lineGap: 2,
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
    "Technical Skills"
  );

  const groups = {
    "Programming Languages": [],
    "Web & Frameworks": [],
    Database: [],
    "Tools & Cloud": [],
    "Core Concepts": [],
  };

  const programming = [
    "Java",
    "JavaScript",
    "Python",
    "C",
    "C++",
  ];

  const webFrameworks = [
    "HTML",
    "HTML5",
    "CSS",
    "CSS3",
    "React",
    "React.js",
    "Node.js",
    "Express.js",
    "MERN",
    "REST API",
    "REST APIs",
    "JWT",
    "JWT Authentication",
  ];

  const databases = [
    "MongoDB",
    "MySQL",
    "SQL",
  ];

  const toolsCloud = [
    "Git",
    "GitHub",
    "AWS",
    "Postman",
  ];

  const concepts = [
    "Data Structures",
    "DSA",
    "OOP",
    "DBMS",
    "Problem Solving",
  ];

  normalizedSkills.forEach(
    (skill) => {
      if (
        programming.includes(skill)
      ) {
        groups[
          "Programming Languages"
        ].push(skill);
      } else if (
        webFrameworks.includes(skill)
      ) {
        groups[
          "Web & Frameworks"
        ].push(skill);
      } else if (
        databases.includes(skill)
      ) {
        groups.Database.push(skill);
      } else if (
        toolsCloud.includes(skill)
      ) {
        groups[
          "Tools & Cloud"
        ].push(skill);
      } else if (
        concepts.includes(skill)
      ) {
        groups[
          "Core Concepts"
        ].push(skill);
      } else {
        groups[
          "Core Concepts"
        ].push(skill);
      }
    }
  );

  Object.entries(groups).forEach(
    ([groupName, groupSkills]) => {
      if (!groupSkills.length) {
        return;
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(9.1)
        .text(
          `${groupName}: `,
          {
            continued: true,
          }
        );

      doc
        .font("Helvetica")
        .fontSize(9.1)
        .text(
          groupSkills.join(", "),
          {
            paragraphGap: 1,
            lineGap: 1,
          }
        );
    }
  );
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

  if (!items.length) {
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

      // First extracted project line
      // is treated as project title,
      // matching the tested Classic ATS
      // data structure.

      if (index === 0) {
        addPlainLine(
          doc,
          value,
          {
            bold: true,
            size: 9.6,
          }
        );

        return;
      }

      // Technology stack remains
      // visually distinct.

      if (
        /^tech\s*\*stack\s*:/i.test(
          value
        )
      ) {
        addPlainLine(
          doc,
          value,
          {
            bold: true,
            size: 9,
          }
        );

        return;
      }

      addBullet(
        doc,
        value
      );
    }
  );
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

  addSectionHeading(
    doc,
    "Education"
  );

  education.forEach(
    (item, index) => {
      const value =
        cleanText(item);

      if (!value) {
        return;
      }

      addPlainLine(
        doc,
        value,
        {
          bold:
            index === 0 ||
            /bachelor|master|bsc|mca|degree/i.test(
              value
            ),

          size: 9.2,
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
    values.join(", ")
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
              top: 30,
              bottom: 30,
              left: 42,
              right: 42,
            },

            info: {
              Title:
                `${studentName || "Student"} Resume`,

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
        // SUMMARY
        // ==================================

        addSummary(
          doc,
          resumeData.summary
        );

        // ==================================
        // TECHNICAL SKILLS
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