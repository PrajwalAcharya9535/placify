
const generateDemoAnswer = async ({
  questionText,
  stage,
  targetRole,
  targetCompany,
  resumeSnapshot,
}) => {
  if (!questionText?.trim()) return "";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "";

  const model =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    8000
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify({
                    instruction:
                      "Write a strong, natural first-person interview sample answer. " +
                      "Answer the exact question directly. " +
                      "Use 12 to 18 words maximum. " +
                      "Suitable for speaking in approximately 5 to 8 seconds. " +
                      "Use the resume only for verified personal facts. " +
                      "Never invent experience, achievements, projects or skills. " +
                      "For technical questions, prioritize factual correctness. " +
                      "Return only the answer, without headings or quotation marks.",
                    question: questionText,
                    stage,
                    targetRole,
                    targetCompany,
                    resume: resumeSnapshot,
                  }),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 120,
          },
        }),
      }
    );

    if (!response.ok) return "";

    const data = await response.json();

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(" ")
        .trim() || "";

    const cleaned = answer
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const wordCount = cleaned
      .split(/\s+/)
      .filter(Boolean).length;

    return wordCount >= 8 && wordCount <= 18
      ? cleaned
      : "";
  } catch (error) {
    console.warn(
      "Demo answer unavailable:",
      error.message
    );
    return "";
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { generateDemoAnswer };
