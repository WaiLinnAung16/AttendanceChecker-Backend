import { z } from "zod";

export const createSessionSchema = z.object({
  subject_id: z.string().min(1, "Subject ID is required"),
  start_time: z.string().datetime("Invalid start time format"),
  end_time: z.string().datetime("Invalid end time format"),
});

export const scanAttendanceSchema = z.object({
  qr_token: z.string().min(1, "QR token is required"),
  student_id: z.string().min(1, "Student ID is required"),
});

export const updateStatusSchema = z.object({
  session_id: z.string().min(1, "Session ID is required"),
  student_id: z.string().min(1, "Student ID is required"),
  status: z.enum(["present", "absent", "leave"], {
    errorMap: () => ({ message: "Status must be present, absent, or leave" }),
  }),
  reason: z.string().optional(),
});
