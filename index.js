import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./configs/db.js";
import job from './configs/cron.js';
import { rateLimiter } from "./middlewares/rateLimiter.js";
import userRoutes from "./routes/user.routes.js";
import resumeRoutes from "./routes/resume.routes.js";

dotenv.config({ quiet: true });
const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
  job.start();
}

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

const PORT = process.env.PORT || 9000;

await connectDB();
app.use(morgan('dev'));

app.use(rateLimiter);

app.get("/", (req, res) => {
  res.status(200).send("Welcome to IntelliResume - AI Resume Analyser API");
});

app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});