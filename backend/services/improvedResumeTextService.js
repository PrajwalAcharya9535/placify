// ==========================================
// IMPROVED RESUME TEXT SERVICE
// ==========================================
//
// Purpose:
// Convert the verified structured improved
// resume into clean plain text that can be
// analyzed by the existing ATS service.
//
// This service does not invent or modify
// resume information.
// ==========================================

const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanArray = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => cleanText(value))
    .filter(Boolean);
};

// ==========================================
// ADD SECTION
// ==========================================

const addSection = (
  lines,
  heading,
  values
) => {
  const items = cleanArray(values);

  if (!items.length) {
    return;
  }

  lines.push("");
  lines.push(heading);
  lines.push(...items);
};

// ==========================================
// BUILD ATS-READABLE TEXT
// ==========================================

const buildImprovedResumeText = (
  improvedResume
) => {
  if (!improvedResume) {
    return "";
  }

  const lines = [];

  const contact =
    improvedResume.contact || {};

  // ========================================
  // CONTACT
  // ========================================

  const contactValues = [
    contact.name,
    contact.email,
    contact.phone,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ]
    .map(cleanText)
    .filter(Boolean);

  if (contactValues.length) {
    lines.push("Contact");
    lines.push(...contactValues);
  }

  // ========================================
  // SUMMARY
  // ========================================

  const summary =
    cleanText(improvedResume.summary);

  if (summary) {
    lines.push("");
    lines.push("Professional Summary");
    lines.push(summary);
  }

  // ========================================
  // EDUCATION
  // ========================================

  addSection(
    lines,
    "Education",
    improvedResume.education
  );

  // ========================================
  // SKILLS
  // ========================================

  addSection(
    lines,
    "Technical Skills",
    improvedResume.skills
  );

  // ========================================
  // PROJECTS
  // ========================================

  const projectItems =
    cleanArray(
      improvedResume.projects?.items || []
    );

  const projectImpact =
    cleanText(
      improvedResume.projects
        ?.studentProvidedImpact
    );

  if (
    projectItems.length ||
    projectImpact
  ) {
    lines.push("");
    lines.push("Projects");

    lines.push(...projectItems);

    if (projectImpact) {
      lines.push(
        `Project Impact: ${projectImpact}`
      );
    }
  }

  // ========================================
  // OPTIONAL SECTIONS
  // ========================================

  addSection(
    lines,
    "Internships",
    improvedResume.internships
  );

  addSection(
    lines,
    "Experience",
    improvedResume.experience
  );

  addSection(
    lines,
    "Certifications",
    improvedResume.certifications
  );

  addSection(
    lines,
    "Achievements",
    improvedResume.achievements
  );

  addSection(
    lines,
    "Languages",
    improvedResume.languages
  );

  addSection(
    lines,
    "Interests",
    improvedResume.interests
  );

  // ========================================
  // FINAL TEXT
  // ========================================

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

module.exports = {
  buildImprovedResumeText,
};