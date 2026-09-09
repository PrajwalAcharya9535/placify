const fs = require("fs");

const InterviewSession = require("../../models/InterviewSession");
const InterviewQuestion = require("../../models/InterviewQuestion");
const InterviewAnswer = require("../../models/InterviewAnswer");

const {
  evaluateInterviewAnswer,
} = require("../../services/interviewEvaluationService");

const {
  transcribeInterviewAudio,
} = require("../../services/interviewTranscriptionService");

// ==============================
// DELETE AUDIO SAFELY
// ==============================

const deleteAudioFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error(
          "Temporary Audio Delete Error:",
          error.message
        );
      }
    });
  }
};

// ==============================
// SUBMIT VOICE INTERVIEW ANSWER
// ==============================

const submitVoiceInterviewAnswer = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      sessionId,
      questionId,
    } = req.params;

    // ==============================
    // CHECK AUDIO FILE
    // ==============================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Voice recording is required",
      });
    }

    // ==============================
    // CHECK INTERVIEW SESSION
    // ==============================

    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: userId,
    });

    if (!session) {
      deleteAudioFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    if (session.status === "Completed") {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Interview session is already completed",
      });
    }

    // ==============================
    // CHECK QUESTION
    // ==============================

    const question = await InterviewQuestion.findOne({
      _id: questionId,
      isActive: true,
    });

    if (!question) {
      deleteAudioFile(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    // ==============================
    // VALIDATE INTERVIEW TYPE
    // ==============================

    if (
      question.interviewType !==
      session.interviewType
    ) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Question does not belong to this interview type",
      });
    }

    // ==============================
    // VALIDATE DIFFICULTY
    // ==============================

    if (
      question.difficulty !==
      session.difficulty
    ) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Question difficulty does not match interview session",
      });
    }

    // ==============================
    // VALIDATE ROLE
    // ==============================

    if (
      question.targetRole &&
      session.targetRole &&
      question.targetRole.toLowerCase() !==
        session.targetRole.toLowerCase()
    ) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Question does not belong to this target role",
      });
    }

    // ==============================
    // VALIDATE COMPANY
    // ==============================

    if (
      question.targetCompany &&
      session.targetCompany &&
      question.targetCompany.toLowerCase() !==
        session.targetCompany.toLowerCase()
    ) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Question does not belong to this target company",
      });
    }

    // ==============================
    // DUPLICATE ANSWER CHECK
    // ==============================

    const existingAnswer =
      await InterviewAnswer.findOne({
        user: userId,
        session: sessionId,
        question: questionId,
      });

    if (existingAnswer) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "This question has already been answered",
      });
    }

    // ==============================
    // TRANSCRIBE VOICE
    // ==============================

    const transcriptionResult =
      await transcribeInterviewAudio(
        req.file.path
      );

    const transcript =
      transcriptionResult.transcript?.trim();

    if (!transcript) {
      deleteAudioFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "No speech could be detected in the voice recording",
      });
    }

    // ==============================
    // EVALUATE TRANSCRIPT
    // ==============================

    const evaluation =
      evaluateInterviewAnswer({
        answerText: transcript,
        question,
      });

    // ==============================
    // SAVE VOICE ANSWER
    // ==============================

    const answer =
      await InterviewAnswer.create({
        user: userId,
        session: sessionId,
        question: questionId,

        answerText: transcript,
        answerType: "Voice",
        transcript,

        score:
          evaluation.score,

        matchedKeywords:
          evaluation.matchedKeywords || [],

        missingKeywords:
          evaluation.missingKeywords || [],

        strengths:
          evaluation.strengths || [],

        weakAreas:
          evaluation.weakAreas || [],

        feedback:
          evaluation.feedback || [],

        communicationScore:
          evaluation.communicationScore || 0,

        relevanceScore:
          evaluation.relevanceScore || 0,

        completenessScore:
          evaluation.completenessScore || 0,
      });

    // ==============================
    // UPDATE SESSION PROGRESS
    // ==============================

    const answeredQuestions =
      await InterviewAnswer.countDocuments({
        user: userId,
        session: sessionId,
      });

    session.answeredQuestions =
      answeredQuestions;

    if (session.status === "Started") {
      session.status = "In Progress";
    }

    await session.save();

    // ==============================
    // DELETE TEMPORARY AUDIO
    // ==============================

    deleteAudioFile(req.file.path);

    // ==============================
    // CALCULATE ANSWER PERCENTAGE
    // ==============================

    const maxScore =
      Number(question.maxScore) || 10;

    const percentage = Math.round(
      (answer.score / maxScore) * 100
    );

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(201).json({
      success: true,

      message:
        "Voice interview answer submitted successfully",

      answer: {
        answerId:
          answer._id,

        questionId:
          question._id,

        answerType:
          answer.answerType,

        transcript:
          answer.transcript,

        language:
          transcriptionResult.language,

        languageProbability:
          transcriptionResult.languageProbability,

        score:
          answer.score,

        maxScore,

        percentage,

        relevanceScore:
          answer.relevanceScore,

        completenessScore:
          answer.completenessScore,

        communicationScore:
          answer.communicationScore,

        matchedKeywords:
          answer.matchedKeywords,

        missingKeywords:
          answer.missingKeywords,

        strengths:
          answer.strengths,

        weakAreas:
          answer.weakAreas,

        feedback:
          answer.feedback,
      },

      session: {
        status:
          session.status,

        totalQuestions:
          session.totalQuestions,

        answeredQuestions:
          session.answeredQuestions,
      },
    });
  } catch (error) {
    deleteAudioFile(req.file?.path);

    console.error(
      "Voice Interview Answer Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to process voice interview answer",

      error:
        error.message,
    });
  }
};

module.exports = {
  submitVoiceInterviewAnswer,
};