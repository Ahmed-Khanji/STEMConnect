import { FileText, Zap, Clock, TrendingUp } from 'lucide-react';

export default function QuickActions({ course }) {
  const handleAction = (action) => {
    // In a real app, this would navigate to the respective feature
    console.log(`Starting ${action} for ${course.name}`);
  };

  return (
    <div className="w-80 bg-gradient-to-br from-purple-50 to-pink-50 border-l border-gray-200 p-6 overflow-y-auto">
      <h3 className="text-gray-900 mb-4">Quick Actions</h3>

      {/* Pop Quiz Card */}
      <button
        onClick={() => handleAction('pop quiz')}
        className="w-full bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all border border-purple-100 text-left group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-gray-900">Pop Quiz</h4>
            <p className="text-xs text-gray-500">Test your knowledge</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Quick 5-minute quiz to review today's topics
        </p>
        <div className="flex items-center gap-2 text-xs text-purple-600">
          <Clock className="w-4 h-4" />
          <span>~5 minutes</span>
        </div>
      </button>

      {/* Sample Exam Card */}
      <button
        onClick={() => handleAction('sample exam')}
        className="w-full bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all border border-pink-100 text-left group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-gray-900">Sample Exam</h4>
            <p className="text-xs text-gray-500">Full practice test</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Complete exam simulation with real conditions
        </p>
        <div className="flex items-center gap-2 text-xs text-pink-600">
          <Clock className="w-4 h-4" />
          <span>~60 minutes</span>
        </div>
      </button>

      {/* Study Stats */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-gray-900">Your Progress</h4>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Course Completion</span>
              <span className="text-gray-900">68%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-[68%] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Quiz Average</span>
              <span className="text-gray-900">85%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}