
/**
 * PLACIFY — AI INTERVIEW RESULT SERVICE
 *
 * Builds the final result from stored interview evaluations.
 *
 * Preserves:
 * - Existing score calculations
 * - Technical and resume knowledge scoring
 * - Role readiness calculation
 * - Strengths and weak areas
 * - Voice metrics
 * - Existing recommendations
 *
 * Adds:
 * - Communication improvement suggestions
 * - Answer improvement suggestions
 *
 * No webcam-based personality inference.
 * No invented speech measurements.
 */

// ======================================================
// HELPERS
// ======================================================

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

const average = (values = []) => {
 const validValues = values
  .filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== ""
  )
  .map(Number)
  .filter((value) => Number.isFinite(value));

  if (!validValues.length) {
    return 0;
  }

  const total = validValues.reduce(
    (sum, value) => sum + value,
    0
  );

  return clampScore(
    total / validValues.length
  );
};

const uniqueStrings = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const cleaned =
      String(value || "").trim();

    if (!cleaned) {
      return;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(cleaned);
  });

  return result;
};

// ======================================================
// GET ANSWERED TURNS
// ======================================================

const getAnsweredTurns = (session) => {
  const conversation =
    Array.isArray(session?.conversation)
      ? session.conversation
      : [];

  return conversation.filter(
    (turn) =>
      turn &&
      (
        String(
          turn.answerTranscript || ""
        ).trim() ||
        turn.skipped
      )
  );
};

// ======================================================
// SCORE AGGREGATION — ORIGINAL LOGIC
// ======================================================

const calculateScores = (
  answeredTurns
) => {
  const evaluations =
    answeredTurns
      .map((turn) => turn.evaluation)
      .filter(Boolean);

 const verifiedOverallEvaluations = evaluations.filter(
  (evaluation) =>
    evaluation.evaluationSource === "ai" &&
    evaluation.overallScore != null &&
    Number.isFinite(Number(evaluation.overallScore))
);

const overallScore = verifiedOverallEvaluations.length
  ? average(
      verifiedOverallEvaluations.map(
        (evaluation) => evaluation.overallScore
      )
    )
  : null;

  // ==========================================
// TECHNICAL SCORE
// ==========================================

const technicalTurns = answeredTurns.filter(
  (turn) =>
    turn.stage === "Technical" ||
    turn.evaluation?.technicalApplicable === true
);

const verifiedTechnicalTurns = technicalTurns.filter(
  (turn) =>
    turn.evaluation?.evaluationSource === "ai" &&
    turn.evaluation?.technicalApplicable === true &&
    turn.evaluation?.technicalScore != null &&
    Number.isFinite(Number(turn.evaluation.technicalScore))
);

const technicalScore = verifiedTechnicalTurns.length
  ? average(
      verifiedTechnicalTurns.map(
        (turn) => turn.evaluation.technicalScore
      )
    )
  : null;

  const verifiedCommunicationEvaluations = evaluations.filter(
  (evaluation) =>
    evaluation.evaluationSource === "ai" &&
    evaluation.communicationScore != null &&
    Number.isFinite(Number(evaluation.communicationScore))
);

const communicationScore = verifiedCommunicationEvaluations.length
  ? average(
      verifiedCommunicationEvaluations.map(
        (evaluation) => evaluation.communicationScore
      )
    )
  : null;

 const verifiedRelevanceEvaluations = evaluations.filter(
  (evaluation) =>
    evaluation.evaluationSource === "ai" &&
    evaluation.relevanceScore != null &&
    Number.isFinite(Number(evaluation.relevanceScore))
);

const relevanceScore = verifiedRelevanceEvaluations.length
  ? average(
      verifiedRelevanceEvaluations.map(
        (evaluation) => evaluation.relevanceScore
      )
    )
  : null;

 const verifiedCompletenessEvaluations = evaluations.filter(
  (evaluation) =>
    evaluation.evaluationSource === "ai" &&
    evaluation.completenessScore != null &&
    Number.isFinite(Number(evaluation.completenessScore))
);

const completenessScore = verifiedCompletenessEvaluations.length
  ? average(
      verifiedCompletenessEvaluations.map(
        (evaluation) => evaluation.completenessScore
      )
    )
  : null;

const verifiedStructureEvaluations = evaluations.filter(
  (evaluation) =>
    evaluation.evaluationSource === "ai" &&
    evaluation.structureScore != null &&
    Number.isFinite(Number(evaluation.structureScore))
);

const answerStructureScore = verifiedStructureEvaluations.length
  ? average(
      verifiedStructureEvaluations.map(
        (evaluation) => evaluation.structureScore
      )
    )
  : null;

  return {
    overallScore,
    technicalScore,
    communicationScore,
    relevanceScore,
    completenessScore,
    answerStructureScore,
  };
};

// ======================================================
// RESUME KNOWLEDGE SCORE — ORIGINAL LOGIC
// ======================================================

const calculateResumeKnowledgeScore = (
  answeredTurns
) => {
  const resumeStages = new Set([
    "Resume Discussion",
    "Project Discussion",
  ]);

  const resumeTurns =
    answeredTurns.filter(
      (turn) =>
        resumeStages.has(turn.stage) ||
        [
          "Resume",
          "Project",
          "Experience",
          "Internship",
          "Certification",
          "Skill",
        ].includes(turn.source)
    );

 if (!resumeTurns.length) {
  return null;
}

  // ==========================================
// RESUME KNOWLEDGE SCORE
// ==========================================

const verifiedResumeTurns = resumeTurns.filter(
  (turn) =>
    turn.evaluation?.evaluationSource === "ai" &&
    turn.evaluation?.resumeKnowledgeApplicable === true &&
    turn.evaluation?.resumeKnowledgeScore != null &&
    Number.isFinite(Number(turn.evaluation.resumeKnowledgeScore))
);

if (!verifiedResumeTurns.length) {
  return null;
}

return average(
  verifiedResumeTurns.map(
    (turn) => turn.evaluation.resumeKnowledgeScore
  )
);
};

// ======================================================
// ROLE READINESS SCORE — ORIGINAL LOGIC
// ======================================================

const calculateRoleReadinessScore = ({
  scores,
  resumeKnowledgeScore,
}) => {
  const components = [
  { score: scores.technicalScore, weight: 0.35 },
  { score: scores.communicationScore, weight: 0.20 },
  { score: scores.relevanceScore, weight: 0.15 },
  { score: scores.completenessScore, weight: 0.10 },
  { score: scores.answerStructureScore, weight: 0.10 },
  { score: resumeKnowledgeScore, weight: 0.10 },
];

const verifiedComponents = components.filter(
  ({ score }) =>
    score !== null &&
    score !== undefined &&
    Number.isFinite(Number(score))
);

if (!verifiedComponents.length) {
  return null;
}

const totalWeight = verifiedComponents.reduce(
  (sum, item) => sum + item.weight,
  0
);

const weightedScore = verifiedComponents.reduce(
  (sum, item) => sum + Number(item.score) * item.weight,
  0
);

return clampScore(weightedScore / totalWeight);
};

// ======================================================
// COLLECT STRONG / WEAK AREAS — ORIGINAL LOGIC
// ======================================================

const collectAreas = (
  session,
  answeredTurns
) => {
  const strengths = [];
  const weakAreas = [];

  answeredTurns.forEach((turn) => {
    const evaluation =
      turn.evaluation || {};

    if (
      Array.isArray(
        evaluation.strengths
      )
    ) {
      strengths.push(
        ...evaluation.strengths
      );
    }

    if (
      Array.isArray(
        evaluation.weakAreas
      )
    ) {
      weakAreas.push(
        ...evaluation.weakAreas
      );
    }
  });

  if (
    Array.isArray(
      session?.observedStrongAreas
    )
  ) {
    strengths.push(
      ...session.observedStrongAreas
    );
  }

  if (
    Array.isArray(
      session?.observedWeakAreas
    )
  ) {
    weakAreas.push(
      ...session.observedWeakAreas
    );
  }

 return {
  strengths: uniqueStrings(strengths).slice(0, 8),
  weakAreas: uniqueStrings(weakAreas).slice(0, 8),
};
};

// ======================================================
// COMMUNICATION METRICS — ORIGINAL LOGIC
// ======================================================

const calculateCommunicationMetrics = (
  answeredTurns
) => {
  const metrics =
    answeredTurns
      .map((turn) => turn.voiceMetrics)
      .filter(Boolean);

  const totalDurationSeconds =
    metrics.reduce(
      (sum, metric) =>
        sum +
        Number(
          metric.durationSeconds || 0
        ),
      0
    );

  const totalFillerWords =
    metrics.reduce(
      (sum, metric) =>
        sum +
        Number(
          metric.fillerWordCount || 0
        ),
      0
    );

  const totalLongPauses =
    metrics.reduce(
      (sum, metric) =>
        sum +
        Number(
          metric.longPauseCount || 0
        ),
      0
    );

  const wordsPerMinute =
    average(
      metrics
        .map(
          (metric) =>
            metric.wordsPerMinute
        )
        .filter(
          (value) =>
            Number(value) > 0
        )
    );

  return {
    totalDurationSeconds:
      Math.max(
        0,
        Math.round(
          totalDurationSeconds
        )
      ),

    averageWordsPerMinute:
      wordsPerMinute,

    totalFillerWords:
      Math.max(
        0,
        Math.round(
          totalFillerWords
        )
      ),

    totalLongPauses:
      Math.max(
        0,
        Math.round(
          totalLongPauses
        )
      ),
  };
};

// ======================================================
// NEW — PERSONALIZED COMMUNICATION SUGGESTIONS
// ======================================================

const buildCommunicationSuggestions = ({
  scores,
  communicationMetrics,
  answeredTurns,
}) => {
  const suggestions = [];

  const {
    totalDurationSeconds,
    totalFillerWords,
    totalLongPauses,
    averageWordsPerMinute,
  } = communicationMetrics;

  const hasFillerData =
    answeredTurns.some(
      (turn) =>
        Number.isFinite(
          Number(
            turn.voiceMetrics?.fillerWordCount
          )
        ) &&
        turn.voiceMetrics?.fillerWordCount != null
    );

  const hasPauseData =
    answeredTurns.some(
      (turn) =>
        Number.isFinite(
          Number(
            turn.voiceMetrics?.longPauseCount
          )
        ) &&
        turn.voiceMetrics?.longPauseCount != null
    );

  const durationMinutes =
    totalDurationSeconds / 60;

  // Filler words: only when measured.
  if (
    hasFillerData &&
    durationMinutes >= 0.5
  ) {
    const fillersPerMinute =
      totalFillerWords / durationMinutes;

    if (fillersPerMinute >= 5) {
      suggestions.push(
        "You used frequent filler sounds such as 'ahh' and 'umm'. Practice speaking with fewer fillers."
      );
    } else if (fillersPerMinute >= 2) {
      suggestions.push(
        "Try reducing filler sounds like 'ahh' and 'umm' to improve your speaking flow."
      );
    } else {
      suggestions.push(
        "Good control of filler words. Keep practicing smooth and natural communication."
      );
    }
  }

  // Long pauses: suggestions, not assumptions about confidence.
  if (
    hasPauseData &&
    durationMinutes >= 0.5
  ) {
    const pausesPerMinute =
      totalLongPauses / durationMinutes;

    if (pausesPerMinute >= 3) {
      suggestions.push(
        "You had several long pauses. Practice organizing your thoughts before answering."
      );
    } else if (pausesPerMinute >= 1.5) {
      suggestions.push(
        "Try maintaining a smoother speaking flow while taking natural pauses when needed."
      );
    }
  }

  // Speaking pace: only when a valid metric exists.
  const hasPaceData =
    answeredTurns.some(
      (turn) =>
        Number(
          turn.voiceMetrics?.wordsPerMinute
        ) > 0
    );

  if (hasPaceData) {
    if (
      averageWordsPerMinute > 0 &&
      averageWordsPerMinute < 90
    ) {
      suggestions.push(
        "Practice speaking at a comfortable, steady pace while keeping your explanations clear."
      );
    } else if (
      averageWordsPerMinute > 190
    ) {
      suggestions.push(
        "Try speaking slightly slower so your points are easier to follow."
      );
    }
  }

  // Existing AI communication evaluation.
 if (scores.communicationScore === null) {
  suggestions.push(
    "Communication score is unavailable because AI evaluation was not completed."
  );
} else if (
  scores.communicationScore !== null &&
  scores.communicationScore < 60
) {
  suggestions.push(
    "Practice speaking clearly and explaining your answers in simple, complete sentences."
  );
} else if (scores.communicationScore < 80) {
  suggestions.push(
    "Your communication is improving. Practice smoother explanations and clearer sentence formation."
  );
} else {
  suggestions.push(
    "Your communication was strong. Keep practicing to maintain your fluency and clarity."
  );
}

  return uniqueStrings(
    suggestions
  ).slice(0, 4);
};

// ======================================================
// NEW — PERSONALIZED ANSWER SUGGESTIONS
// ======================================================

const buildAnswerSuggestions = ({
  scores,
  answeredTurns = [],
}) => {
  const suggestions = [];

  // Collect personalized feedback from evaluated answers.
  const reviewedTurns = answeredTurns.filter(
    (turn) =>
      !turn.skipped &&
      String(turn.answerTranscript || "").trim()
  );

  for (const turn of reviewedTurns) {
    const evaluation = turn.evaluation || {};

    const topic = String(
      turn.topic || turn.focusArea || ""
    ).trim();

    const prefix = topic ? `${topic}: ` : "";

    if (Array.isArray(evaluation.missingKeyPoints)) {
      for (const point of evaluation.missingKeyPoints) {
        const cleaned = String(point || "").trim();

        if (cleaned) {
          suggestions.push(
            `${prefix}Review and explain ${cleaned}.`
          );
        }
      }
    }

    if (Array.isArray(evaluation.incorrectClaims)) {
      for (const claim of evaluation.incorrectClaims) {
        const cleaned = String(claim || "").trim();

        if (cleaned) {
          suggestions.push(
            `${prefix}Revisit this incorrect statement: ${cleaned}`
          );
        }
      }
    }

    if (Array.isArray(evaluation.improvementTips)) {
      for (const tip of evaluation.improvementTips) {
        const cleaned = String(tip || "").trim();

        if (cleaned) {
          suggestions.push(`${prefix}${cleaned}`);
        }
      }
    }
  }

  const personalized = uniqueStrings(suggestions);

  // Prefer specific AI feedback over generic advice.
  if (personalized.length > 0) {
    return personalized.slice(0, 8);
  }

  // Fallback when detailed AI feedback is unavailable.
if (
  scores.technicalScore !== null &&
  scores.technicalScore < 60
) {    suggestions.push(
      "Practice technical fundamentals and explain concepts with practical examples."
    );
  }

if (
  scores.relevanceScore !== null &&
  scores.relevanceScore < 60
) {    suggestions.push(
      "Focus directly on the question and avoid unrelated information."
    );
  }

  if (
  scores.completenessScore !== null &&
  scores.completenessScore < 60
) {
    suggestions.push(
      "Give more complete answers with explanations and relevant examples."
    );
  }

  if (
  scores.answerStructureScore !== null &&
  scores.answerStructureScore < 60
) {
    suggestions.push(
      "Organize answers with a clear introduction, key points, and conclusion."
    );
  }

  if (
  scores.overallScore !== null &&
  scores.overallScore >= 80
) {
    suggestions.push(
      "Your answers were strong overall. Continue practicing advanced interview questions."
    );
  } else {
    suggestions.push(
      "Practice interview questions regularly and review your answers."
    );
  }

  return uniqueStrings(suggestions).slice(0, 4);
};

// ======================================================
// BUILD RECOMMENDATIONS — ORIGINAL LOGIC
// ======================================================

const buildRecommendations = ({
  scores,
  resumeKnowledgeScore,
  roleReadinessScore,
  weakAreas,
}) => {
  const recommendations = [];

 if (
  scores.technicalScore !== null &&
  scores.technicalScore < 60
) {
    recommendations.push(
      "Strengthen technical fundamentals and practice explaining technical concepts with practical examples."
    );
  }

 if (
  scores.communicationScore !== null &&
  scores.communicationScore < 60
) {
    recommendations.push(
      "Practice concise spoken answers with clear wording and a logical flow."
    );
  }

  if (
  scores.relevanceScore !== null &&
  scores.relevanceScore < 60
) {
    recommendations.push(
      "Keep answers focused on the exact question and avoid unrelated details."
    );
  }

if (
  scores.completenessScore !== null &&
  scores.completenessScore < 60
) {
    recommendations.push(
      "Give more complete answers by explaining the situation, your action, and the result."
    );
  }

if (
  scores.answerStructureScore !== null &&
  scores.answerStructureScore < 60
) {
    recommendations.push(
      "Structure answers with a clear beginning, key points, and a concise conclusion."
    );
  }

  if (
  resumeKnowledgeScore !== null &&
  resumeKnowledgeScore < 60
) {
    recommendations.push(
      "Review every project, skill, certification, and experience listed on your resume so you can explain them confidently."
    );
  }

 if (
  roleReadinessScore !== null &&
  roleReadinessScore < 60
) {
    recommendations.push(
      "Continue targeted preparation for the selected role before attempting another interview."
    );
  }

  weakAreas
    .slice(0, 5)
    .forEach((area) => {
      recommendations.push(
        `Practice and review: ${area}.`
      );
    });

  if (!recommendations.length) {
    recommendations.push(
      "Continue practicing advanced interview questions and maintain the same level of clarity and relevance."
    );
  }

  return uniqueStrings(
    recommendations
  ).slice(0, 8);
};

// ======================================================
// BUILD FINAL RESULT
// ======================================================

const buildAIInterviewResult = (
  session
) => {
  if (!session) {
    throw new Error(
      "AI interview session is required."
    );
  }

  const answeredTurns =
    getAnsweredTurns(session);

  if (!answeredTurns.length) {
    throw new Error(
      "The interview does not contain any completed answers."
    );
  }

  const scores =
    calculateScores(
      answeredTurns
    );

  const resumeKnowledgeScore =
    calculateResumeKnowledgeScore(
      answeredTurns
    );

  const roleReadinessScore =
    calculateRoleReadinessScore({
      scores,
      resumeKnowledgeScore,
    });

  const {
    strengths,
    weakAreas,
  } = collectAreas(
    session,
    answeredTurns
  );

  const communicationMetrics =
    calculateCommunicationMetrics(
      answeredTurns
    );

  // NEW — communication improvement suggestions.
  const communicationSuggestions =
    buildCommunicationSuggestions({
      scores,
      communicationMetrics,
      answeredTurns,
    });

  // NEW — answer improvement suggestions.
 const answerSuggestions =
  buildAnswerSuggestions({
    scores,
    answeredTurns,
  });

  // ORIGINAL — recommendations remain unchanged.
  const recommendations =
    buildRecommendations({
      scores,
      resumeKnowledgeScore,
      roleReadinessScore,
      weakAreas,
    });

  return {
    answeredQuestions:
      answeredTurns.length,

    overallScore:
      scores.overallScore,

    technicalScore:
      scores.technicalScore,

    communicationScore:
      scores.communicationScore,

    relevanceScore:
      scores.relevanceScore,

    completenessScore:
      scores.completenessScore,

    answerStructureScore:
      scores.answerStructureScore,

    resumeKnowledgeScore,

    roleReadinessScore,

    strengths,

    weakAreas,

    recommendations,

    communicationMetrics,

    // NEW — additional result fields.
    communicationSuggestions,

    answerSuggestions,
  };
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  buildAIInterviewResult,
};
