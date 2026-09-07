const mongoose = require("mongoose");
const dotenv = require("dotenv");
const PracticeQuestion = require("../models/PracticeQuestion");

dotenv.config();

const technicalQuestions = [
  {
    questionText:
      "Which OOP principle is used to hide internal implementation details and expose only necessary functionality?",
    category: "Technical",
    subcategory: "Java",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "Inheritance",
      "Abstraction",
      "Polymorphism",
      "Compilation",
    ],
    correctAnswer: "Abstraction",
    explanation:
      "Abstraction hides implementation details and exposes only essential behavior.",
    marks: 2,
    time: 60,
    skills: ["Java", "OOP"],
    isActive: true,
  },
  {
    questionText:
      "Which keyword is used to inherit a class in Java?",
    category: "Technical",
    subcategory: "Java",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "implements",
      "inherits",
      "extends",
      "super",
    ],
    correctAnswer: "extends",
    explanation:
      "The extends keyword is used for class inheritance in Java.",
    marks: 2,
    time: 60,
    skills: ["Java", "Inheritance"],
    isActive: true,
  },
  {
    questionText:
      "Which Java collection does not allow duplicate elements?",
    category: "Technical",
    subcategory: "Java Collections",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "List",
      "ArrayList",
      "Set",
      "LinkedList",
    ],
    correctAnswer: "Set",
    explanation:
      "Set implementations are designed to store unique elements.",
    marks: 2,
    time: 60,
    skills: ["Java", "Collections"],
    isActive: true,
  },
  {
    questionText:
      "Which SQL command is used to retrieve data from a database table?",
    category: "Technical",
    subcategory: "SQL",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "GET",
      "SELECT",
      "FETCHROW",
      "DISPLAY",
    ],
    correctAnswer: "SELECT",
    explanation:
      "SELECT is the SQL statement used to retrieve rows from tables.",
    marks: 2,
    time: 60,
    skills: ["SQL", "Database"],
    isActive: true,
  },
  {
    questionText:
      "Which SQL clause is used to filter rows based on a condition?",
    category: "Technical",
    subcategory: "SQL",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "ORDER BY",
      "GROUP BY",
      "WHERE",
      "SELECT",
    ],
    correctAnswer: "WHERE",
    explanation:
      "WHERE filters rows before they are returned or processed further.",
    marks: 2,
    time: 60,
    skills: ["SQL", "Database"],
    isActive: true,
  },
  {
    questionText:
      "Which data structure follows the Last In First Out principle?",
    category: "Technical",
    subcategory: "DSA",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "Queue",
      "Stack",
      "Tree",
      "Graph",
    ],
    correctAnswer: "Stack",
    explanation:
      "A stack follows LIFO: the last element inserted is removed first.",
    marks: 2,
    time: 60,
    skills: ["DSA", "Stack"],
    isActive: true,
  },
  {
    questionText:
      "Which data structure follows the First In First Out principle?",
    category: "Technical",
    subcategory: "DSA",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "Stack",
      "Queue",
      "Tree",
      "HashMap",
    ],
    correctAnswer: "Queue",
    explanation:
      "A queue follows FIFO: the first element inserted is removed first.",
    marks: 2,
    time: 60,
    skills: ["DSA", "Queue"],
    isActive: true,
  },
  {
    questionText:
      "Which HTTP method is commonly used to create a new resource in a REST API?",
    category: "Technical",
    subcategory: "Web",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "GET",
      "POST",
      "DELETE",
      "TRACE",
    ],
    correctAnswer: "POST",
    explanation:
      "POST is commonly used to create a new resource in REST APIs.",
    marks: 2,
    time: 60,
    skills: ["REST API", "Web"],
    isActive: true,
  },
  {
    questionText:
      "Which MongoDB method is commonly used in Mongoose to find one document by its ID?",
    category: "Technical",
    subcategory: "MongoDB",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "findById",
      "getById",
      "selectId",
      "readId",
    ],
    correctAnswer: "findById",
    explanation:
      "Mongoose provides findById() to retrieve a document using its MongoDB ObjectId.",
    marks: 2,
    time: 60,
    skills: ["MongoDB", "Mongoose"],
    isActive: true,
  },
  {
    questionText:
      "Which keyword is used to handle an exception in Java after a try block?",
    category: "Technical",
    subcategory: "Java",
    difficulty: "Easy",
    questionType: "MCQ",
    options: [
      "throw",
      "catch",
      "final",
      "throws",
    ],
    correctAnswer: "catch",
    explanation:
      "A catch block handles exceptions thrown from the associated try block.",
    marks: 2,
    time: 60,
    skills: ["Java", "Exception Handling"],
    isActive: true,
  },
];

const seedTechnicalQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await PracticeQuestion.insertMany(
      technicalQuestions
    );

    console.log(
      "10 Technical questions inserted successfully"
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Failed to seed Technical questions:",
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedTechnicalQuestions();