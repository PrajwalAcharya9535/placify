
const fs = require("fs");
const path = require("path");

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const TelegramAnnouncement = require(
  "../models/TelegramAnnouncement"
);

// ========================================
// CONFIGURATION
// ========================================

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 100;

const HISTORICAL_START_DATE =
  new Date("2026-10-01T00:00:00+05:30");

// ========================================
// CREATE TELEGRAM CLIENT
// ========================================

function createTelegramClient() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  const sessionPath = path.join(
    __dirname,
    "../scripts/.telegram-session"
  );

  if (
    !Number.isSafeInteger(apiId) ||
    apiId <= 0 ||
    !apiHash ||
    !groupId
  ) {
    throw new Error(
      "Missing Telegram configuration in backend/.env"
    );
  }

  if (!fs.existsSync(sessionPath)) {
    throw new Error(
      "Telegram session not found. Log in first."
    );
  }

  const session = fs
    .readFileSync(sessionPath, "utf8")
    .trim();

  if (!session) {
    throw new Error("Telegram session is empty.");
  }

  return new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );
}

// ========================================
// RESOLVE CONFIGURED GROUP
// ========================================

async function resolveTelegramGroup(client) {
  const groupId = process.env.TELEGRAM_GROUP_ID;

  const dialogs = await client.getDialogs({
    limit: 500,
  });

  const group = dialogs.find(
    (dialog) =>
      dialog.id?.toString() === groupId
  );

  if (!group) {
    throw new Error(
      "Configured Telegram group not found."
    );
  }

  return group;
}

// ========================================
// SAVE ONE TELEGRAM MESSAGE
// ========================================

async function saveTelegramMessage(
  message,
  group,
  groupId
) {
  const messageId = message?.id;

  if (!messageId) {
    return false;
  }

  const attachments = [];

  if (message.photo) {
    attachments.push({
      fileType: "photo",
      fileId: "",
      fileName: "",
    });
  } else if (message.document) {
    attachments.push({
      fileType: "document",
      fileId: "",
      fileName: "",
    });
  }

  const telegramDate = message.date
    ? new Date(message.date * 1000)
    : null;

  const result =
    await TelegramAnnouncement.updateOne(
      {
        chatId: groupId,
        messageId,
      },
      {
        $setOnInsert: {
          chatId: groupId,
          messageId,
          chatTitle: group.title || "",
          messageText: message.message || "",
          attachments,
          telegramDate,
          processingStatus: "Pending",
        },
      },
      {
        upsert: true,
      }
    );

  return result.upsertedCount > 0;
}

// ========================================
// IMPORT LATEST TELEGRAM MESSAGES
// Existing functionality preserved
// ========================================

async function importTelegramMessages(limit = 20) {
  const client = createTelegramClient();
  const groupId = process.env.TELEGRAM_GROUP_ID;

  try {
    await client.connect();

    const group = await resolveTelegramGroup(client);

    const safeLimit = Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 500)
      : 20;

    const messages = await client.getMessages(
      group.entity,
      {
        limit: safeLimit,
      }
    );

    let imported = 0;
    let skipped = 0;

    for (const message of messages) {
      const wasImported =
        await saveTelegramMessage(
          message,
          group,
          groupId
        );

      if (wasImported) {
        imported++;
      } else {
        skipped++;
      }
    }

    return {
      group: group.title,
      fetched: messages.length,
      imported,
      skipped,
    };
  } finally {
    await client.disconnect();
  }
}

// ========================================
// HISTORICAL IMPORT
// From 1 October 2026 onwards
// ========================================

async function importHistoricalTelegramMessages(
  startDate = HISTORICAL_START_DATE
) {
  const client = createTelegramClient();
  const groupId = process.env.TELEGRAM_GROUP_ID;

  const cutoff = new Date(startDate);

  if (Number.isNaN(cutoff.getTime())) {
    throw new Error(
      "Invalid historical import start date."
    );
  }

  let fetched = 0;
  let imported = 0;
  let skipped = 0;
  let batches = 0;

  let offsetId = 0;
  let reachedStartDate = false;

  try {
    await client.connect();

    const group = await resolveTelegramGroup(client);

    while (!reachedStartDate) {
      const messages = await client.getMessages(
        group.entity,
        {
          limit: Math.min(
            DEFAULT_BATCH_SIZE,
            MAX_BATCH_SIZE
          ),
          offsetId,
        }
      );

      if (!messages.length) {
        break;
      }

      batches++;
      fetched += messages.length;

      for (const message of messages) {
        if (!message?.id) {
          skipped++;
          continue;
        }

        const messageDate = message.date
          ? new Date(message.date * 1000)
          : null;

        // Stop when older than 1 October 2026.
        if (
          messageDate &&
          messageDate.getTime() < cutoff.getTime()
        ) {
          reachedStartDate = true;
          break;
        }

        const wasImported =
          await saveTelegramMessage(
            message,
            group,
            groupId
          );

        if (wasImported) {
          imported++;
        } else {
          skipped++;
        }
      }

      if (reachedStartDate) {
        break;
      }

      // Continue from the oldest message
      // in the current batch.
      const oldestMessage =
        messages[messages.length - 1];

      if (
        !oldestMessage?.id ||
        oldestMessage.id === offsetId
      ) {
        break;
      }

      offsetId = oldestMessage.id;

      if (messages.length < DEFAULT_BATCH_SIZE) {
        break;
      }
    }

    return {
      success: true,
      group: group.title,
      startDate: cutoff.toISOString(),
      fetched,
      imported,
      skipped,
      batches,
      reachedStartDate,
    };
  } finally {
    await client.disconnect();
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  importTelegramMessages,
  importHistoricalTelegramMessages,
};
