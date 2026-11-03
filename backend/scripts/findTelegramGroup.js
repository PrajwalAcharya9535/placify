
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

async function main() {
  const sessionPath = path.join(__dirname, ".telegram-session");

  if (!fs.existsSync(sessionPath)) {
    throw new Error("Telegram session not found. Log in first.");
  }

  const client = new TelegramClient(
    new StringSession(fs.readFileSync(sessionPath, "utf8").trim()),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );

  try {
    await client.connect();

    const dialogs = await client.getDialogs({ limit: 500 });

    const matches = dialogs.filter((dialog) =>
      (dialog.title || "").toLowerCase().includes("engineering 2026")
    );

    if (matches.length === 0) {
      console.log("No matching group found in the first 500 dialogs.");
      return;
    }

    for (const dialog of matches) {
      console.log("Group name:", dialog.title);
      console.log("Group ID:", dialog.id.toString());
      console.log("------------------------");
    }
  } finally {
    await client.disconnect();
  }
}

main().catch((error) => {
  console.error("Group search failed:", error.message);
  process.exitCode = 1;
});
