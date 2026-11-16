
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
const path = require("path");

const DebuggingProblem = require("../models/DebuggingProblem");

// MongoDB Atlas DNS configuration
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Load backend .env
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

// ========================================
// 3 DEBUGGING QUESTIONS
// ========================================

const debuggingQuestions = [
  // ======================================
  // EASY - MAXIMUM OF TWO NUMBERS
  // ======================================
  {
    title: "Fix Maximum of Two Numbers",

    description:
      "Complete the Python program to read two integers and print the larger number.",

    difficulty: "Easy",
    category: "Conditional Statements",
    language: "Python",

    buggyCode: `a, b = map(int, input().split())

# TODO: Complete the comparison
if a > b:
    print(a)
else:
    # TODO: Print the correct value
`,

    bugDescription:
      "The else branch is incomplete. Fix the code to print the maximum of two numbers.",

    expectedFixedCode: `a, b = map(int, input().split())

if a > b:
    print(a)
else:
    print(b)`,

    inputFormat:
      "Two space-separated integers.",

    outputFormat:
      "Print the larger integer.",

    constraints:
      "-100000 <= a, b <= 100000",

    testCases: [
      {
        input: "8 3",
        expectedOutput: "8",
        isHidden: false,
      },
      {
        input: "4 9",
        expectedOutput: "9",
        isHidden: false,
      },
      {
        input: "-5 -2",
        expectedOutput: "-2",
        isHidden: true,
      },
      {
        input: "7 7",
        expectedOutput: "7",
        isHidden: true,
      },
    ],

    marks: 10,
    timeLimitSeconds: 5,

    skillsCovered: [
      "Python",
      "Conditionals",
      "Debugging",
    ],

    companyTags: ["Placement Practice"],
    isActive: true,
  },

  // ======================================
  // MEDIUM - SECOND LARGEST ELEMENT
  // ======================================
  {
    title: "Fix Second Largest Element",

    description:
      "Complete the Python program to find the second largest distinct element in an array.",

    difficulty: "Medium",
    category: "Arrays",
    language: "Python",

    buggyCode: `n = int(input())
arr = list(map(int, input().split()))

largest = float('-inf')
second = float('-inf')

for num in arr:
    if num > largest:
        # TODO: Update both variables
        largest = num
    elif num < largest and num > second:
        # TODO: Update second largest

# TODO: Print second largest
`,

    bugDescription:
      "The program does not correctly update the second largest element. Complete the missing logic.",

    expectedFixedCode: `n = int(input())
arr = list(map(int, input().split()))

largest = float('-inf')
second = float('-inf')

for num in arr:
    if num > largest:
        second = largest
        largest = num
    elif num < largest and num > second:
        second = num

print(second)`,

    inputFormat:
      "First line contains n. Second line contains n space-separated integers.",

    outputFormat:
      "Print the second largest distinct integer.",

    constraints:
      "2 <= n <= 100000. At least two distinct integers are guaranteed.",

    testCases: [
      {
        input: "5\n10 20 4 45 99",
        expectedOutput: "45",
        isHidden: false,
      },
      {
        input: "5\n5 5 4 3 2",
        expectedOutput: "4",
        isHidden: false,
      },
      {
        input: "4\n-5 -2 -9 -3",
        expectedOutput: "-3",
        isHidden: true,
      },
      {
        input: "3\n1 2 2",
        expectedOutput: "1",
        isHidden: true,
      },
    ],

    marks: 20,
    timeLimitSeconds: 5,

    skillsCovered: [
      "Python",
      "Arrays",
      "Loops",
      "Debugging",
    ],

    companyTags: ["Placement Practice"],
    isActive: true,
  },

  // ======================================
  // HARD - LONGEST UNIQUE SUBSTRING
  // ======================================
  {
    title: "Fix Longest Unique Substring",

    description:
      "Complete the sliding-window algorithm to find the length of the longest substring without repeating characters.",

    difficulty: "Hard",
    category: "Strings",
    language: "Python",

    buggyCode: `s = input()
seen = {}
left = 0
maximum = 0

for right, char in enumerate(s):
    if char in seen:
        # TODO: Move left pointer correctly
        pass

    seen[char] = right

    # TODO: Update maximum window length

print(maximum)`,

    bugDescription:
      "The sliding-window logic is incomplete. Correctly update the left pointer and maximum length.",

    expectedFixedCode: `s = input()
seen = {}
left = 0
maximum = 0

for right, char in enumerate(s):
    if char in seen:
        left = max(left, seen[char] + 1)

    seen[char] = right
    maximum = max(maximum, right - left + 1)

print(maximum)`,

    inputFormat:
      "A single string containing characters.",

    outputFormat:
      "Print the length of the longest substring without repeating characters.",

    constraints:
      "1 <= string length <= 100000",

    testCases: [
      {
        input: "abcabcbb",
        expectedOutput: "3",
        isHidden: false,
      },
      {
        input: "bbbbb",
        expectedOutput: "1",
        isHidden: false,
      },
      {
        input: "pwwkew",
        expectedOutput: "3",
        isHidden: true,
      },
      {
        input: "abba",
        expectedOutput: "2",
        isHidden: true,
      },
    ],

    marks: 30,
    timeLimitSeconds: 5,

    skillsCovered: [
      "Python",
      "Strings",
      "Sliding Window",
      "Debugging",
    ],

    companyTags: ["Placement Practice"],
    isActive: true,
  },
];

// ========================================
// SEED DEBUGGING QUESTIONS
// ========================================

const seedDebuggingQuestions = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB Connected");

    for (const question of debuggingQuestions) {
      await DebuggingProblem.updateOne(
        {
          title: question.title,
          language: question.language,
        },
        {
          $set: question,
        },
        {
          upsert: true,
        }
      );

      console.log(
        `Seeded: ${question.difficulty} - ${question.title}`
      );
    }

    console.log(
      "3 Debugging problems seeded successfully"
    );
  } catch (error) {
    console.error(
      "Debugging seed failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDebuggingQuestions();
