// ==============================
// BASIC HELPERS
// ==============================
const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeText = (value) => {
  return cleanText(value).toLowerCase();
};

const uniqueStrings = (items = []) => {
  const seen = new Set();

  return items
    .map((item) => cleanText(item))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const clampScore = (score) => {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
};

// ==============================
// ACTION VERBS
// ==============================
const ACTION_VERBS = [
  "developed",
  "built",
  "created",
  "designed",
  "implemented",
  "integrated",
  "optimized",
  "improved",
  "managed",
  "led",
  "automated",
  "deployed",
  "tested",
  "configured",
  "engineered",
  "analyzed",
  "collaborated",
  "delivered",
  "reduced",
  "increased",
];

// ==============================
// MEASURABLE IMPACT DETECTION
// ==============================
const hasMeasurableImpact = (text) => {
  const value = String(text || "");

  const patterns = [
    /\b\d+(?:\.\d+)?\s*%/,
    /\b\d+\+?\s+(?:users?|students?|customers?|clients?|requests?|records?|files?|modules?|features?|apis?|endpoints?|tests?|cases?)\b/i,
    /\b(?:increased|improved|reduced|decreased|saved|cut|grew|boosted)\b[^.\n]*\b\d+/i,
    /\b\d+(?:\.\d+)?x\b/i,
  ];

  return patterns.some((pattern) =>
    pattern.test(value)
  );
};

// ==============================
// ACTION VERB DETECTION
// ==============================
const hasActionVerb = (text) => {
  const value = normalizeText(text);

  return ACTION_VERBS.some((verb) =>
    new RegExp(
      `\\b${verb}\\b`,
      "i"
    ).test(value)
  );
};

// ==============================
// PROJECT TECHNOLOGY DETECTION
// ==============================
const hasProjectTechnology = (
  projects = []
) => {
  const text =
    normalizeText(
      projects.join(" ")
    );

  const patterns = [
    /\btech stack\b/,
    /\btechnology\b/,
    /\btechnologies\b/,
    /\bjava\b/,
    /\bjavascript\b/,
    /\bpython\b/,
    /\bsql\b/,
    /\breact\b/,
    /\bnode\b/,
    /\bexpress\b/,
    /\bmongodb\b/,
    /\bmysql\b/,
    /\bspring\b/,
    /\bmern\b/,
    /\bapi\b/,
  ];

  return patterns.some((pattern) =>
    pattern.test(text)
  );
};

// ==============================
// ROLE RELEVANCE
// ==============================
const calculateRoleRelevance = (
  resume
) => {
  const matched =
    resume.matchedSkills || [];

  const missing =
    resume.missingSkills || [];

  const total =
    matched.length +
    missing.length;

  if (total === 0) {
    return 50;
  }

  return clampScore(
    (matched.length / total) *
      100
  );
};

// ==============================
// CONTENT QUALITY
// ==============================
const calculateContentQuality = (
  resume
) => {
  let score = 0;

  const contact =
    resume.contact || {};

  if (
    contact.name &&
    contact.email &&
    contact.phone
  ) {
    score += 15;
  }

  if (
    resume.education?.length
  ) {
    score += 15;
  }

  if (
    resume.extractedSkills?.length >=
    5
  ) {
    score += 15;
  } else if (
    resume.extractedSkills?.length
  ) {
    score += 8;
  }

  if (
    resume.projects?.length
  ) {
    score += 20;
  }

  if (
    resume.summary?.trim()
  ) {
    score += 10;
  }

  if (
    resume.certifications?.length
  ) {
    score += 5;
  }

  if (
    resume.achievements?.length
  ) {
    score += 5;
  }

  if (
    contact.linkedin
  ) {
    score += 5;
  }

  if (
    contact.github
  ) {
    score += 5;
  }

  if (
    resume.internships?.length ||
    resume.experience?.length
  ) {
    score += 5;
  }

  return clampScore(score);
};

// ==============================
// PROJECT QUALITY
// ==============================
const calculateProjectQuality = (
  resume
) => {
  const projects =
    resume.projects || [];

  if (!projects.length) {
    return 0;
  }

  const projectText =
    projects.join(" ");

  let score = 30;

  if (
    hasProjectTechnology(
      projects
    )
  ) {
    score += 20;
  }

  if (
    hasActionVerb(
      projectText
    )
  ) {
    score += 20;
  }

  if (
    /github\.com/i.test(
      projectText
    )
  ) {
    score += 15;
  }

  if (
    hasMeasurableImpact(
      projectText
    )
  ) {
    score += 15;
  }

  return clampScore(score);
};

// ==============================
// IMPACT SCORE
// ==============================
const calculateImpactScore = (
  resume
) => {
  const content = [
    ...(resume.projects || []),
    ...(resume.experience || []),
    ...(resume.internships || []),
    ...(resume.achievements || []),
  ].join(" ");

  if (!content.trim()) {
    return 0;
  }

  let score = 25;

  if (
    hasActionVerb(content)
  ) {
    score += 30;
  }

  if (
    hasMeasurableImpact(content)
  ) {
    score += 35;
  }

  if (
    resume.achievements?.length
  ) {
    score += 10;
  }

  return clampScore(score);
};

// ==============================
// SECTION QUALITY
// ==============================
const calculateSectionQuality = (
  resume
) => {
  const presence =
    resume.sectionPresence || {};

  const weightedSections = [
    ["education", 15],
    ["skills", 20],
    ["projects", 20],
    ["summary", 15],
    ["certifications", 10],
    ["achievements", 5],
    ["interests", 5],
  ];

  let score = 0;

  weightedSections.forEach(
    ([section, weight]) => {
      if (presence[section]) {
        score += weight;
      }
    }
  );

  const contact =
    resume.contact || {};

  if (
    contact.email &&
    contact.phone
  ) {
    score += 10;
  }

  return clampScore(score);
};

// ==============================
// FORMAT REVIEW
// ==============================
const buildFormatReview = (
  resume
) => {
  const pageCount =
    Number(resume.pageCount) || 0;

  const contact =
    resume.contact || {};

  const suggestions = [];

  let pageLengthStatus =
    "Unknown";

  let recommendedPageCount =
    "1 page preferred for most fresher resumes";

  if (pageCount === 1) {
    pageLengthStatus = "Good";
  } else if (pageCount > 1) {
    pageLengthStatus =
      "Needs Improvement";

    suggestions.push(
      "For a fresher resume, consider keeping the resume to one focused page unless additional highly relevant experience justifies more space"
    );
  } else {
    suggestions.push(
      "Page count could not be determined"
    );
  }

  const detectedSections =
    resume.detectedSections || [];

  const sectionOrganizationScore =
    clampScore(
      Math.min(
        detectedSections.length *
          12,
        100
      )
    );

  const contactLinksPresent =
    Boolean(
      contact.linkedin ||
      contact.github ||
      contact.portfolio
    );

  const atsFriendlyStructure =
    Boolean(
      resume.sectionPresence
        ?.education &&
      resume.sectionPresence
        ?.skills &&
      resume.sectionPresence
        ?.projects
    );

  if (!contactLinksPresent) {
    suggestions.push(
      "Add relevant professional links such as LinkedIn, GitHub, or a portfolio"
    );
  }

  if (!atsFriendlyStructure) {
    suggestions.push(
      "Use clearly labeled standard sections such as Education, Skills, and Projects"
    );
  }

  return {
    pageCount,
    recommendedPageCount,
    pageLengthStatus,
    atsFriendlyStructure,
    contactLinksPresent,
    sectionOrganizationScore,
    suggestions:
      uniqueStrings(
        suggestions
      ),
  };
};

// ==============================
// SECTION REVIEW HELPER
// ==============================
const createSectionReview = ({
  section,
  present,
  score,
  optional = false,
  strengths = [],
  issues = [],
  suggestions = [],
}) => {
  let status =
    "Needs Improvement";

  if (!present && optional) {
    status = "Optional";
  } else if (!present) {
    status = "Missing";
  } else if (score >= 85) {
    status = "Strong";
  } else if (score >= 65) {
    status = "Good";
  }

  return {
    section,
    present,
    score:
      clampScore(score),
    status,
    strengths:
      uniqueStrings(
        strengths
      ),
    issues:
      uniqueStrings(
        issues
      ),
    suggestions:
      uniqueStrings(
        suggestions
      ),
  };
};

// ==============================
// BUILD SECTION REVIEWS
// ==============================
const buildSectionReviews = (
  resume
) => {
  const reviews = [];

  const contact =
    resume.contact || {};

  const presence =
    resume.sectionPresence || {};

  // CONTACT
  const contactComplete =
    Boolean(
      contact.name &&
      contact.email &&
      contact.phone
    );

  reviews.push(
    createSectionReview({
      section: "Contact",
      present:
        Boolean(
          contact.name ||
          contact.email ||
          contact.phone
        ),
      score:
        contactComplete
          ? 90
          : 50,
      strengths:
        contactComplete
          ? [
              "Name, email and phone number are present",
            ]
          : [],
      issues:
        contactComplete
          ? []
          : [
              "Core contact information is incomplete",
            ],
      suggestions:
        contactComplete
          ? []
          : [
              "Provide name, professional email address and phone number",
            ],
    })
  );

  // SUMMARY
  const summaryPresent =
    Boolean(
      resume.summary?.trim()
    );

  reviews.push(
    createSectionReview({
      section: "Summary",
      present:
        summaryPresent,
      score:
        summaryPresent
          ? 75
          : 0,
      issues:
        summaryPresent
          ? []
          : [
              "Professional summary or career objective is missing",
            ],
      suggestions:
        summaryPresent
          ? [
              "Keep the summary concise and aligned with the target role",
            ]
          : [
              "Add a concise 2-4 line professional summary or career objective focused on the target role",
            ],
    })
  );

  // EDUCATION
  const educationPresent =
    Boolean(
      resume.education?.length
    );

  reviews.push(
    createSectionReview({
      section: "Education",
      present:
        educationPresent,
      score:
        educationPresent
          ? 90
          : 0,
      strengths:
        educationPresent
          ? [
              "Education details are present",
            ]
          : [],
      issues:
        educationPresent
          ? []
          : [
              "Education section is missing",
            ],
      suggestions:
        educationPresent
          ? []
          : [
              "Add degree, institution, graduation year and relevant academic details",
            ],
    })
  );

  // SKILLS
  const skillsCount =
    resume.extractedSkills
      ?.length || 0;

  reviews.push(
    createSectionReview({
      section: "Skills",
      present:
        Boolean(skillsCount),
      score:
        skillsCount >= 8
          ? 90
          : skillsCount >= 4
            ? 70
            : skillsCount > 0
              ? 50
              : 0,
      strengths:
        skillsCount >= 8
          ? [
              "Resume contains a broad technical skill set",
            ]
          : [],
      issues:
        skillsCount === 0
          ? [
              "Skills section is missing or could not be extracted",
            ]
          : [],
      suggestions:
        resume.missingSkills
          ?.length
          ? [
              `Target-role skills not currently evidenced in the resume: ${resume.missingSkills.join(
                ", "
              )}`,
              "Do not add missing skills unless you genuinely possess them",
            ]
          : [],
    })
  );

  // PROJECTS
  const projectsPresent =
    Boolean(
      resume.projects?.length
    );

  const projectQuality =
    calculateProjectQuality(
      resume
    );

  const projectText =
    (resume.projects || []).join(
      " "
    );

  reviews.push(
    createSectionReview({
      section: "Projects",
      present:
        projectsPresent,
      score:
        projectQuality,
      strengths: [
        ...(projectsPresent &&
        hasProjectTechnology(
          resume.projects
        )
          ? [
              "Project technologies are described",
            ]
          : []),

        ...(projectsPresent &&
        hasActionVerb(projectText)
          ? [
              "Project descriptions use action-oriented language",
            ]
          : []),

        ...(/github\.com/i.test(
          projectText
        )
          ? [
              "Project includes a GitHub reference",
            ]
          : []),
      ],
      issues: [
        ...(!projectsPresent
          ? [
              "Projects section is missing",
            ]
          : []),

        ...(projectsPresent &&
        !hasMeasurableImpact(
          projectText
        )
          ? [
              "Project descriptions do not show measurable results or impact",
            ]
          : []),
      ],
      suggestions: [
        ...(!projectsPresent
          ? [
              "Add relevant academic or personal projects",
            ]
          : []),

        ...(projectsPresent &&
        !hasMeasurableImpact(
          projectText
        )
          ? [
              "Where truthful and available, add measurable project outcomes such as users, modules, performance improvements, test coverage, or other concrete results",
            ]
          : []),
      ],
    })
  );

  // INTERNSHIP
  const internshipPresent =
    Boolean(
      resume.internships?.length
    );

  reviews.push(
    createSectionReview({
      section: "Internships",
      present:
        internshipPresent,
      optional: true,
      score:
        internshipPresent
          ? 80
          : 0,
      strengths:
        internshipPresent
          ? [
              "Internship experience is included",
            ]
          : [],
      suggestions:
        internshipPresent
          ? [
              "Describe responsibilities, technologies and outcomes clearly",
            ]
          : [
              "For a fresher, internships are optional; add them only if you have genuine internship experience",
            ],
    })
  );

  // EXPERIENCE
  const experiencePresent =
    Boolean(
      resume.experience?.length
    );

  reviews.push(
    createSectionReview({
      section: "Experience",
      present:
        experiencePresent,
      optional: true,
      score:
        experiencePresent
          ? 80
          : 0,
      strengths:
        experiencePresent
          ? [
              "Work experience is included",
            ]
          : [],
      suggestions:
        experiencePresent
          ? [
              "Use action verbs and measurable outcomes where possible",
            ]
          : [
              "Professional experience is optional for a fresher; do not create fictional experience",
            ],
    })
  );

  // CERTIFICATIONS
  const certificationPresent =
    Boolean(
      resume.certifications
        ?.length
    );

  reviews.push(
    createSectionReview({
      section: "Certifications",
      present:
        certificationPresent,
      optional: true,
      score:
        certificationPresent
          ? 85
          : 0,
      strengths:
        certificationPresent
          ? [
              "Relevant certifications are included",
            ]
          : [],
      suggestions:
        certificationPresent
          ? []
          : [
              "Add relevant certifications only if completed",
            ],
    })
  );

  // ACHIEVEMENTS
  const achievementPresent =
    Boolean(
      resume.achievements
        ?.length
    );

  reviews.push(
    createSectionReview({
      section: "Achievements",
      present:
        achievementPresent,
      optional: true,
      score:
        achievementPresent
          ? 80
          : 0,
      strengths:
        achievementPresent
          ? [
              "Achievement information is included",
            ]
          : [],
    })
  );

  return reviews;
};

// ==============================
// BUILD IMPROVEMENT FIELDS
// ==============================
const buildImprovementFields = (
  resume
) => {
  const fields = [];

  const contact =
    resume.contact || {};

  if (!contact.name) {
    fields.push({
      key: "contactName",
      section: "Contact",
      label: "Full Name",
      fieldType: "text",
      required: true,
      reason:
        "Your name is required for the improved resume",
      placeholder:
        "Enter your full name",
      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

  if (!contact.email) {
    fields.push({
      key: "contactEmail",
      section: "Contact",
      label: "Email Address",
      fieldType: "text",
      required: true,
      reason:
        "A professional email address is required",
      placeholder:
        "Enter your professional email",
      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

  if (!contact.phone) {
    fields.push({
      key: "contactPhone",
      section: "Contact",
      label: "Phone Number",
      fieldType: "text",
      required: true,
      reason:
        "A phone number is required for recruiter contact",
      placeholder:
        "Enter your phone number",
      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

  if (!contact.portfolio) {
    fields.push({
      key: "portfolio",
      section: "Contact",
      label: "Portfolio URL",
      fieldType: "url",
      required: false,
      reason:
        "A portfolio can strengthen a technical profile when available",
      placeholder:
        "https://yourportfolio.com",
      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

  if (!resume.summary?.trim()) {
    fields.push({
      key: "professionalSummary",
      section: "Summary",
      label:
        "Professional Summary / Career Objective",
      fieldType: "textarea",
      required: false,
      reason:
        "A concise role-focused introduction can improve resume clarity",
      placeholder:
        "Write 2-4 lines about your skills, strengths, target role and relevant experience",
      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

    if (
    !resume.languages?.length
  ) {
    fields.push({
      key: "languages",
      section: "Languages",
      label: "Languages Known",
      fieldType: "multi-select",
      required: false,

      options: [
        "English",
        "Kannada",
        "Hindi",
        "Tamil",
        "Telugu",
        "Malayalam",
        "Marathi",
        "Bengali",
        "Gujarati",
        "Punjabi",
        "Urdu",
        "Odia",
        "Assamese",
        "Sanskrit",
        "French",
        "German",
        "Spanish",
        "Japanese",
        "Korean",
      ],

      reason:
        "Select only the languages you genuinely know",

      placeholder:
        "Select languages",

      currentValue: "",
      studentValue: "",
      status: "Missing",
    });
  }

 if (
  resume.projects?.length &&
  !cleanText(resume.projectImpact)
) {
    fields.push({
      key: "projectImpact",
      section: "Projects",
      label:
        "Project Result / Measurable Impact",
      fieldType: "textarea",
      required: false,
      reason:
        "Your project explains what you built but does not currently show measurable outcomes",
      placeholder:
        "Example: number of modules, users, APIs, test cases, performance improvement, or another truthful measurable result",
      currentValue: "",
      studentValue: "",
      status:
        "Needs Improvement",
    });
  }

    if (
    resume.missingSkills?.length
  ) {
    fields.push({
      key: "confirmedTargetSkills",
      section: "Skills",
      label:
        "Skills You Already Know",

      fieldType: "multi-select",
      required: false,

      options: uniqueStrings(
        resume.missingSkills || []
      ),

      reason:
        "These skills were not found in your resume. Select only the skills you genuinely already know. Unselected skills will remain skill gaps for your preparation roadmap.",

      placeholder:
        "Select only skills you genuinely know",

      currentValue: "",
      studentValue: "",

      status:
        "Needs Improvement",
    });
  }

  return fields;
};

// ==============================
// ADVANCED RESUME REVIEW
// ==============================
const reviewResume = ({
  resume,
}) => {
  if (!resume) {
    return {
      success: false,
      errorMessage:
        "Resume is required for advanced review",
    };
  }

  try {
    const contentQualityScore =
      calculateContentQuality(
        resume
      );

    const sectionQualityScore =
      calculateSectionQuality(
        resume
      );

    const projectQualityScore =
      calculateProjectQuality(
        resume
      );

    const impactScore =
      calculateImpactScore(
        resume
      );

    const roleRelevanceScore =
      calculateRoleRelevance(
        resume
      );

    const formatReview =
      buildFormatReview(
        resume
      );

    let formatScore = 0;

    if (
      formatReview.pageLengthStatus ===
      "Good"
    ) {
      formatScore += 35;
    }

    if (
      formatReview.atsFriendlyStructure
    ) {
      formatScore += 35;
    }

    if (
      formatReview.contactLinksPresent
    ) {
      formatScore += 15;
    }

    formatScore +=
      Math.round(
        formatReview.sectionOrganizationScore *
          0.15
      );

    formatScore =
      clampScore(
        formatScore
      );

    // ==============================
    // OVERALL REVIEW SCORE
    // ==============================
    const overallScore =
      clampScore(
        contentQualityScore *
          0.25 +
          sectionQualityScore *
            0.2 +
          projectQualityScore *
            0.2 +
          impactScore *
            0.1 +
          roleRelevanceScore *
            0.15 +
          formatScore *
            0.1
      );

    const sectionReviews =
      buildSectionReviews(
        resume
      );

    const improvementFields =
      buildImprovementFields(
        resume
      );


      // ==============================
// POSITIVE DETECTION FEEDBACK
// ==============================
const positiveFeedback = [];

const contact =
  resume.contact || {};

if (
  contact.name &&
  contact.email &&
  contact.phone
) {
  positiveFeedback.push(
    "Contact information detected"
  );
}

if (resume.summary?.trim()) {
  positiveFeedback.push(
    "Professional Summary detected"
  );
}

if (resume.education?.length) {
  positiveFeedback.push(
    "Education detected"
  );
}

if (resume.extractedSkills?.length) {
  positiveFeedback.push(
    "Technical Skills detected"
  );
}

if (resume.projects?.length) {
  positiveFeedback.push(
    "Projects detected"
  );
}

if (
  cleanText(
    resume.projectImpact
  )
) {
  positiveFeedback.push(
    "Project Impact detected"
  );
}

if (contact.portfolio) {
  positiveFeedback.push(
    "Portfolio detected"
  );
}

if (contact.github) {
  positiveFeedback.push(
    "GitHub detected"
  );
}

if (contact.linkedin) {
  positiveFeedback.push(
    "LinkedIn detected"
  );
}

if (resume.internships?.length) {
  positiveFeedback.push(
    "Internship experience detected"
  );
}

if (resume.experience?.length) {
  positiveFeedback.push(
    "Work experience detected"
  );
}

if (resume.certifications?.length) {
  positiveFeedback.push(
    "Certifications detected"
  );
}

if (resume.achievements?.length) {
  positiveFeedback.push(
    "Achievements detected"
  );
}

if (resume.languages?.length) {
  positiveFeedback.push(
    "Languages detected"
  );
}

    const strengths = [];

    if (
      resume.contact?.email &&
      resume.contact?.phone
    ) {
      strengths.push(
        "Core contact information is available"
      );
    }

    if (
      resume.extractedSkills
        ?.length >= 8
    ) {
      strengths.push(
        "Resume demonstrates a broad technical skill set"
      );
    }

    if (
      resume.projects?.length
    ) {
      strengths.push(
        "Technical project experience is included"
      );
    }

    if (
      resume.contact?.github
    ) {
      strengths.push(
        "GitHub profile is available for technical work"
      );
    }

    if (
      resume.contact?.linkedin
    ) {
      strengths.push(
        "LinkedIn profile is included"
      );
    }

    if (
      resume.certifications
        ?.length
    ) {
      strengths.push(
        "Relevant certifications are included"
      );
    }

    const priorityImprovements = [];

    if (
      !resume.summary?.trim()
    ) {
      priorityImprovements.push(
        "Add a concise professional summary or career objective tailored to the target role"
      );
    }

    if (
      resume.missingSkills
        ?.length
    ) {
      priorityImprovements.push(
        `Target-role gaps currently identified: ${resume.missingSkills.join(
          ", "
        )}. Add them to the resume only if you genuinely possess those skills`
      );
    }

    if (
  resume.projects?.length &&
  !cleanText(resume.projectImpact)
) {
  priorityImprovements.push(
    "Add a truthful project result or impact where available"
  );
}
    if (
      resume.pageCount > 1
    ) {
      priorityImprovements.push(
        "Consider reducing the resume to one focused page for a fresher profile"
      );
    }

    const recommendations = [
      ...formatReview.suggestions,
    ];

    if (
      resume.projects?.length
    ) {
      recommendations.push(
        "Keep project bullets concise and focus on what you built, the technologies used, your contribution and the result"
      );
    }

    if (
      !resume.internships
        ?.length &&
      !resume.experience?.length
    ) {
      recommendations.push(
        "Do not invent work experience. For a fresher, strong projects, skills, certifications and achievements can provide relevant evidence"
      );
    }

    return {
      success: true,

    data: {
  overallScore,

  contentQualityScore,

  sectionQualityScore,

  projectQualityScore,

  impactScore,

  roleRelevanceScore,

  formatScore,

  sectionReviews,

  formatReview,

  improvementFields,

  positiveFeedback:
    uniqueStrings(
      positiveFeedback
    ),

  strengths:
    uniqueStrings(
      strengths
    ),

        priorityImprovements:
          uniqueStrings(
            priorityImprovements
          ),

        recommendations:
          uniqueStrings(
            recommendations
          ),

        reviewStatus:
          "Reviewed",

        reviewedAt:
          new Date(),
      },
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
  reviewResume,
};