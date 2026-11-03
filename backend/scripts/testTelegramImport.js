
require("dotenv").config();

// ========================================
// DNS CONFIGURATION
// Fix MongoDB Atlas SRV resolution in Node.js
// ========================================

const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// ========================================
// IMPORTS
// ========================================

const mongoose = require("mongoose");

const {
  importTelegramMessages,
} = require("../services/telegramIngestionService");

// ========================================
// TELEGRAM IMPORT TEST
// ========================================

async function main() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is missing from backend/.env"
    );
  }

  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");

    // Import the latest 20 Telegram messages
    const result = await importTelegramMessages(20);

    console.log("\nTelegram import completed!");
    console.log("Group:", result.group);
    console.log("Messages fetched:", result.fetched);
    console.log("New messages imported:", result.imported);
    console.log("Existing messages skipped:", result.skipped);

  } finally {
    // Disconnect safely
    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  }
}

// ========================================
// EXECUTION
// ========================================

main().catch((error) => {
  console.error("Import test failed:", error.message);
  process.exitCode = 1;
});
