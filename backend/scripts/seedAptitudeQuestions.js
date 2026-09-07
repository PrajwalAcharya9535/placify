const mongoose = require("mongoose");
const dotenv = require("dotenv");
const PracticeQuestion = require("../models/PracticeQuestion");

dotenv.config();

const aptitudeQuestions = [
  {
    questionText:
      "A number is increased by 20% and then decreased by 20%. What is the net percentage change?",
    category: "Aptitude",
    subcategory: "Percentage",
    difficulty: "Easy",
questionType: "MCQ",    options: [
      "No change",
      "4% decrease",
      "4% increase",
      "8% decrease",
    ],
    correctAnswer: "4% decrease",
    explanation:
      "100 becomes 120, then 120 decreases by 20% to 96. Net decrease = 4%.",
    marks: 2,
    time: 60,
    skills: ["Percentage"],
    isActive: true,
  },

  {
    questionText:
      "If the ratio of two numbers is 3:5 and their sum is 64, what is the smaller number?",
    category: "Aptitude",
    subcategory: "Ratio",
    difficulty: "Easy",
questionType: "MCQ",    options: ["20", "24", "32", "40"],
    correctAnswer: "24",
    explanation:
      "Total parts = 8. One part = 64/8 = 8. Smaller number = 3 x 8 = 24.",
    marks: 2,
    time: 60,
    skills: ["Ratio"],
    isActive: true,
  },

  {
    questionText:
      "A train travels 240 km in 4 hours. What is its average speed?",
    category: "Aptitude",
    subcategory: "Speed Distance Time",
    difficulty: "Easy",
questionType: "MCQ",    options: [
      "50 km/h",
      "60 km/h",
      "70 km/h",
      "80 km/h",
    ],
    correctAnswer: "60 km/h",
    explanation:
      "Average speed = Distance / Time = 240 / 4 = 60 km/h.",
    marks: 2,
    time: 60,
    skills: ["Speed Distance Time"],
    isActive: true,
  },

  {
    questionText:
      "The average of 10, 20, 30, 40 and 50 is:",
    category: "Aptitude",
    subcategory: "Average",
    difficulty: "Easy",
questionType: "MCQ",    options: ["25", "30", "35", "40"],
    correctAnswer: "30",
    explanation:
      "Sum = 150. Average = 150 / 5 = 30.",
    marks: 2,
    time: 60,
    skills: ["Average"],
    isActive: true,
  },

  {
    questionText:
      "If the cost price of an item is 500 and it is sold for 600, what is the profit percentage?",
    category: "Aptitude",
    subcategory: "Profit and Loss",
    difficulty: "Easy",
questionType: "MCQ",    options: ["10%", "15%", "20%", "25%"],
    correctAnswer: "20%",
    explanation:
      "Profit = 600 - 500 = 100. Profit percentage = 100/500 x 100 = 20%.",
    marks: 2,
    time: 60,
    skills: ["Profit and Loss"],
    isActive: true,
  },

  {
    questionText:
      "A can complete a work in 10 days. What fraction of the work does A complete in one day?",
    category: "Aptitude",
    subcategory: "Time and Work",
    difficulty: "Easy",
questionType: "MCQ",    options: ["1/5", "1/10", "1/15", "1/20"],
    correctAnswer: "1/10",
    explanation:
      "If the whole work takes 10 days, one day's work is 1/10.",
    marks: 2,
    time: 60,
    skills: ["Time and Work"],
    isActive: true,
  },

  {
    questionText:
      "What is the simple interest on 1000 at 10% per annum for 2 years?",
    category: "Aptitude",
    subcategory: "Simple Interest",
    difficulty: "Easy",
questionType: "MCQ",    options: ["100", "150", "200", "250"],
    correctAnswer: "200",
    explanation:
      "SI = P x R x T / 100 = 1000 x 10 x 2 / 100 = 200.",
    marks: 2,
    time: 60,
    skills: ["Simple Interest"],
    isActive: true,
  },

  {
    questionText:
      "If 5 pens cost 100, how much will 8 pens cost at the same rate?",
    category: "Aptitude",
    subcategory: "Unitary Method",
    difficulty: "Easy",
questionType: "MCQ",    options: ["140", "150", "160", "180"],
    correctAnswer: "160",
    explanation:
      "Cost of one pen = 100 / 5 = 20. Cost of 8 pens = 8 x 20 = 160.",
    marks: 2,
    time: 60,
    skills: ["Unitary Method"],
    isActive: true,
  },

  {
    questionText:
      "What is 25% of 320?",
    category: "Aptitude",
    subcategory: "Percentage",
    difficulty: "Easy",
questionType: "MCQ",    options: ["60", "70", "80", "90"],
    correctAnswer: "80",
    explanation:
      "25% of 320 = 320 / 4 = 80.",
    marks: 2,
    time: 60,
    skills: ["Percentage"],
    isActive: true,
  },

  {
    questionText:
      "A shopkeeper gives a 10% discount on an item marked at 1000. What is the selling price?",
    category: "Aptitude",
    subcategory: "Discount",
    difficulty: "Easy",
questionType: "MCQ",    options: ["800", "850", "900", "950"],
    correctAnswer: "900",
    explanation:
      "Discount = 10% of 1000 = 100. Selling price = 1000 - 100 = 900.",
    marks: 2,
    time: 60,
    skills: ["Discount"],
    isActive: true,
  },
];

const seedAptitudeQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await PracticeQuestion.insertMany(
      aptitudeQuestions
    );

    console.log(
      "10 Aptitude questions inserted successfully"
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(
      "Failed to seed Aptitude questions:",
      error.message
    );

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAptitudeQuestions();