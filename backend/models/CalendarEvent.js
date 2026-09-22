const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    eventType: {
      type: String,
      enum: [
        "General",
        "Opportunity Deadline",
        "Application Round",
        "Interview",
        "Group Discussion",
        "Mock Placement",
        "Test",
        "Joining",
      ],
      default: "General",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    allDay: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },

    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    reminderMinutesBefore: {
      type: Number,
      default: 1440,
      min: 0,
    },

    reminderSentAt: {
    type: Date,
     default: null,
    },

    relatedEntityType: {
      type: String,
      enum: [
        "PlacementOpportunity",
        "PlacementApplication",
        "InterviewSession",
        "GDSession",
        "MockTest",
        null,
      ],
      default: null,
    },

    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Student calendar ordered by upcoming date
calendarEventSchema.index({
  user: 1,
  startDate: 1,
});

// Useful for filtering event types
calendarEventSchema.index({
  user: 1,
  eventType: 1,
  startDate: 1,
});

module.exports = mongoose.model(
  "CalendarEvent",
  calendarEventSchema
);