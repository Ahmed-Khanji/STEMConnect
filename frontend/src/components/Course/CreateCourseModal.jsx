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

export default function CreateCourseModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", code: "", color: "#8B5CF6" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: call your API: createCourse(form)
      // const created = await createCourse(form);

      // for now, fake object:
      const created = { ...form, _id: crypto.randomUUID() };

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
            Set a name and a unique code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Course name"
            className="w-full rounded-xl border px-3 py-2 outline-none ring-1 ring-black/40 focus:ring- disabled:opacity-50"
            required
            disabled={loading}
          />

          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="Course code (ex: COMP352)"
            className="w-full rounded-xl border px-3 py-2 outline-none ring-1 ring-black/40 focus:ring-1 disabled:opacity-50"
            required
            disabled={loading}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

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
