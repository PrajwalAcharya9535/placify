// ======================================================
// AI INTERVIEW RESUME CONTEXT SERVICE
// ======================================================
//
// Purpose:
// Convert the structured resume extraction into a small,
// interview-relevant candidate profile.
//
// IMPORTANT:
// - Do not invent resume information.
// - Do not expose unnecessary personal/contact information.
// - Resume filename does not affect interview context.
// - Keep the context focused on information a real
//   interviewer could reasonably discuss.
// ======================================================


// ======================================================
// BASIC HELPERS
// ======================================================

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
  const seen = new Set();

  return cleanArray(values).filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};


// ======================================================
// LIMIT LARGE RESUME SECTIONS
// ======================================================
//
// We do NOT want to send huge amounts of resume text
// into every AI interview turn.
//
// These limits preserve the most useful information while
// keeping the interview context focused.
// ======================================================

const limitItems = (
  values = [],
  maxItems = 8
) => {
  return uniqueStrings(values).slice(
    0,
    maxItems
  );
};


// ======================================================
// SUMMARY CLEANING
// ======================================================

const buildSummary = (summary) => {
  const value = cleanText(summary);

  if (!value) {
    return "";
  }

  // Prevent an unusually long resume summary from
  // dominating the AI interview context.
  return value.slice(0, 1200);
};


// ======================================================
// SKILLS
// ======================================================

const buildSkills = (skills = []) => {
  // Keep more skills than other sections because skills
  // directly drive technical interview questions.
  return limitItems(
    skills,
    25
  );
};


// ======================================================
// PROJECTS
// ======================================================

const buildProjects = (projects = []) => {
  // Project lines are kept because they are one of the
  // most important sources for realistic interview
  // questions.
  return limitItems(
    projects,
    15
  );
};


// ======================================================
// EXPERIENCE
// ======================================================

const buildExperience = (
  experience = []
) => {
  return limitItems(
    experience,
    12
  );
};


// ======================================================
// INTERNSHIPS
// ======================================================

const buildInternships = (
  internships = []
) => {
  return limitItems(
    internships,
    10
  );
};


// ======================================================
// EDUCATION
// ======================================================

const buildEducation = (
  education = []
) => {
  return limitItems(
    education,
    8
  );
};


// ======================================================
// CERTIFICATIONS
// ======================================================

const buildCertifications = (
  certifications = []
) => {
  return limitItems(
    certifications,
    8
  );
};


// ======================================================
// BUILD INTERVIEW RESUME CONTEXT
// ======================================================
//
// Expected input:
//
// structuredResume = result.data returned by
// extractStructuredResume()
//
// Output contains ONLY information useful for the
// interview.
// ======================================================

const buildAIInterviewResumeContext = ({
  structuredResume,
  atsContext = {},
  targetRole = "",
  targetCompany = "",
  jobDescription = "",
}) => {
  if (
    !structuredResume ||
    typeof structuredResume !== "object"
  ) {
    throw new Error(
      "Structured resume data is required"
    );
  }

  const contact =
    structuredResume.contact || {};

  const candidateName =
    cleanText(contact.name);

  const skills =
    buildSkills(
      structuredResume.skills
    );

  const projects =
    buildProjects(
      structuredResume.projects
    );

  const experience =
    buildExperience(
      structuredResume.experience
    );

  const internships =
    buildInternships(
      structuredResume.internships
    );

  const education =
    buildEducation(
      structuredResume.education
    );

  const certifications =
    buildCertifications(
      structuredResume.certifications
    );

  const projectImpact =
    cleanText(
      structuredResume.projectImpact
    ).slice(0, 1500);

  const summary =
    buildSummary(
      structuredResume.summary
    );


  // ====================================================
  // ATS CONTEXT
  // ====================================================
  //
  // ATS information is optional.
  //
  // It should help the AI understand role alignment,
  // but it must NOT override what is actually present
  // in the uploaded resume.
  // ====================================================

  const atsScoreRaw =
    Number(atsContext.atsScore);

  const atsScore =
    Number.isFinite(atsScoreRaw)
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(atsScoreRaw)
          )
        )
      : 0;

  const matchedSkills =
    limitItems(
      atsContext.matchedSkills,
      20
    );

  const missingSkills =
    limitItems(
      atsContext.missingSkills,
      15
    );


  // ====================================================
  // INTERVIEW CONTEXT
  // ====================================================

  return {
    candidateName,

    summary,

    skills,

    projects,

    projectImpact,

    experience,

    internships,

    education,

    certifications,

    atsScore,

    matchedSkills,

    missingSkills,

    target: {
      role:
        cleanText(targetRole),

      company:
        cleanText(targetCompany),

      jobDescription:
        cleanText(jobDescription).slice(
          0,
          6000
        ),
    },

    // ==================================================
    // INTERVIEW SIGNALS
    // ==================================================
    //
    // These tell the future AI question engine what
    // evidence is actually available.
    //
    // They are NOT questions.
    // ==================================================

    availableSignals: {
      hasSummary:
        Boolean(summary),

      hasSkills:
        skills.length > 0,

      hasProjects:
        projects.length > 0,

      hasProjectImpact:
        Boolean(projectImpact),

      hasExperience:
        experience.length > 0,

      hasInternships:
        internships.length > 0,

      hasEducation:
        education.length > 0,

      hasCertifications:
        certifications.length > 0,

      hasTargetRole:
        Boolean(
          cleanText(targetRole)
        ),

      hasTargetCompany:
        Boolean(
          cleanText(targetCompany)
        ),

      hasJobDescription:
        Boolean(
          cleanText(jobDescription)
        ),
    },
  };
};


// ======================================================
// BUILD COMPACT AI QUESTION CONTEXT
// ======================================================
//
// This is what the future AI question-generation engine
// can consume.
//
// It intentionally excludes:
// email
// phone
// LinkedIn
// GitHub
// portfolio URL
// interests
// languages
// page count
// section metadata
// file name
// formatting information
// ======================================================

const buildCompactQuestionContext = (
  interviewContext
) => {
  if (!interviewContext) {
    return {};
  }

  return {
    candidateName:
      cleanText(
        interviewContext.candidateName
      ),

    targetRole:
      cleanText(
        interviewContext.target?.role
      ),

    targetCompany:
      cleanText(
        interviewContext.target?.company
      ),

    summary:
      cleanText(
        interviewContext.summary
      ),

    skills:
      limitItems(
        interviewContext.skills,
        25
      ),

    projects:
      limitItems(
        interviewContext.projects,
        15
      ),

    projectImpact:
      cleanText(
        interviewContext.projectImpact
      ),

    experience:
      limitItems(
        interviewContext.experience,
        12
      ),

    internships:
      limitItems(
        interviewContext.internships,
        10
      ),

    education:
      limitItems(
        interviewContext.education,
        8
      ),

    certifications:
      limitItems(
        interviewContext.certifications,
        8
      ),

    matchedSkills:
      limitItems(
        interviewContext.matchedSkills,
        20
      ),

    missingSkills:
      limitItems(
        interviewContext.missingSkills,
        15
      ),

    jobDescription:
      cleanText(
        interviewContext.target
          ?.jobDescription
      ).slice(
        0,
        6000
      ),
  };
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  buildAIInterviewResumeContext,
  buildCompactQuestionContext,
};