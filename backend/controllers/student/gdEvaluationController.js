const GDSession = require("../../models/GDSession");
const GDTopic = require("../../models/GDTopic");

const {
  evaluateGDParticipant,
} = require("../../services/gdEvaluationService");

// ========================================
// EVALUATE CURRENT GD PARTICIPANT
// ========================================

const evaluateGDParticipantPerformance =
  async (req, res) => {
    try {
      const userId = req.user.id;

      let { roomCode } = req.params;

      // ====================================
      // VALIDATE ROOM CODE
      // ====================================

      if (!roomCode) {
        return res.status(400).json({
          message:
            "GD room code is required",
        });
      }

      roomCode = roomCode
        .trim()
        .toUpperCase();

      // ====================================
      // FIND GD SESSION
      // ====================================

      const session =
        await GDSession.findOne({
          roomCode,
        });

      if (!session) {
        return res.status(404).json({
          message:
            "GD room not found",
        });
      }

      // ====================================
      // FIND CURRENT PARTICIPANT
      // ====================================

      const participant =
        session.participants.find(
          (item) =>
            item.user.toString() ===
            userId.toString()
        );

      if (!participant) {
        return res.status(403).json({
          message:
            "You are not a participant of this GD room",
        });
      }

      // ====================================
      // REQUIRE TRANSCRIPT
      // ====================================

      const transcript =
        participant.transcript?.trim();

      if (!transcript) {
        return res.status(400).json({
          message:
            "No GD transcript is available for evaluation",
        });
      }

      // ====================================
      // LOAD GD TOPIC EVALUATION DATA
      // ====================================

      let expectedKeywords = [];
      let evaluationPoints = [];

      if (session.topicId) {
        const gdTopic =
          await GDTopic.findById(
            session.topicId
          ).select(
            "expectedKeywords evaluationPoints"
          );

        if (gdTopic) {
          expectedKeywords =
            Array.isArray(
              gdTopic.expectedKeywords
            )
              ? gdTopic.expectedKeywords
              : [];

          evaluationPoints =
            Array.isArray(
              gdTopic.evaluationPoints
            )
              ? gdTopic.evaluationPoints
              : [];
        }
      }

      // ====================================
      // RUN GD EVALUATION
      // ====================================

      const evaluation =
        evaluateGDParticipant({
          transcript,

          topic:
            session.topic,

          expectedKeywords,

          evaluationPoints,

          speakingTimeSeconds:
            participant
              .speakingTimeSeconds ||
            0,

          contributionCount:
            participant
              .contributionCount ||
            0,
        });

      // ====================================
      // SAVE INDIVIDUAL SCORES
      // ====================================

      participant.overallScore =
        evaluation.overallScore;

      participant.communicationScore =
        evaluation.communicationScore;

      participant.relevanceScore =
        evaluation.relevanceScore;

      participant.structureScore =
        evaluation.structureScore;

      participant.participationScore =
        evaluation.participationScore;

      participant.strengths =
        evaluation.strengths;

      participant.weakAreas =
        evaluation.weakAreas;

      participant.feedback =
        evaluation.feedback;

      participant.recommendations =
        evaluation.recommendations;

      await session.save();

      // ====================================
      // RESPONSE
      // ====================================

      return res.status(200).json({
        message:
          "GD participant evaluated successfully",

        roomCode:
          session.roomCode,

        topic:
          session.topic,

        evaluation: {
          overallScore:
            participant.overallScore,

          communicationScore:
            participant
              .communicationScore,

          relevanceScore:
            participant.relevanceScore,

          structureScore:
            participant.structureScore,

          participationScore:
            participant
              .participationScore,

          strengths:
            participant.strengths,

          weakAreas:
            participant.weakAreas,

          feedback:
            participant.feedback,

          recommendations:
            participant
              .recommendations,

          matchedKeywords:
            evaluation
              .matchedKeywords,

          missingKeywords:
            evaluation
              .missingKeywords,

          statistics:
            evaluation.statistics,
        },
      });
    } catch (error) {
      console.error(
        "GD participant evaluation error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to evaluate GD participant",
        error: error.message,
      });
    }
  };

module.exports = {
  evaluateGDParticipantPerformance,
};