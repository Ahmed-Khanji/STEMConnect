import React, { useEffect, useMemo, useState } from "react";
import { SendHorizontal, ArrowLeft, Sun, Moon, Bolt, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import {
  createQuestion,
  createQuiz,
  getLatestQuiz,
  getContributionStatus,
  generateExplanation as generateExplanationApi,
} from "@/api/quizApi";
import {
  MIN_HUMAN_QUESTIONS_FOR_QUIZ,
  USER_CONTRIBUTION_THRESHOLD,
} from "@/lib/quizContributionStorage";

/* ===== Small helpers ===== */

const QuestionType = {
  MCQ: "mcq",
  SHORT_ANSWER: "short_answer",
};

const INITIAL_FORM = {
    topicName: "",
    questionType: QuestionType.MCQ,
    questionText: "",
    options: ["", "", "", ""],
    correctOption: null,
    shortAnswer: "",
    explanation: "",
    isConfirmed: false,
};

/* ===== Main component ===== */

function quizHasPopulatedQuestions(quiz) {
  const qs = quiz?.questions;
  if (!Array.isArray(qs) || qs.length === 0) return false;
  const first = qs[0];
  return first && typeof first === "object" && typeof first.question === "string";
}

export default function ContributionScreen({
    isDarkMode,
    toggleDarkMode,
    onBack,
    course,
    needContribution = false,
    onQuizCreated,
    onNeedMoreFromOthers,
}) {
    const courseId = course?._id;

    // Thresholds from server (GET contribution-status on mount)
    const [contribRules, setContribRules] = useState({
      minHumanQuestionsForQuiz: MIN_HUMAN_QUESTIONS_FOR_QUIZ,
      userContributionThreshold: USER_CONTRIBUTION_THRESHOLD,
    });

    const [questionForm, setQuestionForm] = useState(INITIAL_FORM);
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success", // "success" | "error" | "loading"
    });
    const isLoading = toast.show && toast.type === "loading"; // not a state cause depend on a state

    useEffect(() => {
      if (!courseId) return;
      let cancelled = false;
      (async () => {
        try {
          const data = await getContributionStatus(courseId);
          if (cancelled) return;
          setContribRules({
            minHumanQuestionsForQuiz:
              data.minHumanQuestionsForQuiz ?? MIN_HUMAN_QUESTIONS_FOR_QUIZ,
            userContributionThreshold:
              data.userContributionThreshold ?? USER_CONTRIBUTION_THRESHOLD,
          });
        } catch {
          /* keep default contribRules */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [courseId]);

    // Resets the form back to its initial state
    function resetForm() {
        setQuestionForm(INITIAL_FORM);
        setToast({ show: false, message: "", type: "success" }); // optional but nice
    }

    // Shows a toast message with type and optional auto-hide
    function showToast(message, type = "success") {
        setToast({ show: true, message, type });
        
        if (type !== "loading") {
        window.setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
        }
    };

  // Updates a single field in the form state
  function handleInputChange(field, value) {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  // Updates a specific MCQ option by index
  function handleOptionChange(index, value) {
    setQuestionForm((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      return { ...prev, options: nextOptions };
    });
  };

  // Generates an AI explanation via backend (Gemini) and stores it in the form
  const handleAiExplain = async () => {
    const needsMcqCorrect =
      questionForm.questionType === QuestionType.MCQ && questionForm.correctOption === null;
    if (!questionForm.questionText || needsMcqCorrect) {
      showToast("Please provide a question and correct answer first", "error");
      return;
    }
    showToast("AI is thinking...", "loading");
    try {
      const payload = {
        questionText: questionForm.questionText,
        type: questionForm.questionType,
      };
      if (questionForm.questionType === QuestionType.MCQ) {
        payload.options = questionForm.options;
        payload.correctIndex = questionForm.correctOption !== null ? questionForm.correctOption - 1 : 0;
      } else {
        payload.correctAnswer = questionForm.shortAnswer ?? "";
      }
      const data = await generateExplanationApi(payload);
      setQuestionForm((prev) => ({ ...prev, explanation: data.explanation || "" }));
      showToast("AI Explanation Generated!", "success");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to generate explanation";
      showToast(msg, "error");
    }
  };

  // Validates and submits the contribution
  async function handleSubmit(e) {
    e.preventDefault();
    if (!questionForm.isConfirmed) {
      showToast("Please confirm your submission", "error");
      return;
    }
    if (!courseId) {
      showToast("Course not found", "error");
      return;
    }
    const { topicName, questionText, questionType, options, correctOption, shortAnswer, explanation } = questionForm;
    if (!topicName?.trim() || !questionText?.trim() || !explanation?.trim()) {
      showToast("Topic, question text and explanation are required", "error");
      return;
    }
    if (questionType === QuestionType.MCQ) {
      if (options.some((o) => !String(o).trim()) || correctOption == null) {
        showToast("MCQ must have all 4 options and a correct choice", "error");
        return;
      }
    } else if (!String(shortAnswer ?? "").trim()) {
      showToast("Short answer must have an expected answer", "error");
      return;
    }

    showToast("Submitting...", "loading");
    try {
      const payload = {
        topic: topicName.trim(),
        question: questionText.trim(),
        type: questionType,
        explanation: explanation.trim(),
      };
      if (questionType === QuestionType.MCQ) {
        payload.options = options.map((o) => String(o).trim());
        payload.correctIndex = correctOption - 1;
      } else {
        payload.correctAnswer = String(shortAnswer).trim();
      }
      await createQuestion(course._id, payload);

      const status = await getContributionStatus(courseId);
      const minPool = status.minHumanQuestionsForQuiz ?? contribRules.minHumanQuestionsForQuiz;
      const userThr = status.userContributionThreshold ?? contribRules.userContributionThreshold;
      const nextHumanCount =
        typeof status.humanQuestionCount === "number" ? status.humanQuestionCount : 0;
      const myCount =
        typeof status.myContributionCount === "number" ? status.myContributionCount : 0;
      setContribRules({
        minHumanQuestionsForQuiz: minPool,
        userContributionThreshold: userThr,
      });

      if (nextHumanCount >= minPool) {
        showToast("Creating quiz...", "loading");
        try {
          let quiz = null;
          try {
            quiz = await getLatestQuiz(course._id);
          } catch (fetchErr) {
            if (fetchErr?.response?.status !== 404) throw fetchErr;
          }
          if (!quizHasPopulatedQuestions(quiz)) {
            quiz = await createQuiz(course._id, {
              topic: payload.topic,
              questionCount: minPool,
            });
          }
          if (onQuizCreated) onQuizCreated(quiz);
          return;
        } catch (createErr) {
          const msg =
            createErr?.response?.data?.message ||
            createErr?.message ||
            "Could not create quiz";
          showToast(msg, "error");
          resetForm();
          return;
        }
      }

      if (myCount >= userThr && nextHumanCount < minPool) {
        setToast({ show: false, message: "", type: "success" });
        if (onNeedMoreFromOthers) onNeedMoreFromOthers();
        return;
      }

      resetForm();
      showToast("Question submitted successfully", "success");
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit";
      showToast(msg, "error");
    }
  };

  // showing how many characters have been typed for topic (max 50)
  const topicCountText = useMemo(
    () => `${questionForm.topicName.length} / 50`,
    [questionForm.topicName.length]
  );

  const courseName = course?.name || "Your course";

  return (
    <div className="max-w-4xl mx-auto px-6 pb-20 pt-8 animate-fade-in duration-700">
        <TopHeader
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onBack={onBack}
            courseName={courseName}
        />
        
        <Banner courseName={courseName} isNeed={needContribution} />

        <ContributionForm
            questionForm={questionForm}
            topicCountText={topicCountText}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onReset={resetForm}
            onOptionChange={handleOptionChange}
            onAiExplain={handleAiExplain}
        />

        <Toast toast={toast} />
    </div>
  );
}

/* ===== Sections ===== */

function TopHeader({ isDarkMode, toggleDarkMode, onBack, courseName }) {
    function getCurrentSemester() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
      
        if (month <= 4) return `Winter ${year}`;
        if (month <= 7) return `Summer ${year}`;
        return `Fall ${year}`;
    }

    return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          title="Go back to courses"
        >
          <ArrowLeft size={20} className="text-slate-700" />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            Contribute a Question
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {`${courseName} • ${getCurrentSemester()}`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
        aria-label="Toggle theme"
      >
        {isDarkMode 
            ? <Sun size={25} className="text-slate-300" /> 
            : <Moon size={25} className="text-slate-700" />
        }
      </button>
    </header>
  );
}

function Banner({ courseName, isNeed = false }) {
    const title = isNeed 
        ? "Need contributions to unlock the quiz" 
        : "Lead the learning";
    const subtitle = isNeed 
        ? "We don’t have enough questions yet to generate a quiz. Please contribute at least 3 questions"
        : `Your contributions help build the most comprehensive question bank for ${courseName}` 

    return (
        <div
          className={`rounded-2xl p-8 mb-8 text-white flex items-center gap-6 shadow-xl ${
            isNeed ? "bg-gradient-to-br from-amber-500 to-pink-500 shadow-amber-500/20" : "gradient-bg shadow-purple-500/20"
          }`}
        >
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md hidden sm:block">
            {isNeed ? <AlertCircle size={28} className="text-white" /> : <Bolt size={28} className="text-white" />}
          </div>
    
          <div>
            <h2 className="text-2xl font-display font-extrabold">{title}</h2>
            <p className="opacity-90">{subtitle}</p>
          </div>
        </div>
    );
}

function ContributionForm({
  questionForm,
  topicCountText,
  isLoading,
  onSubmit,
  onInputChange,
  onReset,
  onOptionChange,
  onAiExplain,
}) {
  return (
    <form 
        onSubmit={onSubmit} 
        className="
            space-y-8 rounded-2xl p-6 md:p-10 bg-white dark:bg-slate-800
            border border-purple-500/50 dark:border-slate-800
            shadow-[0_0_0_1px_rgba(168,85,247,0.25),0_10px_30px_-10px_rgba(168,85,247,0.35)]
            dark:shadow-sm
        "
    >
      <TopicField questionForm={questionForm} topicCountText={topicCountText} onInputChange={onInputChange} />

      <QuestionTypeToggle questionForm={questionForm} onInputChange={onInputChange} />

      <QuestionText questionForm={questionForm} onInputChange={onInputChange} />

      {questionForm.questionType === QuestionType.MCQ ? (
        <McqSection
          questionForm={questionForm}
          onInputChange={onInputChange}
          onOptionChange={onOptionChange}
        />
      ) : (
        <ShortAnswerSection questionForm={questionForm} onInputChange={onInputChange} />
      )}

      <ExplanationSection
        questionForm={questionForm}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onAiExplain={onAiExplain}
      />

      <Confirmation questionForm={questionForm} onInputChange={onInputChange} />

      <Actions onReset={onReset} isLoading={isLoading} />
    </form>
  );
}

function TopicField({ questionForm, topicCountText, onInputChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        Topic Name
      </label>
      <input
        type="text"
        maxLength={50}
        value={questionForm.topicName}
        onChange={(e) => onInputChange("topicName", e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
        placeholder="e.g., Chain Rule"
      />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-400">Keep it specific: "Inheritance", not "Java"</span>
        <span className="text-xs text-slate-400">{topicCountText}</span>
      </div>
    </div>
  );
}

function QuestionTypeToggle({ questionForm, onInputChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
        Question Type
      </label>
      <div className="flex p-1.5 bg-gray-100 dark:bg-slate-900 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => onInputChange("questionType", QuestionType.MCQ)}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
            questionForm.questionType === QuestionType.MCQ
              ? "bg-white dark:bg-slate-800 shadow-sm text-purple-500"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          MCQ
        </button>

        <button
          type="button"
          onClick={() => onInputChange("questionType", QuestionType.SHORT_ANSWER)}
          className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
            questionForm.questionType === QuestionType.SHORT_ANSWER
              ? "bg-white dark:bg-slate-800 shadow-sm text-purple-500"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Short Answer
        </button>
      </div>
    </div>
  );
}

function QuestionText({ questionForm, onInputChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        Question Text
      </label>
      <textarea
        rows={3}
        value={questionForm.questionText}
        onChange={(e) => onInputChange("questionText", e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
        placeholder="Describe the problem clearly..."
      />
    </div>
  );
}

function McqSection({ questionForm, onInputChange, onOptionChange }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionForm.options.map((opt, idx) => (
          <div key={idx} className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Option {idx + 1}
            </label>
            <input
              type="text"
              value={opt}
              onChange={(e) => onOptionChange(idx, e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Correct Option
        </label>
        <div className="flex flex-wrap gap-4 items-center">
          {[1, 2, 3, 4].map((num) => (
            <label key={num} className="cursor-pointer group">
              <input
                type="radio"
                name="correct"
                className="hidden"
                value={num}
                checked={questionForm.correctOption === num}
                onChange={() => onInputChange("correctOption", num)}
              />
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold ${
                  questionForm.correctOption === num
                    ? "border-purple-500 bg-purple-500/10 text-purple-500 scale-110"
                    : "border-gray-100 dark:border-slate-700 text-slate-500 group-hover:border-purple-500/50"
                }`}
              >
                {num}
              </div>
            </label>
          ))}
          <div className="text-xs text-slate-400 italic">Pick 1–4</div>
        </div>
      </div>
    </div>
  );
}

function ShortAnswerSection({ questionForm, onInputChange }) {
  return (
    <div className="animate-in slide-in-from-top-4 duration-500">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        Expected Answer
      </label>
      <input
        type="text"
        value={questionForm.shortAnswer}
        onChange={(e) => onInputChange("shortAnswer", e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
        placeholder="The exact phrase or number required"
      />
    </div>
  );
}

function ExplanationSection({ questionForm, isLoading, onInputChange, onAiExplain }) {
  const needsMcqCorrect =
    questionForm.questionType === QuestionType.MCQ && questionForm.correctOption === null;

  const disableAi = isLoading || !questionForm.questionText || needsMcqCorrect;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
          Explanation
        </label>
        <button
          type="button"
          onClick={onAiExplain}
          disabled={disableAi}
          className="flex items-center gap-1.5 text-xs font-bold text-purple-500 hover:text-purple-500/80 transition-colors uppercase tracking-tight disabled:opacity-50 disabled:pointer-events-none"
        >
          <Sparkles className="size-4 shrink-0" />
          AI Suggest
        </button>
      </div>

      <textarea
        rows={3}
        value={questionForm.explanation}
        onChange={(e) => onInputChange("explanation", e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
        placeholder="Why is this answer correct?"
      />
      <p className="text-xs text-slate-400 mt-2">1-2 sentences explaining the logic</p>
    </div>
  );
}

function Confirmation({ questionForm, onInputChange }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        questionForm.isConfirmed ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-500/5 border-purple-500/10"
      }`}
    >
      <input
        id="confirm"
        type="checkbox"
        checked={questionForm.isConfirmed}
        onChange={(e) => onInputChange("isConfirmed", e.target.checked)}
        className="mt-1 rounded border-slate-300 text-purple-500 focus:ring-purple-500 h-5 w-5 transition-transform active:scale-90"
      />
      <label
        htmlFor="confirm"
        className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none"
      >
        I confirm this is my own work and follows the course contribution guidelines. Duplicate or plagiarized submissions will be rejected.
      </label>
    </div>
  );
}

function Actions({ onReset, isLoading }) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="w-full sm:w-auto sm:flex-1 px-8 py-4 rounded-full font-bold text-slate-700 dark:text-slate-300
                     hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          Reset
        </button>
  
        <button
            type="submit"
            disabled={isLoading}
            className="group w-full sm:w-auto sm:flex-[2] px-10 py-4 rounded-full font-bold
                        bg-gradient-to-br from-[#A855F7] to-[#EC4899] text-white
                        hover:shadow-lg hover:shadow-purple-500/60 active:scale-[0.98]
                        transition-all inline-flex items-center justify-center gap-2
                        disabled:opacity-60"
            >
            <span className="transition-transform group-hover:-translate-x-[3px]">
                Submit Question
            </span>

            <SendHorizontal
                size={18}
                className="transition-transform group-hover:translate-x-[5px]"
            />
        </button>
      </div>
    );
}

function Toast({ toast }) {
  if (!toast.show) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-10">
      {toast.type === "loading" ? (
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      ) : toast.type === "error" ? (
        <AlertCircle size={20} className="text-red-400" />
      ) : (
        <CheckCircle size={20} className="text-green-400" />
      )}
  
      <span className="font-medium">{toast.message}</span>
    </div>
  );
}
