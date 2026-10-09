// ======================================================
// PLACIFY — AI INTERVIEW EVALUATION SERVICE
// ======================================================
//
// Purpose:
// Evaluate one candidate interview answer using Gemini.
//
// This service evaluates:
// - Technical correctness when applicable
// - Relevance
// - Completeness
// - Clarity
// - Structure
// - Communication quality
// - Resume/project explanation quality
//
// IMPORTANT:
// - This service does NOT generate the next question.
// - This service does NOT infer personality.
// - This service does NOT infer confidence from webcam.
// - This service does NOT evaluate appearance.
// - If Gemini is unavailable, the caller can fall back
//   to Placify's deterministic evaluator.
// ======================================================


// ======================================================
// CONFIGURATION
// ======================================================

// ==========================================
// GEMINI QUOTA PROTECTION
// ==========================================

let geminiQuotaBlockedUntil = 0;

const isGeminiQuotaBlocked = () => {
  return Date.now() < geminiQuotaBlockedUntil;
};

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.8-flash";

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


// ======================================================
// HELPERS
// ======================================================

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


const cleanStringArray = (
  values,
  maxItems = 5
) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const value of values) {
    const cleaned = cleanText(value);

    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);

    if (result.length >= maxItems) {
      break;
    }
  }

  return result;
};


// ======================================================
// SAFE JSON EXTRACTION
// ======================================================

const extractJSON = (text) => {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  if (!cleaned) {
    throw new Error(
      "Gemini returned an empty evaluation."
    );
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace =
      cleaned.indexOf("{");

    const lastBrace =
      cleaned.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(
        "Gemini evaluation did not contain valid JSON."
      );
    }

    return JSON.parse(
      cleaned.slice(
        firstBrace,
        lastBrace + 1
      )
    );
  }
};


// ======================================================
// RESUME CONTEXT
// ======================================================

const buildResumeContext = (
  resumeContext = {}
) => {
  if (
    !resumeContext ||
    typeof resumeContext !== "object"
  ) {
    return {};
  }

  return {
    candidateName:
      cleanText(
        resumeContext.candidateName ||
        resumeContext.name
      ),

    summary:
      cleanText(
        resumeContext.summary
      ),

    skills:
      Array.isArray(resumeContext.skills)
        ? resumeContext.skills
            .map(cleanText)
            .filter(Boolean)
            .slice(0, 30)
        : [],

    projects:
      Array.isArray(resumeContext.projects)
        ? resumeContext.projects
            .slice(0, 8)
        : [],

    experience:
      Array.isArray(
        resumeContext.experience
      )
        ? resumeContext.experience
            .slice(0, 8)
        : [],

    internships:
      Array.isArray(
        resumeContext.internships
      )
        ? resumeContext.internships
            .slice(0, 8)
        : [],

    certifications:
      Array.isArray(
        resumeContext.certifications
      )
        ? resumeContext.certifications
            .slice(0, 10)
        : [],
  };
};


// ======================================================
// CONVERSATION CONTEXT
// ======================================================

const buildConversationContext = (
  conversation = []
) => {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .filter(Boolean)
    .slice(-6)
    .map((turn) => ({
      stage:
        cleanText(turn.stage),

      question:
        cleanText(
          turn.questionText
        ),

      answer:
        cleanText(
          turn.answerTranscript
        ),

      topic:
        cleanText(turn.topic),

      focusArea:
        cleanText(turn.focusArea),
    }));
};


// ======================================================
// PROMPT
// ======================================================

const buildEvaluationPrompt = ({
  questionText,
  answerText,
  stage,
  focusArea,
  topic,
  source,
  targetRole,
  targetCompany,
  jobDescription,
  resumeContext,
  conversation,
}) => {
  const payload = {
    targetRole:
      cleanText(targetRole),

    targetCompany:
      cleanText(targetCompany),

    jobDescription:
      cleanText(jobDescription),

    currentQuestion: {
      stage:
        cleanText(stage),

      source:
        cleanText(source),

      focusArea:
        cleanText(focusArea),

      topic:
        cleanText(topic),

      questionText:
        cleanText(questionText),
    },

    candidateAnswer:
      cleanText(answerText),

    resume:
      buildResumeContext(
        resumeContext
      ),

    recentConversation:
      buildConversationContext(
        conversation
      ),
  };

  return `
You are the evaluation engine for Placify,
an adaptive AI interview preparation platform.

Evaluate ONLY the candidate's answer to the
CURRENT interview question.

You are evaluating interview performance,
not personality.

==================================================
IMPORTANT RULES
==================================================

1. Judge the semantic meaning of the answer.
Do not score based only on keyword overlap.

2. Do not reward an answer merely because it
is long.

3. Do not punish a concise answer when it
correctly and sufficiently answers the question.

4. Evaluate technical correctness only when
the question actually tests technical knowledge,
project implementation, architecture, technical
decision-making, or a technical resume claim.

5. For non-technical questions, technicalScore
must be 0.

6. For technical answers:
- check conceptual correctness
- check whether important claims are reasonable
- check whether the explanation answers the
  actual question
- identify important missing technical detail
- do not invent facts not present in the answer

7. For resume/project questions:
use the supplied resume only as context.
Do not assume the candidate did something that
is not supported by the resume or answer.

8. Communication score must evaluate the
quality of the spoken transcript:
- clarity
- conciseness
- logical flow
- understandable wording

Do NOT infer:
- personality
- honesty
- nervousness
- confidence
- emotion
- appearance

9. Relevance means how directly the answer
addresses the question.

10. Completeness means whether enough
information was provided to satisfactorily
answer that specific question.

11. Structure means whether the answer has a
logical and understandable progression.

12. Scores must be integers from 0 to 100.

13. Be fair to fresher candidates.
Do not expect senior-level depth unless the
question or target role requires it.

14. Do not give high scores to technically
incorrect answers just because they are clear.

15. Do not give low scores to technically
correct concise answers solely because they
are short.

==================================================
TECHNICAL APPLICABILITY
==================================================

Set:

"technicalApplicable": true

when the current question evaluates:
- programming
- databases
- SQL
- DSA
- frameworks
- APIs
- system/project architecture
- implementation details
- debugging
- technical decisions
- technical project explanation
- technical resume skill claims

Otherwise set it to false.

When technicalApplicable is false:

"technicalScore": 0

==================================================
RESUME KNOWLEDGE APPLICABILITY
==================================================

Set:

"resumeKnowledgeApplicable": true

when the question asks the candidate to explain,
justify, describe, or verify something appearing
in their resume, including:
- projects
- skills
- experience
- internships
- certifications
- achievements

Otherwise set it to false.

resumeKnowledgeScore should represent how well
the candidate explains the resume-related claim
being discussed.

When resumeKnowledgeApplicable is false:

"resumeKnowledgeScore": 0

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do not use markdown.
Do not add explanation outside JSON.

Use exactly this structure:

{
  "technicalApplicable": true,
  "resumeKnowledgeApplicable": false,

  "technicalScore": 0,
  "resumeKnowledgeScore": 0,

  "relevanceScore": 0,
  "completenessScore": 0,
  "clarityScore": 0,
  "structureScore": 0,
  "communicationScore": 0,

  "answerQuality": "Irrelevant",

  "strengths": [],
  "weakAreas": [],

  "missingKeyPoints": [],
  "incorrectClaims": [],
  "improvementTips": [],

  "suggestedAnswer": "",
  "feedback": ""
}

==================================================
ANSWER CLASSIFICATION RULES
==================================================

Classify the answer using exactly one category:

Complete:
The answer correctly and sufficiently addresses
the question, even when it is concise.

Partially Complete:
The answer is relevant and contains some correct
information but misses important details.

Too Short:
The answer attempts the question but provides
insufficient information to evaluate properly.
Do not use this label for concise correct answers.

Irrelevant:
The answer does not address the question.
Set relevanceScore to 0.
Set completenessScore to 0.
Set technicalScore to 0.
Set resumeKnowledgeScore to 0.

Incorrect:
The answer addresses the question but contains
materially incorrect information.
Award technical knowledge marks only for
demonstrably correct technical content.

For "I don't know", "sorry", or equivalent
responses that provide no answer:
Set knowledge scores to 0 and explain that
the candidate did not answer.

Evaluate communication independently of
relevance and technical correctness.

Never award technical marks simply because
an answer is long or clearly spoken.

Provide specific missingKeyPoints,
incorrectClaims, improvementTips, and a
concise suggestedAnswer when appropriate.

These improvement details are for the final
interview report, not live spoken feedback.


Strengths:
- maximum 4
- specific to the actual answer
- no generic praise

Weak areas:
- maximum 4
- specific and actionable
- do not invent mistakes

Feedback:
- maximum 2 concise sentences
- explain the most important improvement
- do not mention numeric scores

==================================================
INTERVIEW DATA
==================================================

${JSON.stringify(payload, null, 2)}
`;
};


// ======================================================
// NORMALIZE GEMINI RESULT
// ======================================================

const normalizeEvaluation = (
  evaluation
) => {
  if (
    !evaluation ||
    typeof evaluation !== "object"
  ) {
    throw new Error(
      "Gemini returned an invalid evaluation object."
    );
  }

  const technicalApplicable =
    evaluation.technicalApplicable === true;

  const resumeKnowledgeApplicable =
    evaluation.resumeKnowledgeApplicable === true;

  return {
    technicalApplicable,

    resumeKnowledgeApplicable,

    technicalScore:
      technicalApplicable
        ? clampScore(
            evaluation.technicalScore
          )
        : 0,

    resumeKnowledgeScore:
      resumeKnowledgeApplicable
        ? clampScore(
            evaluation.resumeKnowledgeScore
          )
        : 0,

    relevanceScore:
      clampScore(
        evaluation.relevanceScore
      ),

    completenessScore:
      clampScore(
        evaluation.completenessScore
      ),

    clarityScore:
      clampScore(
        evaluation.clarityScore
      ),

    structureScore:
      clampScore(
        evaluation.structureScore
      ),

    communicationScore:
      clampScore(
        evaluation.communicationScore
      ),

    strengths:
      cleanStringArray(
        evaluation.strengths,
        4
      ),

    weakAreas:
      cleanStringArray(
        evaluation.weakAreas,
        4
      ),

  feedback:
  cleanText(evaluation.feedback),

answerQuality:
  evaluation.answerQuality === "Irrelevant" ||
  (
    Number(evaluation.relevanceScore) === 0 &&
    Number(evaluation.completenessScore) === 0
  )
    ? "Irrelevant"
    : [
        "Complete",
        "Partially Complete",
        "Too Short",
        "Incorrect",
      ].includes(evaluation.answerQuality)
      ? evaluation.answerQuality
      : "Partially Complete",

missingKeyPoints:
  cleanStringArray(evaluation.missingKeyPoints, 5),

incorrectClaims:
  cleanStringArray(evaluation.incorrectClaims, 5),

improvementTips:
  cleanStringArray(evaluation.improvementTips, 5),

suggestedAnswer:
  cleanText(evaluation.suggestedAnswer),
  };
};


// ======================================================
// GEMINI REQUEST
// ======================================================

const evaluateInterviewAnswerWithAI =
  async ({
    questionText,
    answerText,
    stage,
    focusArea,
    topic,
    source,
    targetRole,
    targetCompany,
    jobDescription,
    resumeContext,
    conversation,
  }) => {

    // Avoid repeated Gemini requests after quota exhaustion.
if (isGeminiQuotaBlocked()) {
  const error = new Error(
    "Gemini quota temporarily exhausted. Using local fallback."
  );

  error.status = 429;
  throw error;
}
    const GEMINI_API_KEY =
      process.env.GEMINI_API_KEY || "";

    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured."
      );
    }

    const cleanedQuestion =
      cleanText(questionText);

    const cleanedAnswer =
      cleanText(answerText);

    if (!cleanedQuestion) {
      throw new Error(
        "Interview question is required for AI evaluation."
      );
    }

    if (!cleanedAnswer) {
      throw new Error(
        "Interview answer is required for AI evaluation."
      );
    }

    const prompt =
      buildEvaluationPrompt({
        questionText:
          cleanedQuestion,

        answerText:
          cleanedAnswer,

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

    console.log(
      `🧠 GEMINI ANSWER EVALUATION REQUEST | model=${GEMINI_MODEL}`
    );

    const response = await fetch(
      `${GEMINI_API_URL}?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",

              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.15,

            responseMimeType:
              "application/json",
          },
        }),
      }
    );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch (error) {
      throw new Error(
        `Gemini evaluation returned an unreadable response (${response.status}).`
      );
    }

    if (!response.ok) {
      const providerMessage =
        cleanText(
          responseData?.error?.message
        );

      const error =
        new Error(
          providerMessage ||
            `Gemini evaluation failed with status ${response.status}.`
        );

      error.status =
        response.status;

        if (response.status === 429) {
  // Conservative cooldown; does not increase provider quota.
  geminiQuotaBlockedUntil =
    Date.now() + 60 * 60 * 1000;

  console.warn(
    "Gemini evaluation quota exhausted. Pausing evaluation requests for 1 hour."
  );
}

      throw error;
    }

    const responseText =
      responseData?.candidates?.[0]
        ?.content?.parts
        ?.map((part) =>
          cleanText(part?.text)
        )
        .filter(Boolean)
        .join("\n");

    if (!responseText) {
      throw new Error(
        "Gemini returned no evaluation content."
      );
    }

    const parsed =
  extractJSON(responseText);

console.log("🔍 INTERVIEW RELEVANCE DEBUG", {
  stage,
  question: cleanedQuestion,
  answer: cleanedAnswer,
  answerQuality: parsed.answerQuality,
  relevanceScore: parsed.relevanceScore,
  completenessScore: parsed.completenessScore,
});

const normalized =
  normalizeEvaluation(parsed);

    console.log(
      "✅ GEMINI ANSWER EVALUATION SUCCESS"
    );

    return normalized;
  };


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  evaluateInterviewAnswerWithAI,
};