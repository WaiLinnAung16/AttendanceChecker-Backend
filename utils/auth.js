import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET_KEY } from "../config/env.js";

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

// Generate token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Verify token middleware
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    req.user = decoded; // attach decoded payload
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
