const mongoose = require("mongoose");

// ==============================
// PLACEMENT OPPORTUNITY SCHEMA
// ==============================

const placementOpportunitySchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      companyName: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      opportunityType: {
        type: String,
        enum: [
          "Campus",
          "Off-Campus",
          "Internship",
          "Fresher Job",
        ],
        required: true,
      },

      jobRole: {
        type: String,
        required: true,
        trim: true,
      },

      location: {
        type: String,
        required: true,
        trim: true,
      },

      workMode: {
        type: String,
        enum: [
          "On-site",
          "Remote",
          "Hybrid",
        ],
        default: "On-site",
      },

      // ==============================
      // ELIGIBILITY
      // ==============================

      eligibleCourses: [
        {
          type: String,
          trim: true,
        },
      ],

      eligibleGraduationYears: [
        {
          type: Number,
        },
      ],

      minimumCGPA: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },

      maximumBacklogs: {
        type: Number,
        min: 0,
        default: 0,
      },

      // ==============================
      // SKILLS
      // ==============================

      requiredSkills: [
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

      // ==============================
      // SALARY / STIPEND
      // ==============================

      salaryMin: {
        type: Number,
        min: 0,
        default: 0,
      },

      salaryMax: {
        type: Number,
        min: 0,
        default: 0,
      },

      stipend: {
        type: Number,
        min: 0,
        default: 0,
      },

      // ==============================
      // APPLICATION DETAILS
      // ==============================

      applicationUrl: {
        type: String,
        trim: true,
        default: "",
      },

      applicationDeadline: {
        type: Date,
        required: true,
      },

      testDate: {
        type: Date,
        default: null,
      },

      // ==============================
      // SELECTION PROCESS
      // ==============================

      selectionRounds: [
        {
          type: String,
          trim: true,
        },
      ],

      skillsTags: [
        {
          type: String,
          trim: true,
        },
      ],

      // ==============================
      // STATUS
      // ==============================

      status: {
        type: String,
        enum: [
          "Draft",
          "Active",
          "Closed",
        ],
        default: "Active",
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      // ==============================
      // ADMIN WHO CREATED IT
      // ==============================

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ==============================
// INDEXES
// ==============================

placementOpportunitySchema.index({
  status: 1,
  applicationDeadline: 1,
});

placementOpportunitySchema.index({
  companyName: 1,
  jobRole: 1,
});

placementOpportunitySchema.index({
  opportunityType: 1,
  location: 1,
});

placementOpportunitySchema.index({
  requiredSkills: 1,
});

// ==============================
// MODEL
// ==============================

module.exports = mongoose.model(
  "PlacementOpportunity",
  placementOpportunitySchema
);