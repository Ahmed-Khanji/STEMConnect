import { Link } from "react-router-dom";
import { GraduationCap, BookOpenCheck, Home } from "lucide-react";
import { Modal } from "antd";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { getCurrentSemester } from "@/utils/semester";
import { getUserDisplayName, getUserInitials } from "@/utils/userDisplay";

/* ---------- Main Component ---------- */
export default function CourseList({ courses, selectedCourse, onSelectCourse, onDropCourse }) {
  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-purple-300 to-blue-300 border-r border-white/30">
      <Header />

      <Courses
        courses={courses}
        selectedCourse={selectedCourse}
        onSelectCourse={onSelectCourse}
      />

      <DropButton
        selectedCourse={selectedCourse}
        onDropCourse={onDropCourse}
      />

      <UserProfile />
    </div>
  );
}

function getCourseId(course) {
  return course?._id || course?.id;
}

/* ---------- Sections ---------- */
function Header() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-gray-900">Courses</h2>
            <p className="text-xs text-gray-500">{getCurrentSemester()}</p>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/70 hover:bg-white shadow-sm transition-colors text-gray-700 hover:text-gray-900"
          title="Back to home"
          aria-label="Back to home"
        >
          <Home className="w-5 h-5" />
        </Link>

      </div>
    </div>
  );
}

function Courses({ courses, selectedCourse, onSelectCourse }) {
  const selectedId = getCourseId(selectedCourse);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-3">
        Your Courses
      </p>

      <div className="space-y-1">
        {courses.map((course) => {
          const courseId = getCourseId(course);
          const isSelected = courseId === selectedId;

          return (
            <button
              key={courseId}
              onClick={() => onSelectCourse(course)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 shadow-sm"
                  : "hover:bg-gray-50"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: course.color + "20" }}
              >
                <BookOpenCheck
                  className="w-5 h-5"
                  style={{ color: course.color }}
                />
              </div>

              <div className="flex-1 text-left min-w-0">
                <p
                  className={`text-sm truncate ${
                    isSelected ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {course.name}
                </p>
                <p className="text-xs text-gray-500">{course.code}</p>
              </div>

              {course.unreadCount > 0 && (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white">
                    {course.unreadCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropButton({ selectedCourse, onDropCourse }) {
  if (!selectedCourse) return null;
  const courseName = selectedCourse?.name || "this course";

  return (
    <div className="px-4 pb-4">
      <Button
        variant="destructive"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (!onDropCourse) return;
          const courseId = getCourseId(selectedCourse);
          if (!courseId) return;
          Modal.confirm({
            title: "Drop course?",
            content: `You will leave ${courseName} and lose access to its chat and updates.`,
            okText: "Drop",
            cancelText: "Cancel",
            okButtonProps: { danger: true },
            onOk: () => onDropCourse(courseId),
          });
        }}
        className="w-full"
      >
        Drop
      </Button>
    </div>
  );
}

function UserProfile() {
  const { user } = useAuth();
  // If not signed in somehow, show guest profile
  if (!user) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-700 font-semibold">G</span>
          </div>
  
          <div className="flex-1">
            <p className="text-sm text-gray-900">Guest</p>
            <p className="text-xs text-gray-500">Not signed in</p>
          </div>
  
          <div className="w-3 h-3 bg-gray-400 rounded-full" />
        </div>
      </div>
    );
  }

  const initials = getUserInitials(user);
  const name = getUserDisplayName(user);
  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>

        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </div>
    </div>
  );
}
