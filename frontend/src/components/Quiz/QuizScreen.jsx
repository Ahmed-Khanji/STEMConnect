import React, { useEffect, useMemo, useState } from "react";
import { X, Sun, Moon, Check, ArrowRight } from "lucide-react";

export default function QuizScreen({
  questions,
  onComplete,
  onExit,
  isDarkMode,
  toggleDarkMode,
}) {
  // Quiz progress state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);

  // Countdown timer (5 minutes)
  const [timeLeft, setTimeLeft] = useState(300);

  const totalQuestions = questions?.length || 0;
  const currentQuestion = questions?.[currentIdx];

  // Decrease timer every second, finish quiz when time hits 0
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onComplete(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [score, onComplete]);

  // Handles moving to next question or finishing the quiz
  function handleNext() {
    if (selectedOption === null || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const nextScore = score + (isCorrect ? 1 : 0);
    if (isCorrect) setScore((s) => s + 1);

    const isLast = currentIdx === totalQuestions - 1;

    if (!isLast) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      return;
    }

    onComplete(nextScore);
  }

  const view = useMemo(() => {
    const progress = totalQuestions
      ? ((currentIdx + 1) / totalQuestions) * 100
      : 0;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return { progress, minutes, seconds };
  }, [currentIdx, totalQuestions, timeLeft]);

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

      <QuestionCard
        question={currentQuestion?.question}
        options={currentQuestion?.options || []}
        selectedOption={selectedOption}
        onSelectOption={setSelectedOption}
      />

      <NextButton
        disabled={selectedOption === null}
        isLast={currentIdx === totalQuestions - 1}
        onClick={handleNext}
      />
    </div>
  );
}

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

function QuestionCard({ question, options, selectedOption, onSelectOption }) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 shadow-soft flex-grow transition-colors">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8 leading-snug">
        {question}
      </h3>

      <div className="space-y-4">
        {options.map((option, idx) => {
          const isSelected = selectedOption === idx;

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>

              <span
                className={`font-medium ${
                  isSelected
                    ? "text-purple-700 dark:text-purple-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NextButton({ disabled, isLast, onClick }) {
  return (
    <div className="mt-4">
      <button
        disabled={disabled}
        onClick={onClick}
        className={`w-full py-5 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-[#1f2937] dark:text-gray-500"
            : "bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30 hover:brightness-110 active:scale-[0.98]"
        }`}
      >
        <span>{isLast ? "Finish Quiz" : "Next Question"}</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );
}