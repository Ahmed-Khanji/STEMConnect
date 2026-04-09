// Builds the prompt for selecting and curating quiz questions from candidates.
function quizCuratorPrompt(courseName, questionCount, questions) {
  return `
        You are an assessment-quality validator and quiz curator.

        Course: ${courseName}

        You will receive a list of candidate questions (mixed quality, possibly redundant) written for this course. Each candidate may be MCQ or short-answer.

        Your tasks:
        1. Evaluate all provided questions.
        2. Select exactly ${questionCount} questions.
        3. Rank and choose them based on the criteria below.
        4. Optionally rephrase selected questions to improve clarity and professionalism.
        5. Increase difficulty for at most 3 questions (subtle depth increase only).

        Selection criteria (all required):
        - Strong alignment with this course and the candidate pool (same subject matter and level as the inputs)
        - Clear wording with exactly one correct answer
        - Tests conceptual understanding, not trivia or trick questions
        - High likelihood of correctness
        - Allows a clear, short explanation
        - Balanced difficulty: ~3 easy, ~4 medium, ~3 hard
        - Covers multiple subtopics within the course

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
}

// Builds the prompt for generating a short explanation for a single question.
function questionExplanationPrompt(params) {
  const { questionText, hasMcq, correctIndex, correctOption, correctAnswer, options } = params;
  const questionLine = `Question: ${String(questionText || "").trim()}`;
  const answerLine = hasMcq
    ? `Correct answer (option ${(correctIndex ?? 0) + 1}): ${String(correctOption ?? "")}`
    : `Correct answer: ${String(correctAnswer ?? "")}`;

  const otherOptionsBlock = hasMcq && Array.isArray(options) && options.length === 4
    ? `\nOther options (why they are wrong): ${options
        .filter((_, i) => i !== (correctIndex ?? 0))
        .map((o, i) => `${i + 1}. ${String(o)}`)
        .join("; ")}`
    : "";

  return `You are a helpful tutor explaining concepts to a college student.

    Explain *why the answer is correct* in 1–2 short sentences.
    For multiple-choice: explain why the correct option is right and briefly contrast with the other options—e.g. 
    how the correct one differs from or is more/less restrictive than the wrong choices. 
    This helps the student understand not just the right answer but why the others are wrong.
    
    Guidelines:
    - Use simple, plain language.
    - Avoid technical jargon unless absolutely necessary.
    - If a technical term appears, briefly clarify it.
    - Write like a helpful teaching assistant, not a textbook.
    - Keep the explanation concise and easy to understand.
    
    Do NOT repeat the question or the answer.
    Output only the explanation.
    
    ${questionLine}
    ${answerLine}
    ${otherOptionsBlock}
    
    Explanation:`; 
}

module.exports = {
  quizCuratorPrompt,
  questionExplanationPrompt,
};
