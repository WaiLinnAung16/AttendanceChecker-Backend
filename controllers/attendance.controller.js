import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/env.js";
import Attendance from "../models/attendance.model.js";

const generateQR = async (req, res) => {
  try {
    const { subject_id, start_time, end_time } = req.body;
    const payload = { subject_id, start_time, end_time };
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const scanQR = async (req, res) => {
  const { token, student_id, status } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    const attendance = await Attendance.create({
      subject: decoded.subject_id,
      student: student_id,
      status,
      scanned_at: new Date(),
    });

    res.status(200).json({ message: "Attendance Checked", data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendances = async (req, res) => {
  try {
    const attendances = await Attendance.find({});
    res.status(200).json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { generateQR, scanQR, getAttendances };
