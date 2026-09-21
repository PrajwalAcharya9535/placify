const mongoose = require("mongoose");

const placementApplicationSchema = new mongoose.Schema(
  {
    // Student who is tracking this application
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Placement opportunity
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementOpportunity",
      required: true,
      index: true,
    },

    // Current stage of the real placement process
    currentStage: {
      type: String,
      enum: [
        "Interested",
        "Applied",
        "Assessment",
        "Shortlisted",
        "Technical",
        "HR",
        "Selected",
        "Rejected",
        "Offer",
        "Placed",
      ],
      default: "Interested",
    },

    // Date student actually applied
    appliedAt: {
      type: Date,
      default: null,
    },

    // Upcoming assessment/interview date
    nextRoundDate: {
      type: Date,
      default: null,
    },

    // Student notes
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Complete stage history
    stageHistory: [
      {
        stage: {
          type: String,
          enum: [
            "Interested",
            "Applied",
            "Assessment",
            "Shortlisted",
            "Technical",
            "HR",
            "Selected",
            "Rejected",
            "Offer",
            "Placed",
          ],
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },

        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },
      },
    ],

    // Offer details
    offerDetails: {
      package: {
        type: Number,
        min: 0,
        default: 0,
      },

      joiningDate: {
        type: Date,
        default: null,
      },

      offerLetterUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Overall tracker state
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One student should track an opportunity only once
placementApplicationSchema.index(
  {
    student: 1,
    opportunity: 1,
  },
  {
    unique: true,
  }
);

// Useful for tracker/dashboard queries
placementApplicationSchema.index({
  student: 1,
  currentStage: 1,
  updatedAt: -1,
});

module.exports = mongoose.model(
  "PlacementApplication",
  placementApplicationSchema
);