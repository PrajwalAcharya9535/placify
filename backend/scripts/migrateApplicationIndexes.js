
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const collection =
      mongoose.connection.db.collection(
        "placementapplications"
      );

    const oldIndex = "student_1_opportunity_1";

    const indexes = await collection.indexes();

    if (indexes.some((index) => index.name === oldIndex)) {
      await collection.dropIndex(oldIndex);
      console.log("Old index removed.");
    }

    await collection.createIndex(
      { student: 1, opportunity: 1 },
      {
        name: oldIndex,
        unique: true,
        partialFilterExpression: {
          opportunity: { $type: "objectId" },
        },
      }
    );

    await collection.createIndex(
      { student: 1, telegramAnnouncement: 1 },
      {
        name: "student_1_telegramAnnouncement_1",
        unique: true,
        partialFilterExpression: {
          telegramAnnouncement: { $type: "objectId" },
        },
      }
    );

    console.log("Application indexes migrated successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
