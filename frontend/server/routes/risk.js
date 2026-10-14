const express = require("express");
const router = express.Router();
const axios = require("axios");
const Trainee = require("../models/Trainee");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// POST /api/risk/predict/:traineeId
// -> calls the Python ML microservice, caches the result on the trainee record
router.post("/predict/:traineeId", async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.traineeId);
    if (!trainee) return res.status(404).json({ error: "Trainee not found" });

    const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
      attendance_pct: trainee.attendancePct,
      assessment_score: trainee.assessmentScore,
      program_industry_match: trainee.programIndustryMatch,
    });

    trainee.latestRisk = {
      score: data.risk_score,
      reasons: data.reasons,
      computedAt: new Date(),
    };
    await trainee.save();

    res.json({ trainee: trainee._id, ...data });
  } catch (err) {
    // If the ML service isn't running, fail gracefully so the rest of the app still works
    res.status(502).json({
      error: "Could not reach the ML risk-prediction service. Is ml-service running on " + ML_SERVICE_URL + "?",
      details: err.message,
    });
  }
});

// POST /api/risk/predict-all -> batch score every trainee (handy for demo/seed)
router.post("/predict-all", async (req, res) => {
  try {
    const trainees = await Trainee.find();
    const results = [];
    for (const trainee of trainees) {
      try {
        const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
          attendance_pct: trainee.attendancePct,
          assessment_score: trainee.assessmentScore,
          program_industry_match: trainee.programIndustryMatch,
        });
        trainee.latestRisk = { score: data.risk_score, reasons: data.reasons, computedAt: new Date() };
        await trainee.save();
        results.push({ trainee: trainee._id, ...data });
      } catch (innerErr) {
        results.push({ trainee: trainee._id, error: innerErr.message });
      }
    }
    res.json({ scored: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/risk/flagged -> trainees currently flagged as at-risk (score >= threshold)
router.get("/flagged", async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold || "0.5");
    const trainees = await Trainee.find({ "latestRisk.score": { $gte: threshold } }).sort({
      "latestRisk.score": -1,
    });
    res.json(trainees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
