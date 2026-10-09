const mongoose = require("mongoose");

// ======================================================
// AI INTERVIEW — RESUME SNAPSHOT
// ======================================================
// Stores only interview-relevant information extracted
// from the resume uploaded for THIS interview.
//
// This is intentionally separate from the Resume model.
// If the student later changes/uploads another resume,
// old interview sessions still retain their original
// interview context.
// ======================================================

const resumeSnapshotSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      default: "",
      trim: true,
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    projectImpact: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: [String],
      default: [],
    },

    internships: {
      type: [String],
      default: [],
    },

    education: {
      type: [String],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// ======================================================
// AI INTERVIEW — ANSWER EVALUATION
// ======================================================

const answerEvaluationSchema = new mongoose.Schema(
  {
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    technicalScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

technicalApplicable: {
  type: Boolean,
  default: false,
},


    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completenessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    clarityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    structureScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weakAreas: {
      type: [String],
      default: [],
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },

  resumeKnowledgeScore: {
  type: Number,
  default: 0,
  min: 0,
  max: 100,
},

resumeKnowledgeApplicable: {
  type: Boolean,
  default: false,
},

evaluationSource: {
  type: String,
  enum: [
    "ai",
    "deterministic",
  ],
  default: "deterministic",
},

// ==========================================
// DETAILED ANSWER QUALITY ANALYSIS
// ==========================================

answerQuality: {
  type: String,
  enum: [
    "Complete",
    "Partially Complete",
    "Too Short",
    "Irrelevant",
    "Incorrect",
  ],
  default: "Partially Complete",
},

missingKeyPoints: {
  type: [String],
  default: [],
},

incorrectClaims: {
  type: [String],
  default: [],
},

improvementTips: {
  type: [String],
  default: [],
},

suggestedAnswer: {
  type: String,
  default: "",
  trim: true,
},
  },
  {
    _id: false,
  }
);

// ======================================================
// AI INTERVIEW — VOICE METRICS
// ======================================================
// Only objective/measurable communication information.
// We are NOT trying to infer personality from webcam.
// ======================================================

const voiceMetricsSchema = new mongoose.Schema(
  {
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    wordsPerMinute: {
      type: Number,
      default: 0,
      min: 0,
    },

    fillerWordCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    longPauseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

// ======================================================
// AI INTERVIEW — CONVERSATION TURN
// ======================================================
// There is NO pre-generated question list.
//
// Each turn is created dynamically:
//
// AI asks question
//      ↓
// Student answers
//      ↓
// Answer evaluated
//      ↓
// AI decides next question
// ======================================================

const conversationTurnSchema = new mongoose.Schema(
  {
    turnNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    stage: {
      type: String,
      enum: [
        "Introduction",
        "Resume Discussion",
        "Project Discussion",
        "Technical",
        "Behavioral",
        "Role & Company",
        "Communication",
        "Closing",
      ],
      required: true,
    },

    // Exact dynamically generated AI question.
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    // Natural HR acknowledgement before the question.
acknowledgement: {
  type: String,
  default: "",
  trim: true,
},

    // Example:
    // Java / SQL / Spring Boot / Communication
    focusArea: {
      type: String,
      default: "",
      trim: true,
    },

    // More specific than focusArea.
    // Example:
    // OOP / Collections / REST API / STAR Method
    topic: {
      type: String,
      default: "",
      trim: true,
    },

    difficulty: {
      type: String,
      enum: [
        "Foundation",
        "Intermediate",
        "Advanced",
      ],
      default: "Intermediate",
    },

    // Why did AI ask this question?
    // Useful for our "Why this question?" UI.
    questionReason: {
      type: String,
      default: "",
      trim: true,
    },

    // What triggered this question?
   source: {
  type: String,
  enum: [
    "Introduction",
    "Resume",
    "Skill",
    "Project",
    "Experience",
    "Internship",
    "Certification",
    "Target Role",
    "Target Company",
    "Job Description",
    "Previous Answer",
    "Weak Area",
    "Behavioral",
    "Communication",
    "Technical",
    "Resume Discussion",
    "Project Discussion",
    "Role & Company",
    "Closing",
  ],
  default: "Resume",
},

    // Student voice → speech-to-text.
    answerTranscript: {
      type: String,
      default: "",
      trim: true,
    },

    // If student explicitly cannot answer.
   skipped: {
  type: Boolean,
  default: false,
},

// Number of irrelevant-answer warnings
// issued for this question.
irrelevantWarningCount: {
  type: Number,
  default: 0,
  min: 0,
  max: 2,
},

    evaluation: {
      type: answerEvaluationSchema,
      default: () => ({}),
    },

    voiceMetrics: {
      type: voiceMetricsSchema,
      default: () => ({}),
    },

    // Determines how AI should respond after evaluating
    // the student's answer.
    nextAction: {
      type: String,
      enum: [
        "Pending",
        "Go Deeper",
        "Clarify",
        "Simplify",
        "Related Follow-up",
        "Change Topic",
        "Move Stage",
        "Complete Interview",
      ],
      default: "Pending",
    },

    askedAt: {
      type: Date,
      default: Date.now,
    },

    answeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// AI INTERVIEW SESSION
// ======================================================

const aiInterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================================================
    // INTERVIEW RESUME
    // ==================================================

    resumeFileName: {
      type: String,
      default: "",
      trim: true,
    },

    resumeFileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    resumeFileType: {
      type: String,
      default: "",
      trim: true,
    },

    resumeExtractedText: {
      type: String,
      default: "",
    },

    resumeSnapshot: {
      type: resumeSnapshotSchema,
      default: () => ({}),
    },

    // ==================================================
    // INTERVIEW TARGET
    // ==================================================

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

    // ==================================================
    // INTERVIEW CONFIGURATION
    // ==================================================

    interviewMode: {
      type: String,
      enum: [
        "Resume Adaptive",
      ],
      default: "Resume Adaptive",
    },

    difficulty: {
      type: String,
      enum: [
        "Adaptive",
        "Easy",
        "Medium",
        "Hard",
      ],
      default: "Adaptive",
    },

    durationMinutes: {
      type: Number,
      default: 20,
      min: 5,
      max: 60,
    },

    // ==================================================
    // INTERVIEW STATE
    // ==================================================

    status: {
      type: String,
      enum: [
        "Resume Uploaded",
        "Ready",
        "In Progress",
        "Completed",
        "Abandoned",
      ],
      default: "Resume Uploaded",
    },

    currentStage: {
      type: String,
      enum: [
        "Introduction",
        "Resume Discussion",
        "Project Discussion",
        "Technical",
        "Behavioral",
        "Role & Company",
        "Communication",
        "Closing",
        "Completed",
      ],
      default: "Introduction",
    },

    currentFocusArea: {
      type: String,
      default: "",
      trim: true,
    },

    currentTopic: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // DYNAMIC CONVERSATION MEMORY
    // ==================================================

    conversation: {
      type: [conversationTurnSchema],
      default: [],
    },

    topicsCovered: {
      type: [String],
      default: [],
    },

    skillsTested: {
      type: [String],
      default: [],
    },

    // Areas discovered DURING this interview.
    observedStrongAreas: {
      type: [String],
      default: [],
    },

    observedWeakAreas: {
      type: [String],
      default: [],
    },

    // ==================================================
    // FINAL INTERVIEW RESULT
    // ==================================================

    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    technicalScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    communicationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completenessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    answerStructureScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    resumeKnowledgeScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    roleReadinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weakAreas: {
      type: [String],
      default: [],
    },

    recommendations: {
      type: [String],
      default: [],
    },


    // Personalized communication improvement feedback.
communicationSuggestions: {
  type: [String],
  default: [],
},

// Personalized answer improvement feedback.
answerSuggestions: {
  type: [String],
  default: [],
},


    // ==================================================
    // TIMING
    // ==================================================

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

// ======================================================
// INDEXES
// ======================================================

aiInterviewSessionSchema.index({
  user: 1,
  createdAt: -1,
});

aiInterviewSessionSchema.index({
  user: 1,
  status: 1,
});

// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model(
  "AIInterviewSession",
  aiInterviewSessionSchema
);