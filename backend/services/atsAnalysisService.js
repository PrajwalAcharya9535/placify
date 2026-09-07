// ==============================
// NORMALIZE TEXT
// ==============================
const normalizeText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ==============================
// UNIQUE STRINGS
// ==============================
const uniqueStrings = (items) => {
  return [
    ...new Set(
      items
        .map((item) =>
          String(item || "").trim()
        )
        .filter(Boolean)
    ),
  ];
};

// ==============================
// ESCAPE REGEX
// ==============================
const escapeRegExp = (text) => {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ==============================
// EXACT SKILL MATCH
// ==============================
const containsSkill = (
  text,
  skill
) => {
  const normalizedText =
    normalizeText(text);

  const normalizedSkill =
    normalizeText(skill);

  if (!normalizedText || !normalizedSkill) {
    return false;
  }

  // ==============================
  // MULTI-WORD / SPECIAL SKILLS
  // ==============================
  const escapedSkill =
    escapeRegExp(
      normalizedSkill
    ).replace(
      /\s+/g,
      "\\s+"
    );

  const pattern =
    new RegExp(
      `(^|[^a-z0-9])${escapedSkill}([^a-z0-9]|$)`,
      "i"
    );

  return pattern.test(
    normalizedText
  );
};

// ==============================
// SKILL DICTIONARY
// ==============================
const skillDictionary = [
  "java",
  "javascript",
  "python",
  "sql",
  "c",
  "c++",

  "html",
  "html5",
  "css",
  "css3",

  "react",
  "react.js",

  "node.js",
  "express.js",

  "mongodb",
  "mysql",

  "spring boot",
  "spring",

  "oop",
  "dbms",

  "data structures",
  "dsa",

  "rest api",
  "rest apis",

  "git",
  "github",

  "aws",

  "jwt",
  "jwt authentication",

  "problem solving",
];

// ==============================
// REMOVE CHILD SKILLS
// ==============================
const removeOverlappingSkills = (
  skills
) => {
  const normalized =
    uniqueStrings(skills);

  return normalized.filter(
    (skill) => {
      return !normalized.some(
        (otherSkill) => {
          if (
            otherSkill === skill
          ) {
            return false;
          }

          return (
            otherSkill.length >
              skill.length &&
            normalizeText(
              otherSkill
            ).includes(
              normalizeText(skill)
            )
          );
        }
      );
    }
  );
};

// ==============================
// EXTRACT RESUME SKILLS
// ==============================
const extractSkills = (
  resumeText
) => {
  const foundSkills =
    skillDictionary.filter(
      (skill) =>
        containsSkill(
          resumeText,
          skill
        )
    );

  return removeOverlappingSkills(
    foundSkills
  );
};

// ==============================
// EXTRACT JOB KEYWORDS
// ==============================
const extractJobKeywords = (
  jobDescription
) => {
  const foundKeywords =
    skillDictionary.filter(
      (skill) =>
        containsSkill(
          jobDescription,
          skill
        )
    );

  return removeOverlappingSkills(
    foundKeywords
  );
};

// ==============================
// SECTION DETECTION
// ==============================
const detectSections = (
  resumeText
) => {
  const normalizedResume =
    normalizeText(resumeText);

  return {
    education:
      /\beducation\b/i.test(
        normalizedResume
      ),

    skills:
      /\bskills?\b/i.test(
        normalizedResume
      ),

    projects:
      /\bprojects?\b/i.test(
        normalizedResume
      ),

    experience:
      /\bexperience\b/i.test(
        normalizedResume
      ),

    certifications:
      /\bcertifications?\b/i.test(
        normalizedResume
      ),

    achievements:
      /\bachievements?\b/i.test(
        normalizedResume
      ),

    contact:
      /[\w.-]+@[\w.-]+\.\w+/i.test(
        resumeText
      ) ||
      /\b\d{10}\b/.test(
        String(
          resumeText || ""
        ).replace(/\s+/g, "")
      ),

    linkedin:
      /linkedin/i.test(
        resumeText
      ),

    github:
      /github/i.test(
        resumeText
      ),
  };
};

// ==============================
// ATS ANALYSIS
// ==============================
const analyzeResume = ({
  resumeText,
  jobDescription,
}) => {
  const extractedSkills =
    extractSkills(
      resumeText
    );

  const jobKeywords =
    extractJobKeywords(
      jobDescription
    );

  // ==============================
  // MATCHED / MISSING KEYWORDS
  // ==============================
  const matchedKeywords =
    jobKeywords.filter(
      (keyword) =>
        containsSkill(
          resumeText,
          keyword
        )
    );

  const missingKeywords =
    jobKeywords.filter(
      (keyword) =>
        !containsSkill(
          resumeText,
          keyword
        )
    );

  // ==============================
  // KEYWORD SCORE
  // ==============================
  const keywordScore =
    jobKeywords.length > 0
      ? Math.round(
          (matchedKeywords.length /
            jobKeywords.length) *
            100
        )
      : 0;

  // ==============================
  // SKILL MATCH
  // ==============================
  const matchedSkills =
    matchedKeywords;

  const missingSkills =
    missingKeywords;

  const skillMatchScore =
    jobKeywords.length > 0
      ? Math.round(
          (matchedSkills.length /
            jobKeywords.length) *
            100
        )
      : 0;

  // ==============================
  // COMPLETENESS SCORE
  // ==============================
  const sections =
    detectSections(
      resumeText
    );

  const importantSections = [
    sections.education,
    sections.skills,
    sections.projects,
    sections.contact,
    sections.linkedin,
    sections.github,
    sections.certifications,
  ];

  const completedSections =
    importantSections.filter(
      Boolean
    ).length;

  const completenessScore =
    Math.round(
      (completedSections /
        importantSections.length) *
        100
    );

  // ==============================
  // FINAL ATS SCORE
  // ==============================
  /*
    Keyword Score      = 40%
    Skill Match Score  = 35%
    Completeness       = 25%
  */

  const atsScore =
    Math.round(
      keywordScore *
        0.4 +
        skillMatchScore *
          0.35 +
        completenessScore *
          0.25
    );

  // ==============================
  // STRENGTHS
  // ==============================
  const strengths = [];

  if (
    keywordScore >= 80
  ) {
    strengths.push(
      "Strong job keyword match"
    );
  }

  if (
    skillMatchScore >= 80
  ) {
    strengths.push(
      "Strong skill match"
    );
  }

  if (
    completenessScore >= 80
  ) {
    strengths.push(
      "Resume has strong section completeness"
    );
  }

  // ==============================
  // WEAKNESSES
  // ==============================
  const weaknesses = [];

  if (
    keywordScore < 60
  ) {
    weaknesses.push(
      "Low job keyword match"
    );
  }

  if (
    skillMatchScore < 60
  ) {
    weaknesses.push(
      "Missing important job skills"
    );
  }

  if (
    completenessScore < 80
  ) {
    weaknesses.push(
      "Resume sections are incomplete"
    );
  }

  // ==============================
  // SUGGESTIONS
  // ==============================
  const suggestions = [];

  if (
    keywordScore < 80
  ) {
    suggestions.push(
      "Improve the alignment between your resume and the target job description"
    );
  }

  if (
    missingSkills.length > 0
  ) {
    suggestions.push(
      `Consider adding relevant missing skills only if you genuinely have them: ${missingSkills.join(
        ", "
      )}`
    );
  }

  if (
    !sections.education
  ) {
    suggestions.push(
      "Add an Education section"
    );
  }

  if (
    !sections.skills
  ) {
    suggestions.push(
      "Add a Skills section"
    );
  }

  if (
    !sections.projects
  ) {
    suggestions.push(
      "Add a Projects section"
    );
  }

  if (
    !sections.contact
  ) {
    suggestions.push(
      "Add contact information"
    );
  }

  if (
    !sections.linkedin
  ) {
    suggestions.push(
      "Add your LinkedIn profile"
    );
  }

  if (
    !sections.github
  ) {
    suggestions.push(
      "Add your GitHub profile"
    );
  }

  if (
    !sections.certifications
  ) {
    suggestions.push(
      "Add relevant certifications if available"
    );
  }

  return {
    atsScore,

    keywordScore,

    skillMatchScore,

    completenessScore,

    extractedSkills,

    matchedKeywords,

    missingKeywords,

    matchedSkills,

    missingSkills,

    strengths:
      uniqueStrings(
        strengths
      ),

    weaknesses:
      uniqueStrings(
        weaknesses
      ),

    suggestions:
      uniqueStrings(
        suggestions
      ),
  };
};

module.exports = {
  analyzeResume,
};