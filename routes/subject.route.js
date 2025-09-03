import { Router } from "express";
import {
  getSingleSubject,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  joinSubject,
} from "../controllers/subject.controller.js";

const router = Router();
router.get("/", getSubjects);
router.get("/:id", getSingleSubject);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

router.post("/:id/join", joinSubject);
export default router;
