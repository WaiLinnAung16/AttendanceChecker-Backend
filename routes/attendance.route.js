import { Router } from "express";
import {
  generateQR,
  getAttendances,
  scanQR,
} from "../controllers/attendance.controller.js";

const router = Router();

router.post("/generate-qr", generateQR);
router.post("/scan-qr", scanQR);
router.get("/", getAttendances);

export default router;
