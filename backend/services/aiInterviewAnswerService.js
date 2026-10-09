// ==========================================
// PLACIFY - ADAPTIVE AI INTERVIEW
// ANSWER ANALYSIS SERVICE
// ==========================================
//
// Purpose:
// Analyze one interview answer and decide how
// the adaptive interview should continue.
//
// IMPORTANT:
// This service does NOT generate the next
// question itself.
//
// It decides:
// - how complete/relevant the answer is
// - strengths
// - weak areas
// - next adaptive action
//
// The question service uses this decision to
// generate the next question.
// ==========================================


const {
  evaluateInterviewAnswerWithAI,
} = require("./aiInterviewEvaluationAIService");


// ==========================================
// BASIC HELPERS
// ==========================================

const cleanText = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};


const clampScore = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
};


const uniqueStrings = (values = []) => {
  const result = [];
  const seen = new Set();

  for (const value of values) {
    const cleaned = cleanText(value);

    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }

  return result;
};


// ==========================================
// WORD COUNT
// ==========================================

const countWords = (text) => {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return 0;
  }

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .length;
};


// ==========================================
// SENTENCE COUNT
// ==========================================

const countSentences = (text) => {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return 0;
  }

  const matches = cleaned.match(
    /[^.!?]+[.!?]?/g
  );

  return matches
    ? matches.filter((item) =>
        cleanText(item)
      ).length
    : 0;
};


// ==========================================
// FILLER WORD COUNT
// ==========================================
//
// This is only a transcript-based estimate.
//
// Later, real audio timing will provide more
// accurate voice metrics.
// ==========================================

const countFillerWords = (text) => {
  const cleaned = cleanText(text)
    .toLowerCase();

  if (!cleaned) {
    return 0;
  }

  const fillerPatterns = [
    /\bum\b/g,
    /\buh\b/g,
    /\ber\b/g,
    /\bah\b/g,
    /\blike\b/g,
    /\byou know\b/g,
    /\bbasically\b/g,
    /\bactually\b/g,
    /\bi mean\b/g,
  ];

  let total = 0;

  for (const pattern of fillerPatterns) {
    const matches =
      cleaned.match(pattern);

    total += matches
      ? matches.length
      : 0;
  }

  return total;
};


// ==========================================
// SIMPLE KEYWORD EXTRACTION
// ==========================================

const normalizeKeyword = (value) => {
  return cleanText(value)
    .toLowerCase()
    .replace(
      /[^a-z0-9+#.\- ]/g,
      ""
    );
};


const extractQuestionKeywords = (
  questionText
) => {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "about",
    "your",
    "you",
    "me",
    "my",
    "our",
    "we",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "do",
    "does",
    "did",
    "can",
    "could",
    "would",
    "should",
    "please",
    "tell",
    "explain",
    "describe",
    "give",
    "what",
    "why",
    "how",
    "when",
    "where",
    "which",
  ]);

  return uniqueStrings(
    normalizeKeyword(questionText)
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 3 &&
          !stopWords.has(word)
      )
  );
};


// ==========================================
// RELEVANCE ESTIMATE
// ==========================================
//
// Temporary deterministic evaluator.
//
// Later this can be upgraded with the AI
// evaluation provider.
//
// It gives us a working adaptive pipeline now.
// ==========================================

const calculateRelevanceScore = ({
  questionText,
  answerText,
  focusArea,
  topic,
}) => {
  const answer =
    normalizeKeyword(answerText);

  if (!answer) {
    return 0;
  }

  const keywords = uniqueStrings([
    ...extractQuestionKeywords(
      questionText
    ),
    normalizeKeyword(focusArea),
    normalizeKeyword(topic),
  ]).filter(Boolean);

 if (keywords.length === 0) {
  return 0;
}

  let matches = 0;

  for (const keyword of keywords) {
    if (
      keyword &&
      answer.includes(keyword)
    ) {
      matches += 1;
    }
  }

  const ratio =
    matches / keywords.length;

  const wordCount =
    countWords(answerText);

 // Keyword overlap is only a fallback relevance estimate.
// Never award points merely for answer length.
if (matches === 0) {
  return 0;
}

const score = ratio * 100;

return clampScore(score);
};


// ==========================================
// COMPLETENESS ESTIMATE
// ==========================================

const calculateCompletenessScore = (
  answerText
) => {
  const wordCount =
    countWords(answerText);

  if (wordCount === 0) {
    return 0;
  }

  if (wordCount < 5) {
    return 20;
  }

  if (wordCount < 12) {
    return 40;
  }

  if (wordCount < 25) {
    return 60;
  }

  if (wordCount < 50) {
    return 78;
  }

  if (wordCount < 100) {
    return 90;
  }

  return 95;
};


// ==========================================
// CLARITY ESTIMATE
// ==========================================

const calculateClarityScore = (
  answerText
) => {
  const wordCount =
    countWords(answerText);

  if (wordCount === 0) {
    return 0;
  }

  const sentenceCount =
    Math.max(
      countSentences(answerText),
      1
    );

  const averageSentenceLength =
    wordCount / sentenceCount;

  const fillerCount =
    countFillerWords(answerText);

  let score = 80;

  if (averageSentenceLength > 35) {
    score -= 12;
  }

  if (averageSentenceLength > 50) {
    score -= 10;
  }

  if (fillerCount >= 3) {
    score -= 8;
  }

  if (fillerCount >= 6) {
    score -= 10;
  }

  if (wordCount < 8) {
    score -= 15;
  }

  return clampScore(score);
};


// ==========================================
// STRUCTURE ESTIMATE
// ==========================================

const calculateStructureScore = (
  answerText
) => {
  const cleaned =
    cleanText(answerText);

  if (!cleaned) {
    return 0;
  }

  const wordCount =
    countWords(cleaned);

  const sentenceCount =
    countSentences(cleaned);

  let score = 45;

  if (wordCount >= 15) {
    score += 10;
  }

  if (sentenceCount >= 2) {
    score += 15;
  }

  if (sentenceCount >= 3) {
    score += 10;
  }

  const structureSignals = [
    "first",
    "then",
    "after",
    "because",
    "therefore",
    "finally",
    "result",
    "outcome",
    "problem",
    "solution",
    "responsibility",
    "contribution",
  ];

  const lower =
    cleaned.toLowerCase();

  const signalCount =
    structureSignals.filter(
      (signal) =>
        lower.includes(signal)
    ).length;

  score += Math.min(
    signalCount * 4,
    20
  );

  return clampScore(score);
};


// ==========================================
// COMMUNICATION ESTIMATE
// ==========================================

const calculateCommunicationScore = ({
  clarityScore,
  structureScore,
  completenessScore,
}) => {
  return clampScore(
    clarityScore * 0.4 +
      structureScore * 0.35 +
      completenessScore * 0.25
  );
};


// ==========================================
// TECHNICAL ESTIMATE
// ==========================================
//
// IMPORTANT:
// This is NOT final technical correctness.
//
// Until the AI evaluator is connected, we
// avoid pretending that keyword matching can
// prove technical correctness.
//
// This temporary score represents answer
// engagement with the technical topic.
// ==========================================

const calculateTechnicalScore = ({
  relevanceScore,
  completenessScore,
  stage,
}) => {
  // Technical correctness cannot be verified
  // through keyword matching or answer length.
  //
  // When Gemini evaluation is unavailable,
  // award no unverified technical marks.

  return 0;
};


// ==========================================
// NEXT ACTION DECISION
// ==========================================

const determineNextAction = ({
  skipped,
  relevanceScore,
  completenessScore,
  clarityScore,
  overallScore,
}) => {
  if (skipped) {
    return "Change Topic";
  }

  if (
    relevanceScore < 40
  ) {
    return "Clarify";
  }

  if (
    completenessScore < 40
  ) {
    return "Simplify";
  }

  if (
    clarityScore < 50
  ) {
    return "Clarify";
  }

  if (overallScore >= 80) {
    return "Go Deeper";
  }

  if (overallScore >= 65) {
    return "Related Follow-up";
  }

  return "Change Topic";
};


// ==========================================
// BUILD STRENGTHS
// ==========================================

const buildStrengths = ({
  relevanceScore,
  completenessScore,
  clarityScore,
  structureScore,
}) => {
  const strengths = [];

  if (relevanceScore >= 75) {
    strengths.push(
      "Answer stayed relevant to the question."
    );
  }

  if (completenessScore >= 75) {
    strengths.push(
      "Answer included useful supporting detail."
    );
  }

  if (clarityScore >= 75) {
    strengths.push(
      "Answer was communicated clearly."
    );
  }

  if (structureScore >= 75) {
    strengths.push(
      "Answer had a reasonably organized structure."
    );
  }

  return strengths;
};


// ==========================================
// BUILD WEAK AREAS
// ==========================================

const buildWeakAreas = ({
  relevanceScore,
  completenessScore,
  clarityScore,
  structureScore,
  skipped,
}) => {
  const weakAreas = [];

  if (skipped) {
    weakAreas.push(
      "Candidate skipped the question."
    );

    return weakAreas;
  }

  if (relevanceScore < 55) {
    weakAreas.push(
      "Answer needs to stay more directly focused on the question."
    );
  }

  if (completenessScore < 55) {
    weakAreas.push(
      "Answer needs more supporting explanation or examples."
    );
  }

  if (clarityScore < 60) {
    weakAreas.push(
      "Answer could be expressed more clearly and concisely."
    );
  }

  if (structureScore < 60) {
    weakAreas.push(
      "Answer could use a clearer beginning, explanation, and result."
    );
  }

  return weakAreas;
};


// ==========================================
// FEEDBACK
// ==========================================

const buildFeedback = ({
  skipped,
  nextAction,
}) => {
  if (skipped) {
    return (
      "Question skipped. The interview will " +
      "continue with another relevant area."
    );
  }

  switch (nextAction) {
    case "Go Deeper":
      return (
        "The answer provides enough detail " +
        "for a deeper follow-up."
      );

    case "Related Follow-up":
      return (
        "The answer is useful and can be " +
        "explored with a related follow-up."
      );

    case "Clarify":
      return (
        "The answer would benefit from a " +
        "more specific or clearer explanation."
      );

    case "Simplify":
      return (
        "The answer appears incomplete, so " +
        "the next question should approach " +
        "the topic more simply."
      );

    case "Change Topic":
      return (
        "The interview should continue with " +
        "another relevant topic."
      );

    default:
      return (
        "Continue the adaptive interview."
      );
  }
};


// ==========================================
// ANALYZE INTERVIEW ANSWER
// ==========================================

const analyzeInterviewAnswer = async ({
  questionText,
  answerText,
  stage,
  focusArea,
  topic,

  source = "",
  targetRole = "",
  targetCompany = "",
  jobDescription = "",
  resumeContext = {},
  conversation = [],

  skipped = false,
  voiceMetrics = {},
}) => {
  const cleanedAnswer =
    cleanText(answerText);

  // ========================================
  // SKIPPED ANSWER
  // ========================================

  if (skipped) {
    return {
      answerTranscript:
        cleanedAnswer,

      evaluation: {
        overallScore: 0,
        technicalScore: 0,
        relevanceScore: 0,
        completenessScore: 0,
        communicationScore: 0,
        clarityScore: 0,
        structureScore: 0,

        strengths: [],

        weakAreas: [
          "Candidate skipped the question.",
        ],

        feedback:
          "Question skipped. The interview will continue with another relevant area.",
      },

      voiceMetrics: {
        durationSeconds:
          Number(
            voiceMetrics.durationSeconds
          ) || 0,

        wordsPerMinute:
          Number(
            voiceMetrics.wordsPerMinute
          ) || 0,

        fillerWordCount:
          Number(
            voiceMetrics.fillerWordCount
          ) || 0,

        longPauseCount:
          Number(
            voiceMetrics.longPauseCount
          ) || 0,
      },

      nextAction: "Change Topic",
    };
  }

  // ========================================
  // EMPTY ANSWER
  // ========================================

  if (!cleanedAnswer) {
    throw new Error(
      "Answer transcript is required."
    );
  }

  // ========================================
  // SCORES
  // ========================================

 let relevanceScore;
let completenessScore;
let clarityScore;
let structureScore;
let communicationScore;
let technicalScore;

let resumeKnowledgeScore = 0;

let technicalApplicable =
  stage === "Technical" ||
  stage === "Project Discussion";

let resumeKnowledgeApplicable =
  stage === "Resume Discussion" ||
  stage === "Project Discussion" ||
  [
    "Resume",
    "Project",
    "Experience",
    "Internship",
    "Certification",
    "Skill",
  ].includes(source);

let aiStrengths = null;
let aiWeakAreas = null;
let aiFeedback = "";
let answerQuality = "Partially Complete";
let missingKeyPoints = [];
let incorrectClaims = [];
let improvementTips = [];
let suggestedAnswer = "";

let evaluationSource = "deterministic";

try {
  const aiEvaluation =
    await evaluateInterviewAnswerWithAI({
      questionText,
      answerText: cleanedAnswer,
      stage,
      focusArea,
      topic,
      source,
      targetRole,
      targetCompany,
      jobDescription,
      resumeContext,
      conversation,
    });

    technicalApplicable =
  Boolean(
    aiEvaluation.technicalApplicable
  );

resumeKnowledgeApplicable =
  Boolean(
    aiEvaluation.resumeKnowledgeApplicable
  );

  relevanceScore =
    clampScore(
      aiEvaluation.relevanceScore
    );

  completenessScore =
    clampScore(
      aiEvaluation.completenessScore
    );

  clarityScore =
    clampScore(
      aiEvaluation.clarityScore
    );

  structureScore =
    clampScore(
      aiEvaluation.structureScore
    );

  communicationScore =
    clampScore(
      aiEvaluation.communicationScore
    );

  technicalScore =
    aiEvaluation.technicalApplicable
      ? clampScore(
          aiEvaluation.technicalScore
        )
      : 0;

  resumeKnowledgeScore =
    aiEvaluation.resumeKnowledgeApplicable
      ? clampScore(
          aiEvaluation.resumeKnowledgeScore
        )
      : 0;

  aiStrengths =
    Array.isArray(
      aiEvaluation.strengths
    )
      ? aiEvaluation.strengths
      : [];

  aiWeakAreas =
    Array.isArray(
      aiEvaluation.weakAreas
    )
      ? aiEvaluation.weakAreas
      : [];

  aiFeedback =
    cleanText(
      aiEvaluation.feedback
    );

    answerQuality =
  aiEvaluation.answerQuality || "Partially Complete";

missingKeyPoints =
  Array.isArray(aiEvaluation.missingKeyPoints)
    ? aiEvaluation.missingKeyPoints
    : [];

incorrectClaims =
  Array.isArray(aiEvaluation.incorrectClaims)
    ? aiEvaluation.incorrectClaims
    : [];

improvementTips =
  Array.isArray(aiEvaluation.improvementTips)
    ? aiEvaluation.improvementTips
    : [];

suggestedAnswer =
  cleanText(aiEvaluation.suggestedAnswer);

  evaluationSource = "ai";

  console.log(
    "✅ AI INTERVIEW ANSWER EVALUATION USED"
  );
} catch (error) {
  console.warn(
    "⚠️ AI INTERVIEW EVALUATION FALLBACK:",
    error.message
  );

  // ======================================
  // DETERMINISTIC FALLBACK
  // ======================================

  relevanceScore =
    calculateRelevanceScore({
      questionText,
      answerText: cleanedAnswer,
      focusArea,
      topic,
    });

  completenessScore =
    calculateCompletenessScore(
      cleanedAnswer
    );

  clarityScore =
    calculateClarityScore(
      cleanedAnswer
    );

  structureScore =
    calculateStructureScore(
      cleanedAnswer
    );

  communicationScore =
    calculateCommunicationScore({
      clarityScore,
      structureScore,
      completenessScore,
    });

  technicalScore =
    calculateTechnicalScore({
      relevanceScore,
      completenessScore,
      stage,
    });

    // ======================================
// FALLBACK IRRELEVANCE CLASSIFICATION
// ======================================

// Keyword matching cannot reliably determine
// semantic relevance. Only classify a narrow
// set of clearly unrelated test responses.

const unrelatedTestTopics =
  /\b(cricket|pizza|football|movies?)\b/i;

const interviewRelatedTopics =
  /\b(project|skill|education|experience|work|developer|programming|java|sql|resume|background|career)\b/i;

if (
  relevanceScore === 0 &&
  unrelatedTestTopics.test(cleanedAnswer) &&
  !interviewRelatedTopics.test(cleanedAnswer)
) {
  answerQuality = "Irrelevant";
}
}

// ========================================
// EXPLICIT NON-ANSWER DETECTION
// ========================================

const normalizedAnswer = cleanedAnswer
  .toLowerCase()
  .replace(/[.,!?]/g, "")
  .trim();

const explicitNonAnswers = [
  "i don't know",
  "i dont know",
  "i do not know",
  "no idea",
  "i have no idea",
  "i am not sure",
  "i'm not sure",
  "sorry",
  "sorry i don't know",
  "sorry i dont know",
  "i cannot answer",
  "i can't answer",
];

if (explicitNonAnswers.includes(normalizedAnswer)) {
  answerQuality = "Too Short";
  relevanceScore = 0;
  completenessScore = 0;
  technicalScore = 0;
  resumeKnowledgeScore = 0;
  clarityScore = 0;
  structureScore = 0;
  communicationScore = 0;
}

// ========================================
// OVERALL ANSWER SCORE
// ========================================

const overallScore = clampScore(
  relevanceScore === 0
    ? 0
    : relevanceScore * 0.25 +
        completenessScore * 0.20 +
        clarityScore * 0.15 +
        structureScore * 0.15 +
        communicationScore * 0.15 +
        (
          technicalApplicable
            ? technicalScore * 0.10
            : relevanceScore * 0.10
        )
);

  // ========================================
  // ADAPTIVE DECISION
  // ========================================

 const isExplicitNonAnswer =
  explicitNonAnswers.includes(normalizedAnswer);

// ==========================================
// UNIFIED ADAPTIVE NEXT ACTION
// ==========================================

const fallbackStageSignals = {
  Introduction:
    /\b(my name|i am|i'm|student|graduate|degree|mca|bca|education|background|skills?|developer|experience|projects?)\b/i,

  "Resume Discussion":
    /\b(skills?|java|sql|programming|projects?|experience|education|degree|academic|achievement|developer|internship|certification)\b/i,

  Technical:
    /\b(java|sql|oop|encapsulation|inheritance|polymorphism|abstraction|class|object|interface|exception|collection|array|method|constructor|database|query|api|algorithm|thread|spring|backend)\b/i,

  Behavioral:
    /\b(problem|challenge|issue|error|solution|solved|fixed|resolved|project|team|approach|outcome|responsibility|decision|handled|learned)\b/i,

  "Role & Company":
    /\b(role|company|developer|career|skills?|java|technology|opportunity|contribute|interested|growth|team|organization|experience)\b/i,

  Communication:
    /\b(communicate|communication|explain|understand|listen|team|discussion|feedback|clarify|simple|example|colleague|client|technical)\b/i,

  Closing:
    /\b(thank|opportunity|interview|company|role|career|learn|contribute|question|growth|team|interested)\b/i,

  "Project Discussion":
    /\b(project|developed|built|implemented|frontend|backend|database|api|feature|module|testing|problem|solution|technology)\b/i,
};

const fallbackSignal = fallbackStageSignals[stage];

const isRecognizableFallbackAnswer =
  evaluationSource === "deterministic" &&
  !isExplicitNonAnswer &&
  answerQuality !== "Irrelevant" &&
  Boolean(fallbackSignal) &&
  fallbackSignal.test(cleanedAnswer);

const nextAction = isExplicitNonAnswer
  ? "Change Topic"
  : isRecognizableFallbackAnswer
    ? "Move Stage"
    : evaluationSource === "deterministic"
      ? "Change Topic"
      : determineNextAction({
          skipped,
          relevanceScore,
          completenessScore,
          clarityScore,
          overallScore,
        }); 

 const strengths =
  evaluationSource === "ai"
    ? aiStrengths
    : buildStrengths({
        relevanceScore,
        completenessScore,
        clarityScore,
        structureScore,
      });

const weakAreas =
  evaluationSource === "ai"
    ? aiWeakAreas
    : buildWeakAreas({
        relevanceScore,
        completenessScore,
        clarityScore,
        structureScore,
        skipped,
      });

const feedback =
  evaluationSource === "ai" &&
  aiFeedback
    ? aiFeedback
    : buildFeedback({
        skipped,
        nextAction,
      });



  // ========================================
  // VOICE METRICS
  // ========================================

  const durationSeconds =
    Number(
      voiceMetrics.durationSeconds
    ) || 0;

  const wordCount =
    countWords(cleanedAnswer);

  let wordsPerMinute =
    Number(
      voiceMetrics.wordsPerMinute
    ) || 0;

  if (
    !wordsPerMinute &&
    durationSeconds > 0
  ) {
    wordsPerMinute =
      Math.round(
        (wordCount / durationSeconds) *
          60
      );
  }

  const fillerWordCount =
    Number.isFinite(
      Number(
        voiceMetrics.fillerWordCount
      )
    )
      ? Number(
          voiceMetrics.fillerWordCount
        )
      : countFillerWords(
          cleanedAnswer
        );

  const longPauseCount =
    Number(
      voiceMetrics.longPauseCount
    ) || 0;

  // ========================================
  // RESULT
  // ========================================

  return {
    answerTranscript:
      cleanedAnswer,

 evaluation: {
  overallScore,

  technicalScore,

  technicalApplicable,

  resumeKnowledgeScore,

  resumeKnowledgeApplicable,

  relevanceScore,

  completenessScore,

  communicationScore,

  clarityScore,

  structureScore,

  strengths,

  weakAreas,

  feedback,

  evaluationSource,

  answerQuality,

  missingKeyPoints,

  incorrectClaims,

  improvementTips,

  suggestedAnswer,
},
    voiceMetrics: {
      durationSeconds,

      wordsPerMinute,

      fillerWordCount,

      longPauseCount,
    },

    nextAction,
  };
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  analyzeInterviewAnswer,
};