import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AddCourseModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Modal</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            Fill the form then click save.
          </DialogDescription>
        </DialogHeader>

        {/* Modal body */}
        <div className="space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Course name"
          />
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Course code"
          />
        </div>

        <DialogFooter>
          <Button variant="secondary">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}