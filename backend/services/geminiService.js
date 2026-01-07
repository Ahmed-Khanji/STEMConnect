
// import { GoogleGenAI, Type } from "@google/genai";
// import { Question } from "../types";

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// export const generateQuizQuestions = async (topic: string, count: number = 10): Promise<Question[]> => {
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-3-flash-preview",
//       contents: `Generate ${count} high-quality multiple-choice questions for a pop quiz on the topic: ${topic}. Focus on core concepts like inheritance, polymorphism, classes, and objects.`,
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: Type.ARRAY,
//           items: {
//             type: Type.OBJECT,
//             properties: {
//               id: { type: Type.INTEGER },
//               question: { type: Type.STRING },
//               options: {
//                 type: Type.ARRAY,
//                 items: { type: Type.STRING },
//               },
//               correctAnswer: {
//                 type: Type.INTEGER,
//                 description: "Index of the correct answer in the options array (0-indexed)",
//               },
//             },
//             required: ["id", "question", "options", "correctAnswer"],
//           },
//         },
//       },
//     });

//     if (response.text) {
//       return JSON.parse(response.text.trim());
//     }
//     return [];
//   } catch (error) {
//     console.error("Error generating questions:", error);
//     // Fallback static questions if API fails
//     return [
//       {
//         id: 1,
//         question: "What is inheritance in OOP?",
//         options: ["Creating new classes from existing ones", "Deleting unused classes", "Changing variable types", "None of the above"],
//         correctAnswer: 0
//       },
//       {
//         id: 2,
//         question: "Which keyword is used for inheritance in Java?",
//         options: ["inherits", "extends", "implements", "base"],
//         correctAnswer: 1
//       }
//     ];
//   }
// };