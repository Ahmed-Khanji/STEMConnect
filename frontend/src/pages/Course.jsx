// Course.jsx
import { useEffect, useState } from "react";
import CourseList from "../components/Course/CourseList";
import ChatArea from "../components/Course/ChatArea";
import QuickActions from "../components/Course/QuickActions";
import SearchCourse from "../components/Course/SearchCourse";
import CreateCourseModal from "../components/Course/CreateCourseModal";
import { getMyCourses } from "../api/courseApi";

export default function Course() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // modal open
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await getMyCourses();
        setCourses(data);
        setSelectedCourse(data[0] || null);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  function handleSelectCourse(course) {
    setCourses((prev) => {
      const cid = course._id || course.id;
      const exists = prev.some((c) => (c._id || c.id) === cid);
      return exists ? prev : [course, ...prev];
    });
    setSelectedCourse(course);
  }

  function handleCourseCreated(created) {
    setCourses((prev) => [created, ...prev]);
    setSelectedCourse(created);
  }

  if (!selectedCourse) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-400 to-white">
        <div className="w-full flex flex-col items-center max-w-2xl gap-6">
          <p className="text-gray-700">No courses yet. Join one or create one.</p>
          <SearchCourse
            onSelectCourse={handleSelectCourse}
            onCreateClick={() => setCreateOpen(true)}
          />
          <CreateCourseModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={handleCourseCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <CourseList
        courses={courses}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
      />

      <div className="flex flex-1">
        <ChatArea
          course={selectedCourse}
          onSelectCourse={handleSelectCourse}
          onCreateClick={() => setCreateOpen(true)}
        />
        <QuickActions course={selectedCourse} />
      </div>

      <CreateCourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCourseCreated}
      />
    </div>
  );
}
