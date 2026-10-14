require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const traineeRoutes = require("./routes/trainees");
const checkinRoutes = require("./routes/checkins");
const analyticsRoutes = require("./routes/analytics");
const riskRoutes = require("./routes/risk");
const verifyRoutes = require("./routes/verify");
const feedbackRoutes = require("./routes/feedback");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "KaushalTrack API", ps: "SIH26135" });
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/trainees", traineeRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/feedback", feedbackRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kaushaltrack";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`KaushalTrack API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("Check MONGO_URI in your .env file — see .env.example");
    process.exit(1);
  });
