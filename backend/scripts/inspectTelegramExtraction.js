
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const announcements = await TelegramAnnouncement.find({
      chatId: process.env.TELEGRAM_GROUP_ID,
      messageId: { $in: [22135, 22134] },
    })
      .select("messageId messageText companyName")
      .lean();

    for (const announcement of announcements) {
      console.log("\n==================================");
      console.log("MESSAGE ID:", announcement.messageId);
      console.log("EXTRACTED COMPANY:", announcement.companyName);
      console.log("ORIGINAL MESSAGE:");
      console.log(announcement.messageText);
      console.log("==================================");
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
});
