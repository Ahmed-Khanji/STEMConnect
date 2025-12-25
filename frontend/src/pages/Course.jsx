import { useState } from 'react';
import { CourseList } from '../components/Course/CourseList';
import { ChatArea } from '../components/Course/ChatArea';
import { QuickActions } from '../components/Course/QuickActions';

const mockCourses = [
  { id: '1', name: 'Advanced Mathematics', code: 'MATH301', color: '#8B5CF6', unreadCount: 3 },
  { id: '2', name: 'Computer Science', code: 'CS202', color: '#3B82F6', unreadCount: 0 },
  { id: '3', name: 'Data Structures', code: 'CS305', color: '#10B981', unreadCount: 7 },
  { id: '4', name: 'Physics II', code: 'PHY201', color: '#F59E0B', unreadCount: 0 },
  { id: '5', name: 'English Literature', code: 'ENG104', color: '#EC4899', unreadCount: 2 },
  { id: '6', name: 'Chemistry Lab', code: 'CHEM250', color: '#14B8A6', unreadCount: 0 },
];

export default function Course() {
  const [selectedCourse, setSelectedCourse] = useState(mockCourses[0]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Left Sidebar - Courses */}
      <CourseList
        courses={mockCourses}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-gray-900">{selectedCourse.name}</h1>
          <p className="text-sm text-gray-500">
            {selectedCourse.code} • 24 students online
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <ChatArea course={selectedCourse} />
          {/* Right Sidebar - Quick Actions */}
          <QuickActions course={selectedCourse} />
        </div>
      </div>
    </div>
  );
}
