const mongoose = require("mongoose");

// ==============================
// GD PARTICIPANT SCHEMA
// ==============================

const gdParticipantSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      joinedAt: {
        type: Date,
        default: Date.now,
      },

      leftAt: {
        type: Date,
        default: null,
      },

      isPresent: {
        type: Boolean,
        default: true,
      },

      // ==============================
      // WAITING ROOM READY STATE
      // ==============================

      isReady: {
        type: Boolean,
        default: false,
      },

      readyAt: {
        type: Date,
        default: null,
      },

      // ==============================
      // PARTICIPATION DATA
      // ==============================

      speakingTimeSeconds: {
        type: Number,
        min: 0,
        default: 0,
      },

      contributionCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      transcript: {
        type: String,
        trim: true,
        default: "",
      },

      // ==============================
      // INDIVIDUAL PERFORMANCE
      // ==============================

      overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      communicationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      relevanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      structureScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      participationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      strengths: [
        {
          type: String,
          trim: true,
        },
      ],

      weakAreas: [
        {
          type: String,
          trim: true,
        },
      ],

      feedback: [
        {
          type: String,
          trim: true,
        },
      ],

      recommendations: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    {
      _id: false,
    }
  );

// ==============================
// GD SESSION / VIDEO ROOM
// ==============================

const gdSessionSchema =
  new mongoose.Schema(
    {
      // ==============================
      // ROOM DETAILS
      // ==============================

      roomCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      // ==============================
      // GD DETAILS
      // ==============================

      topic: {
        type: String,
        required: true,
        trim: true,
      },

      topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GDTopic",
        default: null,
      },

      category: {
        type: String,
        trim: true,
        default: "General",
      },

      difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium",
      },

      targetRole: {
        type: String,
        trim: true,
        default: "",
      },

      targetCompany: {
        type: String,
        trim: true,
        default: "",
      },

      // ==============================
      // ROOM CONFIGURATION
      // ==============================

      maxParticipants: {
        type: Number,
        min: 2,
        max: 12,
        default: 6,
      },

      durationMinutes: {
        type: Number,
        min: 1,
        max: 120,
        default: 15,
      },

      videoEnabled: {
        type: Boolean,
        default: true,
      },

      audioEnabled: {
        type: Boolean,
        default: true,
      },

      // ==============================
      // PARTICIPANTS
      // ==============================

      participants: {
        type: [gdParticipantSchema],
        default: [],
      },

      // ==============================
      // SESSION STATUS
      // ==============================

      status: {
        type: String,
        enum: [
          "Waiting",
          "Started",
          "In Progress",
          "Completed",
          "Cancelled",
        ],
        default: "Waiting",
      },

      // ==============================
      // DISCUSSION DATA
      // ==============================

      fullTranscript: {
        type: String,
        trim: true,
        default: "",
      },

      // ==============================
      // VIDEO ROOM TYPE
      // ==============================

      meetingType: {
        type: String,
        enum: [
          "Placify",
          "GoogleMeet",
        ],
        default: "Placify",
      },

      externalMeetingUrl: {
        type: String,
        trim: true,
        default: "",
      },

      // ==============================
      // TIMING
      // ==============================

      scheduledAt: {
        type: Date,
        default: null,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// ==============================
// INDEXES
// ==============================

gdSessionSchema.index({
  status: 1,
  createdAt: -1,
});

gdSessionSchema.index({
  "participants.user": 1,
  createdAt: -1,
});

// ==============================
// MODEL
// ==============================

module.exports = mongoose.model(
  "GDSession",
  gdSessionSchema
);