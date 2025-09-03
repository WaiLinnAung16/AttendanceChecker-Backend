import express from "express";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import subjectRoute from "./routes/subject.route.js";
import attendanceRoute from "./routes/attendance.route.js";
import connectToDatabase from "./database/mongodb.js";
import { PORT } from "./config/env.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/v1", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/subjects", subjectRoute);
app.use("/api/v1/attendance", attendanceRoute);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDatabase();
});
