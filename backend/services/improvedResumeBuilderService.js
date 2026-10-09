// ==========================================
// IMPROVED RESUME BUILDER SERVICE
// ==========================================
//
// Purpose:
// Build a clean, structured resume object from
// verified extracted data + student-provided
// improvement information.
//
// IMPORTANT:
// This service does NOT invent experience,
// projects, achievements, certifications,
// skills, or measurable results.
// ==========================================

// ==========================================
// BASIC HELPERS
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

const uniqueStrings = (values = []) => {
  const result = [];
  const seen = new Set();

  cleanArray(values).forEach((value) => {
    const normalized = value.toLowerCase();

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(value);
    }
  });

  return result;
};

// ==========================================
// GET STUDENT IMPROVEMENT VALUE
// ==========================================
const getImprovementValue = (resume, key) => {
  const fields =
    resume?.advancedReview?.improvementFields || [];

  const field = fields.find(
    (item) => item.key === key
  );

  if (!field) {
    return "";
  }

  return cleanText(field.studentValue);
};

// ==========================================
// BUILD CONTACT INFORMATION
// ==========================================
const buildContact = (resume) => {
  return {
    name: cleanText(resume?.contact?.name),

    email: cleanText(resume?.contact?.email),

    phone: cleanText(resume?.contact?.phone),

    linkedin: cleanText(
      resume?.contact?.linkedin
    ),

    github: cleanText(
      resume?.contact?.github
    ),

    portfolio: cleanText(
      resume?.contact?.portfolio ||
        getImprovementValue(
          resume,
          "portfolio"
        )
    ),
  };
};

// ==========================================
// BUILD PROFESSIONAL SUMMARY
// ==========================================
const buildSummary = (resume) => {
  return cleanText(
    resume?.summary ||
      getImprovementValue(
        resume,
        "professionalSummary"
      )
  );
};

// ==========================================
// BUILD SKILLS
// ==========================================
const buildSkills = (resume) => {
  return uniqueStrings(
    resume?.extractedSkills || []
  );
};

// ==========================================
// BUILD LANGUAGES
// ==========================================
const buildLanguages = (resume) => {
  const existingLanguages =
    uniqueStrings(
      resume?.languages || []
    );

  if (existingLanguages.length) {
    return existingLanguages;
  }

  const improvementValue =
    getImprovementValue(
      resume,
      "languages"
    );

  if (!improvementValue) {
    return [];
  }

  return uniqueStrings(
    improvementValue.split(",")
  );
};

// ==========================================
// BUILD PROJECTS
// ==========================================
// ==========================================
// BUILD PROJECTS
// ==========================================
const buildProjects = (resume) => {
  console.log(
    "\n===== RESUME BUILDER PROJECT DEBUG ====="
  );
  console.log(
    "resume.projects:",
    resume?.projects
  );
  console.log(
    "resume.projectImpact:",
    resume?.projectImpact
  );
  console.log(
    "improvement projectImpact:",
    getImprovementValue(
      resume,
      "projectImpact"
    )
  );
  console.log(
    "========================================\n"
  );

  let projects = cleanArray(
    resume?.projects || []
  );

  let projectImpact =
    cleanText(
      resume?.projectImpact ||
        getImprovementValue(
          resume,
          "projectImpact"
        )
    );

  // ========================================
  // PROJECT IMPACT CONTINUATION FIX
  // ========================================
  //
  // Some extracted resumes may split a
  // Project Impact sentence across lines.
  //
  // Example:
  //
  // projectImpact:
  // "... enabling users to"
  //
  // final project item:
  // "manage placement and bookstore-related
  // data efficiently."
  //
  // Only merge when the impact appears
  // incomplete and the final project item
  // looks like its continuation.
  // ========================================

  if (
    projectImpact &&
    projects.length
  ) {
    const lastProjectItem =
      cleanText(
        projects[
          projects.length - 1
        ]
      );

    const impactLooksIncomplete =
      !/[.!?]$/.test(
        projectImpact
      );

    const continuationLooksValid =
      lastProjectItem &&
      /^[a-z]/.test(
        lastProjectItem
      ) &&
      /[.!?]$/.test(
        lastProjectItem
      );

    if (
      impactLooksIncomplete &&
      continuationLooksValid
    ) {
      projectImpact =
        cleanText(
          `${projectImpact} ${lastProjectItem}`
        );

      projects =
        projects.slice(
          0,
          -1
        );
    }
  }

  console.log(
    "FINAL PROJECT ITEMS:",
    projects
  );

  console.log(
    "FINAL PROJECT IMPACT:",
    projectImpact
  );

  return {
    items: projects,

    studentProvidedImpact:
      projectImpact,

    hasStudentProvidedImpact:
      Boolean(projectImpact),
  };
};

// ==========================================
// BUILD OPTIONAL SECTIONS
// ==========================================
const buildOptionalSections = (resume) => {
  return {
    internships: cleanArray(
      resume?.internships || []
    ),

    experience: cleanArray(
      resume?.experience || []
    ),

    certifications: cleanArray(
      resume?.certifications || []
    ),

    achievements: cleanArray(
      resume?.achievements || []
    ),

    interests: cleanArray(
      resume?.interests || []
    ),
  };
};

// ==========================================
// DETERMINE INCLUDED SECTIONS
// ==========================================
const buildIncludedSections = ({
  summary,
  education,
  skills,
  projects,
  optionalSections,
  languages,
}) => {
  const sections = [];

  if (summary) {
    sections.push("Summary");
  }

  if (education.length) {
    sections.push("Education");
  }

  if (skills.length) {
    sections.push("Skills");
  }

  if (projects.items.length) {
    sections.push("Projects");
  }

  if (
    optionalSections.internships.length
  ) {
    sections.push("Internships");
  }

  if (
    optionalSections.experience.length
  ) {
    sections.push("Experience");
  }

  if (
    optionalSections.certifications.length
  ) {
    sections.push("Certifications");
  }

  if (
    optionalSections.achievements.length
  ) {
    sections.push("Achievements");
  }

  if (languages.length) {
    sections.push("Languages");
  }

  if (
    optionalSections.interests.length
  ) {
    sections.push("Interests");
  }

  return sections;
};

// ==========================================
// BUILD IMPROVED RESUME
// ==========================================
const buildImprovedResume = ({
  resume,
  template = "Classic ATS",
}) => {
  try {
    if (!resume) {
      return {
        success: false,
        errorMessage:
          "Resume data is required",
      };
    }

    const allowedTemplates = [
      "Classic ATS",
      "Modern Professional",
      "Minimal Technical",
    ];

    const selectedTemplate =
      allowedTemplates.includes(template)
        ? template
        : "Classic ATS";

    const contact =
      buildContact(resume);

    const summary =
      buildSummary(resume);

    const education =
      cleanArray(
        resume.education || []
      );

    const skills =
      buildSkills(resume);

    const languages =
      buildLanguages(resume);

    const projects =
      buildProjects(resume);

    const optionalSections =
      buildOptionalSections(resume);

    const includedSections =
      buildIncludedSections({
        summary,
        education,
        skills,
        projects,
        optionalSections,
        languages,
      });

    // ======================================
    // MINIMUM DATA VALIDATION
    // ======================================
    const missingRequiredData = [];

    if (!contact.name) {
      missingRequiredData.push(
        "Name"
      );
    }

    if (!contact.email) {
      missingRequiredData.push(
        "Email"
      );
    }

    if (!education.length) {
      missingRequiredData.push(
        "Education"
      );
    }

    if (!skills.length) {
      missingRequiredData.push(
        "Skills"
      );
    }

    if (missingRequiredData.length) {
      return {
        success: false,

        errorMessage:
          "Resume does not contain enough verified information to generate an improved resume",

        missingRequiredData,
      };
    }

    // ======================================
    // FINAL STRUCTURED RESUME
    // ======================================
    const improvedResume = {
      template:
        selectedTemplate,

      targetRole:
        cleanText(
          resume.targetRole
        ),

      targetCompany:
        cleanText(
          resume.targetCompany
        ),

      contact,

      summary,

      education,

      skills,

      projects,

      internships:
        optionalSections.internships,

      experience:
        optionalSections.experience,

      certifications:
        optionalSections.certifications,

      achievements:
        optionalSections.achievements,

      languages,

      interests:
        optionalSections.interests,

      includedSections,

      metadata: {
        source:
          "Placify Resume Improvement",

        generatedFromVerifiedData:
          true,

        studentProvidedProjectImpact:
          projects.hasStudentProvidedImpact,

        originalPageCount:
          Number(
            resume.pageCount || 0
          ),

        recommendedPageCount:
          resume?.advancedReview
            ?.formatReview
            ?.recommendedPageCount ||
          "1 page preferred for most fresher resumes",
      },
    };

    return {
      success: true,
      data: improvedResume,
    };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error.message,
    };
  }
};

module.exports = {
  buildImprovedResume,
};