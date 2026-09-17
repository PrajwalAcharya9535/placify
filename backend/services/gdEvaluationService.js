// ========================================
// GD EVALUATION SERVICE
// ========================================

// ========================================
// HELPER: NORMALIZE TEXT
// ========================================

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ========================================
// HELPER: CLAMP SCORE
// ========================================

const clampScore = (score) => {
  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
};

// ========================================
// HELPER: COUNT WORDS
// ========================================

const countWords = (text = "") => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return 0;
  }

  return normalized
    .split(" ")
    .filter(Boolean).length;
};

// ========================================
// HELPER: MATCH EXPECTED KEYWORDS
// ========================================

const getKeywordMatches = (
  transcript,
  expectedKeywords = []
) => {
  const normalizedTranscript =
    normalizeText(transcript);

  const matchedKeywords = [];
  const missingKeywords = [];

  expectedKeywords.forEach(
    (keyword) => {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        normalizedKeyword &&
        normalizedTranscript.includes(
          normalizedKeyword
        )
      ) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }
  );

  return {
    matchedKeywords,
    missingKeywords,
  };
};

// ========================================
// HELPER: RELEVANCE SCORE
// ========================================

const calculateRelevanceScore = ({
  transcript,
  topic,
  expectedKeywords,
}) => {
  const normalizedTranscript =
    normalizeText(transcript);

  const normalizedTopic =
    normalizeText(topic);

  if (!normalizedTranscript) {
    return 0;
  }

  const {
    matchedKeywords,
    missingKeywords,
  } = getKeywordMatches(
    transcript,
    expectedKeywords
  );

  let score = 0;

  // ----------------------------------------
  // EXPECTED KEYWORD MATCHING
  // ----------------------------------------

  if (
    Array.isArray(expectedKeywords) &&
    expectedKeywords.length > 0
  ) {
    const keywordRatio =
      matchedKeywords.length /
      expectedKeywords.length;

    score += keywordRatio * 70;
  } else {
    // No admin keywords configured.
    // Give neutral baseline rather than
    // incorrectly treating it as failure.
    score += 40;
  }

  // ----------------------------------------
  // TOPIC WORD OVERLAP
  // ----------------------------------------

  const topicWords =
    normalizedTopic
      .split(" ")
      .filter(
        (word) => word.length >= 4
      );

  const uniqueTopicWords = [
    ...new Set(topicWords),
  ];

  if (uniqueTopicWords.length > 0) {
    const matchedTopicWords =
      uniqueTopicWords.filter(
        (word) =>
          normalizedTranscript.includes(
            word
          )
      );

    const topicRatio =
      matchedTopicWords.length /
      uniqueTopicWords.length;

    score += topicRatio * 30;
  } else {
    score += 15;
  }

  return {
    score: clampScore(score),
    matchedKeywords,
    missingKeywords,
  };
};

// ========================================
// HELPER: COMMUNICATION SCORE
// ========================================

const calculateCommunicationScore = (
  transcript
) => {
  const wordCount =
    countWords(transcript);

  if (wordCount === 0) {
    return 0;
  }

  let score = 30;

  // ----------------------------------------
  // MEANINGFUL RESPONSE LENGTH
  // ----------------------------------------

  if (wordCount >= 10) {
    score += 10;
  }

  if (wordCount >= 25) {
    score += 15;
  }

  if (wordCount >= 50) {
    score += 15;
  }

  if (wordCount >= 80) {
    score += 10;
  }

  // ----------------------------------------
  // BASIC SENTENCE STRUCTURE SIGNAL
  // ----------------------------------------

  const sentences =
    transcript
      .split(/[.!?]+/)
      .map((sentence) =>
        sentence.trim()
      )
      .filter(Boolean);

  if (sentences.length >= 2) {
    score += 10;
  }

  if (sentences.length >= 4) {
    score += 10;
  }

  return clampScore(score);
};

// ========================================
// HELPER: STRUCTURE SCORE
// ========================================

const calculateStructureScore = (
  transcript
) => {
  const normalized =
    normalizeText(transcript);

  if (!normalized) {
    return 0;
  }

  let score = 25;

  const structureSignals = [
    "first",
    "second",
    "finally",
    "because",
    "therefore",
    "however",
    "for example",
    "for instance",
    "in conclusion",
    "to conclude",
    "on the other hand",
    "in my opinion",
    "i believe",
  ];

  const matchedSignals =
    structureSignals.filter(
      (signal) =>
        normalized.includes(signal)
    );

  score += Math.min(
    matchedSignals.length * 10,
    50
  );

  const wordCount =
    countWords(transcript);

  if (wordCount >= 30) {
    score += 10;
  }

  if (wordCount >= 60) {
    score += 15;
  }

  return clampScore(score);
};

// ========================================
// HELPER: PARTICIPATION SCORE
// ========================================

const calculateParticipationScore = ({
  speakingTimeSeconds = 0,
  contributionCount = 0,
  transcript = "",
}) => {
  const wordCount =
    countWords(transcript);

  if (
    contributionCount <= 0 &&
    wordCount === 0
  ) {
    return 0;
  }

  let score = 20;

  // ----------------------------------------
  // NUMBER OF CONTRIBUTIONS
  // ----------------------------------------

  if (contributionCount >= 1) {
    score += 15;
  }

  if (contributionCount >= 2) {
    score += 15;
  }

  if (contributionCount >= 3) {
    score += 15;
  }

  if (contributionCount >= 4) {
    score += 10;
  }

  // ----------------------------------------
  // SPEAKING TIME
  // ----------------------------------------

  if (speakingTimeSeconds >= 15) {
    score += 5;
  }

  if (speakingTimeSeconds >= 30) {
    score += 5;
  }

  // ----------------------------------------
  // TRANSCRIPT CONTRIBUTION
  // ----------------------------------------

  if (wordCount >= 25) {
    score += 5;
  }

  if (wordCount >= 50) {
    score += 5;
  }

  return clampScore(score);
};

// ========================================
// MAIN GD EVALUATION
// ========================================

const evaluateGDParticipant = ({
  transcript = "",
  topic = "",
  expectedKeywords = [],
  evaluationPoints = [],
  speakingTimeSeconds = 0,
  contributionCount = 0,
}) => {
  const wordCount =
    countWords(transcript);

  const relevanceResult =
    calculateRelevanceScore({
      transcript,
      topic,
      expectedKeywords,
    });

  const communicationScore =
    calculateCommunicationScore(
      transcript
    );

  const structureScore =
    calculateStructureScore(
      transcript
    );

  const participationScore =
    calculateParticipationScore({
      speakingTimeSeconds,
      contributionCount,
      transcript,
    });

  // ========================================
  // OVERALL SCORE
  // ========================================

  const overallScore =
    clampScore(
      relevanceResult.score * 0.35 +
        communicationScore * 0.25 +
        structureScore * 0.2 +
        participationScore * 0.2
    );

  // ========================================
  // STRENGTHS
  // ========================================

  const strengths = [];

  if (relevanceResult.score >= 70) {
    strengths.push(
      "Maintained good relevance to the GD topic"
    );
  }

  if (communicationScore >= 70) {
    strengths.push(
      "Communicated ideas with sufficient detail"
    );
  }

  if (structureScore >= 70) {
    strengths.push(
      "Presented points in a structured manner"
    );
  }

  if (participationScore >= 70) {
    strengths.push(
      "Participated actively in the discussion"
    );
  }

  // ========================================
  // WEAK AREAS
  // ========================================

  const weakAreas = [];

  if (relevanceResult.score < 60) {
    weakAreas.push(
      "Topic relevance"
    );
  }

  if (communicationScore < 60) {
    weakAreas.push(
      "Communication depth"
    );
  }

  if (structureScore < 60) {
    weakAreas.push(
      "Answer structure"
    );
  }

  if (participationScore < 60) {
    weakAreas.push(
      "Discussion participation"
    );
  }

  // ========================================
  // FEEDBACK
  // ========================================

  const feedback = [];

  if (wordCount < 20) {
    feedback.push(
      "Provide more detailed points during the discussion"
    );
  }

  if (
    relevanceResult
      .matchedKeywords.length > 0
  ) {
    feedback.push(
      "Your contribution included relevant topic concepts"
    );
  }

  if (
    relevanceResult
      .missingKeywords.length > 0
  ) {
    feedback.push(
      "Cover more important concepts related to the discussion topic"
    );
  }

  if (structureScore < 60) {
    feedback.push(
      "Organize your points using reasons, examples, comparisons, and conclusions"
    );
  }

  // ========================================
  // RECOMMENDATIONS
  // ========================================

  const recommendations = [];

  if (relevanceResult.score < 70) {
    recommendations.push(
      "Focus more closely on the assigned topic and support points with relevant ideas"
    );
  }

  if (communicationScore < 70) {
    recommendations.push(
      "Practice explaining each point clearly with sufficient detail"
    );
  }

  if (structureScore < 70) {
    recommendations.push(
      "Use a clear structure: point, reason, example, and conclusion"
    );
  }

  if (participationScore < 70) {
    recommendations.push(
      "Participate multiple times instead of making only one short contribution"
    );
  }

  return {
    overallScore,

    communicationScore,

    relevanceScore:
      relevanceResult.score,

    structureScore,

    participationScore,

    matchedKeywords:
      relevanceResult
        .matchedKeywords,

    missingKeywords:
      relevanceResult
        .missingKeywords,

    strengths,

    weakAreas,

    feedback,

    recommendations,

    statistics: {
      wordCount,
      contributionCount,
      speakingTimeSeconds,
      evaluationPointCount:
        Array.isArray(
          evaluationPoints
        )
          ? evaluationPoints.length
          : 0,
    },
  };
};

module.exports = {
  evaluateGDParticipant,
};