
require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

const MockTest = require("../models/MockTest");

// ==========================================
// DATABASE CONNECTION
// ==========================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const TEST_TITLE = "TCS NQT 2026 Practice Simulation";

const SOURCE_URL =
  "https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring";

// ==========================================
// ASSESSMENT CONFIGURATION
// ==========================================

const rounds = [
  {
    roundName: "Numerical Ability",
    roundType: "Aptitude",
    sectionKey: "tcs_numerical",
    order: 1,
    durationMinutes: 25,
    demoDurationMinutes: 2,
    numberOfQuestions: 10,
    demoNumberOfQuestions: 3,
    totalMarks: 20,
    passingPercentage: 60,
    instructions: [
      "Answer numerical ability questions.",
      "The timer runs throughout this section.",
    ],
  },
  {
    roundName: "Verbal Ability",
    roundType: "Verbal",
    sectionKey: "tcs_verbal",
    order: 2,
    durationMinutes: 25,
    demoDurationMinutes: 2,
    numberOfQuestions: 10,
    demoNumberOfQuestions: 3,
    totalMarks: 20,
    passingPercentage: 60,
    instructions: [
      "Answer English and verbal ability questions.",
    ],
  },
  {
    roundName: "Reasoning Ability",
    roundType: "Reasoning",
    sectionKey: "tcs_reasoning",
    order: 3,
    durationMinutes: 25,
    demoDurationMinutes: 2,
    numberOfQuestions: 10,
    demoNumberOfQuestions: 3,
    totalMarks: 20,
    passingPercentage: 60,
    instructions: [
      "Answer logical and analytical reasoning questions.",
    ],
  },
  {
    roundName: "Advanced Quantitative & Reasoning",
    roundType: "Aptitude",
    sectionKey: "tcs_advanced",
    order: 4,
    durationMinutes: 25,
    demoDurationMinutes: 2,
    numberOfQuestions: 10,
    demoNumberOfQuestions: 3,
    totalMarks: 20,
    passingPercentage: 60,
    instructions: [
      "Solve advanced quantitative and reasoning problems.",
    ],
  },
  {
    roundName: "Advanced Coding",
    roundType: "Coding",
    sectionKey: "tcs_coding",
    order: 5,
    durationMinutes: 90,
    demoDurationMinutes: 3,
    numberOfQuestions: 2,
    demoNumberOfQuestions: 1,
    totalMarks: 40,
    passingPercentage: 60,
    instructions: [
      "Solve programming problems using the coding editor.",
      "Code will be evaluated using test cases.",
    ],
  },
];

// ==========================================
// CREATE TCS NQT MOCK
// ==========================================

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await MockTest.findOne({
      title: TEST_TITLE,
      companyName: "TCS",
    });

    if (existing) {
      console.log(
        "TCS NQT simulation already exists:",
        existing._id.toString()
      );

      return;
    }

    const mockTest = await MockTest.create({
      title: TEST_TITLE,

      description:
        "TCS NQT-style placement preparation covering Foundation and Advanced assessment sections. Practice simulation, not an official TCS examination.",

      companyName: "TCS",
      hiringTrack: "NQT Graduate Hiring",
      targetRole: "Ninja / Digital / Prime",

      patternYear: 2026,
      patternSourceUrl: SOURCE_URL,

      // Keep Draft until the published pattern
      // has been checked against the exact
      // hiring campaign.
      patternStatus: "Draft",

      difficulty: "Medium",

      rounds,

      totalDurationMinutes: 190,
      totalMarks: 120,
      passingPercentage: 60,

      instructions: [
        "This is a Placify practice simulation.",
        "The assessment has five timed sections.",
        "Full Simulation follows published section durations.",
        "Demo Mode uses shortened durations.",
        "Complete all sections to view your results.",
        "Proctoring is optional and requires consent.",
      ],

      practiceEnabled: true,
      allowRoundPractice: true,
      allowFullSimulation: true,
      allowDemoMode: true,
      allowRetry: true,
      showSolutionsAfterSubmission: true,

      aiInterviewEnabled: true,
      interviewQuestionCount: 3,

      proctoringEnabled: true,
      proctoringMode: "Warning",
      requireFullscreen: false,
      requireCamera: false,
      maxTabSwitches: 3,
      autoSubmitOnViolation: false,

      maxAttempts: null,
      isActive: true,
    });

    console.log("TCS NQT simulation created");
    console.log("ID:", mockTest._id.toString());
    console.log("Sections:", mockTest.rounds.length);
    console.log(
      "Full duration:",
      mockTest.totalDurationMinutes,
      "minutes"
    );
    console.log(
      "Demo duration:",
      mockTest.rounds.reduce(
        (sum, round) =>
          sum + round.demoDurationMinutes,
        0
      ),
      "minutes"
    );
  } catch (error) {
    console.error("Failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
