
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const PracticeQuestion = require("../models/PracticeQuestion");

// TCS NQT-inspired practice questions.
// Not official TCS examination questions.

const questions = [
    // Existing questions are safely skipped during seeding.
  {
    category: "Verbal",
    subCategory: "Synonyms",
    questionText: "Choose the synonym of 'Abundant'.",
    options: ["Scarce", "Plentiful", "Limited", "Rare"],
    correctAnswer: "Plentiful",
    explanation: "Abundant means available in large quantities.",
    difficulty: "Easy",
    skillsCovered: ["Vocabulary"]
  },
  {
    category: "Verbal",
    subCategory: "Antonyms",
    questionText: "Choose the antonym of 'Expand'.",
    options: ["Increase", "Extend", "Contract", "Enlarge"],
    correctAnswer: "Contract",
    explanation: "Contract means to become smaller.",
    difficulty: "Easy",
    skillsCovered: ["Vocabulary"]
  },
  {
    category: "Verbal",
    subCategory: "Grammar",
    questionText: "Choose the grammatically correct sentence.",
    options: [
      "She have completed the task.",
      "She has completed the task.",
      "She having completed the task.",
      "She has complete the task."
    ],
    correctAnswer: "She has completed the task.",
    explanation: "The singular subject 'She' takes 'has' with the past participle.",
    difficulty: "Easy",
    skillsCovered: ["Grammar"]
  },
  {
    category: "Verbal",
    subCategory: "Prepositions",
    questionText: "He has been working here ___ 2022.",
    options: ["for", "since", "from", "during"],
    correctAnswer: "since",
    explanation: "'Since' is used with a specific starting point in time.",
    difficulty: "Easy",
    skillsCovered: ["Grammar"]
  },
  {
    category: "Verbal",
    subCategory: "Sentence Correction",
    questionText: "Choose the correct sentence.",
    options: [
      "Neither of the answers are correct.",
      "Neither of the answers is correct.",
      "Neither answers is correct.",
      "Neither of answers are correct."
    ],
    correctAnswer: "Neither of the answers is correct.",
    explanation: "'Neither' is singular in this construction.",
    difficulty: "Medium",
    skillsCovered: ["Sentence Correction"]
  },
  {
    category: "Verbal",
    subCategory: "Idioms",
    questionText: "What does 'break the ice' mean?",
    options: [
      "To damage something",
      "To begin a friendly conversation",
      "To end a relationship",
      "To create a problem"
    ],
    correctAnswer: "To begin a friendly conversation",
    explanation: "The idiom means to reduce social awkwardness.",
    difficulty: "Easy",
    skillsCovered: ["Idioms"]
  },
  {
    category: "Verbal",
    subCategory: "Vocabulary",
    questionText: "Choose the word closest in meaning to 'Meticulous'.",
    options: ["Careless", "Careful", "Quick", "Lazy"],
    correctAnswer: "Careful",
    explanation: "Meticulous means very careful and precise.",
    difficulty: "Medium",
    skillsCovered: ["Vocabulary"]
  },
  {
    category: "Verbal",
    subCategory: "Grammar",
    questionText: "If I ___ you, I would accept the offer.",
    options: ["am", "was", "were", "be"],
    correctAnswer: "were",
    explanation: "'Were' is used in this hypothetical conditional.",
    difficulty: "Medium",
    skillsCovered: ["Conditionals"]
  },
  {
    category: "Verbal",
    subCategory: "Active and Passive Voice",
    questionText: "Choose the passive form of 'The manager approved the proposal.'",
    options: [
      "The proposal approves the manager.",
      "The proposal was approved by the manager.",
      "The proposal is approving by the manager.",
      "The manager was approved by the proposal."
    ],
    correctAnswer: "The proposal was approved by the manager.",
    explanation: "Simple past passive uses 'was/were + past participle'.",
    difficulty: "Medium",
    skillsCovered: ["Voice"]
  },
  {
    category: "Verbal",
    subCategory: "Reading Comprehension",
    questionText: "Passage: Regular exercise improves physical fitness and can reduce stress. What is the main idea?",
    options: [
      "Exercise is always difficult",
      "Exercise benefits physical and mental well-being",
      "Stress improves fitness",
      "Exercise should be avoided"
    ],
    correctAnswer: "Exercise benefits physical and mental well-being",
    explanation: "The passage describes both fitness and stress benefits.",
    difficulty: "Easy",
    skillsCovered: ["Reading Comprehension"]
  },
  {
    category: "Reasoning",
    subCategory: "Number Series",
    questionText: "Find the next number: 2, 4, 8, 16, ?",
    options: ["24", "30", "32", "36"],
    correctAnswer: "32",
    explanation: "Each number is multiplied by 2.",
    difficulty: "Easy",
    skillsCovered: ["Number Series"]
  },
  {
    category: "Reasoning",
    subCategory: "Number Series",
    questionText: "Find the next number: 3, 6, 11, 18, 27, ?",
    options: ["36", "38", "40", "42"],
    correctAnswer: "38",
    explanation: "Differences are 3, 5, 7, 9, then 11.",
    difficulty: "Medium",
    skillsCovered: ["Number Series"]
  },
  {
    category: "Reasoning",
    subCategory: "Coding-Decoding",
    questionText: "If CAT is coded as DBU, how is DOG coded?",
    options: ["EPH", "EOG", "FPH", "CNG"],
    correctAnswer: "EPH",
    explanation: "Each letter moves one position forward.",
    difficulty: "Easy",
    skillsCovered: ["Coding-Decoding"]
  },
  {
    category: "Reasoning",
    subCategory: "Blood Relations",
    questionText: "A is B's father. B is C's mother. How is A related to C?",
    options: ["Uncle", "Grandfather", "Brother", "Father"],
    correctAnswer: "Grandfather",
    explanation: "A is the father of C's mother.",
    difficulty: "Easy",
    skillsCovered: ["Blood Relations"]
  },
  {
    category: "Reasoning",
    subCategory: "Direction Sense",
    questionText: "A person walks 5 km north, then 3 km east. In which direction is the person from the starting point?",
    options: ["Northwest", "Northeast", "Southwest", "Southeast"],
    correctAnswer: "Northeast",
    explanation: "The final position is north and east of the start.",
    difficulty: "Easy",
    skillsCovered: ["Direction Sense"]
  },
  {
    category: "Reasoning",
    subCategory: "Odd One Out",
    questionText: "Identify the odd one out.",
    options: ["Square", "Triangle", "Circle", "Cube"],
    correctAnswer: "Cube",
    explanation: "Cube is three-dimensional; the others are two-dimensional.",
    difficulty: "Easy",
    skillsCovered: ["Classification"]
  },
  {
    category: "Reasoning",
    subCategory: "Logical Deduction",
    questionText: "All roses are flowers. All flowers are plants. Which conclusion follows?",
    options: [
      "All plants are roses",
      "All roses are plants",
      "No roses are plants",
      "All flowers are roses"
    ],
    correctAnswer: "All roses are plants",
    explanation: "The conclusion follows from the two given statements.",
    difficulty: "Medium",
    skillsCovered: ["Syllogisms"]
  },
  {
    category: "Reasoning",
    subCategory: "Analogies",
    questionText: "Book : Reading :: Fork : ?",
    options: ["Writing", "Eating", "Walking", "Sleeping"],
    correctAnswer: "Eating",
    explanation: "A book is used for reading; a fork is used for eating.",
    difficulty: "Easy",
    skillsCovered: ["Analogies"]
  },
  {
    category: "Reasoning",
    subCategory: "Letter Series",
    questionText: "Find the next letter: A, C, F, J, O, ?",
    options: ["S", "T", "U", "V"],
    correctAnswer: "U",
    explanation: "Alphabet positions increase by 2, 3, 4, 5, then 6.",
    difficulty: "Medium",
    skillsCovered: ["Letter Series"]
  },
  {
    category: "Reasoning",
    subCategory: "Ranking",
    questionText: "Ravi is 7th from the top and 14th from the bottom. How many students are there?",
    options: ["19", "20", "21", "22"],
    correctAnswer: "20",
    explanation: "Total = 7 + 14 - 1 = 20.",
    difficulty: "Easy",
    skillsCovered: ["Ranking"]
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log("MongoDB connected");

    let inserted = 0;
    let skipped = 0;

    for (const question of questions) {
      const result = await PracticeQuestion.updateOne(
        {
          category: question.category,
          questionType: "MCQ",
          questionText: question.questionText
        },
        {
          $setOnInsert: {
            ...question,
            questionType: "MCQ",
            isActive: true,
            marks: 1,
            timeLimitSeconds: 60
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log("Inserted:", inserted);
    console.log("Already existing:", skipped);

    for (const category of ["Aptitude", "Verbal", "Reasoning", "Technical"]) {
      const count = await PracticeQuestion.countDocuments({
        category,
        questionType: "MCQ",
        isActive: true
      });

      console.log(`${category}: ${count} active MCQs`);
    }
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
