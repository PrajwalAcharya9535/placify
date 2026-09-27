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
// CASE-INSENSITIVE
// ==============================
const uniqueStrings = (items = []) => {
  const seen = new Set();

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

// ==============================
// ESCAPE REGEX
// ==============================
const escapeRegExp = (text) => {
  return String(text || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ==============================
// CANONICAL SKILL ALIASES
// ==============================
const skillAliases = {
  java: ["java"],

  javascript: [
    "javascript",
    "java script",
  ],

  python: ["python"],

  sql: ["sql"],

  c: ["c"],

  "c++": ["c++"],

  html: [
    "html",
    "html5",
  ],

  css: [
    "css",
    "css3",
  ],

  react: [
    "react",
    "react.js",
    "reactjs",
  ],

  "node.js": [
    "node.js",
    "nodejs",
    "node js",
  ],

  "express.js": [
    "express.js",
    "expressjs",
    "express js",
  ],

  mongodb: [
    "mongodb",
    "mongo db",
  ],

  mysql: [
    "mysql",
    "my sql",
  ],

  "spring boot": [
    "spring boot",
    "springboot",
  ],

  spring: ["spring"],

  oop: [
    "oop",
    "oops",
    "object oriented programming",
    "object-oriented programming",
  ],

  dbms: ["dbms"],

  "data structures": [
    "data structures",
    "data structure",
    "dsa",
  ],

  "rest api": [
    "rest api",
    "rest apis",
    "restful api",
    "restful apis",
    "restful services",
    "rest services",
  ],

  git: ["git"],

  github: ["github"],

  aws: [
    "aws",
    "amazon web services",
  ],

  jwt: [
    "jwt",
    "jwt authentication",
    "json web token",
    "json web tokens",
  ],

  "problem solving": [
    "problem solving",
    "problem-solving",
  ],
};

// ==============================
// EXACT PHRASE MATCH
// ==============================
const containsPhrase = (
  text,
  phrase
) => {
  const normalizedText =
    normalizeText(text);

  const normalizedPhrase =
    normalizeText(phrase);

  if (
    !normalizedText ||
    !normalizedPhrase
  ) {
    return false;
  }

  const escaped =
    escapeRegExp(
      normalizedPhrase
    ).replace(
      /\s+/g,
      "\\s+"
    );

  const pattern =
    new RegExp(
      `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
      "i"
    );

  return pattern.test(
    normalizedText
  );
};

// ==============================
// CANONICAL SKILL MATCH
// ==============================
const containsSkill = (
  text,
  canonicalSkill
) => {
  const aliases =
    skillAliases[
      canonicalSkill
    ] || [
      canonicalSkill,
    ];

  return aliases.some(
    (alias) =>
      containsPhrase(
        text,
        alias
      )
  );
};

// ==============================
// SKILL DICTIONARY
// ==============================
const skillDictionary =
  Object.keys(
    skillAliases
  );

// ==============================
// EXTRACT SKILLS
// ==============================
const extractSkills = (
  text
) => {
  return skillDictionary.filter(
    (skill) =>
      containsSkill(
        text,
        skill
      )
  );
};

// ==============================
// EXTRACT JOB KEYWORDS
// ==============================
const extractJobKeywords = (
  jobDescription
) => {
  let keywords =
    extractSkills(
      jobDescription
    );

  // If a more specific technology is detected,
  // do not count its parent term separately.
  if (
    keywords.includes(
      "spring boot"
    )
  ) {
    keywords =
      keywords.filter(
        (skill) =>
          skill !== "spring"
      );
  }

  return keywords;
};

// ==============================
// SECTION DETECTION
// ==============================
const detectSections = (
  resumeText
) => {
  const text =
    String(resumeText || "");

  const normalized =
    normalizeText(text);

  const compactPhoneText =
    text.replace(
      /[\s\-()]/g,
      ""
    );

  return {
    summary:
      /\b(summary|professional summary|profile summary|career objective|objective|about me)\b/i.test(
        normalized
      ),

    education:
      /\b(education|academic details|academic background|academics)\b/i.test(
        normalized
      ),

    skills:
      /\b(technical skills|key skills|skills|technologies)\b/i.test(
        normalized
      ),

    projects:
      /\b(project|projects|academic projects|personal projects)\b/i.test(
        normalized
      ),

    internships:
      /\b(internship|internships|internship experience)\b/i.test(
        normalized
      ),

    experience:
      /\b(work experience|professional experience|experience|employment history)\b/i.test(
        normalized
      ),

    certifications:
      /\b(certification|certifications|courses)\b/i.test(
        normalized
      ),

    achievements:
      /\b(achievement|achievements|awards|accomplishments)\b/i.test(
        normalized
      ),

    languages:
      /\b(languages known|languages)\b/i.test(
        normalized
      ),

    interests:
      /\b(interests|hobbies|activities)\b/i.test(
        normalized
      ),

    contact:
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
        text
      ) &&
      /(?:\+91)?[6-9]\d{9}/.test(
        compactPhoneText
      ),

    linkedin:
      /linkedin\.com/i.test(
        text
      ),

    github:
      /github\.com/i.test(
        text
      ),
  };
};

// ==============================
// COMPLETENESS SCORE
// FRESHER-AWARE
// ==============================
const calculateCompleteness = (
  sections
) => {
  /*
    Core fresher resume structure.

    Experience/internship is useful,
    but a fresher should not be
    penalized heavily for not having
    professional experience.

    Total = 100
  */

  const weights = {
    contact: 20,
    education: 15,
    skills: 20,
    projects: 20,
    summary: 10,
    linkedin: 5,
    github: 5,
    certifications: 5,
  };

  let score = 0;

  Object.entries(
    weights
  ).forEach(
    ([section, weight]) => {
      if (sections[section]) {
        score += weight;
      }
    }
  );

  return Math.min(
    100,
    Math.round(score)
  );
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
          (
            matchedKeywords.length /
            jobKeywords.length
          ) * 100
        )
      : 0;

  // ==============================
  // SKILL MATCH SCORE
  // ==============================
  const matchedSkills =
    [...matchedKeywords];

  const missingSkills =
    [...missingKeywords];

  const skillMatchScore =
    jobKeywords.length > 0
      ? Math.round(
          (
            matchedSkills.length /
            jobKeywords.length
          ) * 100
        )
      : 0;

  // ==============================
  // SECTION COMPLETENESS
  // ==============================
  const sections =
    detectSections(
      resumeText
    );

  const completenessScore =
    calculateCompleteness(
      sections
    );

  // ==============================
  // FINAL ATS SCORE
  // ==============================
  /*
    Current Placify ATS foundation:

    Keyword alignment = 40%
    Skill alignment   = 35%
    Completeness      = 25%

    Later advanced resume review
    will add separate content,
    format and quality metrics.
  */

  const atsScore =
    Math.round(
      keywordScore * 0.4 +
      skillMatchScore * 0.35 +
      completenessScore * 0.25
    );

  // ==============================
  // STRENGTHS
  // ==============================
  const strengths = [];

  if (
    keywordScore >= 80
  ) {
    strengths.push(
      "Strong target-job keyword alignment"
    );
  } else if (
    keywordScore >= 60
  ) {
    strengths.push(
      "Moderate target-job keyword alignment"
    );
  }

  if (
    skillMatchScore >= 80
  ) {
    strengths.push(
      "Strong target-job skill alignment"
    );
  } else if (
    skillMatchScore >= 60
  ) {
    strengths.push(
      "Moderate target-job skill alignment"
    );
  }

  if (
    completenessScore >= 85
  ) {
    strengths.push(
      "Strong core resume section completeness"
    );
  }

  if (
    sections.projects
  ) {
    strengths.push(
      "Projects section is present"
    );
  }

  if (
    sections.github
  ) {
    strengths.push(
      "GitHub profile is included"
    );
  }

  if (
    sections.linkedin
  ) {
    strengths.push(
      "LinkedIn profile is included"
    );
  }

  // ==============================
  // WEAKNESSES
  // ==============================
  const weaknesses = [];

  if (
    jobKeywords.length === 0
  ) {
    weaknesses.push(
      "No recognized technical job keywords were found in the supplied job description"
    );
  } else {
    if (
      keywordScore < 60
    ) {
      weaknesses.push(
        "Low target-job keyword alignment"
      );
    }

    if (
      skillMatchScore < 60
    ) {
      weaknesses.push(
        "Several target-job skills are not evidenced in the resume"
      );
    }
  }

  if (
    completenessScore < 80
  ) {
    weaknesses.push(
      "Some recommended core resume sections are missing"
    );
  }

  if (
    !sections.summary
  ) {
    weaknesses.push(
      "Professional summary or career objective is missing"
    );
  }

  // ==============================
  // SUGGESTIONS
  // ==============================
  const suggestions = [];

  if (
    jobKeywords.length === 0
  ) {
    suggestions.push(
      "Provide a more detailed job description to calculate meaningful keyword and skill alignment"
    );
  } else if (
    keywordScore < 80
  ) {
    suggestions.push(
      "Improve alignment with the target role using relevant keywords that truthfully reflect your skills and experience"
    );
  }

  if (
    missingSkills.length > 0
  ) {
    suggestions.push(
      `Consider developing or adding these target-role skills only when you genuinely have them: ${missingSkills.join(
        ", "
      )}`
    );
  }

  if (
    !sections.contact
  ) {
    suggestions.push(
      "Add both a professional email address and phone number"
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
      "Add a clearly labeled Skills section"
    );
  }

  if (
    !sections.projects
  ) {
    suggestions.push(
      "Add relevant academic or personal projects"
    );
  }

  if (
    !sections.summary
  ) {
    suggestions.push(
      "Consider adding a concise professional summary or career objective tailored to the target role"
    );
  }

  if (
    !sections.linkedin
  ) {
    suggestions.push(
      "Add your LinkedIn profile if available"
    );
  }

  if (
    !sections.github
  ) {
    suggestions.push(
      "Add your GitHub profile for technical roles if available"
    );
  }

  if (
    !sections.certifications
  ) {
    suggestions.push(
      "Add relevant certifications if available"
    );
  }

  if (
    !sections.internships &&
    !sections.experience
  ) {
    suggestions.push(
      "As a fresher, professional experience is not mandatory; add internships, practical training, freelance work, or other relevant experience only if you have it"
    );
  }

  return {
    atsScore,

    keywordScore,

    skillMatchScore,

    completenessScore,

    extractedSkills:
      uniqueStrings(
        extractedSkills
      ),

    matchedKeywords:
      uniqueStrings(
        matchedKeywords
      ),

    missingKeywords:
      uniqueStrings(
        missingKeywords
      ),

    matchedSkills:
      uniqueStrings(
        matchedSkills
      ),

    missingSkills:
      uniqueStrings(
        missingSkills
      ),

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