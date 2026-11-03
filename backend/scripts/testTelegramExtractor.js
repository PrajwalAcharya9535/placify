
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

const {
  processTelegramAnnouncements,
} = require(
  "../services/telegramAnnouncementExtractor"
);

async function main() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully.");

    // Process up to 100 pending Telegram messages.
    const result = await processTelegramAnnouncements(100);

    console.log("\nAnnouncement extraction completed!");
    console.log("Messages examined:", result.examined);
    console.log("Processed opportunities:", result.processed);
    console.log("Needs review:", result.needsReview);
    console.log("Failed:", result.failed);

    // Show extracted results without full message text.
    const announcements = await TelegramAnnouncement.find({
      chatId: process.env.TELEGRAM_GROUP_ID,
    })
      .sort({ telegramDate: -1 })
      .limit(20)
      .select(
        "messageId companyName applicationUrl registrationDeadline deadlineTimeConfirmed announcementType processingStatus"
      )
      .lean();

    console.log("\nSaved announcement summaries:");

    for (const announcement of announcements) {
      console.log("------------------------------");
      console.log("Message ID:", announcement.messageId);
      console.log(
        "Company:",
        announcement.companyName || "[Not identified]"
      );
      console.log(
        "Application link:",
        announcement.applicationUrl ? "[Found]" : "[Not found]"
      );
      console.log(
        "Deadline:",
        announcement.registrationDeadline || "[Not found]"
      );
      console.log(
        "Deadline time confirmed:",
        announcement.deadlineTimeConfirmed
      );
      console.log("Type:", announcement.announcementType);
      console.log("Status:", announcement.processingStatus);
    }
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected.");
  }
}

main().catch((error) => {
  console.error("Extractor test failed:", error.message);
  process.exitCode = 1;
});
