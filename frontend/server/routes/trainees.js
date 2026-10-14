const express = require("express");
const router = express.Router();
const Trainee = require("../models/Trainee");

// POST /api/trainees  -> register a new trainee (with explicit consent)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      district,
      program,
      attendancePct,
      assessmentScore,
      programIndustryMatch,
      consentGiven,
      employerContact,
    } = req.body;

    if (!consentGiven) {
      return res.status(400).json({ error: "Consent is required before registering a trainee." });
    }

    const trainee = await Trainee.create({
      name,
      phone,
      district,
      program,
      attendancePct,
      assessmentScore,
      programIndustryMatch,
      consentGiven,
      employerContact: employerContact || "",
      verificationStatus: employerContact ? "pending" : "not_applicable",
    });

    res.status(201).json(trainee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trainees -> list all trainees (admin view)
router.get("/", async (req, res) => {
  try {
    const trainees = await Trainee.find().sort({ createdAt: -1 });
    res.json(trainees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trainees/:id
router.get("/:id", async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.id);
    if (!trainee) return res.status(404).json({ error: "Trainee not found" });
    res.json(trainee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
