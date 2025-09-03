import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minLength: 2,
      maxLength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1024,
    },
    code: {
      type: String,
      maxLength: 5,
      unique: true,
    },
    assign_teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model("Subject", SubjectSchema);

export default Subject;
