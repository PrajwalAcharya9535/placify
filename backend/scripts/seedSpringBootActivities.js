
require("dotenv").config();

const mongoose = require("mongoose");
const dns = require("node:dns");

// DNS fallback for MongoDB Atlas SRV resolution.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const LearningTopic = require("../models/LearningTopic");
const LearningVideo = require("../models/LearningVideo");
const LearningQuiz = require("../models/LearningQuiz");
const LearningExercise = require("../models/LearningExercise");
const LearningResource = require("../models/LearningResource");

// ==========================================
// SPRING BOOT FUNDAMENTALS LEARNING DATA
// Safe to run repeatedly.
// Existing lessons are never deleted.
// ==========================================

const videos = [
  {
    title: "Spring Boot Tutorial for Beginners - Programming with Mosh",
    youtubeUrl: "https://www.youtube.com/watch?v=gJrjgg1KVL4",
    description:
      "Learn Spring Boot project setup, project structure, controllers, configuration and dependency injection.",
    durationMinutes: 72,
    order: 1,
  },
  {
    title: "Spring Boot Full Course - Java Guides",
    youtubeUrl: "https://www.youtube.com/watch?v=Kq-DRboTVrc",
    description:
      "Explore Spring Boot fundamentals, REST APIs, HTTP methods and backend development.",
    durationMinutes: 720,
    order: 2,
  },
  {
    title: "Understanding Dependency Injection - Java Brains",
    youtubeUrl: "https://www.youtube.com/watch?v=GB8k2-Egfv0",
    description:
      "Understand dependency injection and loosely coupled applications.",
    durationMinutes: 15,
    order: 3,
  },
  {
    title: "Creating a Spring Boot Project",
    youtubeUrl: "https://www.youtube.com/watch?v=Z8JHm1NCcQ0",
    description:
      "Learn how to create a Spring Boot project using Spring Initializr.",
    durationMinutes: 15,
    order: 4,
  },
  {
    title: "Inversion of Control and Dependency Injection",
    youtubeUrl: "https://www.youtube.com/watch?v=kzZnWVm0h98",
    description:
      "Understand inversion of control and dependency injection through examples.",
    durationMinutes: 15,
    order: 5,
  },
];

const quizzes = [
  {
    question: "What is the main purpose of Spring Boot?",
    options: [
      "To replace the Java language",
      "To simplify Spring application development",
      "To create database tables only",
      "To replace HTML and CSS",
    ],
    correctAnswer: 1,
    explanation:
      "Spring Boot simplifies Spring development through auto-configuration, starter dependencies and embedded servers.",
    difficulty: "Easy",
    order: 1,
  },
  {
    question:
      "Which annotation is used on a typical Spring Boot entry-point class?",
    options: [
      "@Entity",
      "@Autowired",
      "@SpringBootApplication",
      "@RequestBody",
    ],
    correctAnswer: 2,
    explanation:
      "@SpringBootApplication combines configuration, component scanning and auto-configuration capabilities.",
    difficulty: "Easy",
    order: 2,
  },
  {
    question: "Which tool helps generate a new Spring Boot project?",
    options: [
      "Spring Initializr",
      "MongoDB Compass",
      "Git Bash only",
      "JDBC Driver Manager",
    ],
    correctAnswer: 0,
    explanation:
      "Spring Initializr generates a project structure with the selected build tool, language and dependencies.",
    difficulty: "Easy",
    order: 3,
  },
  {
    question: "Which annotation commonly marks a REST controller?",
    options: [
      "@Repository",
      "@RestController",
      "@Bean",
      "@Table",
    ],
    correctAnswer: 1,
    explanation:
      "@RestController combines controller functionality with response-body handling, commonly returning JSON.",
    difficulty: "Easy",
    order: 4,
  },
  {
    question: "What is dependency injection?",
    options: [
      "Manually compiling every Java file",
      "Injecting HTML into a webpage",
      "Providing an object's dependencies from outside the object",
      "Deleting unused dependencies",
    ],
    correctAnswer: 2,
    explanation:
      "Dependency injection provides required objects to a class rather than making the class create them itself.",
    difficulty: "Easy",
    order: 5,
  },
  {
    question:
      "Which annotation maps HTTP GET requests to a controller method?",
    options: [
      "@PostMapping",
      "@GetMapping",
      "@PutMapping",
      "@DeleteMapping",
    ],
    correctAnswer: 1,
    explanation:
      "@GetMapping maps HTTP GET requests to a controller method.",
    difficulty: "Easy",
    order: 6,
  },
  {
    question:
      "What is the purpose of a Spring Boot starter dependency?",
    options: [
      "To bundle commonly required dependencies",
      "To create user passwords",
      "To replace the JVM",
      "To store application screenshots",
    ],
    correctAnswer: 0,
    explanation:
      "Starter dependencies provide convenient dependency groupings for common application features.",
    difficulty: "Medium",
    order: 7,
  },
  {
    question: "What is the role of application.properties?",
    options: [
      "To store Java class definitions",
      "To define HTML page layouts",
      "To configure application settings",
      "To store all database records",
    ],
    correctAnswer: 2,
    explanation:
      "application.properties stores configuration such as server ports and database settings.",
    difficulty: "Easy",
    order: 8,
  },
  {
    question: "Which annotation maps HTTP POST requests?",
    options: [
      "@GetMapping",
      "@PostMapping",
      "@ComponentScan",
      "@SpringBootApplication",
    ],
    correctAnswer: 1,
    explanation:
      "@PostMapping handles HTTP POST requests, such as requests to create a resource.",
    difficulty: "Easy",
    order: 9,
  },
  {
    question: "Why does Spring Boot support embedded servers?",
    options: [
      "To remove the need for Java",
      "To store source code in a database",
      "To eliminate all dependencies",
      "To run supported web applications without separately deploying to an external server",
    ],
    correctAnswer: 3,
    explanation:
      "An embedded server allows a web application to run with its server packaged in the application.",
    difficulty: "Medium",
    order: 10,
  },
];

const exercises = [
  {
    title: "Create a Spring Boot Project",
    description:
      "Create a new Spring Boot project with the required web dependency.",
    type: "Written",
    difficulty: "Easy",
    instructions:
      "1. Open Spring Initializr.\n2. Select Java and Maven.\n3. Add Spring Web.\n4. Generate and open the project.\n5. Explain the purpose of the main application class.",
    order: 1,
  },
  {
    title: "Build Your First REST Endpoint",
    description:
      "Create an endpoint that returns a greeting message.",
    type: "Coding",
    difficulty: "Easy",
    instructions:
      "Create a REST controller using @RestController. Add a GET endpoint at /hello that returns 'Hello, Placify!'. Run the application and test the endpoint in your browser.",
    order: 2,
  },
  {
    title: "Create a Student REST API",
    description:
      "Implement endpoints for retrieving student information.",
    type: "Coding",
    difficulty: "Medium",
    instructions:
      "Create a Student class and a REST controller. Implement GET endpoints to return one student and a list of students. Use suitable HTTP mappings and return JSON responses.",
    order: 3,
  },
  {
    title: "Understand Dependency Injection",
    description:
      "Create a service and inject it into a controller.",
    type: "Coding",
    difficulty: "Medium",
    instructions:
      "Create a service class containing a greeting method. Register it using @Service. Inject it into a controller using constructor injection and expose the result through a GET endpoint.",
    order: 4,
  },
  {
    title: "Debug a Spring Boot Configuration",
    description:
      "Identify and correct common application configuration errors.",
    type: "Debugging",
    difficulty: "Medium",
    instructions:
      "Create a Spring Boot application. Set a custom server port in application.properties. Run the application and investigate the logs if it fails to start. Explain how you identified and fixed the issue.",
    order: 5,
  },
];

const resources = [
  {
    title: "Official Spring Boot Reference Documentation",
    type: "Documentation",
    url: "https://docs.spring.io/spring-boot/index.html",
    description:
      "Official reference for Spring Boot features, configuration and application development.",
    order: 1,
  },
  {
    title: "Getting Started with Spring Boot",
    type: "Documentation",
    url: "https://spring.io/guides/gs/spring-boot/",
    description:
      "Official step-by-step guide to creating and running a Spring Boot application.",
    order: 2,
  },
  {
    title: "Spring Initializr",
    type: "Website",
    url: "https://start.spring.io/",
    description:
      "Generate a Spring Boot project with your chosen dependencies and build tool.",
    order: 3,
  },
  {
    title: "Building a RESTful Web Service",
    type: "Documentation",
    url: "https://spring.io/guides/gs/rest-service/",
    description:
      "Learn to build a RESTful web service with Spring.",
    order: 4,
  },
  {
    title: "Spring Guides",
    type: "Website",
    url: "https://spring.io/guides/",
    description:
      "Explore practical guides covering web development, REST APIs, data access and testing.",
    order: 5,
  },
];

// ==========================================
// UPSERT HELPER
// Uses one $set operation only, avoiding
// the MongoDB conflict on the topic field.
// Existing matching records are updated;
// unrelated records are preserved.
// ==========================================

async function upsertActivities(Model, topicId, items, key) {
  for (const item of items) {
    await Model.updateOne(
      {
        topic: topicId,
        [key]: item[key],
      },
      {
        $set: {
          ...item,
          topic: topicId,
          isActive: true,
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );
  }
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function seedSpringBootActivities() {
  let connected = false;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);
    connected = true;

    console.log("MongoDB connected.");

    const topic = await LearningTopic.findOne({
      title: "Spring Boot Fundamentals",
      isActive: true,
    });

    if (!topic) {
      throw new Error(
        'Active topic "Spring Boot Fundamentals" not found. Run seedSpringBootLessons.js first.'
      );
    }

    console.log(`Topic found: ${topic.title}`);

    await upsertActivities(
      LearningVideo,
      topic._id,
      videos,
      "title"
    );
    console.log(`Videos seeded: ${videos.length}`);

    await upsertActivities(
      LearningQuiz,
      topic._id,
      quizzes,
      "question"
    );
    console.log(`MCQs seeded: ${quizzes.length}`);

    await upsertActivities(
      LearningExercise,
      topic._id,
      exercises,
      "title"
    );
    console.log(`Exercises seeded: ${exercises.length}`);

    await upsertActivities(
      LearningResource,
      topic._id,
      resources,
      "title"
    );
    console.log(`Resources seeded: ${resources.length}`);

    // Verify the actual active records in MongoDB.
    const [videoCount, quizCount, exerciseCount, resourceCount] =
      await Promise.all([
        LearningVideo.countDocuments({
          topic: topic._id,
          isActive: true,
        }),
        LearningQuiz.countDocuments({
          topic: topic._id,
          isActive: true,
        }),
        LearningExercise.countDocuments({
          topic: topic._id,
          isActive: true,
        }),
        LearningResource.countDocuments({
          topic: topic._id,
          isActive: true,
        }),
      ]);

    console.log("\nVerified active records:");
    console.log(`Videos: ${videoCount}`);
    console.log(`MCQs: ${quizCount}`);
    console.log(`Practice exercises: ${exerciseCount}`);
    console.log(`Resources: ${resourceCount}`);

    console.log(
      "\nSpring Boot learning activities seeded successfully."
    );
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
}

seedSpringBootActivities();
