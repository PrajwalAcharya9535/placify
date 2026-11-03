
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

const MESSAGE_IDS = [
  22132,
  22074,
  22061,
  21987,
  21946,
  21897,
  21881,
  22135,
  22118,
  22085,
  22083,
  21967,
  21961,
  21926,
  21917,
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const messages = await TelegramAnnouncement.find({
      messageId: { $in: MESSAGE_IDS },
      processingStatus: "Processed",
    })
      .sort({ messageId: -1 })
      .lean();

    for (const item of messages) {
      console.log("\n" + "=".repeat(70));
      console.log("MESSAGE ID:", item.messageId);
      console.log("COMPANY:", item.companyName);
      console.log("ROLE:", item.jobRole);
      console.log("APPLICATION URL:", item.applicationUrl);
      console.log("TELEGRAM DATE:", item.telegramDate);
      console.log("-".repeat(70));
      console.log(item.messageText || "NO MESSAGE TEXT");
    }

    console.log("\nMessages found:", messages.length);
    console.log("Database changes: NONE");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
