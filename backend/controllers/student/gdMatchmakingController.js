const crypto = require("crypto");

const GDQueue = require("../../models/GDQueue");
const GDTopic = require("../../models/GDTopic");
const GDSession = require("../../models/GDSession");

// ==============================
// MATCHMAKING SETTINGS
// ==============================

// Realistic GD practice:
// minimum 4 students to begin,
// maximum 6 students in one room.
const MIN_PARTICIPANTS = 4;
const MAX_PARTICIPANTS = 6;

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
// GET RANDOM GD TOPIC
// ==============================
const getRandomGDTopic = async (
  difficulty
) => {
  // First try to find a topic matching
  // the student's difficulty.
  let topics = await GDTopic.aggregate([
    {
      $match: {
        isActive: true,
        difficulty,
      },
    },
    {
      $sample: {
        size: 1,
      },
    },
  ]);

  // If no topic exists for that difficulty,
  // use any active GD topic.
  if (topics.length === 0) {
    topics = await GDTopic.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $sample: {
          size: 1,
        },
      },
    ]);
  }

  return topics.length > 0
    ? topics[0]
    : null;
};

// ==============================
// JOIN GD MATCHMAKING QUEUE
// ==============================
const joinGDQueue = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const {
      difficulty = "Medium",
      targetRole = "",
      targetCompany = "",
    } = req.body;

    // ==============================
    // VALIDATE DIFFICULTY
    // ==============================

    if (
      ![
        "Easy",
        "Medium",
        "Hard",
      ].includes(difficulty)
    ) {
      return res.status(400).json({
        message:
          "Difficulty must be Easy, Medium, or Hard",
      });
    }

    // ==============================
    // CHECK EXISTING QUEUE ENTRY
    // ==============================

    let queueEntry =
      await GDQueue.findOne({
        user: userId,
      });

    // ==============================
    // ALREADY WAITING
    // ==============================

    if (
      queueEntry &&
      queueEntry.status === "Waiting"
    ) {
      const waitingCount =
        await GDQueue.countDocuments({
          status: "Waiting",
          difficulty:
            queueEntry.difficulty,
        });

      return res.status(200).json({
        message:
          "You are already waiting for a GD match",

        status: "Waiting",

        queue: {
          difficulty:
            queueEntry.difficulty,

          targetRole:
            queueEntry.targetRole,

          targetCompany:
            queueEntry.targetCompany,

          joinedQueueAt:
            queueEntry.joinedQueueAt,

          waitingStudents:
            waitingCount,

          minimumRequired:
            MIN_PARTICIPANTS,
        },
      });
    }

    // ==============================
    // EXISTING MATCH
    // ==============================

    if (
      queueEntry &&
      queueEntry.status === "Matched" &&
      queueEntry.matchedSession
    ) {
      const existingSession =
        await GDSession.findById(
          queueEntry.matchedSession
        );

      if (
        existingSession &&
        ![
          "Completed",
          "Cancelled",
        ].includes(
          existingSession.status
        )
      ) {
        return res.status(200).json({
          message:
            "You already have an active GD match",

          status: "Matched",

          room: {
            _id:
              existingSession._id,

            roomCode:
              existingSession.roomCode,

            topic:
              existingSession.topic,

            category:
              existingSession.category,

            difficulty:
              existingSession.difficulty,

            currentParticipants:
              existingSession
                .participants.length,

            maxParticipants:
              existingSession
                .maxParticipants,

            durationMinutes:
              existingSession
                .durationMinutes,

            status:
              existingSession.status,

            meetingType:
              existingSession.meetingType,
          },
        });
      }
    }

    // ==============================
    // ADD / RESET QUEUE ENTRY
    // ==============================

    if (queueEntry) {
      queueEntry.difficulty =
        difficulty;

      queueEntry.targetRole =
        targetRole;

      queueEntry.targetCompany =
        targetCompany;

      queueEntry.status =
        "Waiting";

      queueEntry.matchedSession =
        null;

      queueEntry.joinedQueueAt =
        new Date();

      queueEntry.matchedAt =
        null;

      await queueEntry.save();
    } else {
      queueEntry =
        await GDQueue.create({
          user: userId,

          difficulty,

          targetRole,

          targetCompany,

          status:
            "Waiting",

          matchedSession:
            null,

          joinedQueueAt:
            new Date(),

          matchedAt:
            null,
        });
    }

    // ==============================
    // FIND WAITING STUDENTS
    // ==============================

    const waitingStudents =
      await GDQueue.find({
        status: "Waiting",
        difficulty,
      })
        .sort({
          joinedQueueAt: 1,
        })
        .limit(MAX_PARTICIPANTS);

    // ==============================
    // NOT ENOUGH STUDENTS YET
    // ==============================

    if (
      waitingStudents.length <
      MIN_PARTICIPANTS
    ) {
      return res.status(200).json({
        message:
          "Added to GD matchmaking queue",

        status: "Waiting",

        queue: {
          difficulty,

          waitingStudents:
            waitingStudents.length,

          minimumRequired:
            MIN_PARTICIPANTS,

          studentsNeeded:
            MIN_PARTICIPANTS -
            waitingStudents.length,
        },
      });
    }

    // ==============================
    // SELECT GD TOPIC
    // ==============================

    const topic =
      await getRandomGDTopic(
        difficulty
      );

    if (!topic) {
      return res.status(404).json({
        message:
          "No active GD topics are available",
      });
    }

    // ==============================
    // GENERATE PRIVATE ROOM
    // ==============================

    const roomCode =
      await generateUniqueRoomCode();

    const participantIds =
      waitingStudents.map(
        (student) => student.user
      );

    // ==============================
    // CREATE PLACIFY GD ROOM
    // ==============================

    const session =
      await GDSession.create({
        roomCode,

        createdBy:
          participantIds[0],

        topicId:
          topic._id,

        topic:
          topic.topic,

        category:
          topic.category ||
          "General",

        difficulty:
          topic.difficulty ||
          difficulty,

        targetRole:
          topic.targetRole ||
          targetRole ||
          "",

        targetCompany:
          topic.targetCompany ||
          targetCompany ||
          "",

        maxParticipants:
          MAX_PARTICIPANTS,

        durationMinutes:
          15,

        videoEnabled:
          true,

        audioEnabled:
          true,

        participants:
          participantIds.map(
            (participantId) => ({
              user:
                participantId,

              joinedAt:
                new Date(),

              leftAt:
                null,

              isPresent:
                true,
            })
          ),

        status:
          "Waiting",

        meetingType:
          "Placify",

        externalMeetingUrl:
          "",

        scheduledAt:
          null,

        startedAt:
          null,

        completedAt:
          null,
      });

    // ==============================
    // MARK STUDENTS AS MATCHED
    // ==============================

    await GDQueue.updateMany(
      {
        _id: {
          $in:
            waitingStudents.map(
              (student) =>
                student._id
            ),
        },
      },
      {
        $set: {
          status:
            "Matched",

          matchedSession:
            session._id,

          matchedAt:
            new Date(),
        },
      }
    );

    // ==============================
    // MATCH FOUND RESPONSE
    // ==============================

    return res.status(201).json({
      message:
        "GD match found successfully",

      status:
        "Matched",

      room: {
        _id:
          session._id,

        roomCode:
          session.roomCode,

        topic:
          session.topic,

        category:
          session.category,

        difficulty:
          session.difficulty,

        participants:
          session.participants.length,

        maxParticipants:
          session.maxParticipants,

        durationMinutes:
          session.durationMinutes,

        videoEnabled:
          session.videoEnabled,

        audioEnabled:
          session.audioEnabled,

        meetingType:
          session.meetingType,

        status:
          session.status,
      },
    });
  } catch (error) {
    console.error(
      "GD matchmaking error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to join GD matchmaking queue",
      error:
        error.message,
    });
  }
};

module.exports = {
  joinGDQueue,
};