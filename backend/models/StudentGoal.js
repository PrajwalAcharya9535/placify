const mongoose = require("mongoose");

const studentGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    targetRole: {
      type: String,
      trim: true,
    },

    targetCompanies: [
      {
        type: String,
        trim: true,
      },
    ],

    preferredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    preferredLocation: {
      type: String,
      trim: true,
    },

    targetPackage: {
      type: Number,
      min: 0,
    },

    preparationGoal: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudentGoal", studentGoalSchema);