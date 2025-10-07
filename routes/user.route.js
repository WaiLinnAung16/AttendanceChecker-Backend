import { Router } from "express";
import {
  getUsers,
  getSingleUser,
  updateUser,
  getTeachers,
} from "../controllers/user.controller.js";

const router = Router();
router.get("/", getUsers);
router.get("/teachers", getTeachers);
router.get("/:id", getSingleUser);
router.put("/:id", updateUser);
export default router;
