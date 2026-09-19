const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    course: {
      type: String,
      default: "MCA",
      trim: true,
    },

    college: {
      type: String,
      trim: true,
    },

    graduationYear: {
      type: Number,
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },

    backlogs: {
      type: Number,
      min: 0,
      default: 0,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    location: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);