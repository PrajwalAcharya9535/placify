
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

const {
  extractCompanyName,
  extractJobRole,
} = require("../services/telegramAnnouncementExtractor");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const announcements = await TelegramAnnouncement.find({
      processingStatus: "Processed",
      announcementType: "New Opportunity",
    })
      .sort({ telegramDate: -1 })
      .lean();

    const groups = new Map();

    for (const item of announcements) {
      const correctedCompany = extractCompanyName(
        item.messageText || ""
      );

      const correctedRole = extractJobRole(
        item.messageText || ""
      );

      const companyChanged =
        correctedCompany &&
        correctedCompany !== item.companyName;

      const roleChanged =
        correctedRole &&
        correctedRole !== item.jobRole;

      const key = [
        (correctedCompany || item.companyName || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
        (correctedRole || item.jobRole || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      ].join("|");

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(item.messageId);

      console.log("\nMessage:", item.messageId);
      console.log("Company:", item.companyName);
      console.log("Suggested company:", correctedCompany || "REVIEW");
      console.log("Role:", item.jobRole || "Not specified");
      console.log("Suggested role:", correctedRole || "REVIEW");

      if (companyChanged || roleChanged) {
        console.log("FLAG: Extraction differs");
      }
    }

    console.log("\nPOSSIBLE DUPLICATE POSTINGS");

    let duplicateGroups = 0;

    for (const [key, ids] of groups) {
      if (ids.length < 2) continue;

      duplicateGroups++;

      console.log({
        key,
        messageIds: ids,
      });
    }

    console.log("\nAUDIT SUMMARY");
    console.log("Opportunities:", announcements.length);
    console.log("Possible duplicate groups:", duplicateGroups);
    console.log("Database changes: NONE");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
