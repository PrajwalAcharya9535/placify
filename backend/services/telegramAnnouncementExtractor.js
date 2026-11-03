
const TelegramAnnouncement = require("../models/TelegramAnnouncement");

// ========================================
// HELPERS
// ========================================

const PLACEMENT_TERMS = [
  "placement drive",
  "campus drive",
  "recruitment drive",
  "hiring",
  "job opportunity",
  "employment opportunity",
  "internship opportunity",
  "internship & full-time",
  "internship and full-time",
  "registration link",
  "apply now",
  "apply here",
  "eligible students",
];

const EXCLUSION_TERMS = [
  "higher studies",
  "study abroad",
  "university admissions",
  "education loan",
];

function linesOf(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function tidy(value, max = 500) {
  return String(value || "")
    .replace(/^[\s*•\-–—]+/, "")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeLine(line) {
  return String(line || "")
    .replace(/^[\s*•\-–—]+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\*+/g, "")
    .trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPlacementAnnouncement(text) {
  if (typeof text !== "string" || !text.trim()) {
    return false;
  }

  const content = text.toLowerCase();

  if (
    EXCLUSION_TERMS.some((term) =>
      content.includes(term)
    )
  ) {
    return false;
  }

  return PLACEMENT_TERMS.some((term) =>
    content.includes(term)
  );
}

// ========================================
// APPLICATION URL
// ========================================

function extractApplicationUrl(text) {
  const urls =
    String(text || "").match(
      /https?:\/\/[^\s<>"']+/gi
    ) || [];

  const cleaned = urls.map((url) =>
    url.replace(/[),.;!?\]}]+$/, "")
  );

  return (
    cleaned.find((url) =>
      /forms\.gle|docs\.google\.com\/forms|apply|register/i.test(
        url
      )
    ) ||
    cleaned[0] ||
    ""
  );
}

// ========================================
// COMPANY NAME
// ========================================

function cleanCompanyName(value) {
  return tidy(value, 120)
    .replace(/^subject\s*:\s*/i, "")
    .replace(/^greetings\s+from\s+/i, "")
    .replace(/^greetings\s+(?:by|at)\s+/i, "")
    .replace(
      /^opportunity\s+(?:at|with|by)\s+/i,
      ""
    )
    .replace(
      /^campus\s+(?:placement|recruitment)\s+(?:drive\s+)?(?:at|by|with|for)\s+/i,
      ""
    )
    .replace(
      /^placement\s+(?:drive\s+)?(?:at|by|with|for)\s+/i,
      ""
    )
    .replace(
      /^recruitment\s+(?:drive\s+)?(?:at|by|with|for)\s+/i,
      ""
    )
    .replace(/^hiring\s+(?:at|by|with)\s+/i, "")
    .replace(
      /\s+for\s+the\s+(?:position|role)\s+of\b.*$/i,
      ""
    )
    .replace(
      /\s+(?:is conducting|is organizing|is organising|is hiring|has announced)\b.*$/i,
      ""
    )
    .replace(
      /\s+off[\s-]+campus\s+drive\b.*$/i,
      ""
    )
    .replace(/[|:;,–—\s]+$/, "")
    .trim();
}

function isValidCompanyName(value) {
  const name = cleanCompanyName(value);

  if (name.length < 3 || name.length > 120) {
    return false;
  }

  if (
    /^(?:the|a|an|for|at|by|campus|placement|recruitment|hiring|company|students|dear students|eligible students)$/i.test(
      name
    )
  ) {
    return false;
  }

  if (
    /^(?:B\.?E|B\.?Tech|MCA|MBA)\b/i.test(name) ||
    /^(?:the\s+)?\d{4}\s+batch\b/i.test(name)
  ) {
    return false;
  }

  if (
    /^(?:campus|placement|recruitment|job|internship)\s+(?:drive|opportunity|notification)\b/i.test(
      name
    )
  ) {
    return false;
  }

  if (
    /^(?:greetings|dear|attention|important|notice|subject)\b/i.test(
      name
    )
  ) {
    return false;
  }

  if (/https?:\/\/|www\./i.test(name)) {
    return false;
  }

  if (
    /\b(?:click here|register now|apply now|last date|deadline)\b/i.test(
      name
    )
  ) {
    return false;
  }

  return true;
}

function extractCompanyName(text) {
  const lines = linesOf(text).map(normalizeLine);

  for (const line of lines) {
    const match = line.match(
      /^(?:company name|company|organization|organisation|employer)\s*[:：-]\s*(.+)$/i
    );

    if (match) {
      const name = cleanCompanyName(match[1]);

      if (isValidCompanyName(name)) {
        return name;
      }
    }
  }

  const patterns = [
    /^greetings\s+from\s+(.+)$/i,
    /^(.+?)\s+(?:is conducting|is organizing|is organising|is hiring|has announced)\b/i,
    /^(.+?)\s+(?:campus placement drive|campus recruitment drive|placement drive|recruitment drive)\b/i,
    /\b(?:employment|job|internship)\s+opportunity\s+(?:at|by|with)\s+(.+?)(?:[.;]|$)/i,
    /\b(?:recruitment|hiring)\s+(?:at|by|with)\s+(.+?)(?:[.;]|$)/i,
    /^(?:subject\s*:\s*)?(.+?)\s+campus drive\b/i,
  ];

  for (const pattern of patterns) {
    for (const line of lines.slice(0, 12)) {
      const match = line.match(pattern);

      if (!match) continue;

      const name = cleanCompanyName(match[1]);

      if (isValidCompanyName(name)) {
        return name;
      }
    }
  }

  return "";
}

// ========================================
// LABELED EXTRACTION
// ========================================

function extractLabeled(text, labels, max = 500) {
  const escaped = labels
    .map(escapeRegex)
    .join("|");

  const pattern = new RegExp(
    `^(?:${escaped})\\s*[:：–—-]\\s*(.+)$`,
    "i"
  );

  for (const line of linesOf(text)) {
    const match = normalizeLine(line).match(pattern);

    if (match) {
      return tidy(match[1], max);
    }
  }

  return "";
}

function extractLabeledMultiline(
  text,
  labels,
  maxLines = 8
) {
  const lines = linesOf(text);
  const escaped = labels
    .map(escapeRegex)
    .join("|");

  const pattern = new RegExp(
    `^(?:${escaped})\\s*[:：–—-]\\s*(.*)$`,
    "i"
  );

  for (let index = 0; index < lines.length; index++) {
    const match = normalizeLine(
      lines[index]
    ).match(pattern);

    if (!match) continue;

    const collected = [];

    if (match[1]) {
      collected.push(tidy(match[1]));
    }

    for (
      let next = index + 1;
      next < lines.length &&
      collected.length < maxLines;
      next++
    ) {
      const current = normalizeLine(lines[next]);

      if (
        /^[A-Za-z][A-Za-z\s/&()-]{2,50}\s*[:：]/.test(
          current
        )
      ) {
        break;
      }

      if (
        /^(?:registration|apply|important note|note|deadline|last date|eligibility|salary|stipend|location|job description)\b/i.test(
          current
        )
      ) {
        break;
      }

      collected.push(tidy(current));
    }

    return collected.join(" | ").slice(0, 1000);
  }

  return "";
}

// ========================================
// JOB ROLE
// ========================================

function extractJobRole(text) {
  const role = extractLabeled(
    text,
    [
      "job role",
      "role",
      "position",
      "designation",
      "job title",
      "position offered",
      "role offered",
      "open position",
    ],
    150
  );

  if (
    /^(?:as per|refer|see|mentioned|attached|given)\b/i.test(
      role
    )
  ) {
    return "";
  }

  return role;
}

// ========================================
// ELIGIBILITY
// ========================================

function extractEligibility(text) {
  const lines = linesOf(text);
  const collected = [];

  const relevant =
    /\beligib|engineering branch|engineering stream|academic requirement|minimum\s+\d+(?:\.\d+)?%|eligible batch|cgpa|percentage|aggregate|backlog|unplaced students|degree|qualification|passing year/i;

  const stop =
    /^(?:registration|apply|application link|salary|stipend|compensation|selection process|interview process|deadline|last date|work location)\s*[:：]/i;

  for (let index = 0; index < lines.length; index++) {
    const line = normalizeLine(lines[index]);

    if (!relevant.test(line)) continue;

    collected.push(line);

    if (
      /^(?:eligibility|eligibility criteria|academic requirement)\s*[:：]?\s*$/i.test(
        line
      )
    ) {
      for (
        let next = index + 1;
        next < lines.length &&
        next <= index + 6;
        next++
      ) {
        const following = normalizeLine(
          lines[next]
        );

        if (stop.test(following)) break;

        collected.push(following);
      }
    }
  }

  return [...new Set(collected)]
    .slice(0, 12)
    .join("\n")
    .slice(0, 2000);
}

// ========================================
// SALARY
// ========================================

function extractSalary(text) {
  const direct = extractLabeled(
    text,
    [
      "full-time ctc",
      "full time ctc",
      "annual ctc",
      "expected full-time ctc",
      "expected ctc",
      "annual salary package",
      "salary package",
      "annual package",
      "salary",
      "ctc",
      "package",
      "compensation",
      "offered ctc",
    ],
    350
  );

  if (direct) return direct;

  const amountPattern =
    /(?:₹|Rs\.?|INR)\s*[\d,.]+\s*(?:[-–]\s*(?:₹|Rs\.?|INR)?\s*[\d,.]+)?\s*(?:LPA|Lakh|Lakhs|\/Month|per month)?|\b\d+(?:\.\d+)?\s*(?:[-–]\s*\d+(?:\.\d+)?)?\s*(?:LPA|Lakhs?)\b/i;

  for (const line of linesOf(text)) {
    const normalized = normalizeLine(line);

    if (
      /^(?:subject|reminder)\b/i.test(normalized)
    ) {
      continue;
    }

    if (
      /\b(?:salary|ctc|package|compensation)\b/i.test(
        normalized
      )
    ) {
      const amount = normalized.match(amountPattern);

      if (amount) {
        return amount[0].trim();
      }
    }
  }

  return "";
}

// ========================================
// STIPEND
// ========================================

function extractStipend(text) {
  const direct = extractLabeled(
    text,
    [
      "internship stipend",
      "training stipend",
      "monthly stipend",
      "stipend",
    ],
    350
  );

  if (direct) return direct;

  for (const line of linesOf(text)) {
    const normalized = normalizeLine(line);

    if (
      /\bstipend\b/i.test(normalized) &&
      /(?:₹|rs\.?|inr)\s*[\d,.]+|\d+(?:\.\d+)?\s*(?:k|thousand)/i.test(
        normalized
      )
    ) {
      return tidy(normalized, 350);
    }
  }

  return "";
}

// ========================================
// CGPA / ACADEMIC PERCENTAGE
// ========================================

function extractMinimumCGPA(text) {
  const direct = extractLabeled(
    text,
    [
      "minimum cgpa",
      "min cgpa",
      "cgpa criteria",
      "cgpa requirement",
      "minimum percentage",
      "academic percentage",
      "academic requirement",
    ],
    250
  );

  if (direct) return direct;

  for (const line of linesOf(text)) {
    const normalized = normalizeLine(line);

    if (
      /\b\d+(?:\.\d+)?\s*(?:cgpa|c\.g\.p\.a\.?)\b/i.test(
        normalized
      )
    ) {
      return tidy(normalized, 250);
    }

    if (
      /\b\d+(?:\.\d+)?\s*%/.test(normalized) &&
      /\b(?:academic|aggregate|throughout|eligib|minimum|marks|degree|graduation|10th|12th|percentage)\b/i.test(
        normalized
      )
    ) {
      return tidy(normalized, 250);
    }
  }

  return "";
}

// ========================================
// LOCATION
// ========================================

function extractLocation(text) {
  return extractLabeled(
    text,
    [
      "job location",
      "work location",
      "posting location",
      "office location",
      "locations",
      "location",
      "place of posting",
    ],
    300
  );
}

// ========================================
// WORK MODE
// ========================================

function extractWorkMode(text) {
  const direct = extractLabeled(
    text,
    [
      "work model",
      "work mode",
      "mode of work",
      "working mode",
      "work arrangement",
      "working arrangement",
    ],
    200
  );

  if (direct) return direct;

  for (const line of linesOf(text)) {
    const normalized = normalizeLine(line);

    if (
      /^(?:work\s+model|work\s+mode|mode\s+of\s+work|working\s+mode)\b/i.test(
        normalized
      ) &&
      /\b(?:hybrid|remote|onsite|on-site|office|wfh)\b/i.test(
        normalized
      )
    ) {
      return tidy(normalized, 200);
    }
  }

  return "";
}

// ========================================
// GRADUATION BATCH
// ========================================

function extractGraduationBatch(text) {
  const direct = extractLabeled(
    text,
    [
      "graduation batch",
      "eligible batch",
      "passing year",
      "year of passing",
      "batch",
      "batch eligible",
      "eligible batches",
    ],
    250
  );

  if (direct) return direct;

  for (const line of linesOf(text)) {
    const normalized = normalizeLine(line);

    if (
      /\b(?:batch|graduates?|passing year|year of passing)\b/i.test(
        normalized
      )
    ) {
      const years = [
        ...new Set(
          normalized.match(/\b20\d{2}\b/g) || []
        ),
      ];

      if (years.length) {
        return years.join(", ");
      }

      if (
        /\ball batches\b/i.test(normalized)
      ) {
        return "All batches";
      }
    }
  }

  return "";
}

// ========================================
// JOB TYPE
// ========================================

function extractJobType(text) {
  return extractLabeled(
    text,
    [
      "employment type",
      "job type",
      "type of employment",
      "employment",
      "opportunity type",
    ],
    250
  );
}

// ========================================
// SELECTION PROCESS
// ========================================

function extractSelectionProcess(text) {
  return extractLabeledMultiline(
    text,
    [
      "selection process",
      "selection rounds",
      "recruitment process",
      "interview rounds",
      "interview process",
      "selection procedure",
    ],
    8
  );
}

// ========================================
// DEADLINE
// ========================================

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function extractDeadline(text) {
  const empty = {
    registrationDeadline: null,
    deadlineTimeConfirmed: false,
  };

  if (!text) return empty;

  const lines = linesOf(text);

  const keyword =
    /deadline|dead\s*line|last date|last day|registration (?:closes|ends|deadline)|register (?:before|by|on or before)|apply (?:before|by)|submit (?:before|by)|complete (?:registration|the form) (?:before|by|on or before)/i;

  const candidates = [];

  for (let index = 0; index < lines.length; index++) {
    if (keyword.test(lines[index])) {
      candidates.push(lines[index]);

      if (index + 1 < lines.length) {
        candidates.push(
          `${lines[index]} ${lines[index + 1]}`
        );
      }
    }
  }

  const monthPattern =
    "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

  const namedDate = new RegExp(
    `(\\d{1,2})(?:st|nd|rd|th)?[\\s,/-]+${monthPattern}[\\s,/-]+(20\\d{2})`,
    "i"
  );

  const numericDate =
    /\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/;

  const timePattern =
    /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i;

  const numericTime =
    /\b(\d{1,2}):(\d{2})\b/;

  for (const candidate of candidates) {
    let day;
    let month;
    let year;

    const named = candidate.match(namedDate);
    const numeric = candidate.match(numericDate);

    if (named) {
      day = Number(named[1]);
      month = MONTHS[named[2].toLowerCase()];
      year = Number(named[3]);
    } else if (numeric) {
      day = Number(numeric[1]);
      month = Number(numeric[2]) - 1;
      year = Number(numeric[3]);
    } else {
      continue;
    }

    if (
      month === undefined ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31
    ) {
      continue;
    }

    const time = candidate.match(timePattern);
    const twentyFourHour =
      time ? null : candidate.match(numericTime);

    let hour = 0;
    let minute = 0;
    let confirmed = false;

    if (time) {
      const hour12 = Number(time[1]);
      minute = Number(time[2] || 0);

      if (
        hour12 < 1 ||
        hour12 > 12 ||
        minute > 59
      ) {
        continue;
      }

      hour =
        (hour12 % 12) +
        (time[3].toUpperCase() === "PM" ? 12 : 0);

      confirmed = true;
    } else if (twentyFourHour) {
      hour = Number(twentyFourHour[1]);
      minute = Number(twentyFourHour[2]);

      if (hour > 23 || minute > 59) {
        continue;
      }

      confirmed = true;
    }

    const offset = 330 * 60000;

    const date = new Date(
      Date.UTC(year, month, day, hour, minute) -
        offset
    );

    const check = new Date(
      date.getTime() + offset
    );

    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month ||
      check.getUTCDate() !== day
    ) {
      continue;
    }

    return {
      registrationDeadline: date,
      deadlineTimeConfirmed: confirmed,
    };
  }

  return empty;
}

// ========================================
// ADDITIONAL DETAILS
// ========================================

const EXTRA_LABELS = [
  "service agreement",
  "service bond",
  "bond",
  "probation period",
  "joining date",
  "interview date",
  "interview venue",
  "drive date",
  "drive venue",
  "reporting time",
  "required documents",
  "documents required",
  "benefits",
  "perks",
  "backlog criteria",
  "backlogs allowed",
  "experience required",
  "training period",
  "shift timings",
  "working hours",
  "notice period",
  "special instructions",
  "company website",
];

function extractAdditionalDetails(text) {
  const details = [];

  for (const line of linesOf(text)) {
    const match = normalizeLine(line).match(
      /^([^:：]{3,70})\s*[:：]\s*(.+)$/
    );

    if (!match) continue;

    const label = tidy(match[1], 120);
    const value = tidy(match[2], 2000);
    const lower = label.toLowerCase();

    if (
      !value ||
      !EXTRA_LABELS.includes(lower)
    ) {
      continue;
    }

    if (
      !details.some(
        (item) =>
          item.label.toLowerCase() === lower
      )
    ) {
      details.push({ label, value });
    }
  }

  return details.slice(0, 25);
}

// ========================================
// ALL COMPANY DETAILS
// ========================================

function extractCompanyDetails(text) {
  return {
    salary: extractSalary(text),
    stipend: extractStipend(text),
    location: extractLocation(text),
    graduationBatch: extractGraduationBatch(text),
    jobType: extractJobType(text),
    workMode: extractWorkMode(text),
    minimumCGPA: extractMinimumCGPA(text),
    selectionProcess: extractSelectionProcess(text),
    additionalDetails: extractAdditionalDetails(text),
  };
}

// ========================================
// PROCESS ONLY PENDING MESSAGES
// ========================================

async function processTelegramAnnouncements(
  limit = 100
) {
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 500)
    : 100;

  const announcements =
    await TelegramAnnouncement.find({
      processingStatus: "Pending",
    })
      .sort({
        telegramDate: -1,
        _id: -1,
      })
      .limit(safeLimit);

  let processed = 0;
  let needsReview = 0;
  let failed = 0;

  for (const announcement of announcements) {
    try {
      const text =
        announcement.messageText || "";

      if (!isPlacementAnnouncement(text)) {
        announcement.announcementType =
          "General Update";

        announcement.processingStatus =
          "Needs Review";

        needsReview++;
      } else {
        const deadline = extractDeadline(text);

        announcement.companyName =
          extractCompanyName(text);

        announcement.jobRole =
          extractJobRole(text);

        announcement.eligibility =
          extractEligibility(text);

        announcement.applicationUrl =
          extractApplicationUrl(text);

        announcement.registrationDeadline =
          deadline.registrationDeadline;

        announcement.deadlineTimeConfirmed =
          deadline.deadlineTimeConfirmed;

        Object.assign(
          announcement,
          extractCompanyDetails(text)
        );

        announcement.announcementType =
          "New Opportunity";

        const validCompany =
          isValidCompanyName(
            announcement.companyName
          );

        const validRole =
          Boolean(announcement.jobRole);

        const validUrl =
          /^https?:\/\/\S+$/i.test(
            announcement.applicationUrl
          );

        announcement.processingStatus =
          validCompany &&
          validRole &&
          validUrl
            ? "Processed"
            : "Needs Review";

        if (
          announcement.processingStatus ===
          "Processed"
        ) {
          processed++;
        } else {
          needsReview++;
        }
      }

      await announcement.save();
    } catch (error) {
      console.error(
        `Failed to process Telegram message ${announcement.messageId}:`,
        error.message
      );

      announcement.processingStatus = "Failed";

      try {
        await announcement.save();
      } catch (saveError) {
        console.error(
          "Failed to save processing status:",
          saveError.message
        );
      }

      failed++;
    }
  }

  return {
    examined: announcements.length,
    processed,
    needsReview,
    failed,
  };
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  isPlacementAnnouncement,
  extractApplicationUrl,
  extractCompanyName,
  extractJobRole,
  extractEligibility,
  extractDeadline,
  extractCompanyDetails,
  extractAdditionalDetails,
  processTelegramAnnouncements,
};
