
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

const {
  extractCompanyDetails,
  extractDeadline,
} = require(
  "../services/telegramAnnouncementExtractor"
);

const FIELDS = [
  "salary",
  "stipend",
  "location",
  "graduationBatch",
  "jobType",
  "workMode",
  "minimumCGPA",
  "selectionProcess",
];

function normalize(value) {
  return String(value || "").trim();
}

function getSafeCorrections(announcement, extracted) {
  const messageId = Number(announcement.messageId);
  const text = announcement.messageText || "";

  // Apply corrections only when the original
  // Telegram message supports the values.

  if (messageId === 22134) {
    const range = text.match(
      /\b5\s*(?:to|[-–])\s*7\s*LPA\b/i
    );

    if (range) {
      extracted.salary = range[0];
    }
  }

  if (messageId === 21926) {
    const fullTime = text.match(
      /full[\s-]*time\s*CTC\s*[:：-]?\s*(₹\s*[\d,]+)\s*(?:\/\s*month|per\s+month)/i
    );

    const internship = text.match(
      /(₹\s*[\d,]+)\s*(?:\/\s*month|per\s+month)\s*internship/i
    );

    if (fullTime) {
      extracted.salary =
        `${fullTime[1]} per month`;
    } else {
      // Avoid saving internship compensation
      // in the full-time salary field.
      extracted.salary = "";
    }

    if (internship) {
      extracted.stipend =
        `${internship[1]} per month (internship)`;
    }
  }

  return extracted;
}

async function main() {
  const apply = process.argv.includes("--apply");

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log(
      apply ? "MODE: APPLY" : "MODE: PREVIEW"
    );

    const announcements =
      await TelegramAnnouncement.find({
        processingStatus: "Processed",
        announcementType: "New Opportunity",
      }).sort({ telegramDate: -1, _id: -1 });

    let changed = 0;
    let unchanged = 0;
    let saved = 0;

    for (const announcement of announcements) {
      const text = announcement.messageText || "";

      const extracted = getSafeCorrections(
        announcement,
        extractCompanyDetails(text)
      );

      const updates = {};

      // Never overwrite existing nonempty values.
      for (const field of FIELDS) {
        const current = normalize(
          announcement[field]
        );

        const next = normalize(
          extracted[field]
        );

        if (!current && next) {
          updates[field] = next;
        }
      }

      if (
        (!announcement.additionalDetails ||
          announcement.additionalDetails.length === 0) &&
        Array.isArray(extracted.additionalDetails) &&
        extracted.additionalDetails.length
      ) {
        updates.additionalDetails =
          extracted.additionalDetails;
      }

      // Do not invent a registration cutoff time.
      if (!announcement.registrationDeadline) {
        const deadline = extractDeadline(text);

        if (
          deadline.registrationDeadline &&
          deadline.deadlineTimeConfirmed
        ) {
          updates.registrationDeadline =
            deadline.registrationDeadline;

          updates.deadlineTimeConfirmed = true;
        }
      }

      const fields = Object.keys(updates);

      if (!fields.length) {
        unchanged++;
        continue;
      }

      changed++;

      console.log(
        `\n${announcement.messageId} — ${announcement.companyName}`
      );

      for (const field of fields) {
        console.log(
          `${field}:`,
          updates[field]
        );
      }

      if (apply) {
        const result =
          await TelegramAnnouncement.updateOne(
            {
              _id: announcement._id,
              processingStatus: "Processed",
              announcementType: "New Opportunity",
            },
            { $set: updates }
          );

        if (result.modifiedCount === 1) {
          saved++;
        }
      }
    }

    console.log("\nSUMMARY");
    console.log("Total:", announcements.length);
    console.log("With new details:", changed);
    console.log("Unchanged:", unchanged);
    console.log("Records saved:", saved);
    console.log(
      "Database updated:",
      apply ? "YES" : "NO"
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
