const GDSession = require("../../models/GDSession");

// Get logged-in student's GD history
const getGDHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await GDSession.find({
      "participants.user": userId,
      status: "Completed",
    })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    const history = sessions.map((session) => {
      const participant = session.participants.find(
        (item) => item.user.toString() === userId.toString()
      );

      return {
        sessionId: session._id,
        roomCode: session.roomCode,

        topic: session.topic,
        category: session.category,
        difficulty: session.difficulty,

        targetRole: session.targetRole || "",
        targetCompany: session.targetCompany || "",

        durationMinutes: session.durationMinutes,

        meetingType: session.meetingType,

        startedAt: session.startedAt,
        completedAt: session.completedAt,

        contributionCount:
          participant?.contributionCount || 0,

        speakingTimeSeconds:
          participant?.speakingTimeSeconds || 0,

        contributed: Boolean(
          participant?.transcript?.trim()
        ),

        overallScore:
          participant?.overallScore || 0,

        communicationScore:
          participant?.communicationScore || 0,

        relevanceScore:
          participant?.relevanceScore || 0,

        structureScore:
          participant?.structureScore || 0,

        participationScore:
          participant?.participationScore || 0,
      };
    });

    return res.status(200).json({
      message: "GD history fetched successfully",
      totalSessions: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Get GD history error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch GD history",
      error: error.message,
    });
  }
};

// Get one completed GD result for logged-in student
const getGDResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const roomCode = req.params.roomCode
      ?.trim()
      .toUpperCase();

    if (!roomCode) {
      return res.status(400).json({
        message: "Room code is required",
      });
    }

    const session = await GDSession.findOne({
      roomCode,
      "participants.user": userId,
    })
      .populate(
        "participants.user",
        "name email"
      )
      .lean();

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    if (session.status !== "Completed") {
      return res.status(400).json({
        message:
          "GD result is available only after the round is completed",
      });
    }

    const participant = session.participants.find(
      (item) =>
        item.user?._id?.toString() ===
        userId.toString()
    );

    if (!participant) {
      return res.status(403).json({
        message:
          "You are not a participant in this GD room",
      });
    }

    const participantResults =
      session.participants.map((item) => ({
        user: item.user?._id || item.user,
        name: item.user?.name || "Student",

        contributed: Boolean(
          item.transcript?.trim()
        ),

        contributionCount:
          item.contributionCount || 0,

        speakingTimeSeconds:
          item.speakingTimeSeconds || 0,

        overallScore:
          item.overallScore || 0,
      }));

    return res.status(200).json({
      message: "GD result fetched successfully",

      result: {
        sessionId: session._id,
        roomCode: session.roomCode,

        topic: session.topic,
        category: session.category,
        difficulty: session.difficulty,

        targetRole: session.targetRole || "",
        targetCompany:
          session.targetCompany || "",

        durationMinutes:
          session.durationMinutes,

        meetingType: session.meetingType,

        startedAt: session.startedAt,
        completedAt: session.completedAt,

        transcript:
          participant.transcript || "",

        contributionCount:
          participant.contributionCount || 0,

        speakingTimeSeconds:
          participant.speakingTimeSeconds || 0,

        overallScore:
          participant.overallScore || 0,

        communicationScore:
          participant.communicationScore || 0,

        relevanceScore:
          participant.relevanceScore || 0,

        structureScore:
          participant.structureScore || 0,

        participationScore:
          participant.participationScore || 0,

        strengths:
          participant.strengths || [],

        weakAreas:
          participant.weakAreas || [],

        feedback:
          participant.feedback || [],

        recommendations:
          participant.recommendations || [],

        participantResults,
      },
    });
  } catch (error) {
    console.error(
      "Get GD result error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch GD result",
      error: error.message,
    });
  }
};

module.exports = {
  getGDHistory,
  getGDResult,
};