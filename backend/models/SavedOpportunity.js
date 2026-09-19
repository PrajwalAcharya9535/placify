const mongoose = require("mongoose");

const savedOpportunitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementOpportunity",
      required: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A student can save an opportunity only once
savedOpportunitySchema.index(
  {
    user: 1,
    opportunity: 1,
  },
  {
    unique: true,
  }
);

// Faster lookup of a student's saved opportunities
savedOpportunitySchema.index({
  user: 1,
  savedAt: -1,
});

module.exports = mongoose.model(
  "SavedOpportunity",
  savedOpportunitySchema
);