
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

const CORRECTIONS = {
  22132: {
    companyName: "Cloud Analogy",
    jobRole: "Software Trainee",
  },
  22074: {
    companyName: "Enterprise IT Solutions (EITS)",
  },
  22061: {
    companyName: "HARTING India Pvt. Ltd.",
  },
  21987: {
    companyName: "Surya Financial Technologies Private Limited",
  },
  21946: {
    companyName: "MyRank Education Pvt. Ltd",
  },
  21897: {
    companyName: "Skillentrix Technologies",
  },
};

const NEEDS_REVIEW = [
  21881, // Sonata Software: role not confirmed
];

const DUPLICATES = [
  22118, // Iron Mountain: keep newer 22135
  22083, // Vibran Technologies: keep newer 22085
  21961, // NoBroker: keep newer 21967
  21917, // Plazza!: keep newer 21926
];

async function main() {
  const apply = process.argv.includes("--apply");

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log(
      apply
        ? "MODE: APPLY VERIFIED CORRECTIONS"
        : "MODE: PREVIEW ONLY"
    );

    let found = 0;
    let missing = 0;

    const allIds = [
      ...Object.keys(CORRECTIONS).map(Number),
      ...NEEDS_REVIEW,
      ...DUPLICATES,
    ];

    for (const messageId of allIds) {
      const item = await TelegramAnnouncement.findOne({
        messageId,
        processingStatus: "Processed",
        announcementType: "New Opportunity",
      });

      if (!item) {
        console.log(`SKIPPED ${messageId}: Record not found`);
        missing++;
        continue;
      }

      found++;

      const changes = {};

      if (CORRECTIONS[messageId]) {
        Object.assign(changes, CORRECTIONS[messageId]);
      }

      if (NEEDS_REVIEW.includes(messageId)) {
        changes.processingStatus = "Needs Review";
      }

      if (DUPLICATES.includes(messageId)) {
        changes.processingStatus = "Needs Review";
      }

      console.log(`\nMessage ${messageId}`);
      console.log("Current company:", item.companyName);
      console.log("Current role:", item.jobRole || "Not specified");
      console.log("Changes:", changes);

      if (apply) {
        Object.assign(item, changes);
        await item.save();
      }
    }

    console.log("\nSUMMARY");
    console.log("Records found:", found);
    console.log("Records missing:", missing);
    console.log("Database updated:", apply ? "YES" : "NO");

    if (!apply) {
      console.log(
        "\nReview the changes before applying."
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
