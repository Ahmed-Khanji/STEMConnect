import { useState } from 'react';
import { CourseList } from '../Course/CourseList';
import { ChatArea } from '../Course/ChatArea';
import { QuickActions } from '../Course/QuickActions';
import { VideoRooms } from '../Course/VideoRooms';

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
    const [showVideoRooms, setShowVideoRooms] = useState(false);

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
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-gray-900">{selectedCourse.name}</h1>
                <p className="text-sm text-gray-500">{selectedCourse.code} • 24 students online</p>
              </div>
              <button
                onClick={() => setShowVideoRooms(!showVideoRooms)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
              >
                {showVideoRooms ? 'Back to Chat' : 'Study Rooms'}
              </button>
            </div>
    
            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {showVideoRooms ? (
                <VideoRooms course={selectedCourse} />
              ) : (
                <>
                  {/* Chat Area */}
                  <ChatArea course={selectedCourse} />
    
                  {/* Right Sidebar - Quick Actions */}
                  <QuickActions course={selectedCourse} />
                </>
              )}
            </div>
          </div>
        </div>
    );
}