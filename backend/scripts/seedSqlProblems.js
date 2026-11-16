
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const SqlProblem = require("../models/SqlProblem");
const { executeSql } = require("../services/sqlExecutionService");

// ==========================================
// SQL TABLE HELPERS
// ==========================================

const employeesTable = {
  tableName: "employees",
  columns: [
    { name: "id", dataType: "INT" },
    { name: "name", dataType: "VARCHAR(100)" },
    { name: "department_id", dataType: "INT" },
    { name: "salary", dataType: "INT" },
  ],
  sampleData: [
    { id: 1, name: "Asha", department_id: 1, salary: 45000 },
    { id: 2, name: "Rahul", department_id: 2, salary: 65000 },
    { id: 3, name: "Priya", department_id: 1, salary: 80000 },
    { id: 4, name: "Kiran", department_id: 2, salary: 55000 },
    { id: 5, name: "Neha", department_id: 3, salary: 90000 },
    { id: 6, name: "Arjun", department_id: 1, salary: 60000 },
  ],
};

const departmentsTable = {
  tableName: "departments",
  columns: [
    { name: "id", dataType: "INT" },
    { name: "department_name", dataType: "VARCHAR(100)" },
  ],
  sampleData: [
    { id: 1, department_name: "Engineering" },
    { id: 2, department_name: "Marketing" },
    { id: 3, department_name: "Finance" },
  ],
};

const ordersTable = {
  tableName: "orders",
  columns: [
    { name: "id", dataType: "INT" },
    { name: "customer_name", dataType: "VARCHAR(100)" },
    { name: "amount", dataType: "INT" },
  ],
  sampleData: [
    { id: 1, customer_name: "Asha", amount: 500 },
    { id: 2, customer_name: "Rahul", amount: 1200 },
    { id: 3, customer_name: "Asha", amount: 800 },
    { id: 4, customer_name: "Priya", amount: 2000 },
    { id: 5, customer_name: "Rahul", amount: 700 },
    { id: 6, customer_name: "Priya", amount: 1500 },
  ],
};

// ==========================================
// 6 SQL PRACTICE PROBLEMS
// ==========================================

const problems = [
  // ========================================
  // EASY 1 — EXISTING PROBLEM
  // ========================================
  {
    title: "Find High Salary Employees",
    description:
      "Display the employee name and salary for employees whose salary is greater than 50000. Return the columns name and salary in ascending order of employee id.",
    difficulty: "Easy",
    category: "WHERE Clause",
    tables: [employeesTable],
    expectedQuery: `
      SELECT name, salary
      FROM employees
      WHERE salary > 50000
      ORDER BY id ASC
    `,
    explanation:
      "WHERE filters employees whose salary exceeds 50000. ORDER BY id ASC ensures a consistent result order.",
    marks: 10,
    timeLimitSeconds: 300,
    skillsCovered: ["SQL", "SELECT", "WHERE Clause", "ORDER BY"],
    companyTags: ["TCS", "Infosys"],
    isActive: true,
  },

  // ========================================
  // EASY 2 — ORDER BY
  // ========================================
  {
    title: "Sort Employees by Salary",
    description:
      "Display employee name and salary for all employees. Sort by salary from highest to lowest. Return columns name and salary.",
    difficulty: "Easy",
    category: "ORDER BY",
    tables: [employeesTable],
    expectedQuery: `
      SELECT name, salary
      FROM employees
      ORDER BY salary DESC
    `,
    explanation:
      "ORDER BY salary DESC sorts employee records from highest salary to lowest salary.",
    marks: 10,
    timeLimitSeconds: 300,
    skillsCovered: ["SQL", "SELECT", "ORDER BY"],
    companyTags: ["Wipro", "Accenture"],
    isActive: true,
  },

  // ========================================
  // MEDIUM 1 — GROUP BY + HAVING
  // ========================================
  {
    title: "Customers with High Total Spending",
    description:
      "Using the orders table, find customers whose total order amount is greater than 1500. Return customer_name and total_spent. Sort by customer_name ascending.",
    difficulty: "Medium",
    category: "GROUP BY",
    tables: [ordersTable],
    expectedQuery: `
      SELECT
        customer_name,
        SUM(amount) AS total_spent
      FROM orders
      GROUP BY customer_name
      HAVING SUM(amount) > 1500
      ORDER BY customer_name ASC
    `,
    explanation:
      "GROUP BY combines orders for each customer. SUM calculates total spending. HAVING filters customers with total spending greater than 1500.",
    marks: 20,
    timeLimitSeconds: 600,
    skillsCovered: ["SQL", "GROUP BY", "HAVING", "SUM"],
    companyTags: ["Cognizant", "Capgemini"],
    isActive: true,
  },

  // ========================================
  // MEDIUM 2 — INNER JOIN
  // ========================================
  {
    title: "Employees with Department Names",
    description:
      "Join employees and departments to display each employee's name and department name. Return columns employee_name and department_name. Sort by employee id ascending.",
    difficulty: "Medium",
    category: "JOIN",
    tables: [employeesTable, departmentsTable],
    expectedQuery: `
      SELECT
        e.name AS employee_name,
        d.department_name AS department_name
      FROM employees AS e
      INNER JOIN departments AS d
        ON e.department_id = d.id
      ORDER BY e.id ASC
    `,
    explanation:
      "INNER JOIN connects employees with departments using matching department IDs. Aliases define the required output column names.",
    marks: 20,
    timeLimitSeconds: 600,
    skillsCovered: ["SQL", "INNER JOIN", "Table Aliases"],
    companyTags: ["TCS", "IBM"],
    isActive: true,
  },

  // ========================================
  // HARD 1 — SUBQUERY
  // ========================================
  {
    title: "Employees Earning Above Average Salary",
    description:
      "Find employees whose salary is greater than the overall average employee salary. Return name and salary. Sort by salary descending.",
    difficulty: "Hard",
    category: "Subquery",
    tables: [employeesTable],
    expectedQuery: `
      SELECT name, salary
      FROM employees
      WHERE salary > (
        SELECT AVG(salary)
        FROM employees
      )
      ORDER BY salary DESC
    `,
    explanation:
      "The subquery calculates the overall average salary. The outer query returns employees earning more than that average.",
    marks: 30,
    timeLimitSeconds: 900,
    skillsCovered: ["SQL", "Subquery", "AVG", "WHERE"],
    companyTags: ["Amazon", "Microsoft"],
    isActive: true,
  },

  // ========================================
  // HARD 2 — ADVANCED AGGREGATION
  // ========================================
  {
    title: "Department Salary Analysis",
    description:
      "For departments with at least two employees, display department_name, employee_count, and average_salary. Sort by department_name ascending.",
    difficulty: "Hard",
    category: "Advanced Aggregation",
    tables: [employeesTable, departmentsTable],
    expectedQuery: `
      SELECT
        d.department_name AS department_name,
        COUNT(e.id) AS employee_count,
        AVG(e.salary) AS average_salary
      FROM departments AS d
      INNER JOIN employees AS e
        ON d.id = e.department_id
      GROUP BY d.department_name
      HAVING COUNT(e.id) >= 2
      ORDER BY d.department_name ASC
    `,
    explanation:
      "INNER JOIN combines employees with their departments. GROUP BY groups employees by department. COUNT and AVG calculate employee count and average salary. HAVING keeps departments with at least two employees.",
    marks: 30,
    timeLimitSeconds: 900,
    skillsCovered: [
      "SQL",
      "INNER JOIN",
      "GROUP BY",
      "HAVING",
      "COUNT",
      "AVG",
    ],
    companyTags: ["Google", "Amazon"],
    isActive: true,
  },
];

// ==========================================
// NORMALIZE QUERY RESULTS
// ==========================================

const normalizeResult = (result) =>
  result.map((row) => {
    const normalized = {};

    Object.keys(row)
      .sort()
      .forEach((key) => {
        normalized[key] = row[key];
      });

    return normalized;
  });

// ==========================================
// VALIDATE PROBLEMS
// ==========================================

async function prepareProblems() {
  const difficultyCounts = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  for (const problem of problems) {
    difficultyCounts[problem.difficulty]++;

    // Generate the expected result using
    // the same SQL engine as student submissions.
    const execution = await executeSql({
      tables: problem.tables,
      query: problem.expectedQuery,
    });

    if (!execution.success) {
      throw new Error(
        `Invalid solution for "${problem.title}": ${execution.errorMessage}`
      );
    }

    problem.expectedQuery = problem.expectedQuery.trim();
    problem.expectedResult = normalizeResult(
      execution.result
    );

    if (problem.expectedResult.length === 0) {
      throw new Error(
        `Solution returned no rows: ${problem.title}`
      );
    }

    console.log(
      `Validated: ${problem.title} (${problem.difficulty}) - ${problem.expectedResult.length} rows`
    );
  }

  if (
    problems.length !== 6 ||
    difficultyCounts.Easy !== 2 ||
    difficultyCounts.Medium !== 2 ||
    difficultyCounts.Hard !== 2
  ) {
    throw new Error(
      "Expected exactly 2 Easy, 2 Medium, and 2 Hard SQL problems"
    );
  }
}

// ==========================================
// SEED DATABASE
// ==========================================

async function seedSqlProblems() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing in backend/.env"
      );
    }

    await prepareProblems();

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    let created = 0;
    let updated = 0;

    for (const problem of problems) {
      const existing = await SqlProblem.findOne({
        title: problem.title,
      });

      if (existing) {
        await SqlProblem.updateOne(
          { _id: existing._id },
          { $set: problem }
        );

        updated++;
      } else {
        await SqlProblem.create(problem);
        created++;
      }
    }

    console.log("------------------------------");
    console.log("SQL Practice seeding completed");
    console.log("Created:", created);
    console.log("Updated:", updated);
    console.log("Total processed:", problems.length);
    console.log("------------------------------");

    const counts = await SqlProblem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("Active SQL problems by difficulty:");

    for (const count of counts) {
      console.log(`${count._id}: ${count.count}`);
    }

    console.log("SQL problems ready.");
  } catch (error) {
    console.error(
      "SQL seeding failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSqlProblems();
