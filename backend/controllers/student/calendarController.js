const mongoose = require("mongoose");

const CalendarEvent = require(
  "../../models/CalendarEvent"
);


const {
  createNotification,
} = require("../../services/notificationService");


// ========================================
// CREATE CALENDAR EVENT
// MODULE 11
// ========================================

const createCalendarEvent = async (req, res) => {
  try {
    const {
      title,
      description = "",
      eventType = "General",
      startDate,
      endDate = null,
      allDay = false,
      reminderEnabled = true,
      reminderMinutesBefore = 1440,
    } = req.body;

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Event title is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Event start date is required",
      });
    }

    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    let parsedEndDate = null;

    if (endDate) {
      parsedEndDate = new Date(endDate);

      if (Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }

      if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({
          success: false,
          message:
            "End date cannot be before start date",
        });
      }
    }

    const event = await CalendarEvent.create({
      user: req.user.id,

      title: title.trim(),

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      eventType,

      startDate: parsedStartDate,

      endDate: parsedEndDate,

      allDay: Boolean(allDay),

      status: "Scheduled",

      reminderEnabled:
        Boolean(reminderEnabled),

      reminderMinutesBefore:
        reminderEnabled
          ? Number(reminderMinutesBefore)
          : 0,
    });

    return res.status(201).json({
      success: true,
      message:
        "Calendar event created successfully",
      event,
    });
  } catch (error) {
    console.error(
      "Create calendar event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create calendar event",
      error: error.message,
    });
  }
};

// ========================================
// GET CALENDAR EVENTS
// ========================================

const getCalendarEvents = async (req, res) => {
  try {
    const {
      eventType,
      status,
      startDate,
      endDate,
    } = req.query;

    const filter = {
      user: req.user.id,
    };

    if (eventType) {
      filter.eventType = eventType;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.startDate = {};

      if (startDate) {
        const parsedStart = new Date(startDate);

        if (Number.isNaN(parsedStart.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date filter",
          });
        }

        filter.startDate.$gte = parsedStart;
      }

      if (endDate) {
        const parsedEnd = new Date(endDate);

        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date filter",
          });
        }

        filter.startDate.$lte = parsedEnd;
      }
    }

    const events = await CalendarEvent.find(
      filter
    ).sort({
      startDate: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message:
        "Calendar events fetched successfully",
      count: events.length,
      filters: {
        eventType: eventType || "All",
        status: status || "All",
        startDate: startDate || null,
        endDate: endDate || null,
      },
      events,
    });
  } catch (error) {
    console.error(
      "Get calendar events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch calendar events",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE CALENDAR EVENT
// ========================================

const getCalendarEventById = async (
  req,
  res
) => {
  try {
    const { eventId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID",
      });
    }

    const event = await CalendarEvent.findOne({
      _id: eventId,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Calendar event fetched successfully",
      event,
    });
  } catch (error) {
    console.error(
      "Get calendar event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch calendar event",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE CALENDAR EVENT
// ========================================

const updateCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID",
      });
    }

    const event = await CalendarEvent.findOne({
      _id: eventId,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      allDay,
      status,
      reminderEnabled,
      reminderMinutesBefore,
    } = req.body;

    // ----------------------------------------
    // TITLE
    // ----------------------------------------

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Event title cannot be empty",
        });
      }

      event.title = title.trim();
    }

    // ----------------------------------------
    // DESCRIPTION
    // ----------------------------------------

    if (description !== undefined) {
      event.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    // ----------------------------------------
    // EVENT TYPE
    // ----------------------------------------

    if (eventType !== undefined) {
      event.eventType = eventType;
    }

    // ----------------------------------------
    // START DATE
    // ----------------------------------------

    let finalStartDate = event.startDate;

    if (startDate !== undefined) {
      const parsedStartDate = new Date(startDate);

      if (
        Number.isNaN(parsedStartDate.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      finalStartDate = parsedStartDate;
    }

    // ----------------------------------------
    // END DATE
    // ----------------------------------------

    let finalEndDate = event.endDate;

    if (endDate !== undefined) {
      if (
        endDate === null ||
        endDate === ""
      ) {
        finalEndDate = null;
      } else {
        const parsedEndDate = new Date(endDate);

        if (
          Number.isNaN(parsedEndDate.getTime())
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        finalEndDate = parsedEndDate;
      }
    }

    if (
      finalEndDate &&
      finalEndDate < finalStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be before start date",
      });
    }

    event.startDate = finalStartDate;
    event.endDate = finalEndDate;

    // ----------------------------------------
    // ALL DAY
    // ----------------------------------------

    if (allDay !== undefined) {
      event.allDay = Boolean(allDay);
    }

    // ----------------------------------------
    // STATUS
    // ----------------------------------------

    if (status !== undefined) {
      event.status = status;
    }

    // ----------------------------------------
    // REMINDER
    // ----------------------------------------

    if (reminderEnabled !== undefined) {
      event.reminderEnabled =
        Boolean(reminderEnabled);

      if (!event.reminderEnabled) {
        event.reminderMinutesBefore = 0;
      }
    }

    if (
      reminderMinutesBefore !== undefined &&
      event.reminderEnabled
    ) {
      const reminderMinutes = Number(
        reminderMinutesBefore
      );

      if (
        !Number.isFinite(reminderMinutes) ||
        reminderMinutes < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reminder minutes must be a non-negative number",
        });
      }

      event.reminderMinutesBefore =
        reminderMinutes;
    }

    // ----------------------------------------
// RESET SENT REMINDER WHEN SCHEDULE CHANGES
// ----------------------------------------

if (
  startDate !== undefined ||
  reminderEnabled !== undefined ||
  reminderMinutesBefore !== undefined
) {
  event.reminderSentAt = null;
}

    await event.save();

    return res.status(200).json({
      success: true,
      message:
        "Calendar event updated successfully",
      event,
    });
  } catch (error) {
    console.error(
      "Update calendar event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update calendar event",
      error: error.message,
    });
  }
};


// ========================================
// DELETE CALENDAR EVENT
// ========================================

const deleteCalendarEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar event ID",
      });
    }

    const event =
      await CalendarEvent.findOneAndDelete({
        _id: eventId,
        user: req.user.id,
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Calendar event deleted successfully",
      eventId: event._id,
    });
  } catch (error) {
    console.error(
      "Delete calendar event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete calendar event",
      error: error.message,
    });
  }
};


// ========================================
// GET UPCOMING CALENDAR EVENTS
// ========================================

const getUpcomingCalendarEvents = async (
  req,
  res
) => {
  try {
    const now = new Date();

    let limit = parseInt(req.query.limit, 10);

    if (
      Number.isNaN(limit) ||
      limit < 1
    ) {
      limit = 5;
    }

    if (limit > 20) {
      limit = 20;
    }

    const events = await CalendarEvent.find({
      user: req.user.id,

      status: "Scheduled",

      startDate: {
        $gte: now,
      },
    })
      .sort({
        startDate: 1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,

      message:
        "Upcoming calendar events fetched successfully",

      count: events.length,

      events,
    });
  } catch (error) {
    console.error(
      "Get upcoming calendar events error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch upcoming calendar events",

      error: error.message,
    });
  }
};


// ========================================
// GET DUE CALENDAR REMINDERS
// ========================================

const getDueCalendarReminders = async (
  req,
  res
) => {
  try {
    const now = new Date();

    const events = await CalendarEvent.find({
  user: req.user.id,
  status: "Scheduled",
  reminderEnabled: true,
  reminderSentAt: null,
  startDate: {
    $gte: now,
  },
}).sort({
  startDate: 1,
});

    const dueReminders = events
      .map((event) => {
        const reminderTime = new Date(
          event.startDate.getTime() -
            event.reminderMinutesBefore *
              60 *
              1000
        );

        return {
          event,
          reminderTime,
        };
      })
      .filter(({ reminderTime }) => {
        return reminderTime <= now;
      });

      for (const { event, reminderTime } of dueReminders) {
  await createNotification({
    user: req.user.id,

    title: `Upcoming ${event.eventType}`,

    message: `${event.title} is coming up soon.`,

    type: "Calendar",

    priority: "High",

    relatedEntityType: "CalendarEvent",

    relatedEntityId: event._id,

    actionUrl:
      event.actionUrl ||
      `/calendar/events/${event._id}`,

    scheduledFor: reminderTime,

    metadata: {
      eventType: event.eventType,
      eventTitle: event.title,
      startDate: event.startDate,
    },
  });

  event.reminderSentAt = now;

  await event.save();
}

    return res.status(200).json({
      success: true,

      message:
        "Due calendar reminders fetched successfully",

      count: dueReminders.length,

      reminders: dueReminders,
    });
  } catch (error) {
    console.error(
      "Get due calendar reminders error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch due calendar reminders",

      error: error.message,
    });
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingCalendarEvents,
  getDueCalendarReminders,
};