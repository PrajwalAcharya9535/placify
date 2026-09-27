const mongoose = require("mongoose");

// ==============================
// CONTACT INFORMATION SCHEMA
// ==============================
const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    linkedin: {
      type: String,
      default: "",
      trim: true,
    },

    github: {
      type: String,
      default: "",
      trim: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==============================
// SECTION PRESENCE SCHEMA
// ==============================
const sectionPresenceSchema =
  new mongoose.Schema(
    {
      summary: {
        type: Boolean,
        default: false,
      },

      education: {
        type: Boolean,
        default: false,
      },

      skills: {
        type: Boolean,
        default: false,
      },

      projects: {
        type: Boolean,
        default: false,
      },

      internships: {
        type: Boolean,
        default: false,
      },

      experience: {
        type: Boolean,
        default: false,
      },

      certifications: {
        type: Boolean,
        default: false,
      },

      achievements: {
        type: Boolean,
        default: false,
      },

      languages: {
        type: Boolean,
        default: false,
      },

      interests: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// SECTION REVIEW SCHEMA
// ==============================
const sectionReviewSchema =
  new mongoose.Schema(
    {
      section: {
        type: String,
        required: true,
        trim: true,
      },

      present: {
        type: Boolean,
        default: false,
      },

      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      status: {
        type: String,
        enum: [
          "Strong",
          "Good",
          "Needs Improvement",
          "Missing",
          "Optional",
        ],
        default: "Needs Improvement",
      },

      strengths: {
        type: [String],
        default: [],
      },

      issues: {
        type: [String],
        default: [],
      },

      suggestions: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// IMPROVEMENT FIELD SCHEMA
// ==============================
const improvementFieldSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        required: true,
        trim: true,
      },

      section: {
        type: String,
        required: true,
        trim: true,
      },

      label: {
        type: String,
        required: true,
        trim: true,
      },

      fieldType: {
        type: String,
        enum: [
          "text",
          "textarea",
          "list",
          "url",
        ],
        default: "text",
      },

      required: {
        type: Boolean,
        default: false,
      },

      reason: {
        type: String,
        default: "",
      },

      placeholder: {
        type: String,
        default: "",
      },

      currentValue: {
        type: String,
        default: "",
      },

      studentValue: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "Missing",
          "Needs Improvement",
          "Provided",
          "Skipped",
        ],
        default: "Missing",
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// FORMAT REVIEW SCHEMA
// ==============================
const formatReviewSchema =
  new mongoose.Schema(
    {
      pageCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      recommendedPageCount: {
        type: String,
        default: "",
      },

      pageLengthStatus: {
        type: String,
        enum: [
          "Good",
          "Needs Improvement",
          "Unknown",
        ],
        default: "Unknown",
      },

      atsFriendlyStructure: {
        type: Boolean,
        default: false,
      },

      contactLinksPresent: {
        type: Boolean,
        default: false,
      },

      sectionOrganizationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      suggestions: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// ADVANCED REVIEW SCHEMA
// ==============================
const advancedReviewSchema =
  new mongoose.Schema(
    {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      contentQualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      sectionQualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      projectQualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      impactScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      roleRelevanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      formatScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      sectionReviews: {
        type: [sectionReviewSchema],
        default: [],
      },

      formatReview: {
        type: formatReviewSchema,
        default: () => ({}),
      },

      improvementFields: {
        type: [improvementFieldSchema],
        default: [],
      },

      strengths: {
        type: [String],
        default: [],
      },

      priorityImprovements: {
        type: [String],
        default: [],
      },

      recommendations: {
        type: [String],
        default: [],
      },

      reviewStatus: {
        type: String,
        enum: [
          "Not Reviewed",
          "Reviewed",
          "Failed",
        ],
        default: "Not Reviewed",
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// IMPROVED RESUME SCHEMA
// ==============================
const improvedResumeSchema =
  new mongoose.Schema(
    {
      template: {
        type: String,
        enum: [
          "Classic ATS",
          "Modern Professional",
          "Minimal Technical",
        ],
        default: "Classic ATS",
      },

      generated: {
        type: Boolean,
        default: false,
      },

      generatedFileName: {
        type: String,
        default: "",
      },

      generatedFileUrl: {
        type: String,
        default: "",
      },

      generatedFileType: {
        type: String,
        default: "",
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

// ==============================
// RESUME SCHEMA
// ==============================
const resumeSchema = new mongoose.Schema(
  {
    // ==============================
    // STUDENT
    // ==============================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ==============================
    // RESUME FILE INFORMATION
    // ==============================
    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    pageCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ==============================
    // EXTRACTED RESUME TEXT
    // ==============================
    extractedText: {
      type: String,
      default: "",
    },

    // ==============================
    // STRUCTURED CONTACT INFORMATION
    // ==============================
    contact: {
      type: contactSchema,
      default: () => ({}),
    },

    // ==============================
    // SUMMARY / OBJECTIVE
    // ==============================
    summary: {
      type: String,
      default: "",
    },

    // ==============================
    // EXTRACTED INFORMATION
    // ==============================
    extractedSkills: {
      type: [String],
      default: [],
    },

    education: {
      type: [String],
      default: [],
    },

    experience: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    internships: {
      type: [String],
      default: [],
    },

    achievements: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },

    // ==============================
    // SECTION DETECTION
    // ==============================
    sectionPresence: {
      type: sectionPresenceSchema,
      default: () => ({}),
    },

    detectedSections: {
      type: [String],
      default: [],
    },

    extractedLineCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ==============================
    // ATS ANALYSIS
    // ==============================
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    keywordScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    skillMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // ATS FEEDBACK
    // ==============================
    matchedKeywords: {
      type: [String],
      default: [],
    },

    missingKeywords: {
      type: [String],
      default: [],
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },

    // ==============================
    // ADVANCED RESUME REVIEW
    // ==============================
    advancedReview: {
      type: advancedReviewSchema,
      default: () => ({}),
    },

    // ==============================
    // IMPROVED / GENERATED RESUME
    // ==============================
    improvedResume: {
      type: improvedResumeSchema,
      default: () => ({}),
    },

    // ==============================
    // TARGET JOB
    // ==============================
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },

    targetCompany: {
      type: String,
      default: "",
      trim: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },

    // ==============================
    // EXTRACTION STATUS
    // ==============================
    extractionStatus: {
      type: String,
      enum: [
        "Not Extracted",
        "Extracted",
        "Failed",
      ],
      default: "Not Extracted",
    },

    extractedAt: {
      type: Date,
      default: null,
    },

    // ==============================
    // ATS ANALYSIS STATUS
    // ==============================
    analysisStatus: {
      type: String,
      enum: [
        "Not Analyzed",
        "Analyzed",
        "Failed",
      ],
      default: "Not Analyzed",
    },

    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// INDEX
// ==============================
resumeSchema.index({
  user: 1,
  updatedAt: -1,
});

module.exports = mongoose.model(
  "Resume",
  resumeSchema
);