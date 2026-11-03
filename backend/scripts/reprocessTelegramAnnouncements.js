
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

const {
  isPlacementAnnouncement,
  extractCompanyName,
  extractJobRole,
  extractEligibility,
  extractApplicationUrl,
  extractDeadline,
} = require(
  "../services/telegramAnnouncementExtractor"
);

// ========================================
// REPROCESS VERIFIED TELEGRAM MESSAGES
// ========================================

const MESSAGE_IDS = [22134, 22135, 22152];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }

  if (!process.env.TELEGRAM_GROUP_ID) {
    throw new Error("TELEGRAM_GROUP_ID is missing.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    const announcements = await TelegramAnnouncement.find({
      chatId: process.env.TELEGRAM_GROUP_ID,
      messageId: { $in: MESSAGE_IDS },
    });

    console.log(
      "Announcements found:",
      announcements.length
    );

    for (const announcement of announcements) {
      const text = announcement.messageText || "";

      if (!isPlacementAnnouncement(text)) {
        console.log(
          `Message ${announcement.messageId}: Not classified as placement. Skipped.`
        );
        continue;
      }

      const deadline = extractDeadline(text);

      const companyName = extractCompanyName(text);
      const jobRole = extractJobRole(text);
      const eligibility = extractEligibility(text);
      const applicationUrl = extractApplicationUrl(text);

      // Require company and application link.
      const status =
        companyName && applicationUrl
          ? "Processed"
          : "Needs Review";

      await TelegramAnnouncement.updateOne(
        {
          _id: announcement._id,
        },
        {
          $set: {
            companyName,
            jobRole,
            eligibility,
            applicationUrl,
            registrationDeadline:
              deadline.registrationDeadline,
            deadlineTimeConfirmed:
              deadline.deadlineTimeConfirmed,
            announcementType: "New Opportunity",
            processingStatus: status,
          },
        }
      );

      console.log("------------------------------");
      console.log("Message ID:", announcement.messageId);
      console.log("Company:", companyName || "[Not found]");
      console.log("Job role:", jobRole || "[Not found]");
      console.log(
        "Application link:",
        applicationUrl ? "[Found]" : "[Not found]"
      );
      console.log(
        "Deadline:",
        deadline.registrationDeadline
          ? deadline.registrationDeadline.toISOString()
          : "[Not found]"
      );
      console.log("Status:", status);
    }

    console.log("\nReprocessing completed.");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

main().catch((error) => {
  console.error("Reprocessing failed:", error.message);
  process.exitCode = 1;
});
