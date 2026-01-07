import { useEffect, useRef, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { getAllCourses, joinCourseByCode } from "../../api/courseApi";

export default function SearchCourse({ onSelectCourse, onCreateClick, className = "" }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [focusedCourseId, setFocusedCourseId] = useState(null);
  const [joiningCourseId, setJoiningCourseId] = useState(null);

  const wrapRef = useRef(null);
  const debounceRef = useRef(null);
  const activeItemRef = useRef(null);

  const hasResults = results.length > 0;

  // Helper: resets UI state related to dropdown/search
  function resetUI() {
    setQ("");
    setResults([]);
    setOpen(false);
    setLoading(false);
    setActiveIndex(-1);
    setFocusedCourseId(null);
  }

  // Helper: select a course and notify parent
  function selectCourse(course) {
    resetUI();
    onSelectCourse?.(course); // the ? because sometimes component doesnt pass along the props (will be undefined)
  }

  // Helper: user clicks a course item (focus it first, show Join button)
  function handleCourseClick(course) {
    setFocusedCourseId(course.id);
    setActiveIndex(-1); // keyboard selection off when clicking
  }

  // Helper: join flow (uses API, then selects the course)
  async function handleJoin(course) {
    if (!course?.code) {
      alert("Course code is missing");
      return;
    }

    setJoiningCourseId(course.id);
    try {
      await joinCourseByCode(course.code);
      selectCourse(course);
    } catch (err) {
      alert(err?.message || "Failed to join course");
    } finally {
      setJoiningCourseId(null);
    }
  }

  // Helper: keyboard navigation logic
  function handleKeyDown(e) {
    if (!open || !hasResults) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < 0 ? 0 : Math.min(i + 1, results.length - 1);
        setFocusedCourseId(results[next]?.id ?? null);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < 0 ? results.length - 1 : Math.max(i - 1, 0);
        setFocusedCourseId(results[next]?.id ?? null); 
        return next;
      });
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleJoin(results[activeIndex]); // join on Enter
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedCourseId(null);
      setActiveIndex(-1);
    }
  }

  // close dropdown when clicking outside
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setFocusedCourseId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // debounce search
  useEffect(() => {
    const trimmed = q.trim();
    // reset if empty
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      setFocusedCourseId(null);
      return;
    }
    setLoading(true);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const courses = await getAllCourses(trimmed);
        const normalized = courses.map((c) => ({ ...c, id: c._id || c.id }));
        setResults(normalized);
        setActiveIndex(-1);
        setFocusedCourseId(null);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  // scroll active item into view when using keyboard
  useEffect(() => {
    if (activeIndex >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      {/* Input row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.trim() && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search courses by name or code..."
            className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-2xl bg-white/70 border border-white/40 shadow-sm outline-none
                       ring-1 ring-gray-400 focus:ring-2"
          />

          {/* right icon: loading */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {loading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : null}
          </div>
        </div>

        {/* + button */}
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center justify-center h-10 w-10 md:h-14 md:w-14 rounded-xl border border-black/20 bg-white shadow-md shadow-black/25
            hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] transition"
          aria-label="Create a new course"
          title="Create a new course"
        >
          <Plus className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      {/* Dropdown (UI extracted) */}
      <CourseDropdown
        open={open}
        loading={loading}
        results={results}
        activeIndex={activeIndex}
        activeItemRef={activeItemRef}
        focusedCourseId={focusedCourseId}
        joiningCourseId={joiningCourseId}
        onCourseClick={handleCourseClick}
        onJoin={handleJoin}
      />
    </div>
  );
}

// Small child component: only responsible for rendering the dropdown UI
function CourseDropdown({
  open,
  loading,
  results,
  activeIndex,
  activeItemRef,
  focusedCourseId,
  joiningCourseId,
  onCourseClick,
  onJoin,
}) {
  if (!open) return null;

  const hasResults = results.length > 0;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+10px)] rounded-2xl 
      bg-white/90 border border-black/10 shadow-xl shadow-black/25 z-50"
    >
      {loading && !hasResults ? (
        <div className="px-4 py-4 text-sm text-gray-500">Searching…</div>
      ) : hasResults ? (
        <ul className="max-h-[204px] overflow-y-auto overflow-x-hidden rounded-b-2xl">
          {results.map((course, idx) => {
            const active = idx === activeIndex;
            const focused = course.id === focusedCourseId;
            const joining = joiningCourseId === course.id;

            return (
              <li key={course.id} ref={active ? activeItemRef : null}>
                <div
                  className={`w-full px-4 py-3 flex items-center gap-6 text-left transition
                    ${focused ? "bg-gray-300" : active ? "bg-purple-50" : "hover:bg-gray-50"}`}
                >
                  <button
                    type="button"
                    onClick={() => onCourseClick(course)}
                    className="flex items-center gap-6 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: course.color || "#8B5CF6" }}
                      >
                        {course.code?.slice(0, 4)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">{course.name}</p>
                      <p className="text-xs text-gray-500 truncate">{course.code}</p>
                    </div>
                  </button>

                  {focused && (
                    <button
                      type="button"
                      onClick={() => onJoin(course)}
                      disabled={joining}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium
                               hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50
                               disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                    >
                      {joining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-4 py-4 text-sm text-gray-500">
          No matches. Try another name/code or press <span className="font-medium">+</span> to create one.
        </div>
      )}
    </div>
  );
}