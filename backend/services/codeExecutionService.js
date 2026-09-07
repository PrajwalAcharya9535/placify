const languageMap = {
  Java: 4,
  Python: 28,
  C: 1,
  "C++": 2,
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const executeCode = async ({
  language,
  sourceCode,
  input,
  timeLimitSeconds = 5,
}) => {
  try {
    const languageId = languageMap[language];

    // ==============================
    // VALIDATE LANGUAGE
    // ==============================
    if (!languageId) {
      return {
        success: false,
        status: "Execution Error",
        output: "",
        executionTimeMs: 0,
        errorMessage:
          "Unsupported programming language",
      };
    }

    // ==============================
    // GET JUDGE0 API URL
    // ==============================
    const apiUrl =
      process.env.JUDGE0_API_URL;

    if (!apiUrl) {
      return {
        success: false,
        status: "Execution Error",
        output: "",
        executionTimeMs: 0,
        errorMessage:
          "Judge0 API URL is not configured",
      };
    }

    // ==============================
    // CREATE CODE SUBMISSION
    // ==============================
    const submissionResponse =
      await fetch(
        `${apiUrl}/submissions?base64_encoded=false`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            source_code: sourceCode,
            language_id: languageId,
            stdin: input || "",
          }),
        }
      );

    const submissionData =
      await submissionResponse.json();

    if (!submissionResponse.ok) {
      throw new Error(
        `Judge0 submission failed with status ${
          submissionResponse.status
        }: ${JSON.stringify(
          submissionData
        )}`
      );
    }

    if (!submissionData.token) {
      throw new Error(
        "Judge0 did not return a submission token"
      );
    }

    const token =
      submissionData.token;

    let result = null;

    // ==============================
    // WAIT FOR EXECUTION RESULT
    // ==============================
    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {
      await sleep(500);

      const resultResponse =
        await fetch(
          `${apiUrl}/submissions/${token}?base64_encoded=false`
        );

      if (!resultResponse.ok) {
        throw new Error(
          `Judge0 result request failed with status ${resultResponse.status}`
        );
      }

      result =
        await resultResponse.json();

      // 1 = In Queue
      // 2 = Processing
      if (
        result.status &&
        result.status.id !== 1 &&
        result.status.id !== 2
      ) {
        break;
      }
    }

    if (
      !result ||
      !result.status
    ) {
      throw new Error(
        "Judge0 execution result was not received"
      );
    }

    // ==============================
    // CONVERT JUDGE0 STATUS
    // ==============================
    const statusDescription =
      result.status.description ||
      "";

    let status =
      "Execution Error";

    if (
      statusDescription ===
      "Accepted"
    ) {
      status = "Accepted";
    } else if (
      statusDescription ===
      "Wrong Answer"
    ) {
      status = "Wrong Answer";
    } else if (
      statusDescription.includes(
        "Compilation"
      )
    ) {
      status =
        "Compilation Error";
    } else if (
      statusDescription.includes(
        "Runtime"
      )
    ) {
      status =
        "Runtime Error";
    } else if (
      statusDescription.includes(
        "Time Limit"
      )
    ) {
      status =
        "Time Limit Exceeded";
    }

    // ==============================
    // EXECUTION TIME
    // ==============================
    const executionTimeMs =
      result.time
        ? Math.round(
            Number(result.time) *
              1000
          )
        : 0;

    // ==============================
    // RETURN RESULT
    // ==============================
    return {
      success:
        status === "Accepted",

      status,

      output:
        result.stdout || "",

      executionTimeMs,

      errorMessage:
        result.compile_output ||
        result.stderr ||
        result.message ||
        "",
    };
  } catch (error) {
    return {
      success: false,
      status:
        "Execution Error",
      output: "",
      executionTimeMs: 0,
      errorMessage:
        error.message,
    };
  }
};

module.exports = {
  executeCode,
};