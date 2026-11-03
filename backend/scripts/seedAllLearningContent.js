
require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("node:fs");
const path = require("node:path");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const LearningTopic = require("../models/LearningTopic");
const LearningLesson = require("../models/LearningLesson");
const LearningVideo = require("../models/LearningVideo");
const LearningQuiz = require("../models/LearningQuiz");
const LearningExercise = require("../models/LearningExercise");
const LearningResource = require("../models/LearningResource");

// ==========================================
// CONFIGURATION
// ==========================================

const DATA_DIRECTORY = path.join(
  __dirname,
  "../data/learning"
);

const EXPECTED_COUNTS = {
  lessons: 5,
  videos: 5,
  quizzes: 10,
  exercises: 5,
  resources: 5,
};

// Preserve the existing Spring Boot dataset.
const PRESERVED_TOPICS = new Set([
  "Spring Boot Fundamentals",
]);

const MODELS = {
  lessons: LearningLesson,
  videos: LearningVideo,
  quizzes: LearningQuiz,
  exercises: LearningExercise,
  resources: LearningResource,
};

// ==========================================
// VALIDATION
// ==========================================

function validateDataset(dataset, filename) {
  if (
    !dataset ||
    typeof dataset !== "object" ||
    !dataset.topicTitle
  ) {
    throw new Error(
      `${filename}: Missing topicTitle`
    );
  }

  for (const [section, count] of Object.entries(
    EXPECTED_COUNTS
  )) {
    if (
      !Array.isArray(dataset[section]) ||
      dataset[section].length !== count
    ) {
      throw new Error(
        `${filename}: Expected ${count} ${section}`
      );
    }

    for (const [index, item] of dataset[
      section
    ].entries()) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        throw new Error(
          `${filename}: Invalid ${section} item ${index + 1}`
        );
      }

      if (
        item.order !== undefined &&
        item.order !== index + 1
      ) {
        throw new Error(
          `${filename}: Invalid order in ${section}`
        );
      }

      if (section === "quizzes") {
        if (
          !Array.isArray(item.options) ||
          item.options.length !== 4 ||
          item.options.some(
            (option) =>
              typeof option !== "string" ||
              !option.trim()
          ) ||
          !Number.isInteger(item.correctAnswer) ||
          item.correctAnswer < 0 ||
          item.correctAnswer > 3
        ) {
          throw new Error(
            `${filename}: Invalid MCQ ${index + 1}`
          );
        }
      }
    }
  }
}

// ==========================================
// SEED ONE SECTION
// ==========================================

async function seedSection(
  Model,
  topicId,
  items,
  section
) {
  let inserted = 0;
  let skipped = 0;

  for (const [index, item] of items.entries()) {
    const order = index + 1;

    // Never overwrite existing student-facing content.
    const existing = await Model.findOne({
      topic: topicId,
      order,
    });

    if (existing) {
      skipped++;
      continue;
    }

    const document = new Model({
      ...item,
      topic: topicId,
      order,
      isActive: true,
    });

    await document.validate();
    await document.save();

    inserted++;
  }

  console.log(
    `  ${section}: ${inserted} inserted, ${skipped} existing`
  );
}

// ==========================================
// LOAD DATASETS
// ==========================================

function loadDatasets() {
  if (!fs.existsSync(DATA_DIRECTORY)) {
    throw new Error(
      `Dataset directory not found: ${DATA_DIRECTORY}`
    );
  }

  const files = fs
    .readdirSync(DATA_DIRECTORY)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const datasets = [];
  const seenTitles = new Set();

  for (const filename of files) {
    const filepath = path.join(
      DATA_DIRECTORY,
      filename
    );

    const dataset = JSON.parse(
      fs.readFileSync(filepath, "utf8")
    );

    validateDataset(dataset, filename);

    if (seenTitles.has(dataset.topicTitle)) {
      throw new Error(
        `Duplicate dataset: ${dataset.topicTitle}`
      );
    }

    seenTitles.add(dataset.topicTitle);

    datasets.push({
      filename,
      ...dataset,
    });
  }

  return datasets;
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function seedAllLearningContent() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI or MONGODB_URI is missing"
    );
  }

  // Validate JSON files before connecting.
  const datasets = loadDatasets();

  if (datasets.length === 0) {
    console.log(
      "No JSON datasets found. Nothing was changed."
    );
    return;
  }

  await mongoose.connect(mongoUri);

  try {
    console.log("MongoDB connected.");
    console.log(
      `Found ${datasets.length} dataset(s).\n`
    );

    for (const dataset of datasets) {
      const { topicTitle, filename } = dataset;

      if (PRESERVED_TOPICS.has(topicTitle)) {
        console.log(
          `Skipped preserved topic: ${topicTitle}`
        );
        continue;
      }

      const topic = await LearningTopic.findOne({
        title: topicTitle,
        isActive: true,
      });

      if (!topic) {
        throw new Error(
          `${filename}: Active topic not found: ${topicTitle}`
        );
      }

      console.log(`\nTopic: ${topicTitle}`);

      for (const [
        section,
        Model,
      ] of Object.entries(MODELS).map(
        ([key, model]) => [key, model]
      )) {
        await seedSection(
          Model,
          topic._id,
          dataset[section],
          section
        );
      }
    }

    console.log(
      "\nLearning content seeding completed."
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

// ==========================================
// RUN
// ==========================================

seedAllLearningContent().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
