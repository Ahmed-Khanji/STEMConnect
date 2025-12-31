import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createCourse } from "@/api/courseApi";

// color palette
const COURSE_COLORS = [
  "#8B5CF6", // purple
  "#6366F1", // indigo
  "#3B82F6", // blue
  "#0EA5E9", // sky
  "#06B6D4", // cyan
  "#10B981", // emerald
  "#22C55E", // green
  "#84CC16", // lime
  "#EAB308", // yellow
  "#F59E0B", // amber
  "#F97316", // orange
  "#EF4444", // red
  "#EC4899", // pink
  "#A855F7", // violet
];

export default function CreateCourseModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", code: "", color: "#8B5CF6" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "code") {
      const cleaned = normalizeCourseCode(value);
      setForm((prev) => ({ ...prev, code: cleaned }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Format: "comp  248" -> "COMP248"
  function normalizeCourseCode(raw) {
    return raw.replace(/\s+/g, "").toUpperCase();
  }

  // Validate: 3–5 letters + 3–4 digits (letters first)
  function isValidCourseCode(code) {
    return /^[A-Z]{3,5}\d{3,4}$/.test(code);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Normalize course code (remove spaces, force uppercase) and validate format before submitting
    const code = normalizeCourseCode(form.code);
    if (!isValidCourseCode(code)) {
      setError("Course code must be 3–5 letters followed by 3–4 numbers (ex: COMP248).");
      setLoading(false);
      return;
    }
  
    try {
      const payload = { ...form, code };
      const created = await createCourse(payload); // returns course object
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new course</DialogTitle>
          <DialogDescription>
            Set course name and its unique code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Course name"
            className="w-full rounded-xl border px-3 py-2 outline-none ring-1 ring-black/40 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
            disabled={loading}
          />

          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="Course code (ex: COMP248)"
            className="w-full rounded-xl border px-3 py-2 outline-none ring-1 ring-black/40 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
            disabled={loading}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {COURSE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`h-7 w-7 rounded-full border transition
                  ${form.color === c
                    ? "ring-2 ring-black dark:ring-white"
                    : "hover:scale-110"}
                `}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
