import { Router } from "express";
import { signUp, signIn, signOut } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../schemas/userSchema.js";

const router = Router();

router.post("/sign-in", validate(loginSchema), signIn);
router.post("/sign-up", validate(registerSchema), signUp);
router.post("/sign-out", signOut);

export default router;
