const express = require("express");
const router = express.Router();
const Trainee = require("../models/Trainee");
const Program = require("../models/Program");
const CheckIn = require("../models/CheckIn");

// A small rule-based recommendation generator.
// This is intentionally simple/explainable for the prototype stage —
// it closes the loop from "here's a problem" to "here's what to do about it",
// which is the whole point of the Curriculum Feedback Loop feature.
function generateRecommendation({ employmentRate, avgIndustryMatchPct, avgAttendancePct }) {
  const notes = [];
  if (employmentRate < 50) {
    notes.push("Employment rate is below 50% — review placement support and employer partnerships.");
  }
  if (avgIndustryMatchPct < 60) {
    notes.push("Low industry-match score — curriculum content may be outdated versus current local job requirements.");
  }
  if (avgAttendancePct < 70) {
    notes.push("Attendance is low across this program — investigate scheduling, distance, or engagement issues.");
  }
  if (notes.length === 0) {
    notes.push("Program is performing within healthy ranges — no immediate changes recommended.");
  }
  return notes.join(" ");
}

// POST /api/feedback/generate -> recompute recommendations for every program
router.post("/generate", async (req, res) => {
  try {
    const trainees = await Trainee.find();
    const checkIns = await CheckIn.find().sort({ createdAt: -1 });
    const latestByTrainee = {};
    for (const c of checkIns) {
      const key = c.trainee.toString();
      if (!latestByTrainee[key]) latestByTrainee[key] = c;
    }

    const byProgram = {};
    for (const t of trainees) {
      if (!byProgram[t.program]) {
        byProgram[t.program] = {
          program: t.program,
          district: t.district,
          total: 0,
          employed: 0,
          matchSum: 0,
          attendanceSum: 0,
        };
      }
      const p = byProgram[t.program];
      p.total += 1;
      p.matchSum += t.programIndustryMatch;
      p.attendanceSum += t.attendancePct;
      const latest = latestByTrainee[t._id.toString()];
      if (latest && (latest.employmentStatus === "employed" || latest.employmentStatus === "self_employed")) {
        p.employed += 1;
      }
    }

    const results = [];
    for (const p of Object.values(byProgram)) {
      const employmentRate = p.total ? Math.round((p.employed / p.total) * 100) : 0;
      const avgIndustryMatchPct = p.total ? Math.round((p.matchSum / p.total) * 100) : 0;
      const avgAttendancePct = p.total ? Math.round(p.attendanceSum / p.total) : 0;
      const recommendation = generateRecommendation({ employmentRate, avgIndustryMatchPct, avgAttendancePct });

      const program = await Program.findOneAndUpdate(
        { name: p.program },
        {
          name: p.program,
          district: p.district,
          lastRecommendation: recommendation,
          recommendationGeneratedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      results.push({ ...p, employmentRate, avgIndustryMatchPct, avgAttendancePct, recommendation, programId: program._id });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback -> latest stored recommendations
router.get("/", async (req, res) => {
  try {
    const programs = await Program.find().sort({ recommendationGeneratedAt: -1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
