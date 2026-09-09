const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const unique = (items = []) => {
  return [...new Set(items)];
};

const containsKeyword = (
  normalizedAnswer,
  keyword
) => {
  const normalizedKeyword =
    normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  return normalizedAnswer.includes(
    normalizedKeyword
  );
};

// ==============================
// INTERVIEW ANSWER EVALUATION
// ==============================
const evaluateInterviewAnswer = ({
  answerText,
  question,
}) => {
  const normalizedAnswer =
    normalizeText(answerText);

  const expectedKeywords =
    Array.isArray(
      question.expectedKeywords
    )
      ? question.expectedKeywords
      : [];

  const matchedKeywords =
    expectedKeywords.filter(
      (keyword) =>
        containsKeyword(
          normalizedAnswer,
          keyword
        )
    );

  const missingKeywords =
    expectedKeywords.filter(
      (keyword) =>
        !containsKeyword(
          normalizedAnswer,
          keyword
        )
    );

  // ==============================
  // RELEVANCE SCORE
  // ==============================

  let relevanceScore = 0;

  if (expectedKeywords.length === 0) {
    relevanceScore =
      answerText.trim().length > 0
        ? 70
        : 0;
  } else {
    relevanceScore = Math.round(
      (matchedKeywords.length /
        expectedKeywords.length) *
        100
    );
  }

  relevanceScore = Math.min(
    100,
    Math.max(0, relevanceScore)
  );

  // ==============================
  // COMPLETENESS SCORE
  // ==============================

  const wordCount =
    normalizedAnswer.length > 0
      ? normalizedAnswer.split(" ")
          .length
      : 0;

  let completenessScore = 0;

  if (wordCount >= 40) {
    completenessScore = 100;
  } else if (wordCount >= 25) {
    completenessScore = 85;
  } else if (wordCount >= 15) {
    completenessScore = 70;
  } else if (wordCount >= 8) {
    completenessScore = 50;
  } else if (wordCount >= 3) {
    completenessScore = 30;
  } else if (wordCount > 0) {
    completenessScore = 15;
  }

  // ==============================
  // COMMUNICATION SCORE
  // ==============================

  let communicationScore = 0;

  if (wordCount >= 15) {
    communicationScore = 80;
  } else if (wordCount >= 8) {
    communicationScore = 65;
  } else if (wordCount >= 3) {
    communicationScore = 45;
  } else if (wordCount > 0) {
    communicationScore = 25;
  }

  if (
    answerText.includes(".") ||
    answerText.includes(",")
  ) {
    communicationScore += 10;
  }

  communicationScore = Math.min(
    100,
    communicationScore
  );

  // ==============================
  // FINAL PERCENTAGE
  // ==============================

  const finalPercentage =
    Math.round(
      relevanceScore * 0.6 +
        completenessScore * 0.25 +
        communicationScore * 0.15
    );

  const maxScore =
    Number(question.maxScore) || 10;

  const score = Number(
    (
      (finalPercentage / 100) *
      maxScore
    ).toFixed(2)
  );

  // ==============================
  // FEEDBACK
  // ==============================

  const strengths = [];
  const weakAreas = [];
  const feedback = [];

  if (relevanceScore >= 80) {
    strengths.push(
      "Answer is highly relevant to the question"
    );
  } else if (relevanceScore >= 60) {
    strengths.push(
      "Answer covers important concepts"
    );
  } else {
    weakAreas.push(
      "Answer needs better topic coverage"
    );
  }

  if (completenessScore >= 80) {
    strengths.push(
      "Answer has good detail and completeness"
    );
  } else if (completenessScore < 50) {
    weakAreas.push(
      "Answer is too short or incomplete"
    );
  }

  if (communicationScore >= 75) {
    strengths.push(
      "Answer is reasonably clear and structured"
    );
  } else {
    weakAreas.push(
      "Communication clarity can be improved"
    );
  }

  if (missingKeywords.length > 0) {
    feedback.push(
      `Consider covering these concepts: ${missingKeywords.join(
        ", "
      )}`
    );
  }

  if (matchedKeywords.length > 0) {
    feedback.push(
      `Good coverage of: ${matchedKeywords.join(
        ", "
      )}`
    );
  }

  if (wordCount < 8) {
    feedback.push(
      "Try to explain the answer with more detail and an example where appropriate."
    );
  }

  if (finalPercentage >= 80) {
    feedback.push(
      "Strong interview answer."
    );
  } else if (
    finalPercentage >= 60
  ) {
    feedback.push(
      "Good answer, but it can be made more complete."
    );
  } else {
    feedback.push(
      "Review the core concepts and provide a more structured explanation."
    );
  }

  return {
    score,
    finalPercentage,

    matchedKeywords:
      unique(matchedKeywords),

    missingKeywords:
      unique(missingKeywords),

    strengths:
      unique(strengths),

    weakAreas:
      unique(weakAreas),

    feedback:
      unique(feedback),

    communicationScore,
    relevanceScore,
    completenessScore,
  };
};

module.exports = {
  evaluateInterviewAnswer,
};