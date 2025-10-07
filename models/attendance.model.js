import mongoose from "mongoose";

// Attendance Session Schema - represents a single attendance session
const AttendanceSessionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "leave"],
          default: "present",
        },
        scanned_at: {
          type: Date,
          default: null,
        },
        updated_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updated_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
  
);

// Individual Attendance Record Schema - for historical tracking
const AttendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },
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
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    scanned_at: Date,
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSession = mongoose.model(
  "AttendanceSession",
  AttendanceSessionSchema
);
const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  AttendanceRecordSchema
);

export { AttendanceSession, AttendanceRecord };
export default AttendanceSession;
