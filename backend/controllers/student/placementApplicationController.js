const mongoose = require("mongoose");

const PlacementApplication = require(
  "../../models/PlacementApplication"
);

const PlacementOpportunity = require(
  "../../models/PlacementOpportunity"
);

const CalendarEvent = require(
  "../../models/CalendarEvent"
);

const {
  createNotification,
} = require("../../services/notificationService");


// ========================================
// TELEGRAM APPLICATION SUPPORT
// ========================================

const populateTelegramApplication = async (application) => {
  if (!application) {
    return null;
  }

  if (application.telegramAnnouncement) {
    await application.populate("telegramAnnouncement");
  }

  return application;
};

const getApplicationDetails = (application) => {
  const source =
    application.opportunity ||
    application.telegramAnnouncement;

  return {
    companyName:
      source?.companyName ||
      source?.company ||
      "Company not announced",

    jobRole:
      source?.jobRole ||
      source?.role ||
      source?.title ||
      "Role not announced",
  };
};

// ========================================
// VALID PLACEMENT STAGES
// ========================================

const VALID_STAGES = [
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
];

// ========================================
// VALID PLACEMENT STAGE TRANSITIONS
// ========================================

const VALID_STAGE_TRANSITIONS = {
  Interested: [
    "Applied",
    "Rejected",
  ],

  Applied: [
    "Assessment",
    "Shortlisted",
    "Rejected",
  ],

  Assessment: [
    "Shortlisted",
    "Rejected",
  ],

  Shortlisted: [
    "Technical",
    "HR",
    "Rejected",
  ],

  Technical: [
    "HR",
    "Selected",
    "Rejected",
  ],

  HR: [
    "Selected",
    "Rejected",
  ],

  Selected: [
    "Offer",
    "Rejected",
  ],

  Offer: [
    "Placed",
    "Rejected",
  ],

  Rejected: [],

  Placed: [],
};

// ========================================
// ADD OPPORTUNITY TO PLACEMENT TRACKER
// STUDENT
// ========================================

const addToPlacementTracker = async (req, res) => {
  try {
    const { opportunityId } = req.params;

    const opportunity =
      await PlacementOpportunity.findById(
        opportunityId
      );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message:
          "Placement opportunity not found",
      });
    }

    if (
      opportunity.status !== "Active" ||
      opportunity.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This placement opportunity is not currently active",
      });
    }

    if (
      new Date(
        opportunity.applicationDeadline
      ) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application deadline has already passed",
      });
    }

    // ----------------------------------------
    // PREVENT DUPLICATE TRACKING
    // ----------------------------------------

    const existingApplication =
      await PlacementApplication.findOne({
        student: req.user.id,
        opportunity: opportunityId,
      });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message:
          "This opportunity is already in your placement tracker",
      });
    }

    // ----------------------------------------
    // CREATE TRACKER ENTRY
    // ----------------------------------------

    const application =
      await PlacementApplication.create({
        student: req.user.id,
        opportunity: opportunityId,

        currentStage: "Interested",

        stageHistory: [
          {
            stage: "Interested",
            changedAt: new Date(),
            note:
              "Opportunity added to placement tracker",
          },
        ],
      });

    await application.populate(
      "opportunity",
      [
        "title",
        "companyName",
        "jobRole",
        "location",
        "workMode",
        "opportunityType",
        "applicationDeadline",
        "testDate",
        "selectionRounds",
        "salaryMin",
        "salaryMax",
        "status",
        "isActive",
      ].join(" ")
    );

    // ----------------------------------------
// CREATE PLACEMENT TRACKER NOTIFICATION
// ----------------------------------------

await createNotification({
  user: req.user.id,

  title: "Opportunity Added to Placement Tracker",

  message: `${opportunity.companyName} - ${opportunity.jobRole} has been added to your placement tracker.`,

  type: "Application",

  priority: "Medium",

  relatedEntityType: "PlacementApplication",

  relatedEntityId: application._id,

  actionUrl: `/placement-tracker/${application._id}`,

  metadata: {
    companyName: opportunity.companyName,
    jobRole: opportunity.jobRole,
    stage: application.currentStage,
  },
});

    res.status(201).json({
      success: true,
      message:
        "Opportunity added to placement tracker successfully",
      application,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid placement opportunity ID",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "This opportunity is already in your placement tracker",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Placement tracker validation failed",
        error: error.message,
      });
    }

    console.error(
      "Add to placement tracker error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to add opportunity to placement tracker",
      error: error.message,
    });
  }
};

// ========================================
// GET STUDENT PLACEMENT TRACKER
// STUDENT
// ========================================

const getPlacementTracker = async (
  req,
  res
) => {
  try {
    const { stage } = req.query;

    const filter = {
      student: req.user.id,
    };

    // ----------------------------------------
    // OPTIONAL STAGE FILTER
    // ----------------------------------------

    if (stage) {
      if (!VALID_STAGES.includes(stage)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement tracker stage",
        });
      }

      filter.currentStage = stage;
    }

    // ----------------------------------------
    // FETCH TRACKER ENTRIES
    // ----------------------------------------

    const applications =
      await PlacementApplication.find(
        filter
      )
        .populate(
          "opportunity",
          [
            "title",
            "companyName",
            "jobRole",
            "location",
            "workMode",
            "opportunityType",
            "applicationDeadline",
            "testDate",
            "selectionRounds",
            "salaryMin",
            "salaryMax",
            "status",
            "isActive",
          ].join(" ")
        )
        .populate("telegramAnnouncement")
        .sort({
          updatedAt: -1,
        });

    // ----------------------------------------
    // BUILD TRACKER SUMMARY
    // ----------------------------------------

    const studentObjectId =
      new mongoose.Types.ObjectId(
        req.user.id
      );

    const stageCounts =
      await PlacementApplication.aggregate(
        [
          {
            $match: {
              student:
                studentObjectId,
            },
          },
          {
            $group: {
              _id:
                "$currentStage",
              count: {
                $sum: 1,
              },
            },
          },
        ]
      );

    const summary = {
      total: 0,
      Interested: 0,
      Applied: 0,
      Assessment: 0,
      Shortlisted: 0,
      Technical: 0,
      HR: 0,
      Selected: 0,
      Rejected: 0,
      Offer: 0,
      Placed: 0,
    };

    for (const item of stageCounts) {
      if (
        Object.prototype.hasOwnProperty.call(
          summary,
          item._id
        )
      ) {
        summary[item._id] =
          item.count;
      }

      summary.total +=
        item.count;
    }

    res.status(200).json({
      success: true,
      message:
        "Placement tracker fetched successfully",

      count:
        applications.length,

      filter: {
        stage:
          stage || "All",
      },

      summary,

      applications,
    });
  } catch (error) {
    console.error(
      "Get placement tracker error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch placement tracker",
      error:
        error.message,
    });
  }
};

// ========================================
// GET SINGLE PLACEMENT APPLICATION
// STUDENT
// ========================================

const getPlacementApplicationById =
  async (req, res) => {
    try {
      const {
        applicationId,
      } = req.params;

      // ----------------------------------------
      // VALIDATE APPLICATION ID
      // ----------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement application ID",
        });
      }

      // ----------------------------------------
      // FIND STUDENT'S APPLICATION
      // ----------------------------------------

      const application =
        await PlacementApplication.findOne(
          {
            _id: applicationId,
            student:
              req.user.id,
          }
        ).populate(
          "opportunity",
          [
            "title",
            "companyName",
            "description",
            "jobRole",
            "location",
            "workMode",
            "opportunityType",
            "eligibleCourses",
            "eligibleGraduationYears",
            "minimumCGPA",
            "maximumBacklogs",
            "requiredSkills",
            "preferredSkills",
            "salaryMin",
            "salaryMax",
            "stipend",
            "applicationUrl",
            "applicationDeadline",
            "testDate",
            "selectionRounds",
            "skillsTags",
            "status",
            "isActive",
          ].join(" ")
        );

           if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Placement tracker application not found",
        });
      }

      // Populate Telegram announcement details
      await populateTelegramApplication(application);

      // ----------------------------------------
      // RESPONSE
      // ----------------------------------------

      res.status(200).json({
        success: true,
        message:
          "Placement application fetched successfully",
        application,
      });

    } catch (error) {
      console.error(
        "Get placement application error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch placement application",
        error:
          error.message,
      });
    }
  };

// ========================================
// UPDATE PLACEMENT APPLICATION NOTES
// STUDENT
// ========================================

const updatePlacementApplicationNotes =
  async (req, res) => {
    try {
      const {
        applicationId,
      } = req.params;

      const { notes } = req.body;

      // ----------------------------------------
      // VALIDATE APPLICATION ID
      // ----------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement application ID",
        });
      }

      // ----------------------------------------
      // VALIDATE NOTES
      // ----------------------------------------

      if (notes === undefined) {
        return res.status(400).json({
          success: false,
          message:
            "Notes field is required",
        });
      }

      if (typeof notes !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Notes must be a string",
        });
      }

      const cleanedNotes =
        notes.trim();

      if (
        cleanedNotes.length > 2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Notes cannot exceed 2000 characters",
        });
      }

      // ----------------------------------------
      // FIND STUDENT'S APPLICATION
      // ----------------------------------------

      const application =
        await PlacementApplication.findOne({
          _id: applicationId,
          student: req.user.id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Placement tracker application not found",
        });
      }

      // ----------------------------------------
      // UPDATE NOTES
      // ----------------------------------------

      application.notes =
        cleanedNotes;

      await application.save();

      // ----------------------------------------
      // POPULATE OPPORTUNITY
      // ----------------------------------------

      await application.populate(
        "opportunity",
        [
          "title",
          "companyName",
          "jobRole",
          "location",
          "workMode",
          "opportunityType",
          "applicationDeadline",
          "testDate",
          "selectionRounds",
          "salaryMin",
          "salaryMax",
          "status",
          "isActive",
        ].join(" ")
      );


            // Populate Telegram announcement details
      await populateTelegramApplication(application);

      // ----------------------------------------
      // RESPONSE
      // ----------------------------------------

      res.status(200).json({
        success: true,
        message:
          "Placement application notes updated successfully",
        application,
      });

    } catch (error) {
      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Placement tracker validation failed",
          error:
            error.message,
        });
      }

      console.error(
        "Update placement application notes error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update placement application notes",
        error:
          error.message,
      });
    }
  };

// ========================================
// UPDATE PLACEMENT OFFER DETAILS
// STUDENT
// ========================================

const updatePlacementOfferDetails =
  async (req, res) => {
    try {
      const {
        applicationId,
      } = req.params;

      const {
        package: offerPackage,
        joiningDate,
        offerLetterUrl,
      } = req.body;

      // ----------------------------------------
      // VALIDATE APPLICATION ID
      // ----------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          applicationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid placement application ID",
        });
      }

      // ----------------------------------------
      // REQUIRE AT LEAST ONE FIELD
      // ----------------------------------------

      if (
        offerPackage === undefined &&
        joiningDate === undefined &&
        offerLetterUrl === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one offer detail is required",
        });
      }

      // ----------------------------------------
      // FIND STUDENT'S APPLICATION
      // ----------------------------------------

      const application =
        await PlacementApplication.findOne({
          _id: applicationId,
          student: req.user.id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Placement tracker application not found",
        });
      }

      // ----------------------------------------
      // ALLOW OFFER DETAILS ONLY AFTER SELECTION
      // ----------------------------------------

      const allowedOfferStages = [
        "Selected",
        "Offer",
        "Placed",
      ];

      if (
        !allowedOfferStages.includes(
          application.currentStage
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Offer details can only be updated after the student is selected",
          currentStage:
            application.currentStage,
        });
      }

      // ----------------------------------------
      // VALIDATE PACKAGE
      // ----------------------------------------

      if (offerPackage !== undefined) {
        if (
          typeof offerPackage !== "number" ||
          !Number.isFinite(offerPackage) ||
          offerPackage < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Offer package must be a valid non-negative number",
          });
        }

        application.offerDetails.package =
          offerPackage;
      }

      // ----------------------------------------
      // VALIDATE JOINING DATE
      // ----------------------------------------

      if (joiningDate !== undefined) {
        if (
          joiningDate === null ||
          joiningDate === ""
        ) {
          application.offerDetails.joiningDate =
            null;
        } else {
          const parsedJoiningDate =
            new Date(joiningDate);

          if (
            Number.isNaN(
              parsedJoiningDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid joining date",
            });
          }

          application.offerDetails.joiningDate =
            parsedJoiningDate;
        }
      }

      // ----------------------------------------
      // VALIDATE OFFER LETTER URL
      // ----------------------------------------

      if (offerLetterUrl !== undefined) {
        if (
          typeof offerLetterUrl !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Offer letter URL must be a string",
          });
        }

        const cleanedOfferLetterUrl =
          offerLetterUrl.trim();

        if (cleanedOfferLetterUrl) {
          try {
            const parsedUrl =
              new URL(
                cleanedOfferLetterUrl
              );

            if (
              parsedUrl.protocol !== "http:" &&
              parsedUrl.protocol !== "https:"
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "Offer letter URL must use http or https",
              });
            }
          } catch (error) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid offer letter URL",
            });
          }
        }

        application.offerDetails.offerLetterUrl =
          cleanedOfferLetterUrl;
      }

      // ----------------------------------------
      // SAVE OFFER DETAILS
      // ----------------------------------------

      await application.save();

      // ----------------------------------------
      // POPULATE OPPORTUNITY
      // ----------------------------------------

      await application.populate(
        "opportunity",
        [
          "title",
          "companyName",
          "jobRole",
          "location",
          "workMode",
          "opportunityType",
          "applicationDeadline",
          "testDate",
          "selectionRounds",
          "salaryMin",
          "salaryMax",
          "status",
          "isActive",
        ].join(" ")
      );


            // Populate Telegram announcement details
      await populateTelegramApplication(application);
            // Support both regular and Telegram applications
      const { companyName, jobRole } =
        getApplicationDetails(application);

      // ----------------------------------------
// SYNC JOINING DATE TO CALENDAR
// ----------------------------------------

if (application.offerDetails.joiningDate) {
  await CalendarEvent.findOneAndUpdate(
    {
      user: req.user.id,
      relatedEntityType: "PlacementApplication",
      relatedEntityId: application._id,
      eventType: "Joining",
    },
    {
      $set: {
        title: `${companyName} - Joining Date`,

        description: `Joining date for ${jobRole}.`,

        eventType: "Joining",

        startDate:
          application.offerDetails.joiningDate,

        endDate: null,

        allDay: true,

        status: "Scheduled",

        reminderEnabled: true,

        reminderMinutesBefore: 1440,

        reminderSentAt: null,

        actionUrl: `/placement-tracker/${application._id}`,

       metadata: {
  companyName,
  jobRole,

  package:
    application.offerDetails.package,
},
      },

      $setOnInsert: {
        user: req.user.id,

        relatedEntityType:
          "PlacementApplication",

        relatedEntityId:
          application._id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
}

else {
  await CalendarEvent.findOneAndUpdate(
    {
      user: req.user.id,
      relatedEntityType: "PlacementApplication",
      relatedEntityId: application._id,
      eventType: "Joining",
      status: "Scheduled",
    },
    {
      $set: {
        status: "Cancelled",
        reminderEnabled: false,
        reminderSentAt: null,
      },
    },
    {
      new: true,
    }
  );
}

      // ----------------------------------------
      // RESPONSE
      // ----------------------------------------

      res.status(200).json({
        success: true,
        message:
          "Placement offer details updated successfully",
        application,
      });

    } catch (error) {
      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Placement tracker validation failed",
          error:
            error.message,
        });
      }

      console.error(
        "Update placement offer details error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update placement offer details",
        error:
          error.message,
      });
    }
  };

// ========================================
// UPDATE PLACEMENT APPLICATION STAGE
// STUDENT
// ========================================

const updatePlacementStage = async (
  req,
  res
) => {
  try {
    const {
      applicationId,
    } = req.params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid placement application ID",
  });
}

    const {
      stage,
      note = "",
      nextRoundDate,
    } = req.body;

    // ----------------------------------------
    // VALIDATE STAGE
    // ----------------------------------------

    if (!stage) {
      return res.status(400).json({
        success: false,
        message:
          "Placement stage is required",
      });
    }

    if (
      !VALID_STAGES.includes(
        stage
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid placement stage",
      });
    }

    // ----------------------------------------
    // FIND STUDENT'S APPLICATION
    // ----------------------------------------

    const application =
      await PlacementApplication.findOne({
        _id: applicationId,
        student: req.user.id,
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Placement tracker application not found",
      });
    }

    // ----------------------------------------
    // PREVENT SAME STAGE UPDATE
    // ----------------------------------------

    if (
      application.currentStage ===
      stage
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Application is already in ${stage} stage`,
      });
    }

    // ----------------------------------------
    // VALIDATE STAGE TRANSITION
    // ----------------------------------------

    const allowedNextStages =
      VALID_STAGE_TRANSITIONS[
        application.currentStage
      ] || [];

    if (
      !allowedNextStages.includes(
        stage
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid placement stage transition from ${application.currentStage} to ${stage}`,
        currentStage:
          application.currentStage,
        allowedNextStages,
      });
    }

    // ----------------------------------------
    // VALIDATE NEXT ROUND DATE
    // ----------------------------------------

    if (
      nextRoundDate !== undefined
    ) {
      if (
        nextRoundDate !== null &&
        nextRoundDate !== ""
      ) {
        const parsedDate =
          new Date(
            nextRoundDate
          );

        if (
          Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,
              message:
                "Invalid next round date",
            });
        }

        application.nextRoundDate =
          parsedDate;
      } else {
        application.nextRoundDate =
          null;
      }
    }

    // ----------------------------------------
    // UPDATE CURRENT STAGE
    // ----------------------------------------

    application.currentStage =
      stage;

    // Automatically record first Applied time

    if (
      stage === "Applied" &&
      !application.appliedAt
    ) {
      application.appliedAt =
        new Date();
    }

    // ----------------------------------------
    // UPDATE ACTIVE STATUS
    // ----------------------------------------

    if (
      stage === "Rejected" ||
      stage === "Placed"
    ) {
      application.isActive = false;
      application.nextRoundDate = null;
    } else {
      application.isActive = true;
    }

    // ----------------------------------------
    // ADD STAGE HISTORY
    // ----------------------------------------

    application.stageHistory.push({
      stage,
      changedAt:
        new Date(),
      note:
        typeof note ===
        "string"
          ? note.trim()
          : "",
    });

    await application.save();

    // ----------------------------------------
    // POPULATE OPPORTUNITY
    // ----------------------------------------

    await application.populate(
      "opportunity",
      [
        "title",
        "companyName",
        "jobRole",
        "location",
        "workMode",
        "opportunityType",
        "applicationDeadline",
        "testDate",
        "selectionRounds",
        "salaryMin",
        "salaryMax",
        "status",
        "isActive",
      ].join(" ")
    );


    // Populate Telegram announcement details
    await populateTelegramApplication(application);
        // Support both regular and Telegram applications
    const { companyName, jobRole } =
      getApplicationDetails(application);

    // ----------------------------------------
// SYNC NEXT PLACEMENT ROUND TO CALENDAR
// ----------------------------------------

if (application.nextRoundDate) {
  await CalendarEvent.findOneAndUpdate(
    {
  user: req.user.id,
  relatedEntityType: "PlacementApplication",
  relatedEntityId: application._id,
  eventType: "Application Round",
},
    {
      $set: {
        title: `${companyName} - ${stage} Round`,

        description: `${stage} round for ${jobRole}.`,

        eventType: "Application Round",

        startDate: application.nextRoundDate,

        endDate: null,

        allDay: false,

        status: "Scheduled",

        reminderEnabled: true,

        reminderMinutesBefore: 1440,

        reminderSentAt: null,

        actionUrl: `/placement-tracker/${application._id}`,

      metadata: {
  companyName,
  jobRole,
  stage,
},
      },

      $setOnInsert: {
        user: req.user.id,

        relatedEntityType:
          "PlacementApplication",

        relatedEntityId:
          application._id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
    );
} else {
  await CalendarEvent.findOneAndUpdate(
    {
      user: req.user.id,
      relatedEntityType: "PlacementApplication",
      relatedEntityId: application._id,
      eventType: "Application Round",
      status: "Scheduled",
    },
    {
      $set: {
        status: "Cancelled",
        reminderEnabled: false,
        reminderSentAt: null,
      },
    },
    {
      new: true,
    }
  );
}


// ----------------------------------------
// CREATE PLACEMENT STAGE NOTIFICATION
// ----------------------------------------

await createNotification({
  user: req.user.id,

  title: "Placement Application Update",

  message: `Your ${companyName} application has moved to ${stage}.`,

  type: "Application",

  priority:
    stage === "Selected" ||
    stage === "Offer" ||
    stage === "Placed"
      ? "High"
      : "Medium",

  relatedEntityType: "PlacementApplication",

  relatedEntityId: application._id,

  actionUrl: `/placement-tracker/${application._id}`,

metadata: {
  companyName,
  jobRole,
  stage,

  nextRoundDate:
    application.nextRoundDate || null,
},
});


// ----------------------------------------
// RESPONSE
// ----------------------------------------


    res.status(200).json({
      success: true,
      message:
        `Placement stage updated to ${stage} successfully`,
      application,
    });

  } catch (error) {
    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid placement application ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Placement tracker validation failed",
        error:
          error.message,
      });
    }

    console.error(
      "Update placement stage error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update placement stage",
      error:
        error.message,
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  addToPlacementTracker,
  getPlacementTracker,
  getPlacementApplicationById,
  updatePlacementApplicationNotes,
  updatePlacementOfferDetails,
  updatePlacementStage,
};