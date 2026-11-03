
const mongoose = require("mongoose");

const Notification = require(
  "../../models/Notification"
);

// ========================================
// GET STUDENT NOTIFICATIONS
// ========================================

const getNotifications = async (req, res) => {
  try {
    const {
      isRead,
      type,
      priority,
      limit = 50,
    } = req.query;

    const filter = {
      user: req.user.id,
    };

    // Optional read/unread filter
    if (isRead !== undefined) {
      if (isRead !== "true" && isRead !== "false") {
        return res.status(400).json({
          success: false,
          message:
            "isRead must be either true or false",
        });
      }

      filter.isRead = isRead === "true";
    }

    // Optional notification type filter
    if (type) {
      filter.type = type;
    }

    // Optional priority filter
    if (priority) {
      filter.priority = priority;
    }

    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be an integer between 1 and 100",
      });
    }

    const notifications =
      await Notification.find(filter)
        .sort({
          createdAt: -1,
        })
        .limit(parsedLimit);

    const unreadCount =
      await Notification.countDocuments({
        user: req.user.id,
        isRead: false,
      });

    const totalCount =
      await Notification.countDocuments({
        user: req.user.id,
      });

    res.status(200).json({
      success: true,
      message:
        "Notifications fetched successfully",

      summary: {
        total: totalCount,
        unread: unreadCount,
      },

      count: notifications.length,

      filters: {
        isRead:
          isRead !== undefined
            ? isRead === "true"
            : "All",

        type:
          type || "All",

        priority:
          priority || "All",
      },

      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// ========================================
// GET UNREAD NOTIFICATION COUNT
// ========================================

const getUnreadNotificationCount =
  async (req, res) => {
    try {
      const unreadCount =
        await Notification.countDocuments({
          user: req.user.id,
          isRead: false,
        });

      res.status(200).json({
        success: true,
        message:
          "Unread notification count fetched successfully",
        unreadCount,
      });
    } catch (error) {
      console.error(
        "Get unread notification count error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch unread notification count",
        error: error.message,
      });
    }
  };

// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

const markNotificationAsRead =
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID",
        });
      }

      const notification =
        await Notification.findOne({
          _id: notificationId,
          user: req.user.id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt =
          new Date();

        await notification.save();
      }

      res.status(200).json({
        success: true,
        message:
          "Notification marked as read successfully",
        notification,
      });
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark notification as read",
        error: error.message,
      });
    }
  };

// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      const now = new Date();

      const result =
        await Notification.updateMany(
          {
            user: req.user.id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: now,
            },
          }
        );

      res.status(200).json({
        success: true,
        message:
          "All notifications marked as read successfully",
        updatedCount:
          result.modifiedCount || 0,
      });
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark all notifications as read",
        error: error.message,
      });
    }
  };

// ========================================
// DELETE ONE NOTIFICATION
// ========================================

const deleteNotification =
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID",
        });
      }

      const notification =
        await Notification.findOneAndDelete({
          _id: notificationId,
          user: req.user.id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Notification deleted successfully",
        notificationId:
          notification._id,
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete notification",
        error: error.message,
      });
    }
  };

// ========================================
// GET TELEGRAM OPPORTUNITY UNREAD COUNT
// ========================================

const getTelegramOpportunityUnreadCount =
  async (req, res) => {
    try {
      const unreadCount =
        await Notification.countDocuments({
          user: req.user.id,
          type: "Opportunity",
          "metadata.source": "Telegram",
          isRead: false,
        });

      return res.status(200).json({
        success: true,
        message:
          "Telegram opportunity unread count fetched successfully",
        unreadCount,
      });
    } catch (error) {
      console.error(
        "Telegram opportunity unread count error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch Telegram opportunity unread count",
      });
    }
  };

// ========================================
// MARK TELEGRAM OPPORTUNITIES AS READ
// ========================================

const markTelegramOpportunitiesAsRead =
  async (req, res) => {
    try {
      const now = new Date();

      const result =
        await Notification.updateMany(
          {
            user: req.user.id,
            type: "Opportunity",
            "metadata.source": "Telegram",
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: now,
            },
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Telegram opportunity notifications marked as read",
        updatedCount:
          result.modifiedCount || 0,
      });
    } catch (error) {
      console.error(
        "Mark Telegram opportunities as read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark Telegram opportunities as read",
      });
    }
  };

// ========================================
// EXPORTS
// ========================================

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getTelegramOpportunityUnreadCount,
  markTelegramOpportunitiesAsRead,
};
