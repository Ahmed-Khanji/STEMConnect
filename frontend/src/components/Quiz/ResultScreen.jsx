import React from "react";
import { Trophy, Frown } from "lucide-react";

export default function ResultScreen({ score, total, onRestart }) {
  // Compute result stats
  const percentage = Math.round((score / total) * 100);
  const isPass = percentage >= 60;

  return (
    <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col gap-6 mx-auto animate-slide-in text-center">
      <ResultCard
        score={score}
        total={total}
        percentage={percentage}
        isPass={isPass}
        onRestart={onRestart}
      />
    </div>
  );
}

function ResultCard({ score, total, percentage, isPass, onRestart }) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-10 shadow-soft flex flex-col items-center transition-colors">
      <ResultIcon isPass={isPass} />

      <ResultHeader isPass={isPass} />

      <StatsRow score={score} total={total} percentage={percentage} />

      <RestartButton onRestart={onRestart} />
    </div>
  );
}

function ResultIcon({ isPass }) {
  return (
    <div
      className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${
        isPass ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
      }`}
    >
      {isPass ? <Trophy size={44} /> : <Frown size={44} />}
    </div>
  );
}

function ResultHeader({ isPass }) {
  return (
    <>
      <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">
        {isPass ? "Excellent Work!" : "Keep Practicing!"}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        You've completed the Object-Oriented Programming pop quiz.
      </p>
    </>
  );
}

function StatsRow({ score, total, percentage }) {
  return (
    <div className="flex gap-4 w-full mb-8">
      <StatBox
        label="Score"
        value={`${score}/${total}`}
        valueClass="text-purple-600 dark:text-purple-400"
      />
      <StatBox
        label="Accuracy"
        value={`${percentage}%`}
        valueClass="text-pink-500"
      />
    </div>
  );
}

function StatBox({ label, value, valueClass }) {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-[#111827]/40 p-6 rounded-2xl transition-colors">
      <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className={`text-3xl font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function RestartButton({ onRestart }) {
  return (
    <button
      onClick={onRestart}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-5 rounded-2xl shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
    >
      Try Again
    </button>
  );
}