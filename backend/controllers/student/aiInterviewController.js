  const fs = require("fs");

  const AIInterviewSession = require(
    "../../models/AIInterviewSession"
  );

  const {
    extractResumeText,
  } = require(
    "../../services/resumeTextExtractionService"
  );

  const {
    extractStructuredResume,
  } = require(
    "../../services/resumeStructuredExtractionService"
  );

  const {
    buildAIInterviewResumeContext,
  } = require(
    "../../services/aiInterviewResumeContextService"
  );


  const {
    generateNextInterviewQuestion,
    generateFallbackAdaptiveQuestion,
  } = require("../../services/aiInterviewQuestionService");

  const {
    analyzeInterviewAnswer,
  } = require(
    "../../services/aiInterviewAnswerService"
  );

  const {
    buildAIInterviewResult,
  } = require(
    "../../services/aiInterviewResultService"
  );

  
const {
  generateDemoAnswer,
} = require("../../services/aiInterviewDemoAnswerService");

const getDemoAnswer = async (session, question) => {
  if (!question?.questionText) return "";

  return generateDemoAnswer({
    questionText: question.questionText,
    stage: question.stage || session.currentStage,
    targetRole: session.targetRole,
    targetCompany: session.targetCompany,
    resumeSnapshot: session.resumeSnapshot,
  });
};


  // ======================================================
  // BASIC HELPERS
  // ======================================================

  // Prevent simultaneous answer processing
  // for the same interview session.
  const activeInterviewSubmissions = new Set();
  // Track irrelevant-answer warnings for each active question.
  // Key: session ID + question turn number.


  const MAX_IRRELEVANT_WARNINGS = 2;

  const cleanText = (value) => {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  };


  // ======================================================
  // INTERVIEW DURATION HELPERS
  // ======================================================

  const getInterviewDeadline = (session) => {
    if (!session?.startedAt) {
      return null;
    }

    const startedAt = new Date(session.startedAt).getTime();

    if (!Number.isFinite(startedAt)) {
      return null;
    }

    const durationMinutes = Number(session.durationMinutes) || 20;

    return new Date(startedAt + durationMinutes * 60 * 1000);
  };

  const hasInterviewTimeExpired = (session) => {
    const deadline = getInterviewDeadline(session);

    if (!deadline) {
      return false;
    }

    return Date.now() >= deadline.getTime();
  };

  // ======================================================
  // FINALIZE AI INTERVIEW
  // ======================================================

  const finalizeAIInterview = async (session) => {
    if (session.status === "Completed") {
      return session;
    }

    if (session.status !== "In Progress") {
      throw new Error("Interview is not in progress.");
    }

    // Remove an unanswered final question.
    const lastTurn = session.conversation.at(-1);

    if (
      lastTurn &&
      !cleanText(lastTurn.answerTranscript) &&
      !lastTurn.skipped
    ) {
      session.conversation.pop();
    }

    // Check completed answers.
    const answeredTurns = session.conversation.filter(
      (turn) =>
        Boolean(cleanText(turn.answerTranscript)) ||
        Boolean(turn.skipped)
    );

    if (answeredTurns.length === 0) {
      throw new Error(
        "Cannot finalize interview without any answered questions."
      );
    }

    // Generate the final evaluation.
    const result = buildAIInterviewResult(session);

    session.overallScore = result.overallScore;
    session.technicalScore = result.technicalScore;
    session.communicationScore = result.communicationScore;
    session.relevanceScore = result.relevanceScore;
    session.completenessScore = result.completenessScore;
    session.answerStructureScore = result.answerStructureScore;
    session.resumeKnowledgeScore = result.resumeKnowledgeScore;
    session.roleReadinessScore = result.roleReadinessScore;

    session.strengths = result.strengths || [];
    session.weakAreas = result.weakAreas || [];
    session.recommendations = result.recommendations || [];
    session.communicationSuggestions =
      result.communicationSuggestions || [];
    session.answerSuggestions =
      result.answerSuggestions || [];

    session.status = "Completed";
    session.currentStage = "Completed";
    session.currentFocusArea = "";
    session.currentTopic = "";
    session.completedAt = new Date();

    await session.save();

    return session;
  };

  // ======================================================
  // DELETE UPLOADED FILE SAFELY
  // ======================================================
  //
  // Used when resume processing fails after Multer has
  // already saved the PDF.
  //
  // We do not want failed interview uploads accumulating
  // unnecessary files.
  // ======================================================

  const deleteUploadedFile = (filePath) => {
    try {
      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.log(
        "AI interview resume cleanup failed:",
        error.message
      );
    }
  };


  // ======================================================
  // UPLOAD + ANALYZE INTERVIEW RESUME
  // ======================================================
  //
  // POST /api/student/ai-interview/resume
  //
  // Flow:
  //
  // PDF
  //  ↓
  // Extract raw text
  //  ↓
  // Structured resume extraction
  //  ↓
  // Keep only interview-relevant information
  //  ↓
  // Create AIInterviewSession
  //
  // IMPORTANT:
  // This does NOT generate interview questions.
  // ======================================================

  const uploadAIInterviewResume = async (
    req,
    res
  ) => {
    let uploadedFilePath = "";

    try {
      const userId = req.user.id;

      // ==================================================
      // REQUIRE RESUME
      // ==================================================

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload a resume for the AI interview",
        });
      }

      uploadedFilePath =
        req.file.path;


      // ==================================================
      // INTERVIEW TARGET
      // ==================================================

      const targetRole =
        cleanText(
          req.body.targetRole
        );

      const targetCompany =
        cleanText(
          req.body.targetCompany
        );

      const jobDescription =
        cleanText(
          req.body.jobDescription
        );


      // ==================================================
      // EXTRACT PDF TEXT
      // ==================================================

      const extractionResult =
        await extractResumeText(
          req.file.path
        );

      if (
        !extractionResult.success ||
        !cleanText(
          extractionResult.text
        )
      ) {
        deleteUploadedFile(
          uploadedFilePath
        );

        return res.status(400).json({
          message:
            "Unable to read the uploaded resume. Please upload a readable PDF resume.",

          error:
            extractionResult.errorMessage ||
            "Resume text extraction failed",
        });
      }


      // ==================================================
      // STRUCTURED RESUME EXTRACTION
      // ==================================================

      const structuredResult =
        extractStructuredResume({
          resumeText:
            extractionResult.text,

          pageCount:
            extractionResult.pages || 0,
        });

      if (!structuredResult.success) {
        deleteUploadedFile(
          uploadedFilePath
        );

        return res.status(400).json({
          message:
            "Unable to understand the uploaded resume",

          error:
            structuredResult.errorMessage ||
            "Structured resume extraction failed",
        });
      }


      // ==================================================
      // BUILD SMALL INTERVIEW CONTEXT
      // ==================================================
      //
      // No email / phone / LinkedIn / GitHub /
      // interests / languages / formatting metadata.
      // ==================================================

      const interviewContext =
        buildAIInterviewResumeContext({
          structuredResume:
            structuredResult.data,

          targetRole,

          targetCompany,

          jobDescription,
        });


      // ==================================================
      // BASIC RESUME VALIDATION
      // ==================================================
      //
      // We do not require every resume section.
      // Freshers may have projects but no experience.
      //
      // We only reject the file when practically no useful
      // interview information was extracted.
      // ==================================================

      const hasUsefulContext =
        Boolean(
          interviewContext.candidateName
        ) ||
        interviewContext.skills.length > 0 ||
        interviewContext.projects.length > 0 ||
        interviewContext.experience.length > 0 ||
        interviewContext.internships.length > 0 ||
        interviewContext.education.length > 0;

      if (!hasUsefulContext) {
        deleteUploadedFile(
          uploadedFilePath
        );

        return res.status(400).json({
          message:
            "The uploaded PDF does not contain enough resume information for an AI interview.",
        });
      }


      // ==================================================
      // CREATE INTERVIEW SESSION
      // ==================================================

      const session =
        await AIInterviewSession.create({
          user:
            userId,

          resumeFileName:
            req.file.filename,

          resumeFileUrl:
            `/uploads/resumes/${req.file.filename}`,

          resumeFileType:
            req.file.mimetype,

          // Keep original extracted text in the session
          // for future grounded AI reasoning.
          //
          // We will NOT send this entire text to the AI
          // on every interview turn.
          resumeExtractedText:
            extractionResult.text,

          resumeSnapshot: {
            candidateName:
              interviewContext.candidateName,

            summary:
              interviewContext.summary,

            skills:
              interviewContext.skills,

            projects:
              interviewContext.projects,

            projectImpact:
              interviewContext.projectImpact,

            experience:
              interviewContext.experience,

            internships:
              interviewContext.internships,

            education:
              interviewContext.education,

            certifications:
              interviewContext.certifications,

            atsScore:
              interviewContext.atsScore,

            matchedSkills:
              interviewContext.matchedSkills,

            missingSkills:
              interviewContext.missingSkills,
          },

          targetRole:
            interviewContext.target.role,

          targetCompany:
            interviewContext.target.company,

          jobDescription:
            interviewContext.target
              .jobDescription,

          interviewMode:
            "Resume Adaptive",

          difficulty:
            "Adaptive",

          status:
            "Ready",

          currentStage:
            "Introduction",

          currentFocusArea:
            "",

          currentTopic:
            "",
        });


      // ==================================================
      // RESPONSE
      // ==================================================
      //
      // Return a clean preview for the frontend.
      //
      // Do NOT expose the full extracted resume text.
      // ==================================================

      return res.status(201).json({
        message:
          "Resume analyzed successfully. AI interview is ready.",

        sessionId:
          session._id,

        status:
          session.status,

        candidate: {
          name:
            session.resumeSnapshot
              .candidateName,

          summary:
            session.resumeSnapshot
              .summary,

          skills:
            session.resumeSnapshot
              .skills,

          projects:
            session.resumeSnapshot
              .projects,

          projectImpact:
            session.resumeSnapshot
              .projectImpact,

          experience:
            session.resumeSnapshot
              .experience,

          internships:
            session.resumeSnapshot
              .internships,

          education:
            session.resumeSnapshot
              .education,

          certifications:
            session.resumeSnapshot
              .certifications,
        },

        target: {
          role:
            session.targetRole,

          company:
            session.targetCompany,

          hasJobDescription:
            Boolean(
              session.jobDescription
            ),
        },

        interview: {
          mode:
            session.interviewMode,

          difficulty:
            session.difficulty,

          currentStage:
            session.currentStage,

          durationMinutes:
            session.durationMinutes,
        },
      });
    } catch (error) {
      // If session creation/processing fails,
      // remove the newly uploaded file.
      deleteUploadedFile(
        uploadedFilePath
      );

      console.error(
        "AI interview resume upload error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to prepare resume for AI interview",

        error:
          error.message,
      });
    }
  };


  // ======================================================
  // START ADAPTIVE AI INTERVIEW
  // ======================================================
  //
  // POST /api/student/ai-interview/:sessionId/start
  //
  // Flow:
  //
  // Ready session
  //      ↓
  // Verify ownership
  //      ↓
  // Generate ONE opening question
  //      ↓
  // Store question as conversation turn #1
  //      ↓
  // Mark interview In Progress
  //      ↓
  // Return question to frontend
  //
  // IMPORTANT:
  // Questions are NOT pre-generated.
  // ======================================================

  const startAIInterview = async (req, res) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      // ==========================================
      // FIND SESSION + VERIFY OWNERSHIP
      // ==========================================

      const session = await AIInterviewSession.findOne({
        _id: sessionId,
        user: userId,
      });

      if (!session) {
        return res.status(404).json({
          message: "AI interview session not found",
        });
      }

      // ==========================================
      // COMPLETED INTERVIEW CANNOT RESTART
      // ==========================================

      if (session.status === "Completed") {
        return res.status(400).json({
          message:
            "This AI interview has already been completed.",
        });
      }

      // ==========================================
  // HANDLE EXPIRED INTERVIEW
  // ==========================================

  if (
    session.status === "In Progress" &&
    hasInterviewTimeExpired(session)
  ) {
    const answeredTurns = session.conversation.filter(
      (turn) =>
        Boolean(cleanText(turn.answerTranscript)) ||
        Boolean(turn.skipped)
    );

  if (answeredTurns.length === 0) {
    session.status = "Abandoned";
    session.completedAt = new Date();
    session.currentFocusArea = "";
    session.currentTopic = "";

    await session.save();

    return res.status(200).json({
      message:
        "AI interview time expired without any submitted answers.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
      completedAt: session.completedAt,
      result: null,
    });
  }

    await finalizeAIInterview(session);

    return res.status(200).json({
      message: "AI interview time has expired.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
      completedAt: session.completedAt,
    });
  }

      // ==========================================
      // ALREADY STARTED
      // ==========================================
      //
      // Prevent duplicate opening questions if
      // Start is clicked more than once.
      // ==========================================

    if (
    session.status === "In Progress" &&
    session.conversation.length > 0 &&
    !hasInterviewTimeExpired(session)
  ) {
        const currentTurn =
          session.conversation[
            session.conversation.length - 1
          ];

          if (
    currentTurn.answeredAt ||
    currentTurn.skipped ||
    cleanText(currentTurn.answerTranscript)
  ) {
  const recoveryRequest = {
    ...req,
    body: {
      answerTranscript: currentTurn.answerTranscript || "",
      skipped: Boolean(currentTurn.skipped),
      voiceMetrics: currentTurn.voiceMetrics || {},
    },
  };

  return submitAIInterviewAnswer(recoveryRequest, res);
  }

        return res.status(200).json({
          message:
            "AI interview is already in progress.",

          sessionId: session._id,

          status: session.status,

          currentStage: session.currentStage,

          currentQuestion: {
            turnNumber: currentTurn.turnNumber,
            stage: currentTurn.stage,
            questionText: currentTurn.questionText,
            demoAnswer: await getDemoAnswer(session, currentTurn),
            acknowledgement: currentTurn.acknowledgement || "",
            focusArea: currentTurn.focusArea,
            topic: currentTurn.topic,
            difficulty: currentTurn.difficulty,
            questionReason:
              currentTurn.questionReason,
            source: currentTurn.source,
          },
        });
      }

      // ==========================================
      // SESSION MUST BE READY
      // ==========================================

      if (session.status !== "Ready") {
        return res.status(400).json({
          message:
            "AI interview is not ready to start.",
        });
      }

      // ==========================================
      // GENERATE ONLY ONE QUESTION
      // ==========================================

      const question =
        await generateNextInterviewQuestion(
          session
        );

      if (
        !question ||
        !question.questionText
      ) {
        return res.status(500).json({
          message:
            "Unable to generate the opening interview question.",
        });
      }

      // ==========================================
      // CREATE FIRST CONVERSATION TURN
      // ==========================================

      const firstTurn = {
        turnNumber: 1,

        stage: question.stage,

        questionText: question.questionText,
        acknowledgement: question.acknowledgement || "",

        focusArea: question.focusArea || "",

        topic: question.topic || "",

        difficulty:
          question.difficulty || "Foundation",

        questionReason:
          question.questionReason || "",

        source:
          question.source || "Introduction",

        answerTranscript: "",

        skipped: false,

        nextAction: "Pending",

        askedAt: new Date(),
      };

      session.conversation.push(firstTurn);

      // ==========================================
      // UPDATE INTERVIEW STATE
      // ==========================================

      session.status = "In Progress";

      session.currentStage =
        question.stage || "Introduction";

      session.currentFocusArea =
        question.focusArea || "";

      session.currentTopic =
        question.topic || "";

      session.startedAt =
        session.startedAt || new Date();

      await session.save();

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.status(200).json({
        message:
          "Adaptive AI interview started successfully.",

        sessionId: session._id,

        status: session.status,

        currentStage: session.currentStage,

        startedAt: session.startedAt,

        interview: {
          mode: session.interviewMode,
          difficulty: session.difficulty,
          durationMinutes:
            session.durationMinutes,
        },

        target: {
          role: session.targetRole,
          company: session.targetCompany,
        },

        currentQuestion: {
          turnNumber: firstTurn.turnNumber,
          stage: firstTurn.stage,
          questionText:
            firstTurn.questionText,
            demoAnswer: await getDemoAnswer(session, firstTurn),
            acknowledgement: firstTurn.acknowledgement || "",
          focusArea: firstTurn.focusArea,
          topic: firstTurn.topic,
          difficulty: firstTurn.difficulty,
          questionReason:
            firstTurn.questionReason,
          source: firstTurn.source,
        },
      });
    } catch (error) {
      console.error(
        "Start AI interview error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to start AI interview",

        error: error.message,
      });
    }
  };


  // ======================================================
  // SUBMIT ADAPTIVE AI INTERVIEW ANSWER
  // ======================================================
  //
  // POST /api/student/ai-interview/:sessionId/answer
  //
  // Flow:
  //
  // Current unanswered question
  //          ↓
  // Student transcript
  //          ↓
  // Analyze answer
  //          ↓
  // Save evaluation + voice metrics
  //          ↓
  // Update interview memory
  //          ↓
  // Generate ONE adaptive next question
  //          ↓
  // Store next conversation turn
  //          ↓
  // Return next question
  //
  // IMPORTANT:
  // Frontend live speech recognition will provide
  // answerTranscript.
  //
  // No numeric evaluation is shown to the student
  // during the live interview.
  // ======================================================

  const submitAIInterviewAnswer = async (req, res) => {
    const sessionId = req.params.sessionId;

    if (activeInterviewSubmissions.has(sessionId)) {
      return res.status(409).json({
        message:
          "Your previous answer is still processing. Please wait.",
      });
    }

    activeInterviewSubmissions.add(sessionId);

    try {
      const userId = req.user.id;

      const { sessionId } = req.params;

      const {
        answerTranscript,
        skipped = false,
        voiceMetrics = {},
      } = req.body;

      // ==========================================
      // FIND SESSION
      // ==========================================

      const session =
        await AIInterviewSession.findOne({
          _id: sessionId,
          user: userId,
        });

      if (!session) {
        return res.status(404).json({
          message:
            "AI interview session not found",
        });
      }

      // ==========================================
      // INTERVIEW MUST BE ACTIVE
      // ==========================================

      if (session.status !== "In Progress") {
        return res.status(400).json({
          message:
            "AI interview is not currently in progress.",
        });
      }

      if (
        !Array.isArray(session.conversation) ||
        session.conversation.length === 0
      ) {
        return res.status(400).json({
          message:
            "No active interview question found.",
        });
      }


      // ==========================================
  // HANDLE INTERVIEW TIME EXPIRY
  // ==========================================

  if (hasInterviewTimeExpired(session)) {
    const hasAnswered = session.conversation.some(
      (turn) =>
        Boolean(cleanText(turn.answerTranscript)) ||
        Boolean(turn.skipped)
    );

    if (!hasAnswered) {
      session.status = "Abandoned";
      session.completedAt = new Date();
      session.currentFocusArea = "";
      session.currentTopic = "";

      await session.save();

      return res.status(200).json({
        message: "AI interview time expired without answers.",
        sessionId: session._id,
        status: session.status,
        interviewFinished: true,
        currentQuestion: null,
        result: null,
      });
    }

    await finalizeAIInterview(session);

    return res.status(200).json({
      message: "AI interview time expired.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
      completedAt: session.completedAt,
      nextAction: "Complete Interview",
    });
  }
      // ==========================================
      // CURRENT QUESTION
      // ==========================================

      const currentTurn =
        session.conversation[
          session.conversation.length - 1
        ];

      // Prevent the same question from being
      // submitted more than once.

  if (
    currentTurn.answeredAt ||
    currentTurn.skipped ||
    cleanText(currentTurn.answerTranscript)
  ) {
    // The answer was already saved, but the next question
    // may not have been generated due to an earlier failure.

    const nextQuestion =
      await generateNextInterviewQuestion(session);

  if (hasInterviewTimeExpired(session)) {
    await finalizeAIInterview(session);

      return res.status(200).json({
        message: "AI interview completed successfully.",
        sessionId: session._id,
        status: session.status,
        interviewFinished: true,
        currentQuestion: null,
        completedAt: session.completedAt,
      });
    }

    if (!nextQuestion) {
    return res.status(503).json({
      message: "Unable to generate the next interview question. Please retry.",
      code: "INTERVIEW_QUESTION_RETRY",
      retryable: true,
    });
  }

    if (!cleanText(nextQuestion.questionText)) {
      return res.status(503).json({
        message:
          "Unable to generate the next question. Please try again.",
      });
    }

    const nextTurn = {
      turnNumber: session.conversation.length + 1,
      stage: nextQuestion.stage,
      questionText: nextQuestion.questionText,
      acknowledgement: nextQuestion.acknowledgement || "",
      focusArea: nextQuestion.focusArea || "",
      topic: nextQuestion.topic || "",
      difficulty: nextQuestion.difficulty || "Intermediate",
      questionReason: nextQuestion.questionReason || "",
      source: nextQuestion.source || "Previous Answer",
      answerTranscript: "",
      skipped: false,
      nextAction: "Pending",
      askedAt: new Date(),
    };

    session.conversation.push(nextTurn);

    session.currentStage = nextTurn.stage;
    session.currentFocusArea = nextTurn.focusArea;
    session.currentTopic = nextTurn.topic;

    await session.save();

    return res.status(200).json({
      message: "AI interview recovered successfully.",
      sessionId: session._id,
      status: session.status,
      currentStage: session.currentStage,
      acknowledgement: nextTurn.acknowledgement,
      interviewerDecision: {
        nextAction: nextQuestion.nextAction || currentTurn.nextAction,
        stage: nextTurn.stage,
        focusArea: nextTurn.focusArea,
        topic: nextTurn.topic,
      },
      currentQuestion: {
        turnNumber: nextTurn.turnNumber,
        stage: nextTurn.stage,
        questionText: nextTurn.questionText,
        demoAnswer: await getDemoAnswer(session, nextTurn),
        acknowledgement: nextTurn.acknowledgement,
        focusArea: nextTurn.focusArea,
        topic: nextTurn.topic,
        difficulty: nextTurn.difficulty,
        questionReason: nextTurn.questionReason,
        source: nextTurn.source,
      },
    });
  }

      // ==========================================
      // VALIDATE ANSWER
      // ==========================================

      const cleanedTranscript =
        cleanText(answerTranscript);

      if (
        !skipped &&
        !cleanedTranscript
      ) {
        return res.status(400).json({
          message:
            "Answer transcript is required.",
        });
      }

      // ==========================================
      // ANALYZE ANSWER
      // ==========================================

    const analysis =
    await analyzeInterviewAnswer({
      questionText:
        currentTurn.questionText,

      answerText:
        cleanedTranscript,

      stage:
        currentTurn.stage,

      focusArea:
        currentTurn.focusArea,

      topic:
        currentTurn.topic,

      source:
        currentTurn.source || "",

      targetRole:
        session.targetRole || "",

      targetCompany:
        session.targetCompany || "",

      jobDescription:
        session.jobDescription || "",

      resumeContext:
        session.resumeSnapshot || {},

      conversation:
        session.conversation || [],

      skipped:
        Boolean(skipped),

      voiceMetrics:
        voiceMetrics || {},
    });


    // ==========================================
  // IRRELEVANT ANSWER WARNING
  // ==========================================



  const isIrrelevant =
    !skipped &&
    analysis.evaluation?.answerQuality === "Irrelevant";

  console.log("🔍 CONTROLLER RELEVANCE DEBUG", {
    stage: currentTurn.stage,
    answerQuality: analysis.evaluation?.answerQuality,
    relevanceScore: analysis.evaluation?.relevanceScore,
    completenessScore: analysis.evaluation?.completenessScore,
    isIrrelevant,
    previousWarnings: currentTurn.irrelevantWarningCount || 0,
  });

  if (isIrrelevant) {
    const previousWarnings =
    currentTurn.irrelevantWarningCount || 0;

    if (previousWarnings < MAX_IRRELEVANT_WARNINGS) {
      const warningCount = previousWarnings + 1;

    currentTurn.irrelevantWarningCount = warningCount;

  await session.save();

      return res.status(200).json({
        message:
          "Your answer does not address the question. Please try again.",

        sessionId: session._id,
        status: session.status,
        currentStage: session.currentStage,

        interviewFinished: false,
        retrySameQuestion: true,
        warningCount,

        acknowledgement:
          warningCount === 1
            ? "Your answer seems unrelated to my question. Please try again."
            : "Your answer is still unrelated. Please focus on the question. This is your final attempt.",

        currentQuestion: {
          turnNumber: currentTurn.turnNumber,
          stage: currentTurn.stage,
          questionText: currentTurn.questionText,
          demoAnswer: await getDemoAnswer(session, currentTurn),
          focusArea: currentTurn.focusArea,
          topic: currentTurn.topic,
          difficulty: currentTurn.difficulty,
          source: currentTurn.source,
        },
      });
    }

    // Third irrelevant answer: proceed with zero
    // relevance and applicable knowledge marks.
    analysis.evaluation.relevanceScore = 0;
    analysis.evaluation.completenessScore = 0;
    analysis.evaluation.technicalScore = 0;
    analysis.evaluation.resumeKnowledgeScore = 0;
    analysis.evaluation.overallScore = 0;
    analysis.nextAction = "Change Topic";
  }

  // Clear warnings once this question is accepted.
  // Warning count is stored in the conversation turn.
  // No in-memory cleanup is required.


      // ==========================================
      // SAVE CURRENT ANSWER
      // ==========================================

      currentTurn.answerTranscript =
        analysis.answerTranscript || "";

      currentTurn.skipped =
        Boolean(skipped);

      currentTurn.evaluation =
        analysis.evaluation;

      currentTurn.voiceMetrics =
        analysis.voiceMetrics;

      currentTurn.nextAction =
        analysis.nextAction;

      currentTurn.answeredAt =
        new Date();

      // ==========================================
      // UPDATE INTERVIEW MEMORY
      // ==========================================

      const topic =
        cleanText(currentTurn.topic);

      const focusArea =
        cleanText(
          currentTurn.focusArea
        );

      if (
        topic &&
        !session.topicsCovered.some(
          (item) =>
            cleanText(item)
              .toLowerCase() ===
            topic.toLowerCase()
        )
      ) {
        session.topicsCovered.push(
          topic
        );
      }

      // Technical / skill-based focus areas
      // become part of skillsTested.

      if (
        currentTurn.stage ===
          "Technical" &&
        focusArea &&
        !session.skillsTested.some(
          (item) =>
            cleanText(item)
              .toLowerCase() ===
            focusArea.toLowerCase()
        )
      ) {
        session.skillsTested.push(
          focusArea
        );
      }

      // ==========================================
      // UPDATE OBSERVED STRONG AREAS
      // ==========================================

      const strengths =
        Array.isArray(
          analysis.evaluation
            ?.strengths
        )
          ? analysis.evaluation
              .strengths
          : [];

      for (const strength of strengths) {
        const cleanedStrength =
          cleanText(strength);

        if (
          cleanedStrength &&
          !session.observedStrongAreas.some(
            (item) =>
              cleanText(item)
                .toLowerCase() ===
              cleanedStrength.toLowerCase()
          )
        ) {
          session.observedStrongAreas.push(
            cleanedStrength
          );
        }
      }

      // ==========================================
      // UPDATE OBSERVED WEAK AREAS
      // ==========================================

      const weakAreas =
        Array.isArray(
          analysis.evaluation
            ?.weakAreas
        )
          ? analysis.evaluation
              .weakAreas
          : [];

      for (const weakArea of weakAreas) {
        const cleanedWeakArea =
          cleanText(weakArea);

        if (
          cleanedWeakArea &&
          !session.observedWeakAreas.some(
            (item) =>
              cleanText(item)
                .toLowerCase() ===
              cleanedWeakArea.toLowerCase()
          )
        ) {
          session.observedWeakAreas.push(
            cleanedWeakArea
          );
        }
      }

      // ==========================================
      // GENERATE ONE NEXT QUESTION
      // ==========================================
      //
      // At this point the previous turn already
      // contains:
      //
      // answerTranscript
      // evaluation
      // nextAction
      //
      // Therefore the question service can react
      // to the student's actual previous answer.
      // ==========================================

    // Save the evaluated answer and interview memory
  // before requesting the next AI question.
  // This protects completed answers if Gemini fails.

  await session.save();

  const nextQuestion = hasInterviewTimeExpired(session)
    ? null
    : await generateNextInterviewQuestion(session);

    // ==========================================
  // CHECK TIMER AFTER AI GENERATION
  // ==========================================

  if (hasInterviewTimeExpired(session)) {
    await finalizeAIInterview(session);

    return res.status(200).json({
      message: "AI interview time expired.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
      completedAt: session.completedAt,
      nextAction: "Complete Interview",
    });
  }

  if (!nextQuestion) {
    const fallbackQuestion = generateFallbackAdaptiveQuestion(session);

    if (fallbackQuestion) {
      return res.status(503).json({
        message:
          "Next interview question could not be generated. Please retry your submission.",
        code: "INTERVIEW_QUESTION_RETRY",
        retryable: true,
      });
    }

    await finalizeAIInterview(session);

    return res.status(200).json({
      message: "AI interview completed successfully.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
      nextAction: "Complete Interview",
      completedAt: session.completedAt,
      result: {
        overallScore: session.overallScore,
        technicalScore: session.technicalScore,
        communicationScore: session.communicationScore,
        roleReadinessScore: session.roleReadinessScore,
        strengths: session.strengths,
        weakAreas: session.weakAreas,
        recommendations: session.recommendations,
        communicationSuggestions:
          session.communicationSuggestions,
        answerSuggestions: session.answerSuggestions,
      },
    });
  }

      if (
        !nextQuestion ||
        !nextQuestion.questionText
      ) {
        return res.status(500).json({
          message:
            "Unable to generate the next adaptive interview question.",
        });
      }

      // ==========================================
      // CREATE NEXT TURN
      // ==========================================

      const nextTurnNumber =
        session.conversation.length + 1;

      const nextTurn = {
        turnNumber:
          nextTurnNumber,

        stage:
          nextQuestion.stage,

        questionText:
          nextQuestion.questionText,

          acknowledgement: nextQuestion.acknowledgement || "",

        focusArea:
          nextQuestion.focusArea || "",

        topic:
          nextQuestion.topic || "",

        difficulty:
          nextQuestion.difficulty ||
          "Intermediate",

        questionReason:
          nextQuestion.questionReason ||
          "",

        source:
          nextQuestion.source ||
          "Previous Answer",

        answerTranscript: "",

        skipped: false,

        nextAction: "Pending",

        askedAt: new Date(),
      };

      session.conversation.push(
        nextTurn
      );

      // ==========================================
      // UPDATE CURRENT INTERVIEW STATE
      // ==========================================

      session.currentStage =
        nextTurn.stage;

      session.currentFocusArea =
        nextTurn.focusArea;

      session.currentTopic =
        nextTurn.topic;

      await session.save();

      // ==========================================
      // LIVE INTERVIEW RESPONSE
      // ==========================================
      //
      // Do NOT expose numeric answer scores here.
      // Detailed evaluation belongs in the final
      // interview report.
      // ==========================================

      return res.status(200).json({
        message:
          "Answer processed successfully.",

        sessionId:
          session._id,

        status:
          session.status,

        previousTurn: {
          turnNumber:
            currentTurn.turnNumber,

          skipped:
            currentTurn.skipped,

          nextAction:
            currentTurn.nextAction,
        },

        currentStage:
    session.currentStage,

  acknowledgement:
    cleanText(
      nextQuestion.acknowledgement
    ),

  interviewerDecision: {
    nextAction:
      nextQuestion.nextAction ||
      currentTurn.nextAction,

    stage:
      nextQuestion.stage,

    focusArea:
      nextQuestion.focusArea || "",

    topic:
      nextQuestion.topic || "",
  },

  currentQuestion: {
          turnNumber:
            nextTurn.turnNumber,

          stage:
            nextTurn.stage,

          questionText:
            nextTurn.questionText,
            demoAnswer: await getDemoAnswer(session, nextTurn),

            acknowledgement: nextTurn.acknowledgement || "",

          focusArea:
            nextTurn.focusArea,

          topic:
            nextTurn.topic,

          difficulty:
            nextTurn.difficulty,

          questionReason:
            nextTurn.questionReason,

          source:
            nextTurn.source,
        },
      });
    } catch (error) {
    console.error(
      "Submit AI interview answer error:",
      error
    );

    const errorMessage = String(error.message || "");

    const isQuotaError =
      /\b429\b|quota exceeded|resource_exhausted|rate.limit/i.test(
        errorMessage
      );

    if (isQuotaError) {
      return res.status(429).json({
        message:
          "Gemini AI request limit reached. Your submitted answer is saved if processing completed. Please try again after the quota resets.",
        code: "AI_QUOTA_EXCEEDED",
        retryable: true,
      });
    }

    return res.status(500).json({
      message: "Failed to process AI interview answer",
      error: errorMessage,
    });
  } finally {
    activeInterviewSubmissions.delete(sessionId);
  }
  };
  // ======================================================
  // COMPLETE ADAPTIVE AI INTERVIEW
  // ======================================================
  //
  // POST /api/student/ai-interview/:sessionId/complete
  //
  // Finalizes the current interview and builds the
  // final evaluation/report from answered conversation
  // turns.
  //
  // IMPORTANT:
  // No new question is generated here.
  // ======================================================

  const completeAIInterview = async (
    req,
    res
  ) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      // ==========================================
      // FIND SESSION + VERIFY OWNERSHIP
      // ==========================================

      const session =
        await AIInterviewSession.findOne({
          _id: sessionId,
          user: userId,
        });

      if (!session) {
        return res.status(404).json({
          message:
            "AI interview session not found",
        });
      }

      // ==========================================
      // ALREADY COMPLETED
      // ==========================================

    // ==========================================
  // PREVENT RESTARTING ABANDONED INTERVIEW
  // ==========================================

  if (session.status === "Abandoned") {
    return res.status(400).json({
      message:
        "This AI interview has expired and cannot be restarted. Please create a new interview.",
      sessionId: session._id,
      status: session.status,
      interviewFinished: true,
      currentQuestion: null,
    });
  }

      if (session.status === "Completed") {
        return res.status(200).json({
          message:
            "AI interview has already been completed.",

          sessionId: session._id,

          status: session.status,

          currentStage:
            session.currentStage,

          completedAt:
            session.completedAt,

          result: {
            overallScore:
              session.overallScore,

            technicalScore:
              session.technicalScore,

            communicationScore:
              session.communicationScore,

            relevanceScore:
              session.relevanceScore,

            completenessScore:
              session.completenessScore,

            answerStructureScore:
              session.answerStructureScore,

            resumeKnowledgeScore:
              session.resumeKnowledgeScore,

            roleReadinessScore:
              session.roleReadinessScore,

            strengths:
              session.strengths,

            weakAreas:
              session.weakAreas,

          recommendations:
    session.recommendations,

  communicationSuggestions:
    session.communicationSuggestions || [],

  answerSuggestions:
    session.answerSuggestions || [],
          },
        });
      }

      // ==========================================
      // INTERVIEW MUST BE ACTIVE
      // ==========================================

      if (
        session.status !== "In Progress"
      ) {
        return res.status(400).json({
          message:
            "AI interview is not currently in progress.",
        });
      }

      // ==========================================
      // HANDLE CURRENT UNANSWERED QUESTION
      // ==========================================
      //
      // The user may click End Interview while the
      // latest generated question is still unanswered.
      //
      // We do NOT count that unanswered question in
      // the final result.
      // ==========================================

      if (
        Array.isArray(
          session.conversation
        ) &&
        session.conversation.length > 0
      ) {
        const lastTurn =
          session.conversation[
            session.conversation.length - 1
          ];

        const hasAnswer =
          Boolean(
            cleanText(
              lastTurn.answerTranscript
            )
          ) ||
          Boolean(lastTurn.skipped);

        if (!hasAnswer) {
          session.conversation.pop();
        }
      }

      // ==========================================
      // REQUIRE AT LEAST ONE ANSWER
      // ==========================================

      const answeredTurns =
        session.conversation.filter(
          (turn) =>
            Boolean(
              cleanText(
                turn.answerTranscript
              )
            ) ||
            Boolean(turn.skipped)
        );

      if (!answeredTurns.length) {
        return res.status(400).json({
          message:
            "Answer at least one interview question before completing the interview.",
        });
      }

      // ==========================================
      // BUILD FINAL RESULT
      // ==========================================

    await finalizeAIInterview(session);

  // Build the response from the finalized session.
  // Do not calculate the final evaluation a second time.
  const result = {
    answeredQuestions: session.conversation.filter(
      (turn) =>
        Boolean(cleanText(turn.answerTranscript)) ||
        Boolean(turn.skipped)
    ).length,

    overallScore: session.overallScore,
    technicalScore: session.technicalScore,
    communicationScore: session.communicationScore,
    relevanceScore: session.relevanceScore,
    completenessScore: session.completenessScore,
    answerStructureScore: session.answerStructureScore,
    resumeKnowledgeScore: session.resumeKnowledgeScore,
    roleReadinessScore: session.roleReadinessScore,

    strengths: session.strengths || [],
    weakAreas: session.weakAreas || [],
    recommendations: session.recommendations || [],
    communicationSuggestions: session.communicationSuggestions || [],
    answerSuggestions: session.answerSuggestions || [],

    communicationMetrics: buildAIInterviewResult(session).communicationMetrics,
  };

    
      // ==========================================
      // FINAL REPORT RESPONSE
      // ==========================================

      return res.status(200).json({
        message:
          "AI interview completed successfully.",

        sessionId:
          session._id,

        status:
          session.status,

        currentStage:
          session.currentStage,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,

        target: {
          role:
            session.targetRole,

          company:
            session.targetCompany,
        },

        interviewSummary: {
          answeredQuestions:
            result.answeredQuestions,

          topicsCovered:
            session.topicsCovered,

          skillsTested:
            session.skillsTested,
        },

        result: {
          overallScore:
            result.overallScore,

          technicalScore:
            result.technicalScore,

          communicationScore:
            result.communicationScore,

          relevanceScore:
            result.relevanceScore,

          completenessScore:
            result.completenessScore,

          answerStructureScore:
            result.answerStructureScore,

          resumeKnowledgeScore:
            result.resumeKnowledgeScore,

          roleReadinessScore:
            result.roleReadinessScore,

          strengths:
            result.strengths,

          weakAreas:
            result.weakAreas,

        recommendations:
    result.recommendations,

  communicationSuggestions:
    result.communicationSuggestions || [],

  answerSuggestions:
    result.answerSuggestions || [],

          communicationMetrics:
            result.communicationMetrics,
        },
      });
    } catch (error) {
      console.error(
        "Complete AI interview error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to complete AI interview",

        error:
          error.message,
      });
    }
  };


  // ======================================================
  // GET COMPLETED AI INTERVIEW RESULT
  // ======================================================
  //
  // GET /api/student/ai-interview/:sessionId/result
  //
  // Used when:
  // - Result page is refreshed
  // - Student opens an old interview result
  // - Interview history opens a completed report
  //
  // IMPORTANT:
  // Only the owner of the interview can access it.
  // ======================================================

  const getAIInterviewResult = async (
    req,
    res
  ) => {
    try {
      const userId = req.user.id;

      const { sessionId } = req.params;

      // ==========================================
      // FIND SESSION + VERIFY OWNERSHIP
      // ==========================================

      const session =
        await AIInterviewSession.findOne({
          _id: sessionId,
          user: userId,
        });

      if (!session) {
        return res.status(404).json({
          message:
            "AI interview session not found",
        });
      }


      // ==========================================
  // FINALIZE EXPIRED INTERVIEW
  // ==========================================

  if (
    session.status === "In Progress" &&
    hasInterviewTimeExpired(session)
  ) {
    const hasAnswered = session.conversation.some(
      (turn) =>
        Boolean(cleanText(turn.answerTranscript)) ||
        Boolean(turn.skipped)
    );

    if (!hasAnswered) {
      session.status = "Abandoned";
      session.completedAt = new Date();
      session.currentFocusArea = "";
      session.currentTopic = "";

      await session.save();

      return res.status(200).json({
        message: "Interview expired without submitted answers.",
        sessionId: session._id,
        status: session.status,
        interviewFinished: true,
        result: null,
      });
    }

    await finalizeAIInterview(session);
  }

      // ==========================================
      // RESULT AVAILABLE ONLY AFTER COMPLETION
      // ==========================================

      if (session.status !== "Completed") {
        return res.status(400).json({
          message:
            "AI interview result is available only after the interview is completed.",
        });
      }

      // ==========================================
      // ANSWERED QUESTION COUNT
      // ==========================================

      const answeredQuestions =
        Array.isArray(session.conversation)
          ? session.conversation.filter(
              (turn) =>
                Boolean(
                  cleanText(
                    turn.answerTranscript
                  )
                ) ||
                Boolean(turn.skipped)
            ).length
          : 0;

      // ==========================================
      // COMMUNICATION METRICS
      // ==========================================

      const answeredTurns =
        Array.isArray(session.conversation)
          ? session.conversation.filter(
              (turn) =>
                Boolean(
                  cleanText(
                    turn.answerTranscript
                  )
                ) ||
                Boolean(turn.skipped)
            )
          : [];

      const totalDurationSeconds =
        answeredTurns.reduce(
          (total, turn) =>
            total +
            Number(
              turn.voiceMetrics
                ?.durationSeconds || 0
            ),
          0
        );

      const totalFillerWords =
        answeredTurns.reduce(
          (total, turn) =>
            total +
            Number(
              turn.voiceMetrics
                ?.fillerWordCount || 0
            ),
          0
        );

      const totalLongPauses =
        answeredTurns.reduce(
          (total, turn) =>
            total +
            Number(
              turn.voiceMetrics
                ?.longPauseCount || 0
            ),
          0
        );

      const paceValues =
        answeredTurns
          .map((turn) =>
            Number(
              turn.voiceMetrics
                ?.wordsPerMinute || 0
            )
          )
          .filter(
            (value) =>
              Number.isFinite(value) &&
              value > 0
          );

      const averageWordsPerMinute =
        paceValues.length > 0
          ? Math.round(
              paceValues.reduce(
                (total, value) =>
                  total + value,
                0
              ) / paceValues.length
            )
          : 0;

      // ==========================================
      // RESULT RESPONSE
      // ==========================================

      return res.status(200).json({
        message:
          "AI interview result retrieved successfully.",

        sessionId:
          session._id,

        status:
          session.status,

        currentStage:
          session.currentStage,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,

        candidate: {
          name:
            session.resumeSnapshot
              ?.candidateName || "",
        },

        target: {
          role:
            session.targetRole || "",

          company:
            session.targetCompany || "",
        },

        answerReviews: session.conversation
    .filter(
      (turn) =>
        turn.answeredAt &&
        !turn.skipped &&
        cleanText(turn.answerTranscript)
    )
    .map((turn) => ({
      turnNumber: turn.turnNumber,
      stage: turn.stage,
      question: turn.questionText,
      candidateAnswer: turn.answerTranscript,

      answerQuality:
        turn.evaluation?.answerQuality ||
        "Partially Complete",

      missingKeyPoints:
        turn.evaluation?.missingKeyPoints || [],

      incorrectClaims:
        turn.evaluation?.incorrectClaims || [],

      improvementTips:
        turn.evaluation?.improvementTips || [],

      suggestedAnswer:
        turn.evaluation?.suggestedAnswer || "",

      feedback:
        turn.evaluation?.feedback || "",
    })),

        interviewSummary: {
          answeredQuestions,

          topicsCovered:
            session.topicsCovered || [],

          skillsTested:
            session.skillsTested || [],
        },

        result: {
          overallScore:
            session.overallScore,

          technicalScore:
            session.technicalScore,

          communicationScore:
            session.communicationScore,

          relevanceScore:
            session.relevanceScore,

          completenessScore:
            session.completenessScore,

          answerStructureScore:
            session.answerStructureScore,

          resumeKnowledgeScore:
            session.resumeKnowledgeScore,

          roleReadinessScore:
            session.roleReadinessScore,

          strengths:
            session.strengths || [],

          weakAreas:
            session.weakAreas || [],

        recommendations:
    session.recommendations || [],

  communicationSuggestions:
    session.communicationSuggestions || [],

  answerSuggestions:
    session.answerSuggestions || [],

          communicationMetrics: {
            totalDurationSeconds:
              Math.round(
                totalDurationSeconds
              ),

            averageWordsPerMinute,

            totalFillerWords,

            totalLongPauses,
          },
        },
      });
    } catch (error) {
      console.error(
        "Get AI interview result error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to retrieve AI interview result",

        error:
          error.message,
      });
    }
  };

  // ======================================================
  // GET AI INTERVIEW HISTORY
  // ======================================================
  //
  // GET /api/student/ai-interview/history
  //
  // Returns the student's adaptive AI interview sessions.
  // Most recent interviews are returned first.
  // ======================================================

  const getAIInterviewHistory = async (req, res) => {
    try {
      const userId = req.user.id;

      const sessions = await AIInterviewSession.find({
        user: userId,
      })
        .sort({
          createdAt: -1,
        })
        .select(
          [
            "_id",
            "status",
            "currentStage",
            "targetRole",
            "targetCompany",
            "resumeSnapshot.candidateName",
            "overallScore",
            "technicalScore",
            "communicationScore",
            "roleReadinessScore",
            "topicsCovered",
            "skillsTested",
            "conversation",
            "startedAt",
            "completedAt",
            "createdAt",
          ].join(" ")
        )
        .lean();

      const history = sessions.map((session) => {
        const conversation = Array.isArray(
          session.conversation
        )
          ? session.conversation
          : [];

        const answeredQuestions =
          conversation.filter(
            (turn) =>
              Boolean(
                String(
                  turn.answerTranscript || ""
                ).trim()
              ) || Boolean(turn.skipped)
          ).length;

        return {
          sessionId: session._id,

          candidate: {
            name:
              session.resumeSnapshot
                ?.candidateName || "",
          },

          target: {
            role: session.targetRole || "",
            company:
              session.targetCompany || "",
          },

          status: session.status,
          currentStage:
            session.currentStage || "",

          answeredQuestions,

          topicsCovered:
            session.topicsCovered || [],

          skillsTested:
            session.skillsTested || [],

          scores: {
            overallScore:
              session.overallScore || 0,

            technicalScore:
              session.technicalScore || 0,

            communicationScore:
              session.communicationScore || 0,

            roleReadinessScore:
              session.roleReadinessScore || 0,
          },

          startedAt:
            session.startedAt || null,

          completedAt:
            session.completedAt || null,

          createdAt:
            session.createdAt || null,

          canViewResult:
            session.status === "Completed",
        };
      });

      return res.status(200).json({
        message:
          "AI interview history retrieved successfully.",

        count: history.length,

        interviews: history,
      });
    } catch (error) {
      console.error(
        "Get AI interview history error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to retrieve AI interview history",
        error: error.message,
      });
    }
  };


  // ======================================================
  // EXPORTS
  // ======================================================

  module.exports = {
    uploadAIInterviewResume,
    startAIInterview,
    submitAIInterviewAnswer,
    completeAIInterview,
    getAIInterviewResult,
    getAIInterviewHistory,
  };