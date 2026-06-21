import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import connectDB from "./configs/db.js";

import userRoutes from "./routes/user.routes.js";

dotenv.config({ quiet: true });
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 9000;

await connectDB();
app.use(morgan('dev'));

app.get("/", (req, res) => {
  res.status(200).send("Welcome to IntelliResume - AI Resume Analyser API");
});

app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
})