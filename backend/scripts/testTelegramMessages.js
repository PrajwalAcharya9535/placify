
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

  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!apiId || !apiHash || !groupId) {
    throw new Error("Missing Telegram configuration in .env");
  }

  const client = new TelegramClient(
    new StringSession(fs.readFileSync(sessionPath, "utf8").trim()),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  try {
    await client.connect();

    // Resolve the group through the authenticated account's dialogs.
    const dialogs = await client.getDialogs({ limit: 500 });

    const group = dialogs.find(
      (dialog) => dialog.id?.toString() === groupId
    );

    if (!group) {
      throw new Error("Configured Telegram group not found in dialogs.");
    }

    console.log("Connected to group:", group.title);

    // Read the latest 5 messages without sending anything.
    const messages = await client.getMessages(group.entity, {
      limit: 5,
    });

    console.log("Messages retrieved:", messages.length);

    for (const message of messages) {
      console.log("------------------------------");
      console.log("Message ID:", message.id);
      console.log("Date:", message.date);
      console.log("Text:", message.message || "[No text]");
      console.log("Has media:", Boolean(message.media));
    }
  } finally {
    await client.disconnect();
  }
}

main().catch((error) => {
  console.error("Telegram test failed:", error.message);
  process.exitCode = 1;
});
