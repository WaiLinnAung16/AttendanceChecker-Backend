import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/env.js";
import {
  AttendanceSession,
  AttendanceRecord,
} from "../models/attendance.model.js";
import Subject from "../models/subject.model.js";
import User from "../models/user.model.js";

// Create a new attendance session
const createAttendanceSession = async (req, res) => {
  try {
    const { subject_id, start_time, end_time } = req.body;
    const created_by = req.user.id; // From auth middleware

    // Validate subject exists and get students
    const subject = await Subject.findById(subject_id).populate(
      "students",
      "name email"
    );
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Check if user is authorized to create attendance for this subject
    const user = await User.findById(created_by);
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({
        message: "Only teachers and admins can create attendance sessions",
      });
    }

    // Check if teacher is assigned to this subject (for teachers)
    if (
      user.role === "teacher" &&
      subject.assign_teacher.toString() !== created_by
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this subject" });
    }

    // Create students array with default "present" status
    const students = subject.students.map((student) => ({
      student: student._id,
      status: "absent",
      scanned_at: null,
      updated_by: created_by,
      updated_at: new Date(),
    }));

    // Create attendance session
    const attendanceSession = await AttendanceSession.create({
      subject: subject_id,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      created_by,
      students,
    });

    // Generate QR code token
    const payload = {
      session_id: attendanceSession._id,
      subject_id,
      start_time,
      end_time,
    };
    const qrToken = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "24h" });

    res.status(201).json({
      message: "Attendance session created successfully",
      session: attendanceSession,
      qr_token: qrToken,
      total_students: students.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student scans QR code to mark attendance
const scanAttendance = async (req, res) => {
  try {
    const { qr_token, student_id } = req.body;

    // Verify QR token
    const decoded = jwt.verify(qr_token, JWT_SECRET_KEY);
    const { session_id, subject_id, start_time, end_time } = decoded;

    // Find the attendance session
    const session = await AttendanceSession.findById(session_id)
      .populate("subject", "title code")
      .populate("students.student", "name email");

    if (!session) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    console.log("Session is", session);

    // Check if session is still active
    if (session.status !== "active") {
      return res
        .status(400)
        .json({ message: "Attendance session is not active" });
    }

    // Check if current time is within session time
    // const now = new Date();
    // if (now < session.start_time || now > session.end_time) {
    //   return res
    //     .status(400)
    //     .json({ message: "Attendance session is not currently active" });
    // }

    // Find student in the session
    const studentIndex = session.students.findIndex(
      (s) => s.student._id.toString() === student_id
    );

    if (studentIndex === -1) {
      return res
        .status(404)
        .json({ message: "Student not enrolled in this subject" });
    }

    // Update student status to present and set scanned time
    session.students[studentIndex].status = "present";
    session.students[studentIndex].scanned_at = new Date();
    session.students[studentIndex].updated_by = student_id;
    session.students[studentIndex].updated_at = new Date();

    await session.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      student: session.students[studentIndex].student,
      status: "present",
      scanned_at: session.students[studentIndex].scanned_at,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid QR code" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Teacher manually updates student attendance status
const updateStudentStatus = async (req, res) => {
  try {
    const { session_id, student_id, status, reason } = req.body;
    const updated_by = req.user.id;

    // Verify user is teacher or admin
    const user = await User.findById(updated_by);
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({
        message: "Only teachers and admins can update attendance status",
      });
    }

    // Find the attendance session
    const session = await AttendanceSession.findById(session_id)
      .populate("subject", "title code assign_teacher")
      .populate("students.student", "name email");

    if (!session) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    // Check if teacher is authorized for this subject
    if (
      user.role === "teacher" &&
      session.subject.assign_teacher.toString() !== updated_by
    ) {
      return res.status(403).json({
        message: "You are not authorized to update attendance for this subject",
      });
    }

    // Find student in the session
    const studentIndex = session.students.findIndex(
      (s) => s.student._id.toString() === student_id
    );

    if (studentIndex === -1) {
      return res
        .status(404)
        .json({ message: "Student not found in this attendance session" });
    }

    // Update student status
    session.students[studentIndex].status = status;
    session.students[studentIndex].updated_by = updated_by;
    session.students[studentIndex].updated_at = new Date();

    // If status is present and not scanned, set scanned_at to now
    if (status === "present" && !session.students[studentIndex].scanned_at) {
      session.students[studentIndex].scanned_at = new Date();
    }

    await session.save();

    res.status(200).json({
      message: "Student attendance status updated successfully",
      student: session.students[studentIndex].student,
      status: status,
      updated_by: user.name,
      updated_at: session.students[studentIndex].updated_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all attendance sessions
const getAttendanceSessions = async (req, res) => {
  try {
    const { subject_id, status, created_by } = req.query;

    let query = {};
    if (subject_id) query.subject = subject_id;
    if (status) query.status = status;
    if (created_by) query.created_by = created_by;

    const sessions = await AttendanceSession.find(query)
      .populate("subject", "title code")
      .populate("created_by", "name email")
      .populate("students.student", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance report for a specific subject
const getSubjectAttendanceReport = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { status, filterBy, session_id, date } = req.query;

    // Get subject details
    const subject = await Subject.findById(subjectId).populate(
      "students",
      "name email"
    );
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    let query = { subject: subjectId };

    // Filter by specific session
    if (session_id) {
      query._id = session_id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by filterBy
    if (filterBy) {
      const now = new Date();
      let startDate, endDate;

      if (filterBy === "daily") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (filterBy === "weekly") {
        const day = now.getDay() || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (filterBy === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
      }

      if (startDate && endDate) {
        query.start_time = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        query.start_time = {
          $gte: startOfDay,
          $lte: endOfDay,
        };
      }
    }

    // Get attendance sessions
    const sessions = await AttendanceSession.find(query)
      .populate("created_by", "name email")
      .populate("students.student", "name email")
      .sort({ start_time: -1 });

    // Calculate overall statistics
    const totalSessions = sessions.length;
    const totalStudents = subject.students.length;

    let overallStats = {
      present: 0,
      absent: 0,
      leave: 0,
      totalRecords: 0,
    };

    // Process each session
    const sessionDetails = sessions.map((session) => {
      const sessionStats = {
        present: 0,
        absent: 0,
        leave: 0,
      };

      session.students.forEach((student) => {
        sessionStats[student.status]++;
        overallStats[student.status]++;
        overallStats.totalRecords++;
      });

      return {
        session_id: session._id,
        start_time: session.start_time,
        end_time: session.end_time,
        created_by: session.created_by,
        status: session.status,
        stats: sessionStats,
        students: session.students.map((s) => ({
          student: s.student,
          status: s.status,
          scanned_at: s.scanned_at,
          updated_at: s.updated_at,
        })),
      };
    });

    // Calculate attendance percentage
    const attendancePercentage =
      totalStudents > 0 && totalSessions > 0
        ? (
            (overallStats.present / (totalStudents * totalSessions)) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      subject: {
        id: subject._id,
        title: subject.title,
        description: subject.description,
        code: subject.code,
        totalStudents: totalStudents,
      },
      filter: {
        status: status || "all",
        period: filterBy || "all",
        session_id: session_id || "all",
        date: date || "all",
      },
      summary: {
        totalSessions: totalSessions,
        totalStudents: totalStudents,
        overallStats: overallStats,
        attendancePercentage: parseFloat(attendancePercentage),
      },
      sessions: sessionDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin dashboard - get comprehensive attendance statistics
const getAdminDashboard = async (req, res) => {
  try {
    const { filterBy } = req.query; // daily, weekly, monthly, yearly

    // Get all subjects with student counts
    const subjects = await Subject.find({})
      .populate("assign_teacher", "name email")
      .populate("students", "name email");

    // Get all attendance sessions
    let sessionQuery = {};
    if (filterBy) {
      const now = new Date();
      let startDate, endDate;

      if (filterBy === "daily") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (filterBy === "weekly") {
        const day = now.getDay() || 7;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (filterBy === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (filterBy === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
      }

      if (startDate && endDate) {
        sessionQuery.start_time = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    const sessions = await AttendanceSession.find(sessionQuery)
      .populate("subject", "title code")
      .populate("created_by", "name email")
      .populate("students.student", "name email");

    // Calculate overall statistics
    const totalSubjects = subjects.length;
    const totalSessions = sessions.length;
    const totalStudents = subjects.reduce(
      (sum, subject) => sum + subject.students.length,
      0
    );

    let overallStats = {
      present: 0,
      absent: 0,
      leave: 0,
      totalRecords: 0,
    };

    // Process each session
    sessions.forEach((session) => {
      session.students.forEach((student) => {
        overallStats[student.status]++;
        overallStats.totalRecords++;
      });
    });

    // Calculate subject-wise statistics
    const subjectStats = subjects.map((subject) => {
      const subjectSessions = sessions.filter(
        (s) => s.subject._id.toString() === subject._id.toString()
      );
      const subjectStudentCount = subject.students.length;

      let subjectOverallStats = {
        present: 0,
        absent: 0,
        leave: 0,
        totalRecords: 0,
      };

      subjectSessions.forEach((session) => {
        session.students.forEach((student) => {
          subjectOverallStats[student.status]++;
          subjectOverallStats.totalRecords++;
        });
      });

      const attendancePercentage =
        subjectStudentCount > 0 && subjectSessions.length > 0
          ? (
              (subjectOverallStats.present /
                (subjectStudentCount * subjectSessions.length)) *
              100
            ).toFixed(2)
          : 0;

      return {
        subject: {
          id: subject._id,
          title: subject.title,
          code: subject.code,
          assign_teacher: subject.assign_teacher,
          totalStudents: subjectStudentCount,
        },
        totalSessions: subjectSessions.length,
        stats: subjectOverallStats,
        attendancePercentage: parseFloat(attendancePercentage),
      };
    });

    // Calculate overall attendance percentage
    const overallAttendancePercentage =
      totalStudents > 0 && totalSessions > 0
        ? (
            (overallStats.present / (totalStudents * totalSessions)) *
            100
          ).toFixed(2)
        : 0;

    res.status(200).json({
      filter: {
        period: filterBy || "all",
      },
      summary: {
        totalSubjects: totalSubjects,
        totalSessions: totalSessions,
        totalStudents: totalStudents,
        overallStats: overallStats,
        overallAttendancePercentage: parseFloat(overallAttendancePercentage),
      },
      subjectStats: subjectStats,
      recentSessions: sessions.slice(0, 10).map((session) => ({
        session_id: session._id,
        subject: session.subject,
        start_time: session.start_time,
        end_time: session.end_time,
        created_by: session.created_by,
        status: session.status,
        totalStudents: session.students.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete attendance session (mark as completed)
const completeAttendanceSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const updated_by = req.user.id;

    // Verify user is teacher or admin
    const user = await User.findById(updated_by);
    if (user.role !== "teacher" && user.role !== "admin") {
      return res.status(403).json({
        message: "Only teachers and admins can complete attendance sessions",
      });
    }

    const session = await AttendanceSession.findById(session_id).populate(
      "subject",
      "title code assign_teacher"
    );

    if (!session) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    // Check if teacher is authorized for this subject
    if (
      user.role === "teacher" &&
      session.subject.assign_teacher.toString() !== updated_by
    ) {
      return res.status(403).json({
        message: "You are not authorized to complete this attendance session",
      });
    }

    // Update session status
    session.status = "completed";
    await session.save();

    // Create attendance records for historical tracking
    const attendanceRecords = session.students.map((student) => ({
      session: session._id,
      subject: session.subject._id,
      student: student.student,
      status: student.status,
      start_time: session.start_time,
      end_time: session.end_time,
      scanned_at: student.scanned_at,
      updated_by: student.updated_by,
    }));

    await AttendanceRecord.insertMany(attendanceRecords);

    res.status(200).json({
      message: "Attendance session completed successfully",
      session: session,
      recordsCreated: attendanceRecords.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createAttendanceSession,
  scanAttendance,
  updateStudentStatus,
  getAttendanceSessions,
  getSubjectAttendanceReport,
  getAdminDashboard,
  completeAttendanceSession,
};
