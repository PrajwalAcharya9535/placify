
const mongoose = require("mongoose");

const TelegramAnnouncement = require(
  "../../models/TelegramAnnouncement"
);

const OpportunityResponse = require(
  "../../models/OpportunityResponse"
);

const PlacementApplication = require(
  "../../models/PlacementApplication"
);

const {
  getOpportunityStatus,
} = require(
  "../../services/telegramOpportunityStatusService"
);

const VALID_ACTIONS = [
  "Interested",
  "Application Opened",
  "Applied",
  "Not Interested",
];

const getSafeApplicationUrl = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const getAdditionalDetails = (details) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .filter(
      (item) =>
        item &&
        cleanText(item.label) &&
        cleanText(item.value)
    )
    .map((item) => ({
      label: cleanText(item.label),
      value: cleanText(item.value),
    }));
};

// ========================================
// GET TELEGRAM OPPORTUNITIES
// ========================================

const getTelegramAnnouncements = async (req, res) => {
  try {
    const studentId = req.user.id;

    const announcements =
      await TelegramAnnouncement.find({
        processingStatus: "Processed",
        announcementType: "New Opportunity",
      })
        .sort({
          telegramDate: -1,
          receivedAt: -1,
        })
        .limit(100)
        .select(
          [
            "chatId",
            "messageId",
            "chatTitle",
            "messageUrl",
            "messageText",
            "attachments",
            "companyName",
            "jobRole",
            "eligibility",
            "applicationUrl",
            "salary",
            "stipend",
            "location",
            "graduationBatch",
            "jobType",
            "workMode",
            "minimumCGPA",
            "selectionProcess",
            "additionalDetails",
            "registrationDeadline",
            "deadlineTimeConfirmed",
            "announcementType",
            "processingStatus",
            "opportunity",
            "telegramDate",
            "receivedAt",
          ].join(" ")
        )
        .lean();

    const announcementIds =
      announcements.map((item) => item._id);

    const responses =
      await OpportunityResponse.find({
        student: studentId,
        announcement: {
          $in: announcementIds,
        },
      }).lean();

    const responseMap = new Map(
      responses.map((item) => [
        String(item.announcement),
        item,
      ])
    );

    const now = new Date();

    const results = announcements.map(
      (announcement) => {
        const response = responseMap.get(
          String(announcement._id)
        );

        const opportunityStatus =
          getOpportunityStatus(
            announcement,
            now
          );

        const safeApplicationUrl =
          getSafeApplicationUrl(
            announcement.applicationUrl
          );

        return {
          ...announcement,

          companyName:
            cleanText(announcement.companyName),

          jobRole:
            cleanText(announcement.jobRole),

          eligibility:
            cleanText(announcement.eligibility),

          salary:
            cleanText(announcement.salary),

          stipend:
            cleanText(announcement.stipend),

          location:
            cleanText(announcement.location),

          graduationBatch:
            cleanText(announcement.graduationBatch),

          jobType:
            cleanText(announcement.jobType),

          workMode:
            cleanText(announcement.workMode),

          minimumCGPA:
            cleanText(announcement.minimumCGPA),

          selectionProcess:
            cleanText(announcement.selectionProcess),

          additionalDetails:
            getAdditionalDetails(
              announcement.additionalDetails
            ),

          attachments:
            Array.isArray(announcement.attachments)
              ? announcement.attachments
              : [],

          opportunityStatus,

          studentStatus:
            response?.status || "Pending",

          reminderEnabled:
            response?.reminderEnabled ?? true,

          reminderSentAt:
            response?.reminderSentAt || null,

          applicationUrl:
            safeApplicationUrl,

          isExpired:
            opportunityStatus === "Expired",

          canApply:
            opportunityStatus === "Open" &&
            Boolean(safeApplicationUrl),
        };
      }
    );

    return res.status(200).json({
      success: true,
      count: results.length,
      announcements: results,
    });
  } catch (error) {
    console.error(
      "Get Telegram announcements error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch Telegram announcements",
    });
  }
};

// ========================================
// UPDATE STUDENT RESPONSE
// ========================================

const updateTelegramOpportunityResponse =
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { announcementId } = req.params;
      const { action } = req.body || {};

      if (
        !mongoose.Types.ObjectId.isValid(
          announcementId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid Telegram announcement ID",
        });
      }

      if (!VALID_ACTIONS.includes(action)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid opportunity action",
          allowedActions: VALID_ACTIONS,
        });
      }

      const announcement =
        await TelegramAnnouncement.findById(
          announcementId
        );

      if (
        !announcement ||
        announcement.processingStatus !== "Processed" ||
        announcement.announcementType !== "New Opportunity"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Telegram opportunity not found",
        });
      }

      const opportunityStatus =
        getOpportunityStatus(announcement);

      const safeUrl =
        getSafeApplicationUrl(
          announcement.applicationUrl
        );

      if (action === "Application Opened") {
        if (!safeUrl) {
          return res.status(400).json({
            success: false,
            message:
              "No valid application link is available",
          });
        }

        if (opportunityStatus !== "Open") {
          return res.status(409).json({
            success: false,
            message:
              "Registration is not confirmed open for this opportunity",
            opportunityStatus,
          });
        }
      }

      // Protect applications that already have
      // placement progress or history.
      const existingApplication =
        await PlacementApplication.findOne({
          student: studentId,
          $or: [
            {
              telegramAnnouncement:
                announcement._id,
            },
            ...(announcement.opportunity
              ? [
                  {
                    opportunity:
                      announcement.opportunity,
                  },
                ]
              : []),
          ],
        });

      if (
        existingApplication &&
        existingApplication.currentStage !==
          "Interested" &&
        action !== "Applied"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This opportunity already has an application history. Update it in My Applications.",
        });
      }

      const now = new Date();

      // Create or update the placement tracker
      // when student confirms applying.
      if (action === "Applied") {
        if (existingApplication) {
          if (
            existingApplication.currentStage ===
            "Interested"
          ) {
            existingApplication.currentStage =
              "Applied";

            existingApplication.appliedAt =
              existingApplication.appliedAt || now;

            existingApplication.stageHistory.push({
              stage: "Applied",
              changedAt: now,
              note:
                "Application confirmed from Telegram Opportunities",
            });

            await existingApplication.save();
          }
        } else {
          try {
            await PlacementApplication.create({
              student: studentId,
              ...(announcement.opportunity
                ? {
                    opportunity:
                      announcement.opportunity,
                  }
                : {
                    telegramAnnouncement:
                      announcement._id,
                  }),
              currentStage: "Applied",
              appliedAt: now,
              stageHistory: [
                {
                  stage: "Applied",
                  changedAt: now,
                  note:
                    "Application confirmed from Telegram Opportunities",
                },
              ],
            });
          } catch (error) {
            if (error.code !== 11000) {
              throw error;
            }
          }
        }
      }

      const update = {
        status: action,

        reminderEnabled:
          action !== "Applied" &&
          action !== "Not Interested" &&
          opportunityStatus === "Open",
      };

      if (action === "Application Opened") {
        update.applicationOpenedAt = now;
      }

      if (action === "Applied") {
        update.appliedAt = now;
      }

      if (
        action === "Interested" ||
        action === "Application Opened"
      ) {
        update.reminderSentAt = null;
      }

      const response =
        await OpportunityResponse.findOneAndUpdate(
          {
            student: studentId,
            announcement: announcementId,
          },
          {
            $set: update,
            $setOnInsert: {
              student: studentId,
              announcement: announcementId,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          `Opportunity marked as ${action}`,
        response,
        opportunityStatus,
        applicationUrl:
          action === "Application Opened"
            ? safeUrl
            : null,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Opportunity response conflict. Please retry.",
        });
      }

      console.error(
        "Update Telegram opportunity response error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update opportunity response",
      });
    }
  };

module.exports = {
  getTelegramAnnouncements,
  updateTelegramOpportunityResponse,
};
