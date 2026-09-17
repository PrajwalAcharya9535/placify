const GDSession = require("../../models/GDSession");

// ==============================
// HELPER: GET ACTIVE PARTICIPANTS
// ==============================

const getActiveParticipants = (session) => {
  return session.participants.filter(
    (participant) => participant.isPresent
  );
};

// ==============================
// HELPER: CHECK PARTICIPANT EVALUATION
// ==============================

const hasParticipantEvaluation = (
  participant
) => {
  /*
    A participant with no transcript did not
    make a recorded contribution.

    A participant with a transcript must have
    been evaluated before the room is completed.
  */

  if (
    !participant.transcript ||
    participant.transcript.trim().length === 0
  ) {
    return true;
  }

  return (
    Number(participant.overallScore || 0) > 0
  );
};

// ==============================
// GET GD ROOM DETAILS
// ==============================

const getGDRoomDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const session = await GDSession.findOne({
      roomCode,
    }).populate(
      "participants.user",
      "name email"
    );

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    // ==============================
    // VERIFY STUDENT BELONGS TO ROOM
    // ==============================

    const participant =
      session.participants.find(
        (item) =>
          item.user &&
          (
            item.user._id
              ? item.user._id.toString()
              : item.user.toString()
          ) === userId.toString()
      );

    if (!participant) {
      return res.status(403).json({
        message:
          "You are not a participant of this GD room",
      });
    }

    const activeParticipants =
      getActiveParticipants(session);

    const readyParticipants =
      activeParticipants.filter(
        (item) => item.isReady
      );

    return res.status(200).json({
      message:
        "GD room details fetched successfully",

      room: {
        _id: session._id,
        roomCode: session.roomCode,
        topic: session.topic,
        category: session.category,
        difficulty: session.difficulty,
        targetRole: session.targetRole,
        targetCompany:
          session.targetCompany,
        status: session.status,
        durationMinutes:
          session.durationMinutes,
        meetingType:
          session.meetingType,
        videoEnabled:
          session.videoEnabled,
        audioEnabled:
          session.audioEnabled,
        maxParticipants:
          session.maxParticipants,

        currentParticipants:
          activeParticipants.length,

        readyParticipants:
          readyParticipants.length,

        allReady:
          activeParticipants.length > 0 &&
          readyParticipants.length ===
            activeParticipants.length,

        scheduledAt:
          session.scheduledAt,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,

        participants:
          session.participants.map(
            (item) => ({
              user:
                item.user?._id ||
                item.user,

              name:
                item.user?.name || "",

              email:
                item.user?.email || "",

              isPresent:
                item.isPresent,

              isReady:
                item.isReady,

              joinedAt:
                item.joinedAt,

              readyAt:
                item.readyAt,

              leftAt:
                item.leftAt,

              contributionCount:
                item.contributionCount,

              speakingTimeSeconds:
                item.speakingTimeSeconds,

              evaluated:
                Boolean(
                  item.transcript &&
                    item.transcript.trim()
                      .length > 0 &&
                    Number(
                      item.overallScore || 0
                    ) > 0
                ),
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch GD room details",
      error: error.message,
    });
  }
};

// ==============================
// MARK STUDENT READY
// ==============================

const markGDParticipantReady = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const session =
      await GDSession.findOne({
        roomCode,
      });

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    if (session.status !== "Waiting") {
      return res.status(400).json({
        message:
          "Students can only become ready while the GD room is waiting",
      });
    }

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
      return res.status(400).json({
        message:
          "You must be present in the room before becoming ready",
      });
    }

    if (participant.isReady) {
      const activeParticipants =
        getActiveParticipants(session);

      const readyCount =
        activeParticipants.filter(
          (item) => item.isReady
        ).length;

      return res.status(200).json({
        message:
          "You are already ready",

        status: session.status,

        readyStatus: {
          readyParticipants:
            readyCount,

          totalParticipants:
            activeParticipants.length,

          allReady:
            activeParticipants.length >
              0 &&
            readyCount ===
              activeParticipants.length,
        },
      });
    }

    participant.isReady = true;
    participant.readyAt = new Date();

    await session.save();

    const activeParticipants =
      getActiveParticipants(session);

    const readyCount =
      activeParticipants.filter(
        (item) => item.isReady
      ).length;

    return res.status(200).json({
      message:
        "You are ready for the GD round",

      status: session.status,

      readyStatus: {
        readyParticipants:
          readyCount,

        totalParticipants:
          activeParticipants.length,

        allReady:
          activeParticipants.length >
            0 &&
          readyCount ===
            activeParticipants.length,
      },
    });
  } catch (error) {
    console.error(
      "GD ready error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update GD ready status",
      error: error.message,
    });
  }
};

// ==============================
// START GD ROOM
// ==============================

const startGDRoom = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const session =
      await GDSession.findOne({
        roomCode,
      });

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    if (session.status !== "Waiting") {
      return res.status(400).json({
        message:
          "GD room cannot be started because it is not waiting",
      });
    }

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
      return res.status(400).json({
        message:
          "You must be present in the GD room to start the round",
      });
    }

    const activeParticipants =
      getActiveParticipants(session);

    if (activeParticipants.length === 0) {
      return res.status(400).json({
        message:
          "No active participants are available in the GD room",
      });
    }

    const readyParticipants =
      activeParticipants.filter(
        (item) => item.isReady
      );

    const allReady =
      readyParticipants.length ===
      activeParticipants.length;

    if (!allReady) {
      return res.status(400).json({
        message:
          "GD room cannot start until all active participants are ready",

        readyStatus: {
          readyParticipants:
            readyParticipants.length,

          totalParticipants:
            activeParticipants.length,

          allReady: false,
        },
      });
    }

    session.status = "Started";
    session.startedAt = new Date();

    await session.save();

    return res.status(200).json({
      message:
        "GD round started successfully",

      room: {
        _id: session._id,
        roomCode: session.roomCode,
        topic: session.topic,
        status: session.status,

        durationMinutes:
          session.durationMinutes,

        participants:
          activeParticipants.length,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,
      },
    });
  } catch (error) {
    console.error(
      "Start GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to start GD room",
      error: error.message,
    });
  }
};

// ==============================
// LEAVE GD ROOM
// ==============================

const leaveGDRoom = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const session =
      await GDSession.findOne({
        roomCode,
      });

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "You cannot leave a completed or cancelled GD room",
      });
    }

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
      return res.status(200).json({
        message:
          "You have already left the GD room",

        room: {
          roomCode:
            session.roomCode,

          status:
            session.status,

          currentParticipants:
            getActiveParticipants(
              session
            ).length,
        },
      });
    }

    participant.isPresent = false;
    participant.isReady = false;
    participant.leftAt = new Date();

    await session.save();

    const activeParticipants =
      getActiveParticipants(session);

    return res.status(200).json({
      message:
        "You left the GD room successfully",

      room: {
        roomCode:
          session.roomCode,

        status:
          session.status,

        currentParticipants:
          activeParticipants.length,

        leftAt:
          participant.leftAt,
      },
    });
  } catch (error) {
    console.error(
      "Leave GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to leave GD room",
      error: error.message,
    });
  }
};

// ==============================
// COMPLETE GD ROOM
// ==============================

const completeGDRoom = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const roomCode = req.params.roomCode
      .trim()
      .toUpperCase();

    const session =
      await GDSession.findOne({
        roomCode,
      });

    if (!session) {
      return res.status(404).json({
        message: "GD room not found",
      });
    }

    // ==============================
    // VERIFY STUDENT BELONGS TO ROOM
    // ==============================

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

    // ==============================
    // HANDLE ALREADY COMPLETED
    // ==============================

    if (session.status === "Completed") {
      return res.status(200).json({
        message:
          "GD round is already completed",

        room: {
          _id: session._id,
          roomCode: session.roomCode,
          topic: session.topic,
          status: session.status,
          startedAt:
            session.startedAt,
          completedAt:
            session.completedAt,
        },
      });
    }

    // ==============================
    // CANCELLED CHECK
    // ==============================

    if (session.status === "Cancelled") {
      return res.status(400).json({
        message:
          "A cancelled GD room cannot be completed",
      });
    }

    // ==============================
    // ROUND MUST HAVE STARTED
    // ==============================

    if (
      session.status !== "Started" &&
      session.status !== "In Progress"
    ) {
      return res.status(400).json({
        message:
          "GD round must be started before it can be completed",
      });
    }

    // ==============================
    // REQUESTER MUST BE PRESENT
    // ==============================

    if (!participant.isPresent) {
      return res.status(400).json({
        message:
          "You must be present in the GD room to complete the round",
      });
    }

    // ==============================
    // ONLY ROOM CREATOR CAN COMPLETE
    // ==============================

    if (
      session.createdBy.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the GD room creator can complete the round",
      });
    }

    // ==============================
    // CHECK PARTICIPANT EVALUATIONS
    // ==============================

    const participantsWithTranscript =
      session.participants.filter(
        (item) =>
          item.transcript &&
          item.transcript.trim().length > 0
      );

    if (
      participantsWithTranscript.length ===
      0
    ) {
      return res.status(400).json({
        message:
          "GD round cannot be completed because no participant contributions were recorded",
      });
    }

    const pendingEvaluations =
      participantsWithTranscript.filter(
        (item) =>
          !hasParticipantEvaluation(item)
      );

    if (pendingEvaluations.length > 0) {
      return res.status(400).json({
        message:
          "GD round cannot be completed until all recorded participant contributions are evaluated",

        pendingEvaluations:
          pendingEvaluations.map(
            (item) =>
              item.user.toString()
          ),
      });
    }

    // ==============================
    // COMPLETE GD ROUND
    // ==============================

    session.status = "Completed";
    session.completedAt = new Date();

    await session.save();

    // ==============================
    // SAFE RESULT SUMMARY
    // ==============================

    const participantResults =
      session.participants.map(
        (item) => ({
          user: item.user,

          contributed:
            Boolean(
              item.transcript &&
                item.transcript.trim()
                  .length > 0
            ),

          contributionCount:
            item.contributionCount,

          speakingTimeSeconds:
            item.speakingTimeSeconds,

          overallScore:
            item.overallScore,

          communicationScore:
            item.communicationScore,

          relevanceScore:
            item.relevanceScore,

          structureScore:
            item.structureScore,

          participationScore:
            item.participationScore,

          strengths:
            item.strengths,

          weakAreas:
            item.weakAreas,

          feedback:
            item.feedback,

          recommendations:
            item.recommendations,
        })
      );

    return res.status(200).json({
      message:
        "GD round completed successfully",

      room: {
        _id: session._id,
        roomCode: session.roomCode,
        topic: session.topic,
        status: session.status,

        durationMinutes:
          session.durationMinutes,

        totalParticipants:
          session.participants.length,

        evaluatedParticipants:
          participantsWithTranscript.length,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,
      },

      participantResults,
    });
  } catch (error) {
    console.error(
      "Complete GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to complete GD room",
      error: error.message,
    });
  }
};

module.exports = {
  getGDRoomDetails,
  markGDParticipantReady,
  startGDRoom,
  leaveGDRoom,
  completeGDRoom,
};