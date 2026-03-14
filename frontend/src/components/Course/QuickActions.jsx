import { FileText, Zap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

      <ProgressCard />
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

function ProgressCard() {
  return (
    <div className="rounded-2xl pt-5 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-gray-900">Your Progress</h4>
      </div>

      <div className="space-y-3">
        <ProgressRow
          label="Course Completion"
          valueLabel="68%"
          widthClass="w-[68%]"
          barClass="bg-gradient-to-r from-blue-500 to-purple-500"
        />

        <ProgressRow
          label="Quiz Average"
          valueLabel="85%"
          widthClass="w-[85%]"
          barClass="bg-gradient-to-r from-green-500 to-emerald-500"
        />
      </div>
    </div>
  );
}

function ProgressRow({ label, valueLabel, widthClass, barClass }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">{valueLabel}</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full
            ${widthClass}
            ${barClass}
          `}
        />
      </div>
    </div>
  );
}
