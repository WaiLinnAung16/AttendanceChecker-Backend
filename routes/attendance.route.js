import { Router } from "express";
import {
  createAttendanceSession,
  scanAttendance,
  updateStudentStatus,
  getAttendanceSessions,
  getSubjectAttendanceReport,
  getAdminDashboard,
  completeAttendanceSession,
} from "../controllers/attendance.controller.js";
import { authMiddleware } from "../utils/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createSessionSchema,
  scanAttendanceSchema,
  updateStatusSchema,
} from "../schemas/attendanceSchema.js";

const router = Router();

// Create attendance session (Teacher/Admin only)
router.post(
  "/sessions",
  authMiddleware,
  validate(createSessionSchema),
  createAttendanceSession
);

// Student scans QR code to mark attendance
router.post("/scan", validate(scanAttendanceSchema), scanAttendance);

// Teacher manually updates student status (Teacher/Admin only)
router.put(
  "/update-status",
  authMiddleware,
  validate(updateStatusSchema),
  updateStudentStatus
);

// Complete attendance session (Teacher/Admin only)
router.put(
  "/sessions/:session_id/complete",
  authMiddleware,
  completeAttendanceSession
);

// Get all attendance sessions
router.get("/sessions", authMiddleware, getAttendanceSessions);

// Get subject attendance report
router.get("/reports/:subjectId", authMiddleware, getSubjectAttendanceReport);

// Admin dashboard
router.get("/admin/dashboard", authMiddleware, getAdminDashboard);

export default router;
