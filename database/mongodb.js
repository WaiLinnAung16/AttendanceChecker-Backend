import mongoose from "mongoose";
import process from "process";
import { DB_URL } from "../config/env.js";

if (!DB_URL) {
  throw new Error("DB_URL is not defined in environment variables");
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectToDatabase;
