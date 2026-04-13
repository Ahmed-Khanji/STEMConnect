import { useState, useEffect } from "react";
import { FileText, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLatestQuiz, getMyAttempts } from "@/api/quizApi";

export default function QuickActions({ course }) {
  const navigate = useNavigate();
  const courseId = course?._id || course?.id;

  function handleAction(action) {
    if (!courseId) return;
    if (action === "QUIZ") navigate(`/courses/${courseId}/quiz`);
    if (action === "EXAM") navigate("/coming-soon");
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-200 to-white border-l border-gray-200 p-6 overflow-y-auto">
      <h3 className="text-gray-900 mb-4">Quick Actions</h3>

      <ActionCard
        title="Pop Quiz"
        subtitle="Test your knowledge"
        description="Quick 5-minute quiz to review today's topics"
        meta="~5 minutes"
        icon={Zap}
        iconBoxClass="bg-gradient-to-br from-purple-400 to-purple-600"
        metaClass="text-purple-600"
        borderClass="border-purple-100"
        onClick={() => handleAction("QUIZ")}
      />

      <ActionCard
        title="Sample Exam"
        subtitle="Full practice test"
        description="Complete exam simulation with real conditions"
        meta="~60 minutes"
        icon={FileText}
        iconBoxClass="bg-gradient-to-br from-pink-400 to-pink-600"
        metaClass="text-pink-600"
        borderClass="border-pink-100"
        onClick={() => handleAction("EXAM")}
      />

      <ProgressCard courseId={courseId} />
    </div>
  );
}

// Returns { label, name, percent } for the current semester progress
function getSemesterProgress() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  let name, start, end;

  if (month <= 4) {
    name = `Winter ${year}`;
    start = new Date(year, 0, 1);   // Jan 1
    end   = new Date(year, 4, 31);  // May 31
  } else if (month <= 7) {
    name = `Summer ${year}`;
    start = new Date(year, 5, 1);   // Jun 1
    end   = new Date(year, 7, 31);  // Aug 31
  } else {
    name = `Fall ${year}`;
    start = new Date(year, 8, 1);   // Sep 1
    end   = new Date(year, 11, 31); // Dec 31
  }

  const totalMonths   = end - start;
  const elapsedMonths = Math.max(0, now - start);
  const percent   = Math.min(100, Math.round((elapsedMonths / totalMonths) * 100));

  return { name, percent };
}

function ProgressCard({ courseId }) {
  const [quizAvg, setQuizAvg] = useState(null); // null = loading, false = no data, 0-100 = value
  const semester = getSemesterProgress();

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    async function load() {
      try {
        const quiz = await getLatestQuiz(courseId);
        if (cancelled) return;
        if (!quiz?._id) { setQuizAvg(false); return; }

        const attempts = await getMyAttempts(quiz._id);
        if (cancelled) return;
        const latest = Array.isArray(attempts) ? attempts[0] : null;
        if (!latest) { setQuizAvg(false); return; }

        const pct = latest.total > 0
          ? Math.round((latest.score / latest.total) * 100)
          : false;
        setQuizAvg(pct);
      } catch {
        if (!cancelled) setQuizAvg(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [courseId]);

  const quizLabel =
    quizAvg === null  ? "…" :
    quizAvg === false ? "—" :
    `${quizAvg}%`;

  return (
    <div className="rounded-2xl pt-5 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-gray-900">Your Progress</h4>
      </div>

      <div className="space-y-3">
        <ProgressRow
          label="Course Completion"
          valueLabel={`${semester.percent}%`}
          percent={semester.percent}
          barClass="bg-gradient-to-r from-blue-500 to-purple-500"
          sublabel={semester.name}
        />

        <ProgressRow
          label="Quiz Average"
          valueLabel={quizLabel}
          percent={typeof quizAvg === "number" ? quizAvg : 0}
          barClass="bg-gradient-to-r from-green-500 to-emerald-500"
          sublabel={quizAvg === false ? "No attempt yet" : quizAvg === null ? "" : null}
        />
      </div>
    </div>
  );
}

function ProgressRow({ label, valueLabel, percent, barClass, sublabel }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-semibold tabular-nums">{valueLabel}</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {sublabel != null && (
        <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
      )}
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  description,
  meta,
  icon: Icon,
  iconBoxClass,
  metaClass,
  borderClass,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all
        text-left group border
        ${borderClass}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            group-hover:scale-110 transition-transform
            ${iconBoxClass}
          `}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div>
          <h4 className="text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{description}</p>

      <div className={`flex items-center gap-2 text-xs ${metaClass}`}>
        <Clock className="w-4 h-4" />
        <span>{meta}</span>
      </div>
    </button>
  );
}
