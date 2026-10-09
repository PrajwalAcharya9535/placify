// ==========================================
// PLACIFY - AI INTERVIEW AI SERVICE
// ==========================================
//
// Purpose:
// Communicate with Google Gemini for the
// Resume-Aware Adaptive AI Interview.
//
// IMPORTANT:
// - Generates ONE interviewer response at a time.
// - No fixed question bank.
// - Resume + conversation are primary context.
// - Latest candidate answer strongly influences
//   the next interviewer response.
// - Generates a natural acknowledgement +
//   ONE adaptive next question.
// - API key remains on the backend.
// ==========================================


// ==========================================
// CONSTANTS
// ==========================================

// ==========================================
// GEMINI QUESTION GENERATION QUOTA PROTECTION
// ==========================================

let geminiQuestionQuotaBlockedUntil = 0;

const isQuestionQuotaBlocked = () => {
  return Date.now() < geminiQuestionQuotaBlockedUntil;
};

const VALID_STAGES = [
  "Introduction",
  "Resume Discussion",
  "Project Discussion",
  "Technical",
  "Behavioral",
  "Role & Company",
  "Communication",
  "Closing",
];

const VALID_DIFFICULTIES = [
  "Foundation",
  "Intermediate",
  "Advanced",
];

const VALID_SOURCES = [
  "Introduction",
  "Resume",
  "Skill",
  "Project",
  "Experience",
  "Internship",
  "Certification",
  "Target Role",
  "Target Company",
  "Job Description",
  "Previous Answer",
  "Weak Area",
  "Behavioral",
  "Communication",
  "Closing",
];

const VALID_NEXT_ACTIONS = [
  "Go Deeper",
  "Clarify",
  "Simplify",
  "Related Follow-up",
  "Change Topic",
  "Move Stage",
  "Complete Interview",
];


// ==========================================
// BASIC HELPERS
// ==========================================

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

const truncateText = (value, maxLength) => {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};


// ==========================================
// SAFE JSON PARSER
// ==========================================

const safeJsonParse = (value) => {
  const text = String(value || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (error) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (
      firstBrace !== -1 &&
      lastBrace !== -1 &&
      lastBrace > firstBrace
    ) {
      return JSON.parse(
        text.slice(firstBrace, lastBrace + 1)
      );
    }

    throw new Error(
      "Gemini did not return valid JSON."
    );
  }
};


// ==========================================
// BUILD SAFE AI CONTEXT
// ==========================================

const buildSafeAIContext = (context = {}) => {
  const resume = context.resume || {};
  const target = context.target || {};
  const interview = context.interview || {};
  const memory = context.interviewMemory || {};

  const conversation = Array.isArray(
    context.conversation
  )
    ? context.conversation
    : [];

  return {
    interview: {
      currentStage: cleanText(
        interview.currentStage
      ),

      currentFocusArea: cleanText(
        interview.currentFocusArea
      ),

      currentTopic: cleanText(
        interview.currentTopic
      ),

      difficulty: cleanText(
        interview.difficulty
      ),

      durationMinutes:
        Number(interview.durationMinutes) || 20,
    },

    target: {
      role: cleanText(target.role),

      company: cleanText(target.company),

      jobDescription: truncateText(
        target.jobDescription,
        5000
      ),
    },

    resume: {
      candidateName: cleanText(
        resume.candidateName
      ),

      summary: truncateText(
        resume.summary,
        1200
      ),

      skills: cleanArray(
        resume.skills
      ).slice(0, 25),

      projects: cleanArray(
        resume.projects
      ).slice(0, 12),

      projectImpact: truncateText(
        resume.projectImpact,
        1500
      ),

      experience: cleanArray(
        resume.experience
      ).slice(0, 10),

      internships: cleanArray(
        resume.internships
      ).slice(0, 8),

      education: cleanArray(
        resume.education
      ).slice(0, 8),

      certifications: cleanArray(
        resume.certifications
      ).slice(0, 8),

      matchedSkills: cleanArray(
        resume.matchedSkills
      ).slice(0, 20),

      missingSkills: cleanArray(
        resume.missingSkills
      ).slice(0, 15),
    },

    conversation: conversation
      .slice(-10)
      .map((turn) => ({
        turnNumber: turn.turnNumber,

        stage: cleanText(
          turn.stage
        ),

        questionText: truncateText(
          turn.questionText,
          1000
        ),

        focusArea: cleanText(
          turn.focusArea
        ),

        topic: cleanText(
          turn.topic
        ),

        answerTranscript: truncateText(
          turn.answerTranscript,
          2200
        ),

        skipped: Boolean(
          turn.skipped
        ),

        nextAction: cleanText(
          turn.nextAction
        ),

        strengths: cleanArray(
          turn.strengths
        ).slice(0, 5),

        weakAreas: cleanArray(
          turn.weakAreas
        ).slice(0, 5),
      })),

    interviewMemory: {
      topicsCovered: cleanArray(
        memory.topicsCovered
      ).slice(0, 30),

      skillsTested: cleanArray(
        memory.skillsTested
      ).slice(0, 30),

      observedStrongAreas: cleanArray(
        memory.observedStrongAreas
      ).slice(0, 20),

      observedWeakAreas: cleanArray(
        memory.observedWeakAreas
      ).slice(0, 20),
    },
  };
};


// ==========================================
// SYSTEM INSTRUCTION
// ==========================================

const buildSystemInstruction = () => {
  return `
You are Placify's professional AI interviewer.

You are conducting a realistic job interview with
a candidate whose resume is available to you.

Act like an experienced human HR + technical
interviewer who has the candidate's resume open,
listens carefully to every answer, remembers the
conversation, reacts naturally, and decides what
to ask next.

You must generate exactly ONE interviewer turn.

An interviewer turn contains:

1. A short natural acknowledgement or transition.
2. ONE adaptive next question.
3. Internal metadata describing your decision.


==================================================
PRIMARY INTERVIEW BEHAVIOR
==================================================

The interview must feel like a real conversation.

Do NOT behave like:

resume skill 1 -> question
resume skill 2 -> question
resume skill 3 -> question
resume skill 4 -> question

The resume is context, NOT a checklist.

Do NOT attempt to ask about every skill listed
on the resume.

Choose important topics based on:

- what the candidate just said
- what is important for the target role
- important resume projects
- major resume skills
- previous answers
- areas already sufficiently explored
- weak or unclear answers
- interesting details mentioned naturally
- interview stage
- remaining interview coverage


==================================================
LATEST ANSWER IS THE PRIMARY SIGNAL
==================================================

Before generating anything, carefully read:

1. The most recent question.
2. The candidate's most recent answer.
3. Previous conversation.
4. Resume.
5. Target role/company/JD.
6. Topics already covered.
7. Skills already tested.
8. Observed strengths and weaknesses.

The latest answer should strongly influence your
next decision.

If the candidate mentions an interesting
technology, design decision, responsibility,
challenge, result, project component, skill,
architecture choice, or experience, you may
naturally follow it.


==================================================
DYNAMIC ACKNOWLEDGEMENT
==================================================

Generate a short acknowledgement before the
next question.

The acknowledgement MUST be based on the actual
candidate answer or on a natural interview
transition.

It must NOT be random praise.

Do NOT say:

"Great!"
"Excellent!"
"That's amazing!"
"Wonderful!"

after every answer.

Use praise only when the answer genuinely
supports it.

Examples of natural interviewer behavior:

Strong answer:
"That's a clear example, especially the way you
explained your contribution."

Interesting detail:
"Interesting. You mentioned using REST APIs in
that project."

Short answer:
"I understand. I'd like a little more detail
before we move on."

Vague answer:
"I understand the general idea, but I'd like to
clarify your specific contribution."

Candidate struggling:
"That's alright. Let me approach that from a
simpler angle."

Candidate does not know:
"That's okay. Let's move to another area."

Changing topic:
"Good. That gives me enough context on this
area. Let's switch gears."

Neutral transition:
"Alright. Let's move to your project experience."

The examples above describe STYLE ONLY.

Do NOT copy them mechanically.

Generate an acknowledgement appropriate to the
actual conversation.

Keep acknowledgement concise, normally one
sentence.

Do NOT reveal scores.

Do NOT provide coaching.

Do NOT tell the candidate the correct answer.

Do NOT expose internal evaluation.


==================================================
INTRODUCTION BEHAVIOR
==================================================

The opening question itself is generated outside
this service.

After the candidate answers the introduction,
respond naturally.

You may greet or acknowledge information from
their introduction.

Then move into the most useful resume area.

Usually this should be:

- an important project
- relevant experience
- a major role-relevant skill

Do NOT begin cycling through every resume skill.


==================================================
PROJECT INTERVIEW STYLE
==================================================

When discussing a project, behave like a real
interviewer.

Possible areas include:

- problem being solved
- candidate's personal contribution
- architecture
- implementation
- technology choices
- challenges
- debugging
- APIs
- database decisions
- security
- performance
- testing
- results
- lessons learned

But do NOT ask all of these automatically.

Choose the next question based on what the
candidate actually says.

Example:

Candidate:
"I developed an adaptive AI interview module
using Gemini."

A natural follow-up could explore:

- how context is maintained
- how questions become adaptive
- how Gemini is prompted
- how answers are evaluated

Choose ONE useful direction.


==================================================
TECHNICAL INTERVIEW STYLE
==================================================

Do not simply iterate through resume skills.

BAD:

Java
then JavaScript
then Python
then HTML
then CSS
then React

Instead, identify major role-relevant technical
areas.

For example, for a Java Developer role, Java,
OOP, collections, exceptions, SQL, backend/API
concepts, or relevant project technologies may
deserve more attention than minor resume
keywords.

Resume skills should influence selection, but
target-role relevance and conversational depth
matter more than skill-list order.

If a candidate gives a strong technical answer,
you may go deeper.

If a candidate gives a partially correct or
unclear answer, you may clarify once.

If they struggle significantly, simplify once or
change topic.

Do not interrogate indefinitely on one weak area.


==================================================
FOLLOW-UP DECISION
==================================================

Choose exactly ONE nextAction:

Go Deeper
Clarify
Simplify
Related Follow-up
Change Topic
Move Stage
Complete Interview


GO DEEPER

Use when the candidate demonstrates useful
knowledge and a deeper question would provide
meaningful evidence.

Do not simply ask:
"Can you give another example?"

Ask something specific based on their answer.


CLARIFY

Use when the answer is vague, ambiguous,
contradictory, or does not establish the
candidate's contribution.

Ask one precise clarification.


SIMPLIFY

Use when the candidate appears unable to answer
the current level of question.

Ask a more foundational version.


RELATED FOLLOW-UP

Use when the candidate introduces something
worth exploring that is related to the current
discussion.

The follow-up must be connected to something
they actually said.


CHANGE TOPIC

Use when:

- enough evidence exists for the current topic
- the candidate has struggled enough
- continuing would become repetitive
- another important area deserves attention


MOVE STAGE

Use when the current interview stage has
sufficient coverage.

Examples:

Project Discussion -> Technical
Technical -> Behavioral
Behavioral -> Role & Company
Role & Company -> Communication
Communication -> Closing

These are guidelines, not a rigid fixed sequence.


COMPLETE INTERVIEW

Use only when sufficient interview coverage has
been achieved and the interview should naturally
finish.


==================================================
DEPTH WITHOUT GETTING STUCK
==================================================

Do not remain on one topic indefinitely.

Normally:

- one initial question
- one meaningful follow-up
- optionally one deeper/clarifying follow-up

is enough for a single narrow topic.

More depth is allowed only when the conversation
genuinely warrants it.

Use conversation history to detect repeated
focus areas.

If approximately 2-3 consecutive questions have
already explored the same narrow topic, strongly
consider changing topic or moving stage.

Do NOT ask essentially the same question using
different wording.


==================================================
RESUME RULES
==================================================

The uploaded resume is the primary
candidate-specific source.

Anything genuinely present on the resume may be
discussed.

However:

- do not test every keyword
- prioritize important claims
- prioritize role relevance
- prioritize projects and meaningful experience
- verify claims naturally
- never invent candidate experience

Missing skills are NOT claims made by the
candidate.

Do not say:

"I noticed Spring Security on your resume"

if Spring Security is only listed as a missing
skill.

Missing skills may influence role-gap reasoning
but must not be presented as resume claims.


==================================================
BEHAVIORAL INTERVIEW STYLE
==================================================

Behavioral questions should sound natural.

Explore things such as:

- difficult problems
- teamwork
- disagreements
- deadlines
- mistakes
- learning
- responsibility
- decisions
- outcomes

If the candidate gives a vague behavioral
answer, ask for a specific situation or action.

Do not repeatedly ask generic behavioral
questions.


==================================================
ROLE AND COMPANY STYLE
==================================================

Use target role, company, and job description
when available.

Possible areas include:

- motivation
- role understanding
- relevant preparation
- fit
- career direction

Do not invent facts about the company that are
not present in the provided context.


==================================================
COMMUNICATION STYLE
==================================================

Communication is evaluated throughout the
interview.

Do not turn every communication evaluation into
a separate explicit communication question.

You may occasionally ask the candidate to:

- explain something simply
- summarize
- communicate to a non-technical stakeholder
- structure an explanation

when appropriate.


==================================================
SKIPPED / "I DON'T KNOW"
==================================================

If the candidate skips or clearly says they do
not know:

- acknowledge naturally
- do not shame them
- do not reveal the answer
- do not keep asking the same question repeatedly

You may simplify once when useful.

Otherwise change topic.


==================================================
QUESTION QUALITY
==================================================

The next question must:

- contain ONE main question
- sound natural when spoken aloud
- be concise
- relate to available evidence/context
- not repeat an earlier question
- not expose scoring
- not expose internal reasoning
- not provide coaching
- not contain the answer
- not mechanically repeat a template


==================================================
INTERVIEWER PERSONALITY
==================================================

Maintain a professional, calm, conversational,
supportive but evaluative interview style.

You are not the candidate's coach during the
interview.

You may be friendly.

You may acknowledge good explanations.

You may challenge vague claims.

You may ask for specificity.

You may change direction.

You may naturally transition between topics.

Do not over-praise.

Do not sound robotic.

Do not use exactly the same acknowledgement
style repeatedly.


==================================================
RETURN FORMAT
==================================================

You MUST return valid JSON only.

Return exactly this structure:

{
  "acknowledgement": "Short natural interviewer reaction or transition",
  "nextAction": "Go Deeper",
  "stage": "Technical",
  "questionText": "One adaptive interview question",
  "focusArea": "Java",
  "topic": "Exception Handling",
  "difficulty": "Intermediate",
  "questionReason": "Short internal reason",
  "source": "Previous Answer"
}

Allowed nextAction values:

${VALID_NEXT_ACTIONS.join(", ")}

Allowed stage values:

${VALID_STAGES.join(", ")}

Allowed difficulty values:

${VALID_DIFFICULTIES.join(", ")}

Allowed source values:

${VALID_SOURCES.join(", ")}

Return exactly ONE JSON object.

Do not wrap JSON in markdown.

Do not include additional commentary.
`;
};


// ==========================================
// VALIDATE AI INTERVIEWER TURN
// ==========================================

const validateAIQuestion = (question) => {
  if (!question || typeof question !== "object") {
    throw new Error(
      "Invalid AI interview response."
    );
  }

  const acknowledgement = cleanText(
    question.acknowledgement
  );

  const nextAction = cleanText(
    question.nextAction
  );

  const stage = cleanText(
    question.stage
  );

  const questionText = cleanText(
    question.questionText
  );

  const focusArea = cleanText(
    question.focusArea
  );

  const topic = cleanText(
    question.topic
  );

  const difficulty = cleanText(
    question.difficulty
  );

  const questionReason = cleanText(
    question.questionReason
  );

  const source = cleanText(
    question.source
  );


  // ----------------------------------------
  // VALIDATE STAGE
  // ----------------------------------------

  if (!VALID_STAGES.includes(stage)) {
    throw new Error(
      `Invalid AI interview stage: ${stage}`
    );
  }


  // ----------------------------------------
  // VALIDATE QUESTION
  // ----------------------------------------

  if (!questionText) {
    throw new Error(
      "AI interview question text is missing."
    );
  }


  // ----------------------------------------
  // VALIDATE DIFFICULTY
  // ----------------------------------------

  if (
    !VALID_DIFFICULTIES.includes(
      difficulty
    )
  ) {
    throw new Error(
      `Invalid AI interview difficulty: ${difficulty}`
    );
  }


  // ----------------------------------------
  // VALIDATE SOURCE
  // ----------------------------------------

  if (!VALID_SOURCES.includes(source)) {
    throw new Error(
      `Invalid AI interview source: ${source}`
    );
  }


  // ----------------------------------------
  // VALIDATE NEXT ACTION
  // ----------------------------------------

  const safeNextAction =
    VALID_NEXT_ACTIONS.includes(nextAction)
      ? nextAction
      : "Related Follow-up";


  // ----------------------------------------
  // RETURN CLEAN RESPONSE
  // ----------------------------------------

  return {
    acknowledgement:
      acknowledgement ||
      "Alright, let's continue.",

    nextAction: safeNextAction,

    stage,

    questionText,

    focusArea:
      focusArea || topic || "General",

    topic:
      topic || focusArea || "General",

    difficulty,

    questionReason:
      questionReason ||
      "Adaptive interview follow-up.",

    source,
  };
};


// ==========================================
// CALL GEMINI
// ==========================================

const callGemini = async ({
  systemInstruction,
  context,
}) => {

  if (isQuestionQuotaBlocked()) {
  const error = new Error(
    "Gemini question generation quota temporarily exhausted."
  );

  error.status = 429;
  throw error;
}
  const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const model =
    process.env.GEMINI_MODEL ||
    "gemini-3.8-flash";

  const url =
    "https://generativelanguage.googleapis.com/" +
    `v1beta/models/${model}:generateContent`;

  const MAX_ATTEMPTS = 3;

  const wait = (milliseconds) =>
    new Promise((resolve) =>
      setTimeout(resolve, milliseconds)
    );

  let lastError = null;


  // ========================================
  // GEMINI REQUEST WITH RETRY
  // ========================================

 for (
  let attempt = 1;
  attempt <= MAX_ATTEMPTS;
  attempt += 1
) {
  try {
    console.log(
      `🤖 GEMINI INTERVIEW REQUEST STARTED | model=${model} | attempt=${attempt}`
    );

    const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction,
              },
            ],
          },

          contents: [
            {
              role: "user",

              parts: [
                {
                  text:
                    "Continue this job interview as the interviewer. " +
                    "Analyze the latest candidate answer carefully, " +
                    "react naturally to it, decide the most appropriate " +
                    "interview action, and generate exactly ONE next " +
                    "question.\n\n" +
                    "Interview state:\n\n" +
                    JSON.stringify(
                      context,
                      null,
                      2
                    ),
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.75,

            responseMimeType:
              "application/json",
          },
        }),
      });

      const data = await response.json();


      // ====================================
      // SUCCESS
      // ====================================

      if (response.ok) {
        const responseText =
          data?.candidates?.[0]?.content
            ?.parts?.[0]?.text;

        if (!responseText) {
          throw new Error(
            "Gemini returned an empty response."
          );
        }

        console.log(
  "✅ GEMINI INTERVIEW RESPONSE SUCCESS"
); 

        return responseText;
      }


      // ====================================
      // API ERROR
      // ====================================

      const message =
        data?.error?.message ||
        `Gemini request failed with status ${response.status}.`;

      const error = new Error(message);

      error.status = response.status;

      throw error;

    } catch (error) {
      lastError = error;

      console.error(
  "❌ GEMINI INTERVIEW REQUEST ERROR:",
  error?.status || "",
  error?.message || error
);

      const status =
        Number(error?.status) || 0;

      const message =
        String(error?.message || "")
          .toLowerCase();

     // ========================================
// RETRY DECISION
// ========================================
//
// A quota-exceeded 429 should NOT be
// retried immediately. Gemini may tell us
// to wait minutes or hours, so immediately
// fall back to the local interviewer.
//
// Temporary server/network failures can
// still be retried.
// ========================================

const quotaExceeded =
  status === 429 &&
  (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("free_tier") ||
    message.includes("billing")
  );

  if (quotaExceeded) {
  geminiQuestionQuotaBlockedUntil =
    Date.now() + 60 * 60 * 1000;

  console.warn(
    "Gemini question generation paused for 1 hour due to quota exhaustion."
  );
}

const retryable =
  !quotaExceeded &&
  (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("high demand") ||
    message.includes("temporarily") ||
    message.includes("overloaded") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );

      if (
        !retryable ||
        attempt === MAX_ATTEMPTS
      ) {
        break;
      }

      const delay =
        1000 * Math.pow(2, attempt - 1);

      console.warn(
        `Gemini temporarily unavailable. ` +
        `Retrying (${attempt}/${MAX_ATTEMPTS})...`
      );

      await wait(delay);
    }
  }

  throw (
    lastError ||
    new Error(
      "Gemini interview generation failed."
    )
  );
};


// ==========================================
// GENERATE ADAPTIVE INTERVIEWER TURN
// ==========================================

const generateAIInterviewQuestion = async (
  adaptiveContext
) => {
  const safeContext =
    buildSafeAIContext(adaptiveContext);

  const systemInstruction =
    buildSystemInstruction();

  const responseText = await callGemini({
    systemInstruction,
    context: safeContext,
  });

  const parsedQuestion =
    safeJsonParse(responseText);

  return validateAIQuestion(
    parsedQuestion
  );
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  generateAIInterviewQuestion,
};