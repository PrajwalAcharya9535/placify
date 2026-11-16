const alasql = require("alasql");

// ==============================
// SAFE SQL IDENTIFIER
// ==============================
const validateIdentifier = (value) => {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
};

// ==============================
// CONVERT DATA TYPE
// ==============================
const getSafeDataType = (dataType) => {
  const type = String(dataType || "")
    .toUpperCase()
    .trim();

  if (
    type.startsWith("INT") ||
    type.startsWith("INTEGER")
  ) {
    return "INT";
  }

  if (
    type.startsWith("VARCHAR") ||
    type.startsWith("CHAR") ||
    type.startsWith("TEXT")
  ) {
    return "STRING";
  }

  if (
    type.startsWith("DECIMAL") ||
    type.startsWith("NUMERIC") ||
    type.startsWith("FLOAT") ||
    type.startsWith("DOUBLE")
  ) {
    return "NUMBER";
  }

  if (type.startsWith("BOOLEAN")) {
    return "BOOLEAN";
  }

  if (
    type.startsWith("DATE") ||
    type.startsWith("DATETIME")
  ) {
    return "STRING";
  }

  return "STRING";
};

// ==============================
// CHECK QUERY SAFETY
// ==============================
const validateQuery = (query) => {
  if (!query || !query.trim()) {
    return {
      valid: false,
      message: "SQL query is required",
    };
  }

  const normalizedQuery = query
    .trim()
    .replace(/;+\s*$/, "");

  const upperQuery =
    normalizedQuery.toUpperCase();

  // Student SQL Lab currently allows
  // read-only SELECT queries.
 if (
  !/^SELECT\b/i.test(normalizedQuery) &&
  !/^WITH\b/i.test(normalizedQuery)
) {
    return {
      valid: false,
      message:
        "Only SELECT queries are allowed in the SQL Lab",
    };
  }

  const blockedKeywords = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "REPLACE",
    "MERGE",
    "GRANT",
    "REVOKE",
    "ATTACH",
    "DETACH",
  ];

  for (const keyword of blockedKeywords) {
    const pattern = new RegExp(
      `\\b${keyword}\\b`,
      "i"
    );

    if (pattern.test(normalizedQuery)) {
      return {
        valid: false,
        message: `${keyword} queries are not allowed`,
      };
    }
  }

  // Prevent multiple SQL statements.
  if (normalizedQuery.includes(";")) {
    return {
      valid: false,
      message:
        "Multiple SQL statements are not allowed",
    };
  }

  return {
    valid: true,
    query: normalizedQuery,
  };
};

// ==============================
// EXECUTE SQL QUERY
// ==============================
const executeSql = async ({
  tables,
  query,
}) => {
  const startTime = Date.now();

  try {
    const validation = validateQuery(query);

    if (!validation.valid) {
      return {
        success: false,
        status: "Query Error",
        result: [],
        executionTimeMs: 0,
        errorMessage: validation.message,
      };
    }

    if (
      !Array.isArray(tables) ||
      tables.length === 0
    ) {
      return {
        success: false,
        status: "Execution Error",
        result: [],
        executionTimeMs: 0,
        errorMessage:
          "No database tables are configured for this problem",
      };
    }

    // Create a completely separate in-memory
    // database for this execution.
    const db = new alasql.Database();

    for (const table of tables) {
      if (
        !table.tableName ||
        !validateIdentifier(table.tableName)
      ) {
        throw new Error(
          "Invalid SQL table name"
        );
      }

      if (
        !Array.isArray(table.columns) ||
        table.columns.length === 0
      ) {
        throw new Error(
          `No columns configured for table ${table.tableName}`
        );
      }

      const columnDefinitions =
        table.columns.map((column) => {
          if (
            !column.name ||
            !validateIdentifier(column.name)
          ) {
            throw new Error(
              "Invalid SQL column name"
            );
          }

          return `${column.name} ${getSafeDataType(
            column.dataType
          )}`;
        });

      db.exec(
        `CREATE TABLE ${table.tableName} (${columnDefinitions.join(
          ", "
        )})`
      );

      // Insert sample rows safely without
      // building SQL INSERT strings.
      if (
        Array.isArray(table.sampleData) &&
        table.sampleData.length > 0
      ) {
        db.tables[
          table.tableName
        ].data = table.sampleData.map(
          (row) => ({ ...row })
        );
      }
    }

    const result = db.exec(
      validation.query
    );

    const executionTimeMs =
      Date.now() - startTime;

    if (!Array.isArray(result)) {
      return {
        success: false,
        status: "Execution Error",
        result: [],
        executionTimeMs,
        errorMessage:
          "SQL query did not produce a valid result",
      };
    }

    return {
      success: true,
      status: "Executed",
      result,
      executionTimeMs,
      errorMessage: "",
    };
  } catch (error) {
    return {
      success: false,
      status: "Query Error",
      result: [],
      executionTimeMs:
        Date.now() - startTime,
      errorMessage: error.message,
    };
  }
};

module.exports = {
  executeSql,
};