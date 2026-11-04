
const mongoose = require("mongoose");

const User = require("../models/User");
const Notification = require("../models/Notification");
const PlacementOpportunity = require("../models/PlacementOpportunity");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");
const PlacementApplication = require("../models/PlacementApplication");
const CalendarEvent = require("../models/CalendarEvent");

// ========================================
// PLACIFY AUTOMATIC REMINDER SCHEDULER
// MODULE 11 - NOTIFICATIONS
// ========================================

const ONE_HOUR = 60 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000;

// Prevent overlapping runs in one process.
let isRunning = false;
let schedulerInterval = null;

// ========================================
// DATABASE DUPLICATE PROTECTION
// ========================================

const ensureReminderIndex = async () => {
  await Notification.collection.createIndex(
    {
      user: 1,
      "metadata.reminderKey": 1,
    },
    {
      unique: true,
      name: "unique_placify_reminder_per_user",
      partialFilterExpression: {
        "metadata.reminderKey": {
          $type: "string",
        },
      },
    }
  );
};

// ========================================
// CREATE REMINDER ONCE
// ========================================

const createReminderOnce = async ({
  user,
  title,
  message,
  type,
  reminderKey,
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl,
  scheduledFor,
  metadata = {},
}) => {
  try {
    const result = await Notification.updateOne(
      {
        user,
        "metadata.reminderKey": reminderKey,
      },
      {
        $setOnInsert: {
          user,
          title,
          message,
          type,
          priority: "High",
          isRead: false,
          readAt: null,
          relatedEntityType,
          relatedEntityId,
          actionUrl,
          scheduledFor,
          metadata: {
            ...metadata,
            source: "PlacifyReminderScheduler",
            reminderKey,
          },
        },
      },
      {
        upsert: true,
      }
    );

    if (result.upsertedCount !== 1) {
      return false;
    }

    const notification = await Notification.findOne({
      user,
      "metadata.reminderKey": reminderKey,
    });

    const io = global.placifySocketIO;

    if (io && notification) {
      io.to(`user:${String(user)}`).emit(
        "notification:new",
        notification
      );
    }

    return true;
  } catch (error) {
    // Another scheduler may have inserted
    // the same reminder simultaneously.
    if (error.code === 11000) {
      return false;
    }

    throw error;
  }
};

// ========================================
// CHECK WHETHER REMINDER IS DUE
// ========================================

const getReminderWindow = () => {
  const now = new Date();

  return {
    now,
    latestDeadline: new Date(
      now.getTime() + ONE_HOUR
    ),
  };
};

// ========================================
// REGULAR PLACEMENT DEADLINES
// ========================================

const checkRegularDeadlines = async () => {
  const { now, latestDeadline } =
    getReminderWindow();

  const opportunities =
    await PlacementOpportunity.find({
      source: "Admin",
      status: "Active",
      isActive: true,
      applicationDeadline: {
        $gt: now,
        $lte: latestDeadline,
      },
    }).lean();

  let created = 0;

  for (const opportunity of opportunities) {
    const deadline = new Date(
      opportunity.applicationDeadline
    );

    const reminderKey =
      `regular-deadline:${opportunity._id}:${deadline.getTime()}`;

    const students = User.find({
      role: "student",
    })
      .select("_id")
      .lean()
      .cursor();

    for await (const student of students) {
      // Skip students who have already
      // applied to this opportunity.
      const existingApplication =
        await PlacementApplication.exists({
          student: student._id,
          opportunity: opportunity._id,
          currentStage: {
            $nin: ["Interested"],
          },
        });

      if (existingApplication) {
        continue;
      }

      const wasCreated =
        await createReminderOnce({
          user: student._id,

          title:
            `Application Deadline: ${opportunity.companyName}`,

          message:
            `${opportunity.jobRole} registration closes within one hour.`,

          type: "Deadline",

          reminderKey,

          relatedEntityType:
            "PlacementOpportunity",

          relatedEntityId:
            opportunity._id,

          actionUrl:
            "/student/opportunities",

          scheduledFor: new Date(
            deadline.getTime() - ONE_HOUR
          ),

          metadata: {
            opportunityId: String(
              opportunity._id
            ),
            deadline,
          },
        });

      if (wasCreated) {
        created++;
      }
    }
  }

  return created;
};

// ========================================
// TELEGRAM REGISTRATION DEADLINES
// ========================================

const checkTelegramDeadlines = async () => {
  const { now, latestDeadline } =
    getReminderWindow();

  const announcements =
    await TelegramAnnouncement.find({
      registrationDeadline: {
        $gt: now,
        $lte: latestDeadline,
      },

      deadlineTimeConfirmed: true,

      announcementType: {
        $ne: "Drive Cancelled",
      },

      processingStatus: "Processed",
    }).lean();

  let created = 0;

  for (const announcement of announcements) {
    const deadline = new Date(
      announcement.registrationDeadline
    );

    const reminderKey =
      `telegram-deadline:${announcement._id}:${deadline.getTime()}`;

    const students = User.find({
      role: "student",
    })
      .select("_id")
      .lean()
      .cursor();

    for await (const student of students) {
      const existingApplication =
        await PlacementApplication.exists({
          student: student._id,
          telegramAnnouncement:
            announcement._id,
          currentStage: {
            $nin: ["Interested"],
          },
        });

      if (existingApplication) {
        continue;
      }

      const wasCreated =
        await createReminderOnce({
          user: student._id,

          title:
            `Telegram Deadline: ${
              announcement.companyName ||
              "Placement Opportunity"
            }`,

          message:
            `Registration closes within one hour. Apply before the deadline.`,

          type: "Deadline",

          reminderKey,

          actionUrl:
            "/student/opportunities",

          scheduledFor: new Date(
            deadline.getTime() - ONE_HOUR
          ),

          metadata: {
            announcementId: String(
              announcement._id
            ),
            deadline,
          },
        });

      if (wasCreated) {
        created++;
      }
    }
  }

  return created;
};

// ========================================
// UPCOMING PLACEMENT ROUND REMINDERS
// ========================================

const checkUpcomingRounds = async () => {
  const { now, latestDeadline } =
    getReminderWindow();

  const applications =
    await PlacementApplication.find({
      isActive: true,

      currentStage: {
        $nin: [
          "Interested",
          "Rejected",
          "Selected",
          "Offer",
          "Placed",
        ],
      },

      nextRoundDate: {
        $gt: now,
        $lte: latestDeadline,
      },
    })
      .populate(
        "opportunity",
        "companyName jobRole"
      )
      .populate(
        "telegramAnnouncement",
        "companyName jobRole"
      );

  let created = 0;

  for (const application of applications) {
    const roundDate = new Date(
      application.nextRoundDate
    );

    const company =
      application.opportunity?.companyName ||
      application.telegramAnnouncement?.companyName ||
      "Your Company";

    const reminderKey =
      `upcoming-round:${application._id}:${roundDate.getTime()}`;

    const wasCreated =
      await createReminderOnce({
        user: application.student,

        title:
          `Upcoming Placement Round: ${company}`,

        message:
          `Your next placement round is scheduled within one hour. Please be prepared.`,

        type: "Interview",

        reminderKey,

        relatedEntityType:
          "PlacementApplication",

        relatedEntityId:
          application._id,

        actionUrl:
          "/student/applications",

        scheduledFor: new Date(
          roundDate.getTime() - ONE_HOUR
        ),

        metadata: {
          applicationId: String(
            application._id
          ),
          roundDate,
          stage: application.currentStage,
        },
      });

    if (wasCreated) {
      created++;
    }
  }

  return created;
};

// ========================================
// SCHEDULED CALENDAR EVENT REMINDERS
// ========================================

const checkCalendarReminders = async () => {
  const now = new Date();

  // A reminder is due when:
  // startDate - reminderMinutesBefore <= now < startDate.
  // Filter in JS because each event has its own lead time.
  const events = CalendarEvent.find({
    status: "Scheduled",
    reminderEnabled: true,
    reminderSentAt: null,
    startDate: { $gt: now },
  }).cursor();

  let created = 0;

  for await (const event of events) {
    const start = new Date(event.startDate);
    const minutesBefore = Number(event.reminderMinutesBefore ?? 1440);

    if (!Number.isFinite(minutesBefore) || minutesBefore < 0) {
      continue;
    }

    const reminderTime = new Date(
      start.getTime() - minutesBefore * 60 * 1000
    );

    if (reminderTime > now) {
      continue;
    }

    const reminderKey =
      `calendar-event:${event._id}:${start.getTime()}:${minutesBefore}`;

    const wasCreated = await createReminderOnce({
      user: event.user,
      title: `Calendar Reminder: ${event.title}`,
      message: `${event.title} is scheduled for ${start.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })}.`,
      type: "Calendar",
      reminderKey,
      relatedEntityType: event.relatedEntityType || null,
      relatedEntityId: event.relatedEntityId || null,
      actionUrl: event.actionUrl || "/student/calendar",
      scheduledFor: reminderTime,
      metadata: {
        calendarEventId: String(event._id),
        eventType: event.eventType,
        startDate: start,
      },
    });

    // Both a new insertion and an already-existing reminderKey
    // mean the reminder has been delivered by this scheduler.
    await CalendarEvent.updateOne(
      {
        _id: event._id,
        status: "Scheduled",
        reminderEnabled: true,
        reminderSentAt: null,
        startDate: event.startDate,
        reminderMinutesBefore: event.reminderMinutesBefore,
      },
      { $set: { reminderSentAt: new Date() } }
    );

    if (wasCreated) {
      created++;
    }
  }

  return created;
};

// ========================================
// RUN ALL REMINDER CHECKS
// ========================================

const runPlacementReminderChecks = async () => {
  if (isRunning) {
    return;
  }

  if (
    mongoose.connection.readyState !== 1
  ) {
    return;
  }

  isRunning = true;

  try {
    const regular =
      await checkRegularDeadlines();

    const telegram =
      await checkTelegramDeadlines();

    const rounds =
      await checkUpcomingRounds();

    const calendar =
      await checkCalendarReminders();

    if (regular || telegram || rounds || calendar) {
      console.log(
        "[Placify Reminders]",
        {
          regular,
          telegram,
          rounds,
          calendar,
        }
      );
    }
  } catch (error) {
    console.error(
      "Placify reminder scheduler error:",
      error
    );
  } finally {
    isRunning = false;
  }
};

// ========================================
// START REMINDER SCHEDULER
// ========================================

const startPlacementReminderScheduler =
  async () => {
    if (schedulerInterval) {
      return;
    }

    await ensureReminderIndex();

    await runPlacementReminderChecks();

    schedulerInterval = setInterval(
      runPlacementReminderChecks,
      CHECK_INTERVAL
    );

    console.log(
      "Placify reminder scheduler started"
    );
  };

// ========================================
// STOP REMINDER SCHEDULER
// ========================================

const stopPlacementReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  startPlacementReminderScheduler,
  stopPlacementReminderScheduler,
  runPlacementReminderChecks,
};
