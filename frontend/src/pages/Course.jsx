import { useEffect, useState } from "react";
import CourseList from "../components/Course/CourseList";
import ChatArea from "../components/Course/ChatArea";
import QuickActions from "../components/Course/QuickActions";
import SearchCourse from "../components/Course/SearchCourse";
import { getMyCourses } from "../api/courseApi";

export default function Course() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await getMyCourses();
        setCourses(data);
        setSelectedCourse(data[0] || null);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        Loading courses...
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-300 to-pink-50 p-6">
        <div className="w-full flex flex-col items-center gap-6">
          <p className="text-gray-700">No courses yet. Join one or create one.</p>
  
          <SearchCourse
            onSelectCourse={(course) => {
              // when user clicks a suggestion
              setCourses((prev) => {
                // if already in courses, do nothing, else prepend it (most recent one)
                const exists = prev.some((c) => (c._id || c.id) === (course._id || course.id));
                return exists ? prev : [course, ...prev];
              });
              setSelectedCourse(course);
            }}
            onCreateClick={() => {
              // later: open create modal
              console.log("Open create course modal");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Left Sidebar - Courses */}
      <CourseList
        courses={courses}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur border-b border-white/30 px-6 py-4">
          <h1 className="text-gray-900">{selectedCourse.name}</h1>
          <p className="text-sm text-gray-500">
            {selectedCourse.code} • 24 students online
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <ChatArea course={selectedCourse} />
          <QuickActions course={selectedCourse} />
        </div>
      </div>
    </div>
  );
}
