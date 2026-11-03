
require("dotenv").config();

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

const {
  getOpportunityStatus,
  getTelegramOpportunities,
} = require(
  "../services/telegramOpportunityStatusService"
);

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    // Test the status logic independently of MongoDB data.
    const fixedNow = new Date("2026-11-04T00:00:00.000Z");

    const testCases = [
      {
        name: "Future deadline",
        announcement: {
          processingStatus: "Processed",
          announcementType: "New Opportunity",
          registrationDeadline: new Date(
            "2026-11-10T09:30:00.000Z"
          ),
          deadlineTimeConfirmed: true,
        },
        expected: "Open",
      },
      {
        name: "Past deadline",
        announcement: {
          processingStatus: "Processed",
          announcementType: "New Opportunity",
          registrationDeadline: new Date(
            "2026-11-02T05:30:00.000Z"
          ),
          deadlineTimeConfirmed: true,
        },
        expected: "Expired",
      },
      {
        name: "Missing deadline",
        announcement: {
          processingStatus: "Processed",
          announcementType: "New Opportunity",
          registrationDeadline: null,
          deadlineTimeConfirmed: false,
        },
        expected: "Deadline Unknown",
      },
      {
        name: "Unconfirmed deadline",
        announcement: {
          processingStatus: "Processed",
          announcementType: "New Opportunity",
          registrationDeadline: new Date(
            "2026-11-10T09:30:00.000Z"
          ),
          deadlineTimeConfirmed: false,
        },
        expected: "Deadline Unconfirmed",
      },
      {
        name: "Needs review",
        announcement: {
          processingStatus: "Needs Review",
          announcementType: "New Opportunity",
        },
        expected: "Needs Review",
      },
    ];

    console.log("\nSTATUS LOGIC TESTS");

    let passed = 0;

    for (const test of testCases) {
      const actual = getOpportunityStatus(
        test.announcement,
        fixedNow
      );

      const success = actual === test.expected;

      if (success) passed++;

      console.log(
        `${success ? "PASS" : "FAIL"} | ${test.name} | ${actual}`
      );
    }

    console.log(
      `\nTests passed: ${passed}/${testCases.length}`
    );

    if (passed !== testCases.length) {
      throw new Error("Some status logic tests failed.");
    }

    // Read actual saved announcements.
    console.log("\nSAVED TELEGRAM OPPORTUNITIES");

    const opportunities = await getTelegramOpportunities(100);

    const counts = {};

    for (const opportunity of opportunities) {
      const status = opportunity.opportunityStatus;

      counts[status] = (counts[status] || 0) + 1;

      console.log("------------------------------");
      console.log("Message ID:", opportunity.messageId);
      console.log(
        "Company:",
        opportunity.companyName || "[Not found]"
      );
      console.log("Status:", status);
      console.log(
        "Deadline:",
        opportunity.registrationDeadline
          ? new Date(
              opportunity.registrationDeadline
            ).toISOString()
          : "[Not found]"
      );
    }

    console.log("\nSTATUS SUMMARY");
    console.log("Total:", opportunities.length);
    console.log("Open:", counts.Open || 0);
    console.log("Expired:", counts.Expired || 0);
    console.log(
      "Deadline Unknown:",
      counts["Deadline Unknown"] || 0
    );
    console.log(
      "Deadline Unconfirmed:",
      counts["Deadline Unconfirmed"] || 0
    );

    console.log("\nTest completed successfully.");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

main().catch((error) => {
  console.error("Test failed:", error.message);
  process.exitCode = 1;
});
