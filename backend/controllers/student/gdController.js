const crypto = require("crypto");

const GDTopic = require("../../models/GDTopic");
const GDSession = require("../../models/GDSession");

// ==============================
// GENERATE UNIQUE ROOM CODE
// ==============================
const generateUniqueRoomCode = async () => {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = `GD-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    exists = await GDSession.exists({
      roomCode,
    });
  }

  return roomCode;
};

// ==============================
// GET AVAILABLE GD TOPICS
// ==============================
const getGDTopics = async (req, res) => {
  try {
    const topics = await GDTopic.find({
      isActive: true,
    })
      .select(
        "topic description category difficulty targetRole targetCompany"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message:
        "GD topics fetched successfully",
      count: topics.length,
      topics,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch GD topics",
      error: error.message,
    });
  }
};

// ==============================
// CREATE GD VIDEO ROOM
// ==============================
const startGDSession = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      topicId,
      maxParticipants,
      durationMinutes,
      meetingType,
      externalMeetingUrl,
      scheduledAt,
    } = req.body;

    // ==============================
    // VALIDATE TOPIC
    // ==============================

    if (!topicId) {
      return res.status(400).json({
        message:
          "GD topic ID is required",
      });
    }

    const topic = await GDTopic.findOne({
      _id: topicId,
      isActive: true,
    });

    if (!topic) {
      return res.status(404).json({
        message:
          "GD topic not found or inactive",
      });
    }

    // ==============================
    // VALIDATE MAX PARTICIPANTS
    // ==============================

    const participantLimit =
      maxParticipants !== undefined
        ? Number(maxParticipants)
        : 6;

    if (
      !Number.isInteger(
        participantLimit
      ) ||
      participantLimit < 2 ||
      participantLimit > 12
    ) {
      return res.status(400).json({
        message:
          "Maximum participants must be between 2 and 12",
      });
    }

    // ==============================
    // VALIDATE DURATION
    // ==============================

    const gdDuration =
      durationMinutes !== undefined
        ? Number(durationMinutes)
        : 15;

    if (
      !Number.isInteger(gdDuration) ||
      gdDuration < 1 ||
      gdDuration > 120
    ) {
      return res.status(400).json({
        message:
          "GD duration must be between 1 and 120 minutes",
      });
    }

    // ==============================
    // VALIDATE MEETING TYPE
    // ==============================

    const selectedMeetingType =
      meetingType || "Placify";

    if (
      ![
        "Placify",
        "GoogleMeet",
      ].includes(
        selectedMeetingType
      )
    ) {
      return res.status(400).json({
        message:
          "Meeting type must be Placify or GoogleMeet",
      });
    }

    // ==============================
    // VALIDATE GOOGLE MEET URL
    // ==============================

    if (
      selectedMeetingType ===
        "GoogleMeet" &&
      !externalMeetingUrl
    ) {
      return res.status(400).json({
        message:
          "External meeting URL is required for Google Meet sessions",
      });
    }

    // ==============================
    // VALIDATE SCHEDULE DATE
    // ==============================

    let parsedScheduledAt = null;

    if (scheduledAt) {
      parsedScheduledAt =
        new Date(scheduledAt);

      if (
        Number.isNaN(
          parsedScheduledAt.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid scheduled date",
        });
      }
    }

    // ==============================
    // GENERATE ROOM CODE
    // ==============================

    const roomCode =
      await generateUniqueRoomCode();

    // ==============================
    // CREATE GD ROOM
    // ==============================

    const session =
      await GDSession.create({
        roomCode,

        createdBy: userId,

        topicId: topic._id,

        topic: topic.topic,

        category:
          topic.category || "General",

        difficulty:
          topic.difficulty || "Medium",

        targetRole:
          topic.targetRole || "",

        targetCompany:
          topic.targetCompany || "",

        maxParticipants:
          participantLimit,

        durationMinutes:
          gdDuration,

        videoEnabled: true,

        audioEnabled: true,

        participants: [
          {
            user: userId,

            joinedAt:
              new Date(),

            leftAt: null,

            isPresent: true,
          },
        ],

        status: "Waiting",

        meetingType:
          selectedMeetingType,

        externalMeetingUrl:
          selectedMeetingType ===
          "GoogleMeet"
            ? externalMeetingUrl
            : "",

        scheduledAt:
          parsedScheduledAt,

        startedAt: null,

        completedAt: null,
      });

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(201).json({
      message:
        "GD video room created successfully",

      room: {
        _id: session._id,

        roomCode:
          session.roomCode,

        topicId:
          session.topicId,

        topic:
          session.topic,

        category:
          session.category,

        difficulty:
          session.difficulty,

        targetRole:
          session.targetRole,

        targetCompany:
          session.targetCompany,

        maxParticipants:
          session.maxParticipants,

        currentParticipants:
          session.participants.length,

        durationMinutes:
          session.durationMinutes,

        videoEnabled:
          session.videoEnabled,

        audioEnabled:
          session.audioEnabled,

        meetingType:
          session.meetingType,

        externalMeetingUrl:
          session.externalMeetingUrl,

        status:
          session.status,

        scheduledAt:
          session.scheduledAt,

        createdAt:
          session.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create GD video room",
      error: error.message,
    });
  }
};

// ==============================
// JOIN GD VIDEO ROOM
// ==============================
const joinGDSession = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    let { roomCode } = req.body;

    // ==============================
    // VALIDATE ROOM CODE
    // ==============================

    if (!roomCode) {
      return res.status(400).json({
        message:
          "GD room code is required",
      });
    }

    roomCode = roomCode
      .trim()
      .toUpperCase();

    // ==============================
    // FIND ROOM
    // ==============================

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

    // ==============================
    // BLOCK CLOSED ROOMS
    // ==============================

    if (
      session.status ===
        "Completed" ||
      session.status ===
        "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "This GD room is no longer available",
      });
    }

    // ==============================
    // FIND EXISTING PARTICIPANT
    // ==============================

    const existingParticipant =
      session.participants.find(
        (participant) =>
          participant.user.toString() ===
          userId.toString()
      );

    // ==============================
    // ALREADY PRESENT
    // ==============================

    if (
      existingParticipant &&
      existingParticipant.isPresent
    ) {
      return res.status(200).json({
        message:
          "You have already joined this GD room",

        room: {
          _id: session._id,

          roomCode:
            session.roomCode,

          topic:
            session.topic,

          category:
            session.category,

          difficulty:
            session.difficulty,

          maxParticipants:
            session.maxParticipants,

          currentParticipants:
            session.participants.filter(
              (participant) =>
                participant.isPresent
            ).length,

          durationMinutes:
            session.durationMinutes,

          meetingType:
            session.meetingType,

          externalMeetingUrl:
            session.externalMeetingUrl,

          status:
            session.status,
        },
      });
    }

    // ==============================
    // COUNT ACTIVE PARTICIPANTS
    // ==============================

    const currentParticipants =
      session.participants.filter(
        (participant) =>
          participant.isPresent
      ).length;

    // ==============================
    // CHECK ROOM CAPACITY
    // ==============================

    if (
      currentParticipants >=
      session.maxParticipants
    ) {
      return res.status(400).json({
        message:
          "GD room is full",
      });
    }

    // ==============================
    // REJOIN EXISTING PARTICIPANT
    // ==============================

    if (existingParticipant) {
      existingParticipant.isPresent =
        true;

      existingParticipant.joinedAt =
        new Date();

      existingParticipant.leftAt =
        null;
    } else {
      // ==============================
      // ADD NEW PARTICIPANT
      // ==============================

      session.participants.push({
        user: userId,

        joinedAt:
          new Date(),

        leftAt: null,

        isPresent: true,
      });
    }

    // ==============================
    // SAVE SESSION
    // ==============================

    await session.save();

    const activeParticipantCount =
      session.participants.filter(
        (participant) =>
          participant.isPresent
      ).length;

    // ==============================
    // RESPONSE
    // ==============================

    return res.status(200).json({
      message:
        "Joined GD video room successfully",

      room: {
        _id: session._id,

        roomCode:
          session.roomCode,

        topic:
          session.topic,

        category:
          session.category,

        difficulty:
          session.difficulty,

        targetRole:
          session.targetRole,

        targetCompany:
          session.targetCompany,

        maxParticipants:
          session.maxParticipants,

        currentParticipants:
          activeParticipantCount,

        durationMinutes:
          session.durationMinutes,

        videoEnabled:
          session.videoEnabled,

        audioEnabled:
          session.audioEnabled,

        meetingType:
          session.meetingType,

        externalMeetingUrl:
          session.externalMeetingUrl,

        status:
          session.status,

        scheduledAt:
          session.scheduledAt,
      },
    });
  } catch (error) {
    console.error(
      "Join GD room error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to join GD video room",
      error: error.message,
    });
  }
};

module.exports = {
  getGDTopics,
  startGDSession,
  joinGDSession,
};