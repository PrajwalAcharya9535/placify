
require("dotenv").config();

const dns = require("dns");

// DNS configuration used in our previous
// successful MongoDB Atlas connection test.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const {
  importHistoricalTelegramMessages,
} = require("../services/telegramIngestionService");

// ========================================
// HISTORICAL IMPORT TEST
// ========================================

async function main() {
  try {
    console.log(
      "\nPLACIFY — HISTORICAL TELEGRAM IMPORT"
    );

    console.log(
      "Importing messages from 1 October 2026 onwards...\n"
    );

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    const result =
      await importHistoricalTelegramMessages(
        new Date("2026-10-01T00:00:00+05:30")
      );

    console.log("\nIMPORT RESULTS");
    console.log("----------------------------");

    console.log("Group:", result.group);
    console.log("Start date:", result.startDate);
    console.log("Messages fetched:", result.fetched);
    console.log("New messages imported:", result.imported);
    console.log("Existing/skipped:", result.skipped);
    console.log("Batches processed:", result.batches);
    console.log(
      "Reached October cutoff:",
      result.reachedStartDate
    );

    console.log("----------------------------");
    console.log("Historical import finished.");
  } catch (error) {
    console.error(
      "\nHistorical import failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
