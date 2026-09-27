const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const {
  generateModernProfessionalPdf,
} = require("./modernProfessionalResumePdfService");


const {
  generateMinimalTechnicalPdf,
} = require("./minimalTechnicalResumePdfService");

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

// ==========================================
// PDF LAYOUT HELPERS
// ==========================================

const addSectionHeading = (doc, title) => {
  doc
    .moveDown(0.4)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(String(title || "").toUpperCase());

  const y = doc.y + 2;

  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(
      doc.page.width - doc.page.margins.right,
      y
    )
    .lineWidth(0.6)
    .stroke();

  doc.moveDown(0.35);
};

const addBullet = (doc, text) => {
  const value = cleanText(text);

  if (!value) {
    return;
  }

  doc
    .font("Helvetica")
    .fontSize(9.2)
    .text(`• ${value}`, {
      indent: 8,
      paragraphGap: 2,
      lineGap: 1,
    });
};

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
      lineGap: 1,
    });
};

// ==========================================
// CONTACT HEADER
// ==========================================

const addContactHeader = (doc, contact) => {
  const name = cleanText(contact.name);
  const email = cleanText(contact.email);
  const phone = cleanText(contact.phone);
  const linkedin = cleanText(contact.linkedin);
  const github = cleanText(contact.github);
  const portfolio = cleanText(contact.portfolio);

  // Name
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(name, {
      align: "center",
    });

  // Email + Phone
  const contactParts = [
    email,
    phone,
  ].filter(Boolean);

  if (contactParts.length) {
    doc
      .moveDown(0.15)
      .font("Helvetica")
      .fontSize(9)
      .text(contactParts.join(" | "), {
        align: "center",
      });
  }

  // LinkedIn / GitHub / Portfolio
  const links = [];

  if (linkedin) {
    links.push({
      label: "LinkedIn",
      url: linkedin.startsWith("http")
        ? linkedin
        : `https://${linkedin}`,
    });
  }

  if (github) {
    links.push({
      label: "GitHub",
      url: github.startsWith("http")
        ? github
        : `https://${github}`,
    });
  }

  if (portfolio) {
    links.push({
      label: "Portfolio",
      url: portfolio.startsWith("http")
        ? portfolio
        : `https://${portfolio}`,
    });
  }

  if (links.length) {
    doc.moveDown(0.15);

    const linkText = links
      .map((item) => item.label)
      .join(" | ");

    const startX =
      (doc.page.width -
        doc.widthOfString(linkText)) /
      2;

    let currentX = startX;
    const y = doc.y;

    links.forEach((item, index) => {
      const labelWidth =
        doc.widthOfString(item.label);

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

      if (index < links.length - 1) {
        const separator = " | ";

        doc.text(
          separator,
          currentX,
          y,
          {
            lineBreak: false,
          }
        );

        currentX +=
          doc.widthOfString(separator);
      }
    });

    doc.x = doc.page.margins.left;
    doc.y = y + 12;
  }
};

// ==========================================
// PROJECT SECTION
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

      // First extracted line normally
      // contains the project title.
      if (index === 0) {
        addPlainLine(
          doc,
          value,
          {
            bold: true,
            size: 9.5,
          }
        );

        return;
      }

      // Keep technology line visually
      // distinct but ATS-readable.
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

  addSectionHeading(
    doc,
    title
  );

  items.forEach((item) => {
    addBullet(doc, item);
  });
};

// ==========================================
// EDUCATION SECTION
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
      addPlainLine(
        doc,
        item,
        {
          bold:
            index === 0 ||
            /bachelor|master|bsc|mca|degree/i.test(
              cleanText(item)
            ),
          size: 9.2,
        }
      );
    }
  );
};

// ==========================================
// SKILLS SECTION
// ==========================================

const addSkills = (doc, skills) => {
  if (
    !Array.isArray(skills) ||
    !skills.length
  ) {
    return;
  }

  addSectionHeading(
    doc,
    "Technical Skills"
  );

  const normalizedSkills = skills
    .map(cleanText)
    .filter(Boolean);

  const groups = {
    "Programming Languages": [],
    "Web & Frameworks": [],
    "Database": [],
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

  normalizedSkills.forEach((skill) => {
    if (programming.includes(skill)) {
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
      groups[
        "Database"
      ].push(skill);
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
  });

  Object.entries(groups).forEach(
    ([groupName, groupSkills]) => {
      if (!groupSkills.length) {
        return;
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(9.1)
        .text(`${groupName}: `, {
          continued: true,
        });

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
// CLASSIC ATS TEMPLATE
// ==========================================

const generateClassicAtsPdf = ({
  resumeData,
  outputPath,
}) => {
  return new Promise(
    (resolve, reject) => {
      try {
        ensureDirectory(
          path.dirname(
            outputPath
          )
        );

        const doc =
          new PDFDocument({
            size: "A4",

            margins: {
              top: 32,
              bottom: 32,
              left: 42,
              right: 42,
            },

            info: {
              Title: `${cleanText(
                resumeData
                  ?.contact
                  ?.name
              )} Resume`,

              Author:
                cleanText(
                  resumeData
                    ?.contact
                    ?.name
                ),

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

        // ================================
        // HEADER
        // ================================

        addContactHeader(
          doc,
          resumeData.contact ||
            {}
        );

        // ================================
        // SUMMARY
        // ================================

        if (
          cleanText(
            resumeData.summary
          )
        ) {
          addSectionHeading(
            doc,
            "Professional Summary"
          );

          doc
            .font("Helvetica")
            .fontSize(9.2)
            .text(
              cleanText(
                resumeData.summary
              ),
              {
                align: "justify",
                lineGap: 2,
              }
            );
        }

        // ================================
        // SKILLS
        // ================================

        addSkills(
          doc,
          resumeData.skills
        );

        // ================================
        // PROJECTS
        // ================================

        addProjects(
          doc,
          resumeData.projects
        );

        // ================================
        // EDUCATION
        // ================================

        addEducation(
          doc,
          resumeData.education
        );

        // ================================
        // INTERNSHIPS
        // ================================

        addListSection(
          doc,
          "Internships",
          resumeData.internships
        );

        // ================================
        // EXPERIENCE
        // ================================

        addListSection(
          doc,
          "Experience",
          resumeData.experience
        );

        // ================================
        // CERTIFICATIONS
        // ================================

        addListSection(
          doc,
          "Certifications",
          resumeData.certifications
        );

        // ================================
        // ACHIEVEMENTS
        // ================================

        addListSection(
          doc,
          "Achievements",
          resumeData.achievements
        );

        // ================================
        // LANGUAGES
        // ================================

        if (
          Array.isArray(
            resumeData.languages
          ) &&
          resumeData.languages.length
        ) {
          addSectionHeading(
            doc,
            "Languages"
          );

          addPlainLine(
            doc,
            resumeData.languages
              .map(cleanText)
              .filter(Boolean)
              .join(", ")
          );
        }

        // ================================
        // INTERESTS
        // ================================

        if (
          Array.isArray(
            resumeData.interests
          ) &&
          resumeData.interests.length
        ) {
          addSectionHeading(
            doc,
            "Interests"
          );

          addPlainLine(
            doc,
            resumeData.interests
              .map(cleanText)
              .filter(Boolean)
              .join(", ")
          );
        }

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
      } catch (error) {
        reject(error);
      }
    }
  );
};

// ==========================================
// MAIN GENERATOR
// ==========================================

const generateResumePdf =
  async ({
    resumeData,
    outputPath,
  }) => {
    try {
      if (!resumeData) {
        return {
          success: false,
          errorMessage:
            "Resume data is required",
        };
      }

      if (!outputPath) {
        return {
          success: false,
          errorMessage:
            "PDF output path is required",
        };
      }

      const template =
        cleanText(
          resumeData.template
        ) || "Classic ATS";

      // ==================================
      // CLASSIC ATS
      // ==================================

      if (
        template ===
        "Classic ATS"
      ) {
        return await generateClassicAtsPdf({
          resumeData,
          outputPath,
        });
      }

      // ==================================
      // MODERN PROFESSIONAL
      // ==================================

      if (
        template ===
        "Modern Professional"
      ) {
        return await generateModernProfessionalPdf({
          resumeData,
          outputPath,
        });
      }


      // ==================================
// MINIMAL TECHNICAL
// ==================================

if (
  template ===
  "Minimal Technical"
) {
  return await generateMinimalTechnicalPdf({
    resumeData,
    outputPath,
  });
}

      // ==================================
      // UNSUPPORTED TEMPLATE
      // ==================================

      return {
        success: false,
        errorMessage:
          `PDF generation for "${template}" is not implemented yet`,
      };
    } catch (error) {
      return {
        success: false,
        errorMessage:
          error.message,
      };
    }
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  generateResumePdf,
};