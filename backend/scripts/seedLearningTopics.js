// ==========================================
// PLACIFY LEARNING TOPIC SEED
// ==========================================
//
// Purpose:
// Populate the initial Placify learning catalog.
//
// This script:
// - Uses the existing LearningTopic model
// - Avoids duplicate title + category records
// - Can safely be run again
// - Supports Personalized Roadmap matching
//
// Run from backend:
// node scripts/seedLearningTopics.js
// ==========================================

require("dotenv").config();

const mongoose = require("mongoose");
const LearningTopic = require("../models/LearningTopic");

// ==========================================
// LEARNING TOPIC CATALOG
// ==========================================

const learningTopics = [
  // ========================================
  // PROGRAMMING
  // ========================================

  {
    title: "Java Fundamentals",
    category: "Programming",
    description:
      "Learn the fundamental concepts of Java programming.",
    difficulty: "Beginner",
    content:
      "Java syntax, variables, data types, operators, conditional statements, loops, methods, classes and basic program structure.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Java",
      "Programming",
      "Java Basics",
    ],
    isActive: true,
  },

  {
    title: "Object-Oriented Programming with Java",
    category: "Programming",
    description:
      "Understand the major object-oriented programming concepts used in Java.",
    difficulty: "Intermediate",
    content:
      "Classes, objects, encapsulation, inheritance, polymorphism, abstraction, interfaces and practical OOP design.",
    estimatedMinutes: 60,
    skillsCovered: [
      "Java",
      "OOP",
      "Object-Oriented Programming",
    ],
    isActive: true,
  },

  {
    title: "Java Exception Handling",
    category: "Programming",
    description:
      "Learn how Java handles runtime and application errors.",
    difficulty: "Intermediate",
    content:
      "Exceptions, try, catch, finally, throw, throws, custom exceptions and exception handling best practices.",
    estimatedMinutes: 40,
    skillsCovered: [
      "Java",
      "Exception Handling",
    ],
    isActive: true,
  },

  {
    title: "Java Collections Framework",
    category: "Programming",
    description:
      "Learn how to store and manage groups of objects using Java collections.",
    difficulty: "Intermediate",
    content:
      "List, ArrayList, LinkedList, Set, HashSet, Map, HashMap, Queue, Iterator and collection selection.",
    estimatedMinutes: 60,
    skillsCovered: [
      "Java",
      "Collections",
      "Java Collections",
    ],
    isActive: true,
  },

  {
    title: "Java Multithreading",
    category: "Programming",
    description:
      "Understand concurrent execution and multithreading in Java.",
    difficulty: "Advanced",
    content:
      "Threads, Runnable, thread lifecycle, synchronization, concurrency and common multithreading problems.",
    estimatedMinutes: 55,
    skillsCovered: [
      "Java",
      "Multithreading",
      "Concurrency",
    ],
    isActive: true,
  },

  {
    title: "Spring Boot Fundamentals",
    category: "Programming",
    description:
      "Learn the fundamentals of developing backend applications using Spring Boot.",
    difficulty: "Intermediate",
    content:
      "Spring Boot project structure, controllers, services, dependency injection, configuration and application development.",
    estimatedMinutes: 75,
    skillsCovered: [
      "Java",
      "Spring Boot",
      "Spring",
      "Backend Development",
    ],
    isActive: true,
  },

  {
    title: "REST API Development with Spring Boot",
    category: "Programming",
    description:
      "Learn how to build REST APIs using Spring Boot.",
    difficulty: "Advanced",
    content:
      "REST architecture, controllers, request mappings, request bodies, responses, service layers and API design.",
    estimatedMinutes: 70,
    skillsCovered: [
      "Java",
      "Spring Boot",
      "REST API",
      "Backend Development",
    ],
    isActive: true,
  },

  {
    title: "JavaScript Fundamentals",
    category: "Programming",
    description:
      "Learn core JavaScript concepts used in modern web development.",
    difficulty: "Beginner",
    content:
      "Variables, data types, functions, arrays, objects, conditions, loops, scope and modern JavaScript syntax.",
    estimatedMinutes: 50,
    skillsCovered: [
      "JavaScript",
      "Programming",
      "Web Development",
    ],
    isActive: true,
  },

  {
    title: "Python Fundamentals",
    category: "Programming",
    description:
      "Learn fundamental Python programming concepts.",
    difficulty: "Beginner",
    content:
      "Python syntax, variables, collections, conditions, loops, functions, modules and object-oriented basics.",
    estimatedMinutes: 50,
    skillsCovered: [
      "Python",
      "Programming",
    ],
    isActive: true,
  },

  // ========================================
  // DSA
  // ========================================

  {
    title: "Data Structures and Algorithms Fundamentals",
    category: "DSA",
    description:
      "Build a foundation in data structures and algorithmic problem solving.",
    difficulty: "Beginner",
    content:
      "Algorithm basics, complexity, arrays, strings, searching, sorting and introductory problem-solving techniques.",
    estimatedMinutes: 60,
    skillsCovered: [
      "DSA",
      "Data Structures",
      "Algorithms",
      "Problem Solving",
    ],
    isActive: true,
  },

  {
    title: "Arrays and Strings",
    category: "DSA",
    description:
      "Practice common array and string problem-solving patterns.",
    difficulty: "Beginner",
    content:
      "Array traversal, frequency counting, two pointers, string manipulation and common interview problems.",
    estimatedMinutes: 50,
    skillsCovered: [
      "DSA",
      "Arrays",
      "Strings",
      "Problem Solving",
    ],
    isActive: true,
  },

  {
    title: "Linked Lists",
    category: "DSA",
    description:
      "Understand linked list structures and common operations.",
    difficulty: "Intermediate",
    content:
      "Singly linked lists, doubly linked lists, insertion, deletion, traversal, reversal and interview problems.",
    estimatedMinutes: 45,
    skillsCovered: [
      "DSA",
      "Linked List",
      "Data Structures",
    ],
    isActive: true,
  },

  {
    title: "Stacks and Queues",
    category: "DSA",
    description:
      "Learn stack and queue data structures and their applications.",
    difficulty: "Intermediate",
    content:
      "Stack operations, queue operations, deque, expression problems and common interview applications.",
    estimatedMinutes: 45,
    skillsCovered: [
      "DSA",
      "Stack",
      "Queue",
      "Data Structures",
    ],
    isActive: true,
  },

  {
    title: "Searching and Sorting Algorithms",
    category: "DSA",
    description:
      "Learn important searching and sorting techniques.",
    difficulty: "Intermediate",
    content:
      "Linear search, binary search, bubble sort, selection sort, insertion sort, merge sort and algorithm complexity.",
    estimatedMinutes: 60,
    skillsCovered: [
      "DSA",
      "Searching",
      "Sorting",
      "Algorithms",
    ],
    isActive: true,
  },

  {
    title: "Trees and Binary Search Trees",
    category: "DSA",
    description:
      "Understand tree structures used in technical interviews.",
    difficulty: "Advanced",
    content:
      "Trees, binary trees, binary search trees, traversal techniques and common tree problems.",
    estimatedMinutes: 65,
    skillsCovered: [
      "DSA",
      "Trees",
      "Binary Search Tree",
      "Data Structures",
    ],
    isActive: true,
  },

  // ========================================
  // SQL
  // ========================================

  {
    title: "SQL Fundamentals",
    category: "SQL",
    description:
      "Learn the fundamentals of relational database querying.",
    difficulty: "Beginner",
    content:
      "SELECT, INSERT, UPDATE, DELETE, WHERE, ORDER BY, GROUP BY and aggregate functions.",
    estimatedMinutes: 50,
    skillsCovered: [
      "SQL",
      "Database",
      "MySQL",
    ],
    isActive: true,
  },

  {
    title: "SQL Joins",
    category: "SQL",
    description:
      "Understand how relational tables are combined using joins.",
    difficulty: "Intermediate",
    content:
      "INNER JOIN, LEFT JOIN, RIGHT JOIN, self joins and practical multi-table query examples.",
    estimatedMinutes: 45,
    skillsCovered: [
      "SQL",
      "Joins",
      "Database",
    ],
    isActive: true,
  },

  {
    title: "SQL Subqueries and Advanced Queries",
    category: "SQL",
    description:
      "Learn advanced SQL querying techniques.",
    difficulty: "Intermediate",
    content:
      "Subqueries, nested queries, correlated subqueries, EXISTS, HAVING and complex filtering.",
    estimatedMinutes: 55,
    skillsCovered: [
      "SQL",
      "Subqueries",
      "Database",
    ],
    isActive: true,
  },

  {
    title: "Database Design and Normalization",
    category: "SQL",
    description:
      "Learn how relational databases are structured efficiently.",
    difficulty: "Intermediate",
    content:
      "Keys, relationships, normalization, functional dependencies and relational database design.",
    estimatedMinutes: 50,
    skillsCovered: [
      "SQL",
      "Database",
      "DBMS",
      "Normalization",
    ],
    isActive: true,
  },

  // ========================================
  // APTITUDE
  // ========================================

  {
    title: "Quantitative Aptitude Fundamentals",
    category: "Aptitude",
    description:
      "Build core quantitative aptitude skills for placement tests.",
    difficulty: "Beginner",
    content:
      "Percentages, ratios, averages, profit and loss, simple arithmetic and common placement problems.",
    estimatedMinutes: 60,
    skillsCovered: [
      "Aptitude",
      "Quantitative Aptitude",
    ],
    isActive: true,
  },

  {
    title: "Time Speed and Distance",
    category: "Aptitude",
    description:
      "Practice time, speed and distance problems commonly asked in placement tests.",
    difficulty: "Intermediate",
    content:
      "Speed calculations, relative speed, trains, boats and distance-based aptitude problems.",
    estimatedMinutes: 40,
    skillsCovered: [
      "Aptitude",
      "Time Speed Distance",
      "Quantitative Aptitude",
    ],
    isActive: true,
  },

  {
    title: "Time and Work",
    category: "Aptitude",
    description:
      "Learn techniques for solving time and work aptitude problems.",
    difficulty: "Intermediate",
    content:
      "Work efficiency, combined work, pipes and cisterns and placement-oriented problems.",
    estimatedMinutes: 40,
    skillsCovered: [
      "Aptitude",
      "Time and Work",
      "Quantitative Aptitude",
    ],
    isActive: true,
  },

  {
    title: "Data Interpretation",
    category: "Aptitude",
    description:
      "Learn how to analyze numerical information presented in charts and tables.",
    difficulty: "Intermediate",
    content:
      "Tables, bar charts, pie charts, percentages, comparisons and placement-oriented data interpretation.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Aptitude",
      "Data Interpretation",
    ],
    isActive: true,
  },

  // ========================================
  // REASONING
  // ========================================

  {
    title: "Logical Reasoning Fundamentals",
    category: "Reasoning",
    description:
      "Build logical reasoning skills required for placement assessments.",
    difficulty: "Beginner",
    content:
      "Series, analogies, classifications, patterns and fundamental logical reasoning.",
    estimatedMinutes: 50,
    skillsCovered: [
      "Reasoning",
      "Logical Reasoning",
    ],
    isActive: true,
  },

  {
    title: "Coding and Decoding Reasoning",
    category: "Reasoning",
    description:
      "Practice coding-decoding questions used in placement reasoning tests.",
    difficulty: "Intermediate",
    content:
      "Letter coding, number coding, substitution patterns and reasoning strategies.",
    estimatedMinutes: 35,
    skillsCovered: [
      "Reasoning",
      "Coding Decoding",
    ],
    isActive: true,
  },

  {
    title: "Analytical Reasoning",
    category: "Reasoning",
    description:
      "Develop analytical thinking for complex placement reasoning problems.",
    difficulty: "Intermediate",
    content:
      "Arrangements, puzzles, deductions, conditions and structured logical analysis.",
    estimatedMinutes: 50,
    skillsCovered: [
      "Reasoning",
      "Analytical Reasoning",
      "Problem Solving",
    ],
    isActive: true,
  },

  // ========================================
  // VERBAL
  // ========================================

  {
    title: "English Grammar for Placements",
    category: "Verbal",
    description:
      "Strengthen grammar skills required for verbal placement assessments.",
    difficulty: "Beginner",
    content:
      "Parts of speech, tenses, subject-verb agreement, articles, prepositions and sentence correction.",
    estimatedMinutes: 50,
    skillsCovered: [
      "Verbal",
      "English",
      "Grammar",
    ],
    isActive: true,
  },

  {
    title: "Reading Comprehension",
    category: "Verbal",
    description:
      "Improve reading comprehension for placement tests.",
    difficulty: "Intermediate",
    content:
      "Passage analysis, main ideas, inference, vocabulary in context and comprehension strategies.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Verbal",
      "Reading Comprehension",
      "English",
    ],
    isActive: true,
  },

  {
    title: "Vocabulary for Placement Tests",
    category: "Verbal",
    description:
      "Improve vocabulary commonly tested in placement assessments.",
    difficulty: "Beginner",
    content:
      "Synonyms, antonyms, contextual vocabulary, word usage and vocabulary-building strategies.",
    estimatedMinutes: 35,
    skillsCovered: [
      "Verbal",
      "Vocabulary",
      "English",
    ],
    isActive: true,
  },

  // ========================================
  // TECHNICAL SUBJECT
  // ========================================

  {
    title: "DBMS Interview Fundamentals",
    category: "Technical Subject",
    description:
      "Review important database management concepts for technical interviews.",
    difficulty: "Intermediate",
    content:
      "DBMS architecture, keys, normalization, transactions, ACID properties, indexing and common interview questions.",
    estimatedMinutes: 60,
    skillsCovered: [
      "DBMS",
      "Database",
      "Technical",
    ],
    isActive: true,
  },

  {
    title: "Operating Systems Fundamentals",
    category: "Technical Subject",
    description:
      "Review core operating system concepts for technical interviews.",
    difficulty: "Intermediate",
    content:
      "Processes, threads, scheduling, synchronization, deadlocks, memory management and virtual memory.",
    estimatedMinutes: 60,
    skillsCovered: [
      "Operating Systems",
      "OS",
      "Technical",
    ],
    isActive: true,
  },

  {
    title: "Computer Networks Fundamentals",
    category: "Technical Subject",
    description:
      "Review networking concepts commonly asked in technical interviews.",
    difficulty: "Intermediate",
    content:
      "OSI model, TCP/IP, HTTP, DNS, IP addressing, protocols and networking fundamentals.",
    estimatedMinutes: 55,
    skillsCovered: [
      "Computer Networks",
      "Networking",
      "Technical",
    ],
    isActive: true,
  },

  // ========================================
  // COMMUNICATION
  // ========================================

  {
    title: "Professional Communication Fundamentals",
    category: "Communication",
    description:
      "Develop clear and professional workplace communication.",
    difficulty: "Beginner",
    content:
      "Clear speaking, active listening, professional vocabulary, structured responses and workplace communication.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Communication",
      "Professional Communication",
      "English",
    ],
    isActive: true,
  },

  {
    title: "Group Discussion Communication",
    category: "Communication",
    description:
      "Learn effective communication techniques for group discussions.",
    difficulty: "Intermediate",
    content:
      "Opening a discussion, presenting arguments, active listening, respectful disagreement, participation and conclusions.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Communication",
      "Group Discussion",
      "GD",
    ],
    isActive: true,
  },

  {
    title: "Interview Speaking and Confidence",
    category: "Communication",
    description:
      "Improve confidence and clarity while answering interview questions.",
    difficulty: "Intermediate",
    content:
      "Answer structure, voice clarity, confidence, pacing, concise responses and professional communication.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Communication",
      "Interview",
      "Confidence",
    ],
    isActive: true,
  },

  // ========================================
  // INTERVIEW
  // ========================================

  {
    title: "Technical Interview Preparation",
    category: "Interview",
    description:
      "Prepare systematically for technical interview rounds.",
    difficulty: "Intermediate",
    content:
      "Technical question strategy, explaining code, project explanation, problem solving and structured technical answers.",
    estimatedMinutes: 60,
    skillsCovered: [
      "Interview",
      "Technical Interview",
      "Technical",
    ],
    isActive: true,
  },

  {
    title: "HR Interview Preparation",
    category: "Interview",
    description:
      "Prepare for common HR and behavioral interview questions.",
    difficulty: "Beginner",
    content:
      "Self-introduction, strengths, weaknesses, career goals, company questions and professional HR responses.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Interview",
      "HR Interview",
      "Communication",
    ],
    isActive: true,
  },

  {
    title: "Behavioral Interview Preparation",
    category: "Interview",
    description:
      "Learn how to answer behavioral interview questions effectively.",
    difficulty: "Intermediate",
    content:
      "STAR method, teamwork, leadership, conflict resolution, challenges and achievement-based answers.",
    estimatedMinutes: 45,
    skillsCovered: [
      "Interview",
      "Behavioral Interview",
      "Communication",
    ],
    isActive: true,
  },
];

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MongoDB connection string not found in environment variables"
    );
  }

  await mongoose.connect(mongoUri);

  console.log(
    "MongoDB connected for LearningTopic seed"
  );
};

// ==========================================
// SEED TOPICS
// ==========================================

const seedLearningTopics = async () => {
  let inserted = 0;
  let skipped = 0;

  for (const topicData of learningTopics) {
    const existingTopic =
      await LearningTopic.findOne({
        title: topicData.title,
        category: topicData.category,
      });

    if (existingTopic) {
      skipped += 1;

      console.log(
        `Skipped: ${topicData.title}`
      );

      continue;
    }

    await LearningTopic.create(
      topicData
    );

    inserted += 1;

    console.log(
      `Created: ${topicData.title}`
    );
  }

  console.log("");
  console.log(
    "Learning topic seed completed"
  );
  console.log(
    `Inserted: ${inserted}`
  );
  console.log(
    `Skipped: ${skipped}`
  );
  console.log(
    `Total catalog definitions: ${learningTopics.length}`
  );
};

// ==========================================
// RUN
// ==========================================

const run = async () => {
  try {
    await connectDatabase();

    await seedLearningTopics();
  } catch (error) {
    console.error(
      "Learning topic seed failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB disconnected"
    );
  }
};

run();