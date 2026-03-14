const { GoogleGenAI, Type } = require("@google/genai");
const { quizCuratorPrompt, questionExplanationPrompt } = require("./prompts");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL = "gemini-2.5-flash";

function extractText(resp) {
    // fallback-safe extraction (SDK versions vary according to ai)
    return (
      resp?.output_text || // GoogleGenAI typically returns text in response.output_text
      resp?.text ||
      resp?.response?.text ||
      ""
    );
}

async function generateQuizQuestions(topic, questionCount, questions) {
  const prompt = quizCuratorPrompt(topic, questionCount, questions);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              minItems: questionCount,
              maxItems: questionCount,
              items: {
                type: Type.OBJECT, 
                properties: {
                  topic: { type: Type.STRING },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["mcq", "short"] },
                  explanation: { type: Type.STRING },
                  
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  
                  correctAnswer: {
                    // allow string OR array of strings (short-answer)
                    anyOf: [
                      { type: Type.STRING },
                      { type: Type.ARRAY, items: { type: Type.STRING } },
                    ],
                  },
                },
                required: ["topic", "question", "type", "explanation"],
              },
            },
            meta: {
              type: Type.OBJECT,
              properties: {
                difficultyMix: {
                  type: Type.OBJECT,
                  properties: {
                    easy: { type: Type.INTEGER },
                    medium: { type: Type.INTEGER },
                    hard: { type: Type.INTEGER },
                  },
                  required: ["easy", "medium", "hard"],
                },
                subtopicsCovered: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                rejectedCount: { type: Type.INTEGER },
                commonRejectionReasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "difficultyMix",
                "subtopicsCovered",
                "rejectedCount",
                "commonRejectionReasons",
              ],
            },
          },
          required: ["questions", "meta"],
        },
      },
    });

    const raw = extractText(response);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Gemini returned invalid JSON.");
    }

    // ---- strict validations ----
    if (!Array.isArray(data.questions) || data.questions.length !== questionCount) {
        throw new Error(`Invalid AI response: expected ${questionCount} questions.`);
    }

    for (const q of data.questions) {
        if (!q.topic || !q.question || !q.type || !q.explanation) {
            throw new Error("Invalid AI question: missing required fields.");
        }

        if (q.type === "mcq") {
            if (!Array.isArray(q.options) || q.options.length !== 4) {
                throw new Error("Invalid MCQ: options must be an array of 4 strings.");
            }
            if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
                throw new Error("Invalid MCQ: correctIndex must be 0..3.");
            }
        }

        if (q.type === "short") {
            if (q.correctAnswer === undefined || q.correctAnswer === null) {
                throw new Error("Invalid short question: correctAnswer is required.");
            }
        }
    }

    return data; // { questions: [...], meta: {...} }

  } catch (err) {
    console.log(err);
    throw new Error(`Gemini generation failed`);
  }
}

async function generateQuestionExplanation(input) {
  const { questionText, type, options, correctIndex, correctAnswer } = input;
  const hasMcq = type === "mcq" && Array.isArray(options) && typeof correctIndex === "number";
  const correctOption = hasMcq ? options[correctIndex] : null;

  const prompt = questionExplanationPrompt({
    questionText,
    hasMcq,
    correctIndex,
    correctOption,
    correctAnswer,
    options,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = extractText(response);
    return (text || "Explanation could not be generated.").trim();
  } catch (err) {
    console.log(err);
    throw new Error(`Explanation generation failed`);
  }
}

module.exports = { generateQuizQuestions, generateQuestionExplanation };
