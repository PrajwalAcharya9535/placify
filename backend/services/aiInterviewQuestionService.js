    // ==========================================
    // PLACIFY - ADAPTIVE AI INTERVIEW
    // QUESTION SERVICE
    // ==========================================
    //
    // Purpose:
    // Generate ONE interview question at a time.
    //
    // IMPORTANT:
    // - No fixed question list
    // - No pre-generated interview
    // - Resume is the primary interview context
    // - Previous conversation influences the next question
    // - Interview stages guide coverage
    // ==========================================


    const {
      generateAIInterviewQuestion,
    } = require("./aiInterviewAIService");

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

    const uniqueStrings = (values = []) => {
      const seen = new Set();
      const result = [];

      for (const value of cleanArray(values)) {
        const key = value.toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          result.push(value);
        }
      }

      return result;
    };

    // ==========================================
    // INTERVIEW STAGES
    // ==========================================

    const INTERVIEW_STAGES = [
      "Introduction",
      "Resume Discussion",
      "Project Discussion",
      "Technical",
      "Behavioral",
      "Role & Company",
      "Communication",
      "Closing",
    ];

    // ==========================================
    // SAFE RESUME CONTEXT
    // ==========================================

    const buildResumeContext = (session) => {
      const resume = session?.resumeSnapshot || {};

      return {
        candidateName: cleanText(resume.candidateName),

        summary: cleanText(resume.summary),

        skills: uniqueStrings(resume.skills).slice(0, 25),

        projects: cleanArray(resume.projects).slice(0, 15),

        projectImpact: cleanText(resume.projectImpact),

        experience: cleanArray(resume.experience).slice(0, 12),

        internships: cleanArray(resume.internships).slice(0, 10),

        education: cleanArray(resume.education).slice(0, 8),

        certifications: cleanArray(resume.certifications).slice(0, 8),

        matchedSkills: uniqueStrings(
          resume.matchedSkills
        ).slice(0, 20),

        missingSkills: uniqueStrings(
          resume.missingSkills
        ).slice(0, 15),
      };
    };

    // ==========================================
    // CONVERSATION MEMORY
    // ==========================================

    const buildConversationMemory = (session) => {
      const conversation = Array.isArray(session?.conversation)
        ? session.conversation
        : [];

      return conversation.slice(-8).map((turn) => ({
        turnNumber: turn.turnNumber,

        stage: cleanText(turn.stage),

        questionText: cleanText(turn.questionText),

        focusArea: cleanText(turn.focusArea),

        topic: cleanText(turn.topic),

        answerTranscript: cleanText(
          turn.answerTranscript
        ),

        skipped: Boolean(turn.skipped),

        nextAction: cleanText(turn.nextAction),

        strengths: cleanArray(
          turn?.evaluation?.strengths
        ),

        weakAreas: cleanArray(
          turn?.evaluation?.weakAreas
        ),
      }));
    };

    // ==========================================
    // DETERMINE FIRST FOCUS AREA
    // ==========================================

    const determineFirstFocusArea = (session) => {
      const resume = buildResumeContext(session);

      if (resume.summary) {
        return "Candidate Introduction";
      }

      if (resume.projects.length > 0) {
        return "Resume Overview";
      }

      if (resume.skills.length > 0) {
        return "Resume Skills";
      }

      if (resume.experience.length > 0) {
        return "Experience";
      }

      return "Candidate Introduction";
    };

    // ==========================================
    // FIRST QUESTION
    // ==========================================

    const generateOpeningQuestion = (session) => {
      const resume = buildResumeContext(session);

      const candidateName =
        resume.candidateName || "there";

      const targetRole = cleanText(
        session?.targetRole
      );

      let questionText =
        `Hello ${candidateName}. ` +
        "To begin, please introduce yourself and walk me through " +
        "the parts of your background that you believe are most relevant";

      if (targetRole) {
        questionText += ` to the ${targetRole} role`;
      }

      questionText += ".";

      return {
        stage: "Introduction",

        questionText,

        focusArea: determineFirstFocusArea(session),

        topic: "Self Introduction",

        difficulty: "Foundation",

        questionReason:
          "Opening question used to understand the candidate's background and establish context for adaptive follow-up questions.",

        source: "Introduction",
      };
    };

    // ==========================================
    // BUILD ADAPTIVE QUESTION CONTEXT
    // ==========================================
    //
    // This object will later be passed to the AI
    // provider when generating each next question.
    //
    // We intentionally keep the AI provider separate
    // from this service so the interview architecture
    // remains clean and replaceable.
    // ==========================================

    const buildAdaptiveQuestionContext = (session) => {
      const resume = buildResumeContext(session);

      const conversation =
        buildConversationMemory(session);

      return {
        interview: {
          currentStage:
            cleanText(session?.currentStage) ||
            "Introduction",

          currentFocusArea:
            cleanText(session?.currentFocusArea),

          currentTopic:
            cleanText(session?.currentTopic),

          difficulty:
            cleanText(session?.difficulty) ||
            "Adaptive",

          durationMinutes:
            Number(session?.durationMinutes) || 20,
        },

        target: {
          role: cleanText(session?.targetRole),

          company: cleanText(
            session?.targetCompany
          ),

          jobDescription: cleanText(
            session?.jobDescription
          ),
        },

        resume,

        conversation,

        interviewMemory: {
          topicsCovered: uniqueStrings(
            session?.topicsCovered
          ),

          skillsTested: uniqueStrings(
            session?.skillsTested
          ),

          observedStrongAreas: uniqueStrings(
            session?.observedStrongAreas
          ),

          observedWeakAreas: uniqueStrings(
            session?.observedWeakAreas
          ),
        },
      };
    };

    // ==========================================
    // FOLLOW-UP LIMIT HELPERS
    // ==========================================

    const MAX_CONSECUTIVE_TOPIC_QUESTIONS = 3;
    const REQUIRED_INTERVIEW_STAGES = [
      "Introduction",
      "Resume Discussion",
      "Project Discussion",
      "Technical",
      "Behavioral",
      "Role & Company",
      "Communication",
    ];

    const getCompletedInterviewStages = (session) => {
      const conversation = Array.isArray(session?.conversation)
        ? session.conversation
        : [];

      return new Set(
        conversation
          .filter(
            (turn) =>
              cleanText(turn.answerTranscript) ||
              Boolean(turn.skipped)
          )
          .map((turn) => cleanText(turn.stage))
          .filter(Boolean)
      );
    };

    const canEnterClosingStage = (session) => {
      const completedStages = getCompletedInterviewStages(session);
      const resume = buildResumeContext(session);

      const requiredStages = REQUIRED_INTERVIEW_STAGES.filter(
        (stage) => {
          if (stage === "Project Discussion") {
            return resume.projects.length > 0;
          }

      if (stage === "Role & Company") {
    return Boolean(
      cleanText(session?.targetRole) ||
      cleanText(session?.targetCompany) ||
      cleanText(session?.jobDescription)
    );
  }

          return true;
        }
      );

      return requiredStages.every((stage) =>
        completedStages.has(stage)
      );
    };

    const getConsecutiveTopicCount = (session) => {
      const conversation = Array.isArray(session?.conversation)
        ? session.conversation
        : [];

      if (!conversation.length) return 0;

      const lastTurn = conversation[conversation.length - 1];

      const lastTopic = cleanText(lastTurn.topic).toLowerCase();

      if (!lastTopic) return 0;

      let count = 0;

      for (let i = conversation.length - 1; i >= 0; i--) {
        const topic = cleanText(
          conversation[i].topic
        ).toLowerCase();

        if (topic !== lastTopic) break;

        count++;
      }

      return count;
    };

    // ==========================================
    // ADAPTIVE FOLLOW-UP FROM PREVIOUS ANSWER
    // ==========================================
    //
    // Uses the evaluation decision from the
    // immediately previous answer.
    //
    // This keeps the conversation natural:
    //
    // Strong answer      -> Go Deeper
    // Good answer        -> Related Follow-up
    // Unclear answer     -> Clarify
    // Incomplete answer  -> Simplify
    // Skip / weak topic  -> Change Topic
    // ==========================================

    const generateAdaptiveFollowUp = (session) => {
      if (
      getConsecutiveTopicCount(session) >=
      MAX_CONSECUTIVE_TOPIC_QUESTIONS
    ) {
      return null;
    }
      const conversation = Array.isArray(
        session?.conversation
      )
        ? session.conversation
        : [];

  

      if (conversation.length === 0) {
        return null;
      }

      const previousTurn =
        conversation[conversation.length - 1];

      const nextAction =
        cleanText(previousTurn.nextAction);

      const focusArea =
        cleanText(previousTurn.focusArea);

      const topic =
        cleanText(previousTurn.topic);

      const previousAnswer =
        cleanText(previousTurn.answerTranscript);

      // No answer has been processed yet.
      if (
        !previousAnswer &&
        !previousTurn.skipped
      ) {
        return null;
      }

      // ========================================
      // GO DEEPER
      // ========================================

      if (nextAction === "Go Deeper") {
      return {
      acknowledgement:
        "That's a useful explanation. I'd like to explore it further.",

      stage:
        previousTurn.stage || "Technical",
          questionText:
            `You gave a good explanation about ${
              topic || focusArea || "that topic"
            }. ` +
            "Let's go one level deeper. What was the most challenging part, " +
            "and how did you decide on the approach you used?",

          focusArea:
            focusArea || topic,

          topic:
            topic || focusArea,

          difficulty: "Advanced",

          questionReason:
            "The previous answer was strong enough to justify a deeper follow-up.",

          source: "Previous Answer",
        };
      }

      // ========================================
      // CLARIFY
      // ========================================

      if (nextAction === "Clarify") {
      return {
      acknowledgement:
        "I understand your point. Let me clarify one detail.",

      stage:
        previousTurn.stage || "Resume Discussion",

          questionText:
            `I'd like you to clarify your previous answer about ${
              topic || focusArea || "that topic"
            }. ` +
            "Can you explain your specific role or contribution more clearly, " +
            "with one concrete example?",

          focusArea:
            focusArea || topic,

          topic:
            topic || focusArea,

          difficulty: "Foundation",

          questionReason:
            "The previous answer needs a clearer and more specific explanation.",

          source: "Previous Answer",
        };
      }

      // ========================================
      // SIMPLIFY
      // ========================================

      if (nextAction === "Simplify") {
      return {
      acknowledgement:
        "That's alright. Let's approach it from a simpler angle.",

      stage:
        previousTurn.stage || "Technical",
          questionText:
            `Let's approach ${
              topic || focusArea || "this topic"
            } more simply. ` +
            "Can you explain the basic idea in your own words and give one simple example?",

          focusArea:
            focusArea || topic,

          topic:
            topic || focusArea,

          difficulty: "Foundation",

          questionReason:
            "The previous answer was incomplete, so the topic is being approached at a more foundational level.",

          source: "Previous Answer",
        };
      }

      // ========================================
      // RELATED FOLLOW-UP
      // ========================================

      if (
        nextAction ===
        "Related Follow-up"
      ) {
      return {
      acknowledgement:
        "Thank you for explaining that. Let's look at a related situation.",

      stage:
        previousTurn.stage ||
        "Resume Discussion",

          questionText:
            `Staying with ${
              topic || focusArea || "this area"
            }, ` +
            "can you give me another practical example or situation where you applied it?",

          focusArea:
            focusArea || topic,

          topic:
            topic || focusArea,

          difficulty: "Intermediate",

          questionReason:
            "The previous answer was useful and supports a related follow-up question.",

          source: "Previous Answer",
        };
      }

      // ========================================
      // CHANGE TOPIC
      // ========================================
      //
      // Returning null intentionally allows the
      // normal resume-aware fallback engine to
      // select another uncovered area.
      // ========================================

      if (
        nextAction === "Change Topic" ||
        nextAction === "Move Stage"
      ) {
        return null;
      }

      return null;
    };

    // ==========================================
    // FALLBACK QUESTION GENERATION
    // ==========================================
    //
    // This is NOT a fixed question bank.
    //
    // It provides a safe fallback if the AI provider
    // is temporarily unavailable.
    //
    // Questions are selected from actual resume
    // information wherever possible.
    // ==========================================

    const generateFallbackAdaptiveQuestion = (
      session
    ) => {
      const context =
        buildAdaptiveQuestionContext(session);

      const resume = context.resume;

    const conversation = Array.isArray(session?.conversation)
      ? session.conversation
      : [];

      const completedStages = getCompletedInterviewStages(session);

    const hasAskedStage = (stage) =>
      conversation.some(
        (turn) => cleanText(turn.stage) === stage
      );

    const hasCompletedStage = (stage) =>
      completedStages.has(stage);

    // ==========================================
  // REQUIRED STAGE PROGRESSION
  // ==========================================

  const getNextRequiredStage = () => {
    const requiredStages = REQUIRED_INTERVIEW_STAGES.filter(
      (stage) => {
        if (stage === "Project Discussion") {
          return resume.projects.length > 0;
        }

        if (stage === "Role & Company") {
          return Boolean(
            context.target.role ||
            context.target.company ||
            context.target.jobDescription
          );
        }

        return true;
      }
    );

    return requiredStages.find(
      (stage) => !hasCompletedStage(stage)
    ) || null;
  };

  const nextRequiredStage = getNextRequiredStage();
      // ----------------------------------------
      // FIRST QUESTION
      // ----------------------------------------

    // ==========================================
  // INTRODUCTION STAGE PROGRESSION
  // ==========================================

  if (conversation.length === 0) {
    return generateOpeningQuestion(session);
  }

  if (nextRequiredStage === "Introduction") {
    const introductionAlreadyAsked = conversation.some(
      (turn) =>
        cleanText(turn.stage) === "Introduction"
    );

    // Never repeat an unanswered introduction.
    if (introductionAlreadyAsked) {
      return null;
    }

    return generateOpeningQuestion(session);
  } 

      // ----------------------------------------
    // RESUME DISCUSSION
    // ----------------------------------------

   if (
  nextRequiredStage === "Resume Discussion" &&
  !conversation.some(
    (turn) =>
      turn.stage === "Resume Discussion" &&
      turn.topic === "Resume Highlights"
  ) &&
  (
    resume.experience.length === 0 ||
    conversation.some(
      (turn) =>
        turn.stage === "Resume Discussion" &&
        turn.topic === "Experience"
    )
  )
) {
      return {
        stage: "Resume Discussion",
        questionText:
          "Looking at your background, " +
          "which skill, academic achievement, or experience do you feel " +
          "best demonstrates your readiness for this role, and why?",
        focusArea: "Resume Overview",
        topic: "Resume Highlights",
        difficulty: "Foundation",
        questionReason:
          "Explore the candidate's resume and identify relevant strengths before moving into deeper discussions.",
        source: "Resume",
      };
    }


    // ----------------------------------------
      // EXPERIENCE
      // ----------------------------------------

    if (
    nextRequiredStage === "Resume Discussion" &&
    resume.experience.length > 0 &&
    !conversation.some(
      (turn) =>
        turn.stage === "Resume Discussion" &&
        turn.topic === "Experience"
    )
  ) {
        return {
          stage: "Resume Discussion",

          questionText:
            "Tell me about the most relevant experience listed on your resume. " +
            "What were your responsibilities, and what did you personally contribute?",

          focusArea: "Experience",

          topic: "Experience",

          difficulty: "Intermediate",

          questionReason:
            "Relevant experience is present on the uploaded resume and has not yet been discussed.",

          source: "Experience",
        };
      }


      // ----------------------------------------
      // PROJECT
      // ----------------------------------------

    if (
      resume.projects.length > 0 &&
  nextRequiredStage === "Project Discussion"
    ) {
        return {
          stage: "Project Discussion",

          questionText:
            "Let's talk about one of the projects on your resume. " +
            "Choose the project you are most confident about and explain " +
            "the problem you were solving, your specific contribution, " +
            "and the technologies you used.",

          focusArea: "Projects",

          topic: "Project Explanation",

          difficulty: "Intermediate",

          questionReason:
            "A project is listed on the uploaded resume and has not yet been explored.",

          source: "Project",
        };
      }

      // ----------------------------------------
      // SKILL
      // ----------------------------------------

    // ----------------------------------------
    // TECHNICAL
    // ----------------------------------------

    if (
    nextRequiredStage === "Technical"
    ) {  const targetRole = context.target.role || "software developer";

      const skills = resume.skills || [];

      const primarySkill =
        skills.find((skill) =>
          /java|python|javascript|react|node|sql/i.test(skill)
        ) ||
        skills[0] ||
        "";

      const questionText = primarySkill
        ? `Let's move into the technical discussion. Your resume mentions ${primarySkill}. Can you explain one important concept in ${primarySkill} and describe where you have applied it?`
        : `Let's move into the technical discussion for the ${targetRole} role. Which technical concept are you most confident explaining, and how have you applied it?`;

      return {
        stage: "Technical",
        questionText,
        focusArea: primarySkill || targetRole,
        topic: primarySkill || "Technical Fundamentals",
        difficulty: "Intermediate",
        questionReason:
          "The candidate must demonstrate technical knowledge relevant to the target role.",
        source: "Technical",
      };
    }

    
      // ----------------------------------------
      // BEHAVIORAL
      // ----------------------------------------

      if (nextRequiredStage === "Behavioral") {
        return {
          stage: "Behavioral",

          questionText:
            "Tell me about a situation where you faced a difficult problem while working on a project or assignment. " +
            "How did you approach it, and what was the outcome?",

          focusArea: "Problem Solving",

          topic: "Behavioral Problem Solving",

          difficulty: "Intermediate",

          questionReason:
            "The interview needs to evaluate how the candidate approaches real-world problems.",

          source: "Behavioral",
        };
      }

      // ----------------------------------------
      // ROLE / COMPANY
      // ----------------------------------------
    if (
    nextRequiredStage === "Role & Company"
    ) {
      const selectedRole = context.target.role;
  const selectedCompany = context.target.company;

  let questionText = selectedRole
    ? `Why are you interested in the ${selectedRole} role`
    : selectedCompany
      ? `Why are you interested in working`
      : `What interests you about the responsibilities described in the job description`;
        if (context.target.company) {
          questionText +=
            ` at ${context.target.company}`;
        }

        questionText +=
          ", and how does your current background prepare you for it?";

        return {
          stage: "Role & Company",

          questionText,

          focusArea: context.target.role,

          topic: "Role Motivation",

          difficulty: "Intermediate",

          questionReason:
            "The candidate selected a target role for this interview.",

          source: context.target.company
            ? "Target Company"
            : "Target Role",
        };
      }

      // ----------------------------------------
      // COMMUNICATION
      // ----------------------------------------

      if (nextRequiredStage === "Communication") {
        return {
          stage: "Communication",

          questionText:
            "Imagine you need to explain one of your technical projects to a non-technical manager. " +
            "How would you explain what you built and why it is useful?",

          focusArea: "Communication",

          topic: "Communication",

          difficulty: "Intermediate",

          questionReason:
            "The interview needs to evaluate the candidate's ability to communicate technical work clearly.",

          source: "Communication",
        };
      }

      // Do not close until required interview
    // stages have been completed.
    if (!canEnterClosingStage(session)) {
      return null;
    }


      const closingAlreadyAsked =
      Array.isArray(session?.conversation) &&
      session.conversation.some(
        (turn) => turn.stage === "Closing"
      );

  if (closingAlreadyAsked) {
    return null;
  }

      // ----------------------------------------
      // CLOSING
      // ----------------------------------------

      return {
        stage: "Closing",

        questionText:
          "Before we conclude, is there anything about your skills, projects, or experience that we have not discussed and that you would like to highlight?",

        focusArea: "Closing",

        topic: "Closing",

        difficulty: "Foundation",

        questionReason:
          "The major interview areas have been covered and the candidate is being given a final opportunity to add relevant information.",

        source: "Closing",
      };
    };


    // ==========================================
  // DUPLICATE QUESTION PREVENTION
  // ==========================================

  const normalizeQuestionText = (text) => {
    return cleanText(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isDuplicateInterviewQuestion = (
    session,
    questionText
  ) => {
    const conversation = Array.isArray(session?.conversation)
      ? session.conversation
      : [];

    const newQuestion = normalizeQuestionText(questionText);

    if (!newQuestion) {
      return true;
    }

    return conversation.some((turn) => {
      const previousQuestion = normalizeQuestionText(
        turn.questionText
      );

      return previousQuestion === newQuestion;
    });
  };

    // ==========================================
    // GENERATE NEXT QUESTION
    // ==========================================
    //
    // Later this function will call our AI provider.
    //
    // For now:
    // - first question is resume-aware
    // - subsequent questions have safe adaptive fallback
    //
    // This lets us build and test the complete
    // interview workflow before connecting the
    // external AI generation layer.
    // ==========================================

    const generateNextInterviewQuestion = async (
      session
    ) => {
      if (!session) {
        throw new Error(
          "Interview session is required."
        );
      }

      const conversation = Array.isArray(
        session.conversation
      )
        ? session.conversation
        : [];

        // ==========================================
  // PREVENT GENERATION IF QUESTION IS UNANSWERED
  // ==========================================

  if (conversation.length > 0) {
    const lastTurn = conversation[conversation.length - 1];

    const hasAnswer = Boolean(
      cleanText(lastTurn?.answerTranscript)
    );

    const wasSkipped = Boolean(lastTurn?.skipped);

    if (!hasAnswer && !wasSkipped) {
      console.log(
        "Previous interview question is still unanswered."
      );

      return null;
    }
  }

      // ========================================
      // FIRST QUESTION
      // ========================================
      //
      // Keep the opening deterministic so every
      // interview starts naturally and reliably.
      // ========================================

      if (conversation.length === 0) {
        return generateOpeningQuestion(session);
      }

      // ==========================================
    // STOP AFTER CLOSING QUESTION
    // ==========================================

    const closingAnswered = conversation.some(
      (turn) =>
        turn.stage === "Closing" &&
        (Boolean(cleanText(turn.answerTranscript)) ||
          Boolean(turn.skipped))
    );

    if (closingAnswered) {
      return null;
    }


    // ==========================================
// THIRD IRRELEVANT ANSWER — MOVE ON
// ==========================================

const lastAnsweredTurn =
  conversation[conversation.length - 1];

const exhaustedIrrelevantAttempts =
  lastAnsweredTurn?.irrelevantWarningCount >= 2 &&
  lastAnsweredTurn?.evaluation?.answerQuality === "Irrelevant";

if (exhaustedIrrelevantAttempts) {
  const nextQuestion =
    generateFallbackAdaptiveQuestion(session);

  if (
    nextQuestion &&
    !isDuplicateInterviewQuestion(
      session,
      nextQuestion.questionText
    )
  ) {
    return nextQuestion;
  }

  throw new Error(
    "Unable to generate the next stage after an irrelevant answer."
  );
}

// ==========================================
// ENFORCE REQUESTED STAGE PROGRESSION
// ==========================================

const previousCompletedTurn =
  conversation[conversation.length - 1];

if (
  previousCompletedTurn?.nextAction === "Move Stage"
) {
  const nextStageQuestion =
    generateFallbackAdaptiveQuestion(session);

  if (
    nextStageQuestion &&
    !isDuplicateInterviewQuestion(
      session,
      nextStageQuestion.questionText
    )
  ) {
    return nextStageQuestion;
  }

  throw new Error(
    "Unable to progress to the next interview stage."
  );
}

      // ========================================
      // PRIMARY: GEMINI ADAPTIVE INTERVIEWER
      // ========================================

      try {
        const adaptiveContext =
          buildAdaptiveQuestionContext(session);

        const aiQuestion =
          await generateAIInterviewQuestion(
            adaptiveContext
          );

      if (
      aiQuestion &&
      aiQuestion.questionText
    ) {
      const consecutiveCount =
        getConsecutiveTopicCount(session);

      const previousTurn =
        conversation[conversation.length - 1];

      const previousTopic =
        cleanText(previousTurn?.topic).toLowerCase();

      const nextTopic =
        cleanText(aiQuestion.topic).toLowerCase();

        // Prevent the AI from closing the interview
    // before the required stages are covered.
    if (
      cleanText(aiQuestion.stage) === "Closing" &&
      !canEnterClosingStage(session)
    ) {
      console.log(
        "Premature AI Closing question rejected."
      );

    const fallbackQuestion = generateFallbackAdaptiveQuestion(session);

  if (
    fallbackQuestion &&
    !isDuplicateInterviewQuestion(
      session,
      fallbackQuestion.questionText
    )
  ) {
    return fallbackQuestion;
  }

    throw new Error(
      "Cannot enter Closing: required interview stages are incomplete."
    );}

    // Ensure core interview stages are covered
    // before allowing later-stage AI questions.
    const completedStages =
      getCompletedInterviewStages(session);

    const resumeContext = buildResumeContext(session);

    const requiredStages =
      REQUIRED_INTERVIEW_STAGES.filter((stage) => {
        if (stage === "Project Discussion") {
          return resumeContext.projects.length > 0;
        }

    if (stage === "Role & Company") {
    return Boolean(
      cleanText(session?.targetRole) ||
      cleanText(session?.targetCompany) ||
      cleanText(session?.jobDescription)
    );
  }

        return true;
      });

    const nextRequiredStage = requiredStages.find(
      (stage) => !completedStages.has(stage)
    );

    const aiStage = cleanText(aiQuestion.stage);
    // ==========================================
  // PREVENT REPEATING COMPLETED STAGES
  // ==========================================

  if (
    completedStages.has(aiStage) &&
    aiStage !== cleanText(previousTurn?.stage)
  ) {
    console.log(
      `Completed interview stage rejected: ${aiStage}`
    );

    return generateFallbackAdaptiveQuestion(session);
  }
    // ==========================================
  // INTRODUCTION STAGE PROTECTION
  // ==========================================

  if (
    nextRequiredStage === "Introduction" &&
    aiStage !== "Introduction"
  ) {
    console.log(
      "AI attempted to skip the Introduction stage."
    );

    return generateFallbackAdaptiveQuestion(session);
  }
    // Prevent returning to an earlier completed stage.
    const lastCompletedStage = [...conversation]
      .reverse()
      .find(
        (turn) =>
          cleanText(turn.answerTranscript) ||
          Boolean(turn.skipped)
      )?.stage;

    const lastStageIndex =
      INTERVIEW_STAGES.indexOf(cleanText(lastCompletedStage));

    const proposedStageIndex =
      INTERVIEW_STAGES.indexOf(aiStage);

    if (
      proposedStageIndex !== -1 &&
      lastStageIndex !== -1 &&
      proposedStageIndex < lastStageIndex
    ) {
      console.log(
        `Backward AI stage rejected: ${aiStage}`
      );

      return generateFallbackAdaptiveQuestion(session);
    }
    // Reject unrecognized interview stages.
    if (!INTERVIEW_STAGES.includes(aiStage)) {
      console.log(
        `Invalid AI interview stage rejected: ${aiStage}`
      );

      return generateFallbackAdaptiveQuestion(session);
    }

   if (
  nextRequiredStage &&
  aiStage !== nextRequiredStage &&
  aiStage !== cleanText(previousTurn?.stage)
) {
      console.log(
        `AI stage ${aiStage} deferred; awaiting ${nextRequiredStage}.`
      );

      return generateFallbackAdaptiveQuestion(session);
    }

    // ==========================================
  // CONTROL SAME-STAGE QUESTION PROGRESSION
  // ==========================================

  const followUpActions = [
    "Go Deeper",
    "Clarify",
    "Simplify",
    "Related Follow-up",
  ];

  const previousAction = cleanText(previousTurn?.nextAction);

  const isRepeatingCompletedStage =
    completedStages.has(aiStage) &&
    aiStage === cleanText(previousTurn?.stage);

  if (
    isRepeatingCompletedStage &&
    (
      !followUpActions.includes(previousAction) ||
      consecutiveCount >= MAX_CONSECUTIVE_TOPIC_QUESTIONS
    )
  ) {
    console.log(
      `AI same-stage question rejected: ${aiStage}`
    );

    return generateFallbackAdaptiveQuestion(session);
  }

      const sameTopic =
        previousTopic &&
        nextTopic &&
        previousTopic === nextTopic;

      if (
        consecutiveCount >= MAX_CONSECUTIVE_TOPIC_QUESTIONS &&
        sameTopic
      ) {
        // Reject another question on the same topic.
        // Continue to the fallback section below.
    } else if (
    !isDuplicateInterviewQuestion(
      session,
      aiQuestion.questionText
    )
  ) {
    return aiQuestion;
  } else {
    console.log(
      "Duplicate AI interview question rejected."
    );
  }
    }
    } catch (error) {
  console.error(
    "AI interview question generation failed:",
    error.message
  );

  const errorMessage = String(error.message || "");

  const isQuotaError =
    /\b429\b|quota exceeded|resource_exhausted|rate.limit/i.test(
      errorMessage
    );

  if (isQuotaError) {
  console.warn(
    "Gemini quota exhausted. Using local interview fallback."
  );
}
}

      // ========================================
      // FALLBACK
      // ========================================
      //
      // Gemini failure must not break the
      // interview.
      //
      // First try the existing adaptive logic.
      // If it cannot produce a question, move to
      // the resume-aware fallback generator.
      // ========================================

    // ========================================
    // ADAPTIVE LOCAL FOLLOW-UP
    // ========================================
    //
    // Gemini is the primary interviewer.
    //
    // If Gemini is temporarily unavailable,
    // first continue naturally from the
    // student's previous answer.
    //
    // This prevents the fallback from turning
    // into a resume skill checklist.
    // ========================================

  // ==========================================
  // SAFE ADAPTIVE FOLLOW-UP VALIDATION
  // ==========================================

  const adaptiveFollowUp =
    generateAdaptiveFollowUp(session);

  if (
    adaptiveFollowUp &&
    adaptiveFollowUp.questionText
  ) {
    const completedStages =
      getCompletedInterviewStages(session);

    const resume = buildResumeContext(session);

    const requiredStages =
      REQUIRED_INTERVIEW_STAGES.filter((stage) => {
        if (stage === "Project Discussion") {
          return resume.projects.length > 0;
        }

        if (stage === "Role & Company") {
          return Boolean(
            cleanText(session?.targetRole) ||
            cleanText(session?.targetCompany) ||
            cleanText(session?.jobDescription)
          );
        }

        return true;
      });

    const nextRequiredStage = requiredStages.find(
      (stage) => !completedStages.has(stage)
    );

    const followUpStage = cleanText(
      adaptiveFollowUp.stage
    );

    const previousTurn = session.conversation?.at(-1);

    const previousStage = cleanText(
      previousTurn?.stage
    );

    const isSameStage =
      followUpStage === previousStage;

    const isNextRequiredStage =
      followUpStage === nextRequiredStage;

    const isValidStage =
      INTERVIEW_STAGES.includes(followUpStage);

    const isDuplicate =
      isDuplicateInterviewQuestion(
        session,
        adaptiveFollowUp.questionText
      );

    const closingAllowed =
      followUpStage !== "Closing" ||
      canEnterClosingStage(session);

    if (
      isValidStage &&
      (isSameStage || isNextRequiredStage) &&
      !isDuplicate &&
      closingAllowed
    ) {
      return adaptiveFollowUp;
    }

    console.log(
      "Adaptive follow-up rejected: invalid stage or duplicate."
    );
  }


    // ========================================
    // GENERAL STAGE-BASED FALLBACK
    // ========================================
    //
    // If there is no meaningful follow-up,
    // continue through the remaining interview
    // areas instead of checking every skill.
    // ========================================

  const fallbackQuestion =
    generateFallbackAdaptiveQuestion(session);

  if (
    fallbackQuestion &&
    !isDuplicateInterviewQuestion(
      session,
      fallbackQuestion.questionText
    )
  ) {
    return fallbackQuestion;
  }

    // Do not report interview completion while
    // required stages remain incomplete.
   if (!canEnterClosingStage(session)) {
  throw new Error(
    "Interview question generation could not cover all required stages."
  );
}

if (!closingAnswered) {
  throw new Error(
    "Interview cannot finish before the Closing question is answered."
  );
}

return null;
};


    

    // ==========================================
    // EXPORTS
    // ==========================================

    module.exports = {
      INTERVIEW_STAGES,
      buildAdaptiveQuestionContext,
      generateOpeningQuestion,
      generateAdaptiveFollowUp,
      generateFallbackAdaptiveQuestion,
      generateNextInterviewQuestion,
    };