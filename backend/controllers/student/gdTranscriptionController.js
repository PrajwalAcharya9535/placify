const fs = require("fs");

const GDSession = require("../../models/GDSession");

const {
  transcribeInterviewAudio,
} = require("../../services/interviewTranscriptionService");

// ========================================
// TRANSCRIBE GD PARTICIPANT AUDIO
// ========================================

const transcribeGDAudio = async (
  req,
  res
) => {
  let uploadedFilePath = null;

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
    // VALIDATE AUDIO FILE
    // ====================================

    if (!req.file) {
      return res.status(400).json({
        message:
          "GD audio file is required",
      });
    }

    uploadedFilePath = req.file.path;

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
    // BLOCK CLOSED SESSION
    // ====================================

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "This GD session is no longer accepting audio"
      });
    }

    // ====================================
    // VERIFY PARTICIPANT
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

    if (!participant.isPresent) {
      return res.status(403).json({
        message:
          "You are not currently present in this GD room",
      });
    }

    // ====================================
    // TRANSCRIBE USING FASTER-WHISPER
    // ====================================

    const transcriptionResult =
      await transcribeInterviewAudio(
        uploadedFilePath
      );

    const transcript =
      transcriptionResult.transcript
        ?.trim();

    if (!transcript) {
      return res.status(400).json({
        message:
          "No speech could be detected in the GD audio",
      });
    }

    // ====================================
    // APPEND PARTICIPANT TRANSCRIPT
    // ====================================

    if (participant.transcript) {
      participant.transcript =
        `${participant.transcript}\n${transcript}`;
    } else {
      participant.transcript =
        transcript;
    }

    // Each uploaded speaking segment counts
    // as one contribution.
    participant.contributionCount =
      (participant.contributionCount ||
        0) + 1;

    // ====================================
    // APPEND SESSION TRANSCRIPT
    // ====================================

    const speakerLabel =
      req.user.name || "Student";

    const transcriptEntry =
      `${speakerLabel}: ${transcript}`;

    if (session.fullTranscript) {
      session.fullTranscript =
        `${session.fullTranscript}\n${transcriptEntry}`;
    } else {
      session.fullTranscript =
        transcriptEntry;
    }

    // ====================================
    // SAVE SESSION
    // ====================================

    await session.save();

    // ====================================
    // RESPONSE
    // ====================================

    return res.status(200).json({
      message:
        "GD audio transcribed successfully",

      roomCode:
        session.roomCode,

      participant: {
        userId,
        name:
          req.user.name || "Student",

        transcript,

        fullParticipantTranscript:
          participant.transcript,

        contributionCount:
          participant.contributionCount,
      },

      transcription: {
        language:
          transcriptionResult.language,

        languageProbability:
          transcriptionResult
            .languageProbability,
      },
    });
  } catch (error) {
    console.error(
      "GD audio transcription error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to transcribe GD audio",
      error: error.message,
    });
  } finally {
    // ====================================
    // DELETE TEMPORARY AUDIO FILE
    // ====================================

    if (
      uploadedFilePath &&
      fs.existsSync(uploadedFilePath)
    ) {
      try {
        fs.unlinkSync(
          uploadedFilePath
        );
      } catch (cleanupError) {
        console.error(
          "GD audio cleanup error:",
          cleanupError.message
        );
      }
    }
  }
};

module.exports = {
  transcribeGDAudio,
};