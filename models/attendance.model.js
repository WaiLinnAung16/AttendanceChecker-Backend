import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "leave"],
    required: true,
  },
  scanned_at: Date,
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;
