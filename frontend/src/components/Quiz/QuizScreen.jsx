import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Sun, Moon, Check, ArrowRight, CheckCircle } from "lucide-react";

// Normalize a short-answer text for comparison (trim + lowercase + collapse spaces)
function normalizeAnswer(str) {
  return String(str ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// True if the question is a short-answer type
function isShortAnswer(q) {
  return q?.type === "short_answer";
}

// Compute correctness for whichever question type
function computeCorrect(question, selectedOption, shortText) {
  if (isShortAnswer(question)) {
    return normalizeAnswer(shortText) === normalizeAnswer(question.correctAnswer);
  }
  return selectedOption === question.correctIndex;
}

// Build the attempt-answer entry for the API
function buildEntry(question, selectedOption, shortText, isCorrect) {
  if (isShortAnswer(question)) {
    return {
      question: question._id,
      textAnswer: String(shortText ?? "").trim(),
      correct: isCorrect,
    };
  }
  return {
    question: question._id,
    selectedIndex: selectedOption,
    correct: isCorrect,
  };
}

export default function QuizScreen({
  questions,
  durationSeconds = 300,
  onComplete,
  onExit,
  isDarkMode,
  toggleDarkMode,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // MCQ: index (0–3)
  const [shortAnswerText, setShortAnswerText] = useState("");   // short_answer: typed text
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [quizDone, setQuizDone] = useState(false);
  const finishedRef = useRef(false);
  const pendingFinishRef = useRef(null);

  const totalQuestions = questions?.length || 0;
  const currentQuestion = questions?.[currentIdx];
  const currentIsShortAnswer = isShortAnswer(currentQuestion);

  useEffect(() => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setShortAnswerText("");
    setSubmitted(false);
    setScore(0);
    setAnswers([]);
    setTimeLeft(durationSeconds);
    setQuizDone(false);
    finishedRef.current = false;
    pendingFinishRef.current = null;
  }, [questions, durationSeconds]);

  // Count down once per second
  useEffect(() => {
    if (quizDone || timeLeft <= 0) return;
    const id = setTimeout(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [timeLeft, quizDone]);

  const finishWith = useCallback(
    (payload) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setQuizDone(true);
      onComplete(payload);
    },
    [onComplete]
  );

  // Time ran out — auto-submit whatever state we're in
  useEffect(() => {
    if (timeLeft !== 0 || quizDone) return;

    const hasInput = currentIsShortAnswer
      ? shortAnswerText.trim() !== ""
      : selectedOption !== null;

    if (!submitted && hasInput && currentQuestion) {
      const isCorrect = computeCorrect(currentQuestion, selectedOption, shortAnswerText);
      const nextScore = score + (isCorrect ? 1 : 0);
      const nextAnswers = [
        ...answers,
        buildEntry(currentQuestion, selectedOption, shortAnswerText, isCorrect),
      ];
      finishWith({ score: nextScore, answers: nextAnswers, timeTakenSeconds: durationSeconds });
    } else {
      finishWith({ score, answers, timeTakenSeconds: durationSeconds });
    }
  }, [timeLeft, quizDone, submitted, selectedOption, shortAnswerText, currentQuestion, currentIsShortAnswer, score, answers, durationSeconds, finishWith]);

  function handleSubmit() {
    if (!currentQuestion || submitted) return;
    if (currentIsShortAnswer && shortAnswerText.trim() === "") return;
    if (!currentIsShortAnswer && selectedOption === null) return;

    const isCorrect = computeCorrect(currentQuestion, selectedOption, shortAnswerText);
    const nextScore = score + (isCorrect ? 1 : 0);
    const entry = buildEntry(currentQuestion, selectedOption, shortAnswerText, isCorrect);
    const nextAnswers = [...answers, entry];

    setScore(nextScore);
    setAnswers(nextAnswers);
    setSubmitted(true);

    if (currentIdx === totalQuestions - 1) {
      pendingFinishRef.current = {
        score: nextScore,
        answers: nextAnswers,
        timeTakenSeconds: durationSeconds - timeLeft,
      };
    }
  }

  function handleNext() {
    if (!submitted) return;

    const isLast = currentIdx === totalQuestions - 1;
    if (isLast) {
      finishWith(pendingFinishRef.current);
      return;
    }

    setCurrentIdx((i) => i + 1);
    setSelectedOption(null);
    setShortAnswerText("");
    setSubmitted(false);
  }

  const view = useMemo(() => {
    const progress = totalQuestions ? ((currentIdx + 1) / totalQuestions) * 100 : 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return { progress, minutes, seconds };
  }, [currentIdx, totalQuestions, timeLeft]);

  // Determine the answer the user typed/selected for feedback
  const submittedAnswerLabel = currentIsShortAnswer
    ? shortAnswerText.trim()
    : currentQuestion?.options?.[selectedOption] ?? "";

  const isCorrectAfterSubmit =
    submitted && computeCorrect(currentQuestion, selectedOption, shortAnswerText);

  const hasInput = currentIsShortAnswer
    ? shortAnswerText.trim() !== ""
    : selectedOption !== null;

  return (
    <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col gap-6 mx-auto animate-slide-in h-full">
      <TopHeader
        onExit={onExit}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        minutes={view.minutes}
        seconds={view.seconds}
      />

      <ProgressBar
        currentIdx={currentIdx}
        totalQuestions={totalQuestions}
        progress={view.progress}
      />

      {currentIsShortAnswer ? (
        <ShortAnswerCard
          question={currentQuestion?.question}
          correctAnswer={currentQuestion?.correctAnswer}
          explanation={currentQuestion?.explanation}
          value={shortAnswerText}
          submitted={submitted}
          isCorrect={isCorrectAfterSubmit}
          submittedAnswer={submittedAnswerLabel}
          onChange={submitted ? undefined : setShortAnswerText}
        />
      ) : (
        <McqCard
          question={currentQuestion?.question}
          options={currentQuestion?.options || []}
          correctIndex={currentQuestion?.correctIndex}
          explanation={currentQuestion?.explanation}
          selectedOption={selectedOption}
          submitted={submitted}
          isCorrect={isCorrectAfterSubmit}
          onSelectOption={submitted ? undefined : setSelectedOption}
        />
      )}

      <ActionButton
        submitted={submitted}
        hasInput={hasInput}
        isLast={currentIdx === totalQuestions - 1}
        onSubmit={handleSubmit}
        onNext={handleNext}
      />
    </div>
  );
}

/* ── Shared header / progress ─────────────────────────────────── */

function TopHeader({ onExit, isDarkMode, toggleDarkMode, minutes, seconds }) {
  return (
    <header className="flex justify-between items-center px-2">
      <button
        onClick={onExit}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
        aria-label="Exit quiz"
      >
        <X size={20} />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Time Remaining
        </span>
        <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}

function ProgressBar({ currentIdx, totalQuestions, progress }) {
  return (
    <div className="px-2">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
          Question {currentIdx + 1} of {totalQuestions}
        </span>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
          {Math.round(progress)}% Complete
        </span>
      </div>

      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ── MCQ card ─────────────────────────────────────────────────── */

function McqCard({
  question,
  options,
  correctIndex,
  explanation,
  selectedOption,
  submitted,
  isCorrect,
  onSelectOption,
}) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 shadow-soft flex-grow transition-colors flex flex-col gap-6">
      <QuestionText text={question} />

      <div className="space-y-3">
        {options.map((option, idx) => (
          <OptionButton
            key={idx}
            idx={idx}
            option={option}
            selectedOption={selectedOption}
            correctIndex={correctIndex}
            submitted={submitted}
            onSelect={onSelectOption}
          />
        ))}
      </div>

      {submitted && (
        <FeedbackBanner
          isCorrect={isCorrect}
          correctLabel={options[correctIndex]}
          explanation={explanation}
        />
      )}
    </div>
  );
}

function OptionButton({ idx, option, selectedOption, correctIndex, submitted, onSelect }) {
  const isSelected = selectedOption === idx;
  const isCorrect = idx === correctIndex;

  let style = "border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800";
  let radioStyle = "border-gray-300 dark:border-gray-600";
  let textStyle = "text-gray-700 dark:text-gray-300";
  let indicator = null;

  if (!submitted && isSelected) {
    style = "border-purple-500 bg-purple-50 dark:bg-purple-900/20";
    radioStyle = "border-purple-500 bg-purple-500";
    textStyle = "text-purple-700 dark:text-purple-300";
    indicator = <Check size={14} className="text-white" />;
  } else if (submitted && isCorrect) {
    style = "border-green-500 bg-green-50 dark:bg-green-900/20";
    radioStyle = "border-green-500 bg-green-500";
    textStyle = "text-green-700 dark:text-green-300";
    indicator = <Check size={14} className="text-white" />;
  } else if (submitted && isSelected && !isCorrect) {
    style = "border-red-400 bg-red-50 dark:bg-red-900/20";
    radioStyle = "border-red-400 bg-red-400";
    textStyle = "text-red-600 dark:text-red-400";
    indicator = <X size={14} className="text-white" />;
  }

  return (
    <button
      type="button"
      disabled={submitted}
      onClick={() => onSelect?.(idx)}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${radioStyle}`}
      >
        {indicator}
      </div>
      <span className={`font-medium transition-colors ${textStyle}`}>{option}</span>
    </button>
  );
}

/* ── Short-answer card ────────────────────────────────────────── */

function ShortAnswerCard({
  question,
  correctAnswer,
  explanation,
  value,
  submitted,
  isCorrect,
  submittedAnswer,
  onChange,
}) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 shadow-soft flex-grow transition-colors flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <QuestionText text={question} />
        <span className="shrink-0 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
          Short answer
        </span>
      </div>

      <div>
        <textarea
          rows={3}
          value={value ?? ""}
          disabled={submitted}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type your answer here…"
          className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium resize-none outline-none transition-colors ${
            submitted
              ? isCorrect
                ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:border-purple-500 dark:focus:border-purple-400"
          }`}
        />
      </div>

      {submitted && (
        <FeedbackBanner
          isCorrect={isCorrect}
          correctLabel={correctAnswer}
          explanation={explanation}
          submittedAnswer={submittedAnswer}
          isShortAnswer
        />
      )}
    </div>
  );
}

/* ── Shared feedback banner ───────────────────────────────────── */

function FeedbackBanner({
  isCorrect,
  correctLabel,
  explanation,
  submittedAnswer,
  isShortAnswer: shortAnswerMode,
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden animate-fade-in ${
        isCorrect
          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40"
          : "bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40"
      }`}
    >
      {isCorrect && (
        <div className="flex items-center gap-3 px-5 py-4 font-semibold text-sm text-green-700 dark:text-green-300">
          <CheckCircle size={20} className="shrink-0" />
          <span>Correct! Well done.</span>
        </div>
      )}

      {/* For wrong short-answer, show both their answer and the expected one */}
      {!isCorrect && shortAnswerMode && submittedAnswer && (
        <div className="px-5 pt-4 pb-2 text-sm text-red-600 dark:text-red-400">
          <span className="font-bold uppercase tracking-widest text-xs mr-2 opacity-60">
            You wrote:
          </span>
          <span className="italic">{submittedAnswer}</span>
        </div>
      )}

      {explanation && (
        <div
          className={`px-5 pb-4 text-sm ${
            isCorrect
              ? "pt-1 border-t border-green-200 dark:border-green-800/40 text-green-800 dark:text-green-200"
              : "pt-3 text-red-700 dark:text-red-300"
          }`}
        >
          <span className="font-bold uppercase tracking-widest text-xs mr-2 opacity-60">
            Why?
          </span>
          {explanation}
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ───────────────────────────────────────────── */

function QuestionText({ text }) {
  return (
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-snug flex-1">
      {text}
    </h3>
  );
}

function ActionButton({ submitted, hasInput, isLast, onSubmit, onNext }) {
  if (!submitted) {
    return (
      <button
        type="button"
        disabled={!hasInput}
        onClick={onSubmit}
        className={`w-full py-5 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
          !hasInput
            ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-[#1f2937] dark:text-gray-500"
            : "bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30 hover:brightness-110 active:scale-[0.98]"
        }`}
      >
        <span>Submit Answer</span>
        <Check size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onNext}
      className="w-full py-5 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30 hover:brightness-110 active:scale-[0.98]"
    >
      <span>{isLast ? "See Results" : "Next Question"}</span>
      <ArrowRight size={20} />
    </button>
  );
}
