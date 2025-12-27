import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { getAllCourses } from "../../api/courseApi";

export default function SearchCourse({ onSelectCourse, onCreateClick, className = "" }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // debounce search (wait a short moment for user typing before searching)
  useEffect(() => {
    const trimmed = q.trim();

    // reset if empty
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current); // old timer must be canceled when user tupes new letter
    debounceRef.current = setTimeout(async () => {
      try {
        // calls GET /api/courses?q=... to get all courses
        const courses = await getAllCourses(trimmed);
        // normalize _id -> id for your UI
        const normalized = courses.map((c) => ({ ...c, id: c._id || c.id }));
        setResults(normalized);
        setActiveIndex(-1);
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

  const hasResults = results.length > 0;

  function selectCourse(course) {
    setQ("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelectCourse?.(course);
  }

  function onKeyDown(e) {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        selectCourse(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`w-full max-w-2xl ${className}`}
    >
      {/* Input row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.trim() && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search courses by name or code..."
            className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-2xl bg-white/70 border border-white/40 shadow-sm outline-none
                       focus:ring-1 focus:ring-gray-400"
          />

          {/* right icon: loading */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : null}
          </div>
        </div>

        {/* + button */}
        <button
          type="button"
          onClick={onCreateClick}
          className="h-12 sm:h-14 w-12 sm:w-14 rounded-2xl bg-white/70 backdrop-blur border border-white/40 shadow-sm
                     hover:bg-white/85 active:scale-[0.98] transition flex items-center justify-center"
          aria-label="Create a new course"
          title="Create a new course"
        >
          <Plus className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="mt-3 rounded-2xl bg-white/80 border border-white/40 shadow-lg overflow-hidden">
          {loading && !hasResults ? (
            <div className="px-4 py-4 text-sm text-gray-500">Searching…</div>
          ) : hasResults ? (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((course, idx) => {
                const active = idx === activeIndex;
                return (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => selectCourse(course)}
                      className={`w-full px-4 py-3 flex items-center gap-6 text-left transition
                        ${active ? "bg-purple-50" : "hover:bg-gray-50"}`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: course.color || "#8B5CF6" }}
                        >
                          {(course.code).slice(0, 4)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 truncate">{course.name}</p>
                        <p className="text-xs text-gray-500 truncate">{course.code}</p>
                      </div>
                    </button>
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
      )}
    </div>
  );
}
