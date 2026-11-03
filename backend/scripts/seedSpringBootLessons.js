require("dotenv").config();

const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const LearningTopic = require("../models/LearningTopic");
const LearningLesson = require("../models/LearningLesson");

const lessons = [
  {
    title: "Introduction to Spring Boot",
    description: "Understand Spring Boot and its advantages.",
    content: `Spring Boot is a Java framework built on top of Spring.

It simplifies backend application development through:
- Auto-configuration
- Starter dependencies
- Embedded web servers
- Production-ready features

Spring Boot is commonly used to build REST APIs and microservices.

Spring Boot reduces configuration work compared with traditional Spring applications.`,
    estimatedMinutes: 12,
  },
  {
    title: "Spring Boot Project Structure",
    description: "Learn the important folders and files.",
    content: `A typical Spring Boot application contains:

src/main/java — Java application source code
src/main/resources — Configuration and resource files
src/test/java — Automated tests
pom.xml — Maven dependencies and build configuration

The main application class commonly uses @SpringBootApplication.

This annotation combines configuration, component scanning and auto-configuration.`,
    estimatedMinutes: 12,
  },
  {
    title: "Creating REST APIs",
    description: "Understand controllers and HTTP endpoints.",
    content: `Spring Boot provides Spring MVC for developing REST APIs.

Important annotations:

@RestController — Defines a REST controller
@GetMapping — Handles HTTP GET requests
@PostMapping — Handles HTTP POST requests
@RequestBody — Reads JSON request data
@PathVariable — Reads values from URL paths

REST APIs allow frontend applications to communicate with backend services.`,
    examples: [
      {
        title: "Simple REST Controller",
        language: "java",
        explanation: "Returns a greeting through a GET endpoint.",
        code: `@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot";
    }
}`,
      },
    ],
    estimatedMinutes: 15,
  },
  {
    title: "Dependency Injection",
    description: "Learn how Spring manages application objects.",
    content: `Dependency Injection is a core Spring concept.

Instead of manually creating every dependency, Spring manages objects called beans.

Common annotations:

@Component — Registers a Spring-managed component
@Service — Identifies a service-layer component
@Repository — Identifies a data-access component

Constructor injection is generally preferred because dependencies remain explicit and can be final.`,
    estimatedMinutes: 15,
  },
  {
    title: "Spring Boot Database Integration",
    description: "Introduction to Spring Data JPA.",
    content: `Spring Boot supports relational databases through Spring Data JPA.

Important concepts:

@Entity — Maps a Java class to a database entity
@Id — Identifies a primary key
JpaRepository — Provides common database operations

Database connection settings are commonly configured in application.properties or application.yml.

Spring Data JPA reduces repetitive persistence code.`,
    estimatedMinutes: 15,
  },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const topic = await LearningTopic.findOne({
      title: "Spring Boot Fundamentals",
      isActive: true,
    });

    if (!topic) {
      throw new Error("Spring Boot Fundamentals topic not found");
    }

    for (const [index, lesson] of lessons.entries()) {
      await LearningLesson.updateOne(
        { topic: topic._id, order: index + 1 },
        {
          $setOnInsert: {
            topic: topic._id,
            order: index + 1,
            ...lesson,
          },
        },
        { upsert: true }
      );
    }

    console.log("Spring Boot lessons seeded successfully");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();