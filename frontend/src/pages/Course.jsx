import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CourseList from "../components/Course/CourseList";
import ChatArea from "../components/Course/ChatArea";
import QuickActions from "../components/Course/QuickActions";
import SearchCourse from "../components/Course/SearchCourse";
import CreateCourseModal from "../components/Course/CreateCourseModal";

import { getMyCourses, leaveCourse } from "../api/courseApi";

import { Menu, X } from "lucide-react";

export default function Course() {
  const { courseId: courseIdFromRoute } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // modal open
  const [createOpen, setCreateOpen] = useState(false);
  // Quick Actions open
  const [quickOpen, setQuickOpen] = useState(true);
  // Course List open (later)
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await getMyCourses();
        setCourses(data);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Keep selection in sync with /courses/:courseId (e.g. back from quiz deep-link)
  useEffect(() => {
    if (loading) return;
    if (!courses.length) {
      setSelectedCourse(null);
      return;
    }
    if (courseIdFromRoute) {
      const match = courses.find(c => String(c._id) === String(courseIdFromRoute));
      if (match) {
        setSelectedCourse(match);
      } else {
        const first = courses[0];
        setSelectedCourse(first);
        navigate(`/courses/${first._id || first.id}`, { replace: true });
      }
    } else {
      setSelectedCourse(courses[0] || null);
    }
  }, [loading, courses, courseIdFromRoute, navigate]);

  function handleSelectCourse(course) {
    setCourses((prev) => {
      const cid = course._id || course.id;
      const exists = prev.some((c) => (c._id || c.id) === cid);
      return exists ? prev : [course, ...prev];
    });
    setSelectedCourse(course);
    const id = course?._id || course?.id;
    if (id) navigate(`/courses/${id}`, { replace: true });
  }

  function handleCourseCreated(created) {
    setCourses((prev) => [created, ...prev]);
    setSelectedCourse(created);
    const id = created?._id || created?.id;
    if (id) navigate(`/courses/${id}`, { replace: true });
  }

  async function handleDropCourse(courseId) {
    try {
      await leaveCourse(courseId);
      setCourses((prev) => {
        const next = prev.filter((c) => (c._id || c.id) !== courseId);
        setSelectedCourse((prevSelected) => {
          const prevId = prevSelected?._id || prevSelected?.id;
          if (String(prevId) !== String(courseId)) return prevSelected;
          const first = next[0] || null;
          if (first) {
            navigate(`/courses/${first._id || first.id}`, { replace: true });
          } else {
            navigate("/courses", { replace: true });
          }
          return first;
        });
        return next;
      });
    } catch (err) {
      console.error("Drop failed:", err);
      alert(err.message || "Failed to drop course");
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          <p className="text-gray-600 text-sm">Loading courses...</p>
        </div>
      </div>
    );
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
    <div className="relative flex h-screen">
      {/* floating menu button when the course list is hidden */}
      {!listOpen && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="absolute top-4 left-4 z-50 rounded-xl border bg-white/90 p-2 shadow-sm hover:bg-white transition text-gray-900"
          aria-label="Show course list"
        >
          <Menu size={20} />
        </button>
      )}

      <div
        className={`h-full shrink-0 overflow-hidden border-r border-white/30 transition-all duration-300 ease-in-out
          ${listOpen ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"}
        `}
      >
        <CourseList
          courses={courses}
          selectedCourse={selectedCourse}
          onSelectCourse={handleSelectCourse}
          onDropCourse={handleDropCourse}
          listOpen={listOpen} // later
          onToggleList={() => setListOpen(v => !v)}
        />
      </div>

      <div className={`relative flex flex-1 min-w-0 ${!listOpen ? "pl-14" : ""}`}>
        <ChatArea
          course={selectedCourse}
          onSelectCourse={handleSelectCourse}
          onCreateClick={() => setCreateOpen(true)}
        />

        {/* Toggle button (hamburger) */}
        <button
          type="button"
          onClick={() => setQuickOpen(v => !v)}
          className="absolute top-4 right-4 z-50 rounded-xl border bg-white/90 p-2 shadow-sm hover:bg-white transition text-gray-900"
          aria-label={quickOpen ? "Hide quick actions" : "Show quick actions"}
        >
          {quickOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Animated QuickActions container (keep mounted for smooth transitions) */}
        <div
          className={`h-full overflow-hidden border-l border-gray-200 transition-all duration-300 ease-in-out
            ${quickOpen 
              ? "max-w-[20rem] opacity-100 translate-x-0" 
              : "max-w-0 opacity-0 pointer-events-none"}
          `}
        >
          <QuickActions course={selectedCourse} />
        </div>
      </div>

      <CreateCourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCourseCreated}
      />
    </div>
  );
}
