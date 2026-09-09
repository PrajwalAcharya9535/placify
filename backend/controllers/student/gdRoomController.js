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
          item.user._id.toString() ===
            userId.toString()
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

    // ==============================
    // ROOM MUST BE WAITING
    // ==============================

    if (session.status !== "Waiting") {
      return res.status(400).json({
        message:
          "Students can only become ready while the GD room is waiting",
      });
    }

    // ==============================
    // FIND PARTICIPANT
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

    if (!participant.isPresent) {
      return res.status(400).json({
        message:
          "You must be present in the room before becoming ready",
      });
    }

    // ==============================
    // ALREADY READY
    // ==============================

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

    // ==============================
    // MARK READY
    // ==============================

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

    // ==============================
    // ROOM MUST BE WAITING
    // ==============================

    if (session.status !== "Waiting") {
      return res.status(400).json({
        message:
          "GD room cannot be started because it is not waiting",
      });
    }

    // ==============================
    // VERIFY REQUESTING STUDENT
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

    if (!participant.isPresent) {
      return res.status(400).json({
        message:
          "You must be present in the GD room to start the round",
      });
    }

    // ==============================
    // GET ACTIVE PARTICIPANTS
    // ==============================

    const activeParticipants =
      getActiveParticipants(session);

    if (activeParticipants.length === 0) {
      return res.status(400).json({
        message:
          "No active participants are available in the GD room",
      });
    }

    // ==============================
    // CHECK ALL STUDENTS READY
    // ==============================

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

    // ==============================
    // START GD ROUND
    // ==============================

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

    // ==============================
    // COMPLETED/CANCELLED CHECK
    // ==============================

    if (
      session.status === "Completed" ||
      session.status === "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "You cannot leave a completed or cancelled GD room",
      });
    }

    // ==============================
    // FIND PARTICIPANT
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
    // ALREADY LEFT
    // ==============================

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

    // ==============================
    // MARK PARTICIPANT LEFT
    // ==============================

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
    // HANDLE COMPLETED ROOM
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
    // CANCELLED ROOM CANNOT COMPLETE
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
    // REQUESTER MUST STILL BE PRESENT
    // ==============================

    if (!participant.isPresent) {
      return res.status(400).json({
        message:
          "You must be present in the GD room to complete the round",
      });
    }

    // ==============================
    // COMPLETE GD ROUND
    // ==============================

    session.status = "Completed";
    session.completedAt = new Date();

    await session.save();

    const activeParticipants =
      getActiveParticipants(session);

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

        currentParticipants:
          activeParticipants.length,

        totalParticipants:
          session.participants.length,

        startedAt:
          session.startedAt,

        completedAt:
          session.completedAt,
      },
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