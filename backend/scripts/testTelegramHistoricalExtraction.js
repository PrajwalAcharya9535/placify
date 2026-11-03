
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

const {
  processTelegramAnnouncements
} = require("../services/telegramAnnouncementExtractor");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let total = 0;
    let processed = 0;
    let needsReview = 0;
    let failed = 0;

    while (true) {
      const result = await processTelegramAnnouncements(100);

      if (result.examined === 0) break;

      total += result.examined;
      processed += result.processed;
      needsReview += result.needsReview;
      failed += result.failed;

      console.log(`Examined ${total} messages...`);
    }

    console.log("\nEXTRACTION RESULTS");
    console.log("Examined:", total);
    console.log("Processed:", processed);
    console.log("Needs Review:", needsReview);
    console.log("Failed:", failed);

    const opportunities = await TelegramAnnouncement.find({
      processingStatus: "Processed",
      announcementType: "New Opportunity"
    })
      .sort({ telegramDate: -1 })
      .select(
        "companyName jobRole salary stipend location registrationDeadline"
      )
      .lean();

    console.table(
      opportunities.map(item => ({
        company: item.companyName,
        role: item.jobRole,
        salary: item.salary || "Not announced",
        location: item.location || "Not specified"
      }))
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
