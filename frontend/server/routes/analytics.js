const express = require("express");
const router = express.Router();
const Trainee = require("../models/Trainee");
const CheckIn = require("../models/CheckIn");

// GET /api/analytics/outcomes-by-program
// -> employment rate per program, based on each trainee's most recent check-in
router.get("/outcomes-by-program", async (req, res) => {
  try {
    const trainees = await Trainee.find();
    const checkIns = await CheckIn.find().sort({ createdAt: -1 });

    // latest check-in per trainee
    const latestByTrainee = {};
    for (const c of checkIns) {
      const key = c.trainee.toString();
      if (!latestByTrainee[key]) latestByTrainee[key] = c;
    }

    const byProgram = {};
    for (const t of trainees) {
      const key = t.program;
      if (!byProgram[key]) byProgram[key] = { program: key, total: 0, employed: 0, seeking: 0 };
      byProgram[key].total += 1;
      const latest = latestByTrainee[t._id.toString()];
      if (latest) {
        if (latest.employmentStatus === "employed" || latest.employmentStatus === "self_employed") {
          byProgram[key].employed += 1;
        } else {
          byProgram[key].seeking += 1;
        }
      }
    }

    const result = Object.values(byProgram).map((p) => ({
      ...p,
      employmentRate: p.total ? Math.round((p.employed / p.total) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/outcomes-by-district
router.get("/outcomes-by-district", async (req, res) => {
  try {
    const trainees = await Trainee.find();
    const checkIns = await CheckIn.find().sort({ createdAt: -1 });

    const latestByTrainee = {};
    for (const c of checkIns) {
      const key = c.trainee.toString();
      if (!latestByTrainee[key]) latestByTrainee[key] = c;
    }

    const byDistrict = {};
    for (const t of trainees) {
      const key = t.district;
      if (!byDistrict[key]) byDistrict[key] = { district: key, total: 0, employed: 0 };
      byDistrict[key].total += 1;
      const latest = latestByTrainee[t._id.toString()];
      if (latest && (latest.employmentStatus === "employed" || latest.employmentStatus === "self_employed")) {
        byDistrict[key].employed += 1;
      }
    }

    const result = Object.values(byDistrict).map((d) => ({
      ...d,
      employmentRate: d.total ? Math.round((d.employed / d.total) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/skill-gap
// -> approximates "skill gap" as programs with low programIndustryMatch scores, aggregated
router.get("/skill-gap", async (req, res) => {
  try {
    const trainees = await Trainee.find();
    const byProgram = {};
    for (const t of trainees) {
      if (!byProgram[t.program]) byProgram[t.program] = { program: t.program, totalMatch: 0, count: 0 };
      byProgram[t.program].totalMatch += t.programIndustryMatch;
      byProgram[t.program].count += 1;
    }
    const result = Object.values(byProgram).map((p) => ({
      program: p.program,
      avgIndustryMatchPct: p.count ? Math.round((p.totalMatch / p.count) * 100) : 0,
      skillGapPct: p.count ? 100 - Math.round((p.totalMatch / p.count) * 100) : 0,
    }));
    result.sort((a, b) => b.skillGapPct - a.skillGapPct);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/summary -> headline numbers for the dashboard
router.get("/summary", async (req, res) => {
  try {
    const totalTrainees = await Trainee.countDocuments();
    const verifiedCount = await Trainee.countDocuments({ verificationStatus: "verified" });
    const checkIns = await CheckIn.find().sort({ createdAt: -1 });
    const latestByTrainee = {};
    for (const c of checkIns) {
      const key = c.trainee.toString();
      if (!latestByTrainee[key]) latestByTrainee[key] = c;
    }
    const employedCount = Object.values(latestByTrainee).filter(
      (c) => c.employmentStatus === "employed" || c.employmentStatus === "self_employed"
    ).length;

    res.json({
      totalTrainees,
      trainesWithCheckIn: Object.keys(latestByTrainee).length,
      employedCount,
      employmentRatePct: totalTrainees ? Math.round((employedCount / totalTrainees) * 100) : 0,
      employerVerifiedPct: totalTrainees ? Math.round((verifiedCount / totalTrainees) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
