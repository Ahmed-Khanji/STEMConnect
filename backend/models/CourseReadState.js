const mongoose = require("mongoose");

// Track Progress of user: User u1 has read all messages in course c1 up to the lastReadAt time
// unread messages = messages where createdAt > lastReadAt
const courseReadStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lastReadAt: { type: Date, default: new Date(0) },
  },
  { timestamps: true }
);

// Explicit collection name
module.exports = mongoose.model(
  "CourseReadState",
  courseReadStateSchema,
  "course_read_states"
);