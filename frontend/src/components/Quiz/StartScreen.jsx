import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sun,
  Moon,
  Zap,
  Clock,
  HelpCircle,
  Users,
  Info,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getCurrentSemester } from "@/utils/semester";

export default function StartScreen({
  course,
  onStart,
  classAverage,
  isDarkMode,
  toggleDarkMode,
}) {
  const navigate = useNavigate();

  // dynamic display
  const title = course?.name || "Your Course";
  const code = course?.code || "—";
  const durationMinutes = 5;
  const questionCount = 5;

  const semester = getCurrentSemester();

  return (
    <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col gap-6 mx-auto animate-slide-in">
      <TopHeader
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onBack={() => navigate(-1)}
      />
      <MainBanner title={title} subtitle={`${semester} • ${code}`} />
      <StatsCards durationMinutes={durationMinutes} questionCount={questionCount} />
      <CompletionBanner classAverage={classAverage} />
      <Instructions courseName={title} />
      <FooterCTA onStart={onStart} />
    </div>
  );
}

function TopHeader({ isDarkMode, toggleDarkMode, onBack }) {
  return (
    <header className="flex justify-between items-center px-2">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>

      <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
        Pop Quiz
      </h1>

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}

function MainBanner({ title, subtitle }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#a855f7] to-[#ec4899] p-8 md:p-12 text-center text-white shadow-glow">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full glass-effect flex items-center justify-center mb-6 shadow-inner">
          <Zap size={28} />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight">
          {title}
        </h2>

        <p className="text-white/80 text-sm font-medium tracking-wide uppercase mt-2">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StatsCards({ durationMinutes = 5, questionCount = 5 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={<Clock size={18} />}
        iconWrapClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        label="DURATION"
        value={`${durationMinutes} min`}
      />
      <StatCard
        icon={<HelpCircle size={18} />}
        iconWrapClass="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
        label="QUESTIONS"
        value={`${questionCount} Qs`}
      />
    </div>
  );
}

function StatCard({ icon, iconWrapClass, label, value }) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-2xl p-6 flex flex-col items-center shadow-soft transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${iconWrapClass}`}>
        {icon}
      </div>

      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </span>

      <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}

function CompletionBanner({ classAverage }) {
  const status = classAverage?.status ?? "loading";
  const subtitle =
    status === "no-quiz"
      ? "Class average appears after the first quiz exists for this course."
      : status === "no-attempts"
        ? "No attempts recorded yet—be the first to finish."
        : "Across all students in the course";

  const valueEl = (() => {
    if (status === "loading") {
      return (
        <span className="text-xl font-bold text-pink-500/50 tabular-nums animate-pulse" aria-hidden>
          …
        </span>
      );
    }
    if (status === "no-quiz") {
      return (
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
          No quiz yet
        </span>
      );
    }
    if (status === "no-attempts") {
      return (
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
          No data yet
        </span>
      );
    }
    if (status === "ready") {
      return (
        <span className="text-xl font-bold text-pink-500 tabular-nums">
          {classAverage.percent}%
        </span>
      );
    }
    return (
      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400" title="Could not load stats">
        —
      </span>
    );
  })();

  return (
    <div className="bg-pink-50 dark:bg-pink-900/10 rounded-2xl p-5 flex items-center justify-between gap-3 border border-pink-100 dark:border-pink-900/30 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 shrink-0 bg-white dark:bg-[#1f2937] rounded-xl flex items-center justify-center text-pink-500 shadow-sm transition-colors">
          <Users size={20} />
        </div>

        <div className="min-w-0 text-left">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            Overall Quiz Average
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="shrink-0 text-right">{valueEl}</div>
    </div>
  );
}

function Instructions({ courseName }) {
  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 shadow-soft transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <Info className="text-purple-500" size={22} />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Instructions
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
        This is a quick pop quiz to review key topics for <span className="font-semibold text-gray-800 dark:text-gray-100">{courseName}</span>.
        Answer each question and try to finish before time runs out.
      </p>

      <ul className="space-y-5">
        <InstructionItem
          icon={<Check size={14} />}
          iconWrapClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          text="No negative marking"
        />
        <InstructionItem
          icon={<AlertTriangle size={14} />}
          iconWrapClass="bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400"
          text="Cannot be paused once started"
        />
      </ul>
    </div>
  );
}

function InstructionItem({ icon, iconWrapClass, text }) {
  return (
    <li className="flex items-start gap-4">
      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${iconWrapClass}`}>
        {icon}
      </div>
      <span className="text-gray-800 dark:text-gray-100 font-medium text-sm">
        {text}
      </span>
    </li>
  );
}

function FooterCTA({ onStart }) {
  return (
    <button
      onClick={onStart}
      className="w-full bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] hover:from-[#9333ea] hover:to-[#7c3aed] text-white font-bold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all"
    >
      <span className="text-lg">Start Quiz</span>
      <ArrowRight size={20} />
    </button>
  );
}