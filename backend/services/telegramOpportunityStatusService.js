
const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

// ========================================
// TELEGRAM OPPORTUNITY STATUS SERVICE
// ========================================

function getOpportunityStatus(announcement, now = new Date()) {
  if (!announcement) {
    return "Needs Review";
  }

  if (
    announcement.processingStatus !== "Processed" ||
    announcement.announcementType !== "New Opportunity"
  ) {
    return "Needs Review";
  }

  const deadline = announcement.registrationDeadline;

  if (deadline) {
    const deadlineDate = new Date(deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
      return "Needs Review";
    }

    if (!announcement.deadlineTimeConfirmed) {
      return "Deadline Unconfirmed";
    }

    if (deadlineDate.getTime() <= now.getTime()) {
      return "Expired";
    }

    return "Open";
  }

  return "Deadline Unknown";
}

// ========================================
// GET PROCESSED TELEGRAM OPPORTUNITIES
// ========================================

async function getTelegramOpportunities(limit = 100) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    100
  );

  const announcements = await TelegramAnnouncement.find({
    processingStatus: "Processed",
    announcementType: "New Opportunity",
  })
    .sort({ telegramDate: -1 })
    .limit(safeLimit)
    .lean();

  const now = new Date();

  return announcements.map((announcement) => ({
    ...announcement,
    opportunityStatus: getOpportunityStatus(
      announcement,
      now
    ),
  }));
}

module.exports = {
  getOpportunityStatus,
  getTelegramOpportunities,
};
