
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const input = require("input");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!Number.isSafeInteger(apiId) || !apiHash) {
    throw new Error("Missing Telegram API credentials in backend/.env");
  }

  const sessionPath = path.join(__dirname, ".telegram-session");
  const savedSession = fs.existsSync(sessionPath)
    ? fs.readFileSync(sessionPath, "utf8").trim()
    : "";

  const client = new TelegramClient(
    new StringSession(savedSession),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  try {
    await client.start({
      phoneNumber: async () =>
        input.text("Telegram phone number (with country code): "),
      password: async () =>
        input.password("Telegram 2-step verification password: "),
      phoneCode: async () =>
        input.text("Telegram login code: "),
      onError: (error) => console.error(error.message),
    });

    const session = client.session.save();

    fs.writeFileSync(sessionPath, session, {
      encoding: "utf8",
      mode: 0o600,
    });

    console.log("Telegram authentication successful.");
    console.log("Session saved locally. Do not share this file.");
  } finally {
    await client.disconnect();
  }
}

main().catch((error) => {
  console.error("Telegram login failed:", error.message);
  process.exitCode = 1;
});
