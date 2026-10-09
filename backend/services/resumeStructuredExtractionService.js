// ==============================
// NORMALIZE BASIC TEXT
// ==============================
const cleanText = (value) => {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
};

// ==============================
// PDF ARTIFACT DETECTION
// ==============================
const isPdfArtifact = (line) => {
  const value = cleanText(line);

  if (!value) {
    return true;
  }

  const artifactPatterns = [
    /^-+\s*\d+\s+of\s+\d+\s*-+$/i,
    /^\d+\s+of\s+\d+\s*-*$/i,
    /^page\s+\d+\s+of\s+\d+$/i,
    /^page\s+\d+$/i,
    /^\d+\s*\/\s*\d+$/,
  ];

  return artifactPatterns.some((pattern) =>
    pattern.test(value)
  );
};

// ==============================
// CLEAN LINE
// ==============================
const cleanLine = (value) => {
  const original = cleanText(value);

  // Remove PDF-generated footer/header artifacts
  // before removing bullets/dashes.
  if (isPdfArtifact(original)) {
    return "";
  }

  return original
    .replace(/^[•●▪■◆►➤✓✔\-–—]+\s*/, "")
    .trim();
};

// ==============================
// UNIQUE STRINGS
// ==============================
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

// ==============================
// COMMON SECTION HEADINGS
// ==============================
const SECTION_PATTERNS = {
  summary: [
    "summary",
    "professional summary",
    "profile",
    "profile summary",
    "career objective",
    "objective",
    "about me",
  ],

  education: [
    "education",
    "academic details",
    "academic background",
    "educational qualification",
    "educational qualifications",
    "academics",
  ],

  skills: [
  "skills",
  "technical skills",
  "key skills",
  "core skills",
  "technologies",
  "technical proficiency",
  "what i know",
  "skills i know",
  "technical knowledge",
  "technical knowledge and skills",
  "technical expertise",
  "technical competencies",
  "tools & technologies",
  "tools and technologies",
],

  projects: [
  "projects",
  "project",
  "academic projects",
  "personal projects",
  "major projects",
  "college work",
  "college projects",
  "project work",
  "academic work",
  "project experience",
],

  projectImpact: [
  "project impact",
  "project result",
  "project results",
  "project outcome",
  "project outcomes",
  "project achievements",
],

  internships: [
    "internship",
    "internships",
    "internship experience",
  ],

  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
  ],

  certifications: [
    "certification",
    "certifications",
    "courses",
    "courses & certifications",
    "certifications & courses",
  ],

  achievements: [
    "achievement",
    "achievements",
    "awards",
    "awards & achievements",
    "accomplishments",
  ],

  languages: [
    "language",
    "languages",
    "languages known",
  ],

interests: [
  "interest",
  "interests",
  "hobbies",
  "activities",
  "extracurricular activities",
  "other interests",
  "personal interests",
],

other: [
  "other",
  "others",
  "additional information",
  "additional details",
  "additional information & activities",
  "additional information and activities",
  "miscellaneous",
],

};

// ==============================
// COMBINED SECTION HEADINGS
// ==============================
const COMBINED_SECTION_PATTERNS = {
  certificationsAchievements: [
    "certifications & achievements",
    "certification & achievements",
    "certifications and achievements",
    "certification and achievements",
    "certifications / achievements",
    "certification / achievements",
    "certifications & awards",
    "certifications and awards",
  ],
};

// ==============================
// SKILL DICTIONARY
// ==============================
const SKILL_DICTIONARY = [
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "C",
  "C++",
  "C#",
  "PHP",
  "Kotlin",
  "Swift",

  "HTML",
  "HTML5",
  "CSS",
  "CSS3",
  "Bootstrap",
  "Tailwind CSS",

  "React",
  "React.js",
  "Angular",
  "Vue.js",

  "Node.js",
  "Express.js",

  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "SQLite",
  "Oracle",
  "SQL",

  "Spring",
  "Spring Boot",
  "Hibernate",

  "REST API",
  "REST APIs",
  "GraphQL",

  "Git",
  "GitHub",
  "Docker",
  "Kubernetes",

  "AWS",
  "Azure",
  "Google Cloud",

  "Machine Learning",
  "Deep Learning",
  "Artificial Intelligence",
  "AI",
  "TensorFlow",
  "Keras",
  "PyTorch",
  "Pandas",
  "NumPy",
  "Scikit-learn",

  "Data Structures",
  "DSA",
  "Algorithms",
  "OOP",
  "DBMS",

  "JWT",
  "JWT Authentication",

  "MERN",
  "MERN Stack",

  "Power BI",
  "Tableau",
  "Excel",

  "Figma",
  "Postman",

  "Problem Solving",
  "Communication",
  "Teamwork",
  "Leadership",
];

// ==============================
// ESCAPE REGEX
// ==============================
const escapeRegExp = (value) => {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ==============================
// EXACT SKILL MATCH
// ==============================
const containsSkill = (text, skill) => {
  const source = String(text || "").toLowerCase();

  const target = String(skill || "")
    .toLowerCase()
    .trim();

  if (!source || !target) {
    return false;
  }

  const escaped = escapeRegExp(target).replace(
    /\s+/g,
    "\\s+"
  );

  const regex = new RegExp(
    `(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`,
    "i"
  );

  return regex.test(source);
};

// ==============================
// SKILL FAMILY / ALIAS GROUPS
// ==============================
const SKILL_ALIAS_GROUPS = [
  ["HTML", "HTML5"],
  ["CSS", "CSS3"],
  ["React", "React.js"],
  ["REST API", "REST APIs"],
  ["JWT", "JWT Authentication"],
  ["MERN", "MERN Stack"],
];

// ==============================
// REMOVE ONLY TRUE SKILL ALIASES
// ==============================
const removeSkillAliases = (skills = []) => {
  let result = uniqueStrings(skills);

  SKILL_ALIAS_GROUPS.forEach((group) => {
    const detected = group.filter((skill) =>
      result.some(
        (item) =>
          item.toLowerCase() ===
          skill.toLowerCase()
      )
    );

    if (detected.length <= 1) {
      return;
    }

    const preferred = detected.reduce(
      (longest, current) =>
        current.length > longest.length
          ? current
          : longest
    );

    result = result.filter((item) => {
      const belongsToGroup = detected.some(
        (skill) =>
          skill.toLowerCase() ===
          item.toLowerCase()
      );

      if (!belongsToGroup) {
        return true;
      }

      return (
        item.toLowerCase() ===
        preferred.toLowerCase()
      );
    });
  });

  return result;
};

// ==============================
// NORMALIZE HEADING
// ==============================
const normalizeHeading = (line) => {
  return cleanLine(line)
    .toLowerCase()
    .replace(/[:\-–—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ==============================
// DETECT HEADING
// ==============================
const detectHeading = (line) => {
  const normalized =
    normalizeHeading(line);

  if (!normalized) {
    return null;
  }

  for (const [
    section,
    headings,
  ] of Object.entries(
    SECTION_PATTERNS
  )) {
    if (headings.includes(normalized)) {
      return {
        type: "single",
        section,
      };
    }
  }

  for (const [
    section,
    headings,
  ] of Object.entries(
    COMBINED_SECTION_PATTERNS
  )) {
    if (headings.includes(normalized)) {
      return {
        type: "combined",
        section,
      };
    }
  }

  return null;
};


// ==============================
// EXTRACT INLINE PROJECT IMPACT
// ==============================

const extractInlineProjectImpact = (line) => {
  const value = cleanLine(line);

  if (!value) {
    return "";
  }

  const match = value.match(
    /^(?:project\s+impact|project\s+result|project\s+results|project\s+outcome|project\s+outcomes)\s*:\s*(.+)$/i
  );

  return match?.[1]
    ? cleanText(match[1])
    : "";
};

// ==============================
// SPLIT RESUME INTO SECTIONS
// ==============================
const splitIntoSections = (resumeText) => {
  const lines = String(resumeText || "")
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);

  const sections = {
    header: [],
    summary: [],
    education: [],
    skills: [],
    projects: [],
projectImpact: [],
internships: [],
    experience: [],
    certifications: [],
    achievements: [],
    languages: [],
    interests: [],
    certificationsAchievements: [],
    other: [],
  };

  let currentSection = "header";

lines.forEach((line) => {
  const inlineProjectImpact =
    extractInlineProjectImpact(line);

 if (inlineProjectImpact) {
  sections.projectImpact.push(
    inlineProjectImpact
  );

  currentSection = "projectImpact";

  return;
}

  const heading =
    detectHeading(line);

  if (heading) {
    currentSection =
      heading.section;

    return;
  }

  if (!sections[currentSection]) {
    currentSection = "other";
  }

  sections[currentSection].push(
    line
  );
});

  return {
    lines,
    sections,
  };
};

// ==============================
// EXTRACT EMAIL
// ==============================
const extractEmail = (resumeText) => {
  const match =
    String(resumeText || "").match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

  return match
    ? match[0]
    : "";
};

// ==============================
// EXTRACT PHONE
// ==============================
const extractPhone = (resumeText) => {
  const text =
    String(resumeText || "");

  const candidates =
    text.match(
      /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g
    ) || [];

  if (!candidates.length) {
    return "";
  }

  return candidates[0]
    .replace(/\s+/g, " ")
    .trim();
};

// ==============================
// EXTRACT URL
// ==============================
const extractUrl = (
  resumeText,
  type
) => {
  const text =
    String(resumeText || "");

  let regex;

  if (type === "linkedin") {
    regex =
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,;]+/i;
  } else if (type === "github") {
    regex =
      /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,;]+/i;
  } else {
    return "";
  }

  const match =
    text.match(regex);

  return match
    ? match[0]
    : "";
};

// ==============================
// EXTRACT PORTFOLIO
// ==============================
const extractPortfolio = (
  resumeText
) => {
  const text =
    String(resumeText || "");

  const urls =
    text.match(
      /(?:https?:\/\/|www\.)[^\s|,;]+/gi
    ) || [];

  const filtered =
    urls.filter((url) => {
      const lower =
        url.toLowerCase();

      return (
        !lower.includes(
          "linkedin.com"
        ) &&
        !lower.includes(
          "github.com"
        )
      );
    });

  return filtered.length
    ? filtered[0]
    : "";
};

// ==============================
// EXTRACT POSSIBLE NAME
// ==============================
const extractName = (
  headerLines,
  email,
  phone
) => {
  for (
    const line of headerLines.slice(
      0,
      6
    )
  ) {
    const value =
      cleanLine(line);

    if (!value) {
      continue;
    }

    if (
      email &&
      value
        .toLowerCase()
        .includes(
          email.toLowerCase()
        )
    ) {
      continue;
    }

    if (
      phone &&
      value
        .replace(/\D/g, "")
        .includes(
          phone.replace(
            /\D/g,
            ""
          )
        )
    ) {
      continue;
    }

    if (
      /linkedin|github|http|www\.|@/i.test(
        value
      )
    ) {
      continue;
    }

    const words =
      value.split(/\s+/);

    if (
      words.length >= 2 &&
      words.length <= 6 &&
      value.length <= 60 &&
      !/\d/.test(value)
    ) {
      return value;
    }
  }

  return "";
};

// ==============================
// EXTRACT SKILLS
// ==============================
const extractSkills = (
  resumeText
) => {
  const found =
    SKILL_DICTIONARY.filter(
      (skill) =>
        containsSkill(
          resumeText,
          skill
        )
    );

  return removeSkillAliases(
    found
  );
};

// ==============================
// EXTRACT SECTION ITEMS
// ==============================
const extractSectionItems = (
  lines = []
) => {
  return uniqueStrings(
    lines
      .map((line) =>
        cleanLine(line)
      )
      .filter(Boolean)
      .filter(
        (line) =>
          line.length >= 2 &&
          !isPdfArtifact(line)
      )
  );
};

// ==============================
// CLASSIFY COMBINED
// CERTIFICATION / ACHIEVEMENT ITEM
// ==============================
const classifyCertificationAchievement =
  (line) => {
    const value =
      cleanLine(line);

    const achievementPatterns = [
      /\bwinner\b/i,
      /\bwon\b/i,
      /\baward\b/i,
      /\bachievement\b/i,
      /\bachieved\b/i,
      /\bprize\b/i,
      /\brank(?:ed)?\b/i,
      /\bfirst place\b/i,
      /\bsecond place\b/i,
      /\bthird place\b/i,
      /\bfinalist\b/i,
      /\bhackathon winner\b/i,
      /\bcompetition\b/i,
      /\bcontest\b/i,
    ];

    const isAchievement =
      achievementPatterns.some(
        (pattern) =>
          pattern.test(value)
      );

    return isAchievement
      ? "achievement"
      : "certification";
  };

// ==============================
// SPLIT COMBINED CERTIFICATIONS
// AND ACHIEVEMENTS
// ==============================
const splitCombinedCertificationAchievements =
  (lines = []) => {
    const certifications = [];
    const achievements = [];

    lines.forEach((line) => {
      const value =
        cleanLine(line);

      if (
        !value ||
        isPdfArtifact(value)
      ) {
        return;
      }

      const type =
        classifyCertificationAchievement(
          value
        );

      if (
        type ===
        "achievement"
      ) {
        achievements.push(
          value
        );
      } else {
        certifications.push(
          value
        );
      }
    });

    return {
      certifications:
        uniqueStrings(
          certifications
        ),

      achievements:
        uniqueStrings(
          achievements
        ),
    };
  };


// ==============================
// CLASSIFY OTHER SECTION ITEMS
// ==============================

const classifyOtherSectionItems = (lines = []) => {
  const result = {
    certifications: [],
    achievements: [],
    interests: [],
    unclassified: [],
  };

  lines.forEach((line) => {
    const value = cleanLine(line);

    if (!value || isPdfArtifact(value)) {
      return;
    }

    if (
      /\b(course|courses|certification|certified|certificate|training|workshop)\b/i.test(
        value
      )
    ) {
      result.certifications.push(value);
      return;
    }

    if (
      /\b(participated|winner|won|award|achievement|prize|ranked|finalist|competition|contest|hackathon|coding event)\b/i.test(
        value
      )
    ) {
      result.achievements.push(value);
      return;
    }

    if (
      /\b(hobby|hobbies|interest|interests|cricket|music|sports|reading|travel|photography)\b/i.test(
        value
      )
    ) {
      result.interests.push(value);
      return;
    }

    result.unclassified.push(value);
  });

  return {
    certifications: uniqueStrings(result.certifications),
    achievements: uniqueStrings(result.achievements),
    interests: uniqueStrings(result.interests),
    unclassified: uniqueStrings(result.unclassified),
  };
};

// ==============================
// SECTION PRESENCE
// ==============================
const buildSectionPresence = ({
  sections,
  certifications,
  achievements,
}) => {
  return {
    summary:
      sections.summary.length > 0,

    education:
      sections.education.length > 0,

    skills:
      sections.skills.length > 0,

    projects:
      sections.projects.length > 0,

      projectImpact:
  sections.projectImpact.length > 0,

    internships:
      sections.internships.length > 0,

    experience:
      sections.experience.length > 0,

    certifications:
      certifications.length > 0,

    achievements:
      achievements.length > 0,

    languages:
      sections.languages.length > 0,

    interests:
      sections.interests.length > 0,
  };
};

// ==============================
// STRUCTURED RESUME EXTRACTION
// ==============================
const extractStructuredResume = ({
  resumeText,
  pageCount = 0,
}) => {
  if (
    !resumeText ||
    !String(resumeText).trim()
  ) {
    return {
      success: false,

      errorMessage:
        "Resume text is required for structured extraction",
    };
  }

 try {
  console.log("\n===== STRUCTURED EXTRACTION INPUT =====");
  console.log(resumeText);
  console.log("=======================================\n");

  const {
    lines,
    sections,
  } = splitIntoSections(
    resumeText
  );

    const email =
      extractEmail(
        resumeText
      );

    const phone =
      extractPhone(
        resumeText
      );

    const linkedin =
      extractUrl(
        resumeText,
        "linkedin"
      );

    const github =
      extractUrl(
        resumeText,
        "github"
      );

    const portfolio =
      extractPortfolio(
        resumeText
      );

    const name =
      extractName(
        sections.header,
        email,
        phone
      );

    const skills =
      extractSkills(
        resumeText
      );

    const normalCertifications =
      extractSectionItems(
        sections.certifications
      );

    const normalAchievements =
      extractSectionItems(
        sections.achievements
      );

    const combined =
      splitCombinedCertificationAchievements(
        sections.certificationsAchievements
      );

      const classifiedOther =
  classifyOtherSectionItems(
    sections.other
  );

  const certifications =
  uniqueStrings([
    ...normalCertifications,
    ...combined.certifications,
    ...classifiedOther.certifications,
  ]);

const achievements =
  uniqueStrings([
    ...normalAchievements,
    ...combined.achievements,
    ...classifiedOther.achievements,
  ]);

const interests =
  uniqueStrings([
    ...extractSectionItems(
      sections.interests
    ),
    ...classifiedOther.interests,
  ]);

    const sectionPresence =
      buildSectionPresence({
        sections,
        certifications,
        achievements,
      });

    const detectedSections =
      Object.entries(
        sectionPresence
      )
        .filter(
          ([, present]) =>
            present
        )
        .map(
          ([section]) =>
            section
        );

    return {
      success: true,

      data: {
        pageCount:
          Number(pageCount) || 0,

        contact: {
          name,
          email,
          phone,
          linkedin,
          github,
          portfolio,
        },

        summary:
          sections.summary.join(
            " "
          ),

        skills,

        education:
          extractSectionItems(
            sections.education
          ),

        projects:
          extractSectionItems(
            sections.projects
          ),

          projectImpact:
  sections.projectImpact.join(
    " "
  ),

        internships:
          extractSectionItems(
            sections.internships
          ),

        experience:
          extractSectionItems(
            sections.experience
          ),

        certifications,

        achievements,

        languages:
          extractSectionItems(
            sections.languages
          ),

      interests,

        sectionPresence,

        detectedSections,

        lineCount:
          lines.length,
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
  extractStructuredResume,
};