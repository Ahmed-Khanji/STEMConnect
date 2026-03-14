const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
  const prompt = `
        You are an assessment-quality validator and quiz curator.

        Topic: ${topic}

        You will receive a list of candidate questions (mixed quality, possibly redundant). Each candidate may be MCQ or short-answer.

        Your tasks:
        1. Evaluate all provided questions.
        2. Select exactly ${questionCount} questions.
        3. Rank and choose them based on the criteria below.
        4. Optionally rephrase selected questions to improve clarity and professionalism.
        5. Increase difficulty for at most 3 questions (subtle depth increase only).

        Selection criteria (all required):
        - Strong relevance to ${topic}
        - Clear wording with exactly one correct answer
        - Tests conceptual understanding, not trivia or trick questions
        - High likelihood of correctness
        - Allows a clear, short explanation
        - Balanced difficulty: ~3 easy, ~4 medium, ~3 hard
        - Covers multiple subtopics

        Rejection rules:
        - Reject vague, redundant, misleading, or incorrect questions
        - Avoid selecting multiple questions on the same tiny detail

        For each selected question:
        - Keep MCQ format
        - Provide exactly 4 options
        - Provide correctIndex (0–3)
        - Provide a short, clear explanation
        - Preserve original meaning if rephrased

        Output requirements:
        - Return JSON ONLY
        - No markdown
        - No comments
        - No extra text

        Output format (MUST match this schema):
        {
            "questions": [
                {
                "topic": "string",
                "question": "string",
                "type": "mcq" | "short",
                "explanation": "string",
                "options": ["string", "string", "string", "string"],      // required only if type === "mcq"
                "correctIndex": 0,                                        // required only if type === "mcq"
                "correctAnswer": "string or [string]"                     // required only if type === "short"
                }
            ],
            "meta": {
                "difficultyMix": { "easy": 0, "medium": 0, "hard": 0 },
                "subtopicsCovered": ["string"],
                "rejectedCount": 0,
                "commonRejectionReasons": ["string"]
            }
        }

        ===== CANDIDATE QUESTIONS (INPUT) =====
        ${JSON.stringify(questions, null, 2)}
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    throw new Error(`Gemini generation failed: ${err.message}`);
  }
}


module.exports = { generateQuizQuestions };
