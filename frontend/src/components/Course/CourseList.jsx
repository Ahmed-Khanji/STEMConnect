import { GraduationCap, BookOpenCheck } from 'lucide-react';

export default function CourseList({ courses, selectedCourse, onSelectCourse }) {
    function getCurrentSemester() {
        const now = new Date();
        const month = now.getMonth(); // 0 = Jan, 11 = Dec
        const year = now.getFullYear();
      
        let semester;
        if (month <= 4) semester = "Winter";
        else if (month <= 7) semester = "Summer";
        else semester = "Fall";
      
        return `${semester} ${year}`;
    }
    
    return (
      <div className="w-80 flex flex-col bg-gradient-to-br from-purple-300 to-blue-300 border-r border-white/30">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">Courses</h2>
              <p className="text-xs text-gray-500">{getCurrentSemester()}</p>
            </div>
          </div>
        </div>
  
        {/* Courses List */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-3">Your Courses</p>
          <div className="space-y-1">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  selectedCourse.id === course.id
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: course.color + '20' }}
                >
                  <BookOpenCheck className="w-5 h-5" style={{ color: course.color }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm truncate ${
                    selectedCourse.id === course.id ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {course.name}
                  </p>
                  <p className="text-xs text-gray-500">{course.code}</p>
                </div>
                {course.unreadCount && course.unreadCount > 0 && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white">{course.unreadCount}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
  
        {/* User Profile */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white">JD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
}