const express = require("express");
const router = express.Router();
const CheckIn = require("../models/CheckIn");
const Trainee = require("../models/Trainee");

// POST /api/checkins -> trainee submits a periodic outcome check-in
// (In production this endpoint is what a WhatsApp/SMS webhook or the web form would call)
router.post("/", async (req, res) => {
  try {
    const { traineeId, employmentStatus, sector, wageBand } = req.body;

    const trainee = await Trainee.findById(traineeId);
    if (!trainee) return res.status(404).json({ error: "Trainee not found" });

    const checkIn = await CheckIn.create({
      trainee: traineeId,
      employmentStatus,
      sector,
      wageBand,
    });

    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkins/:traineeId -> a trainee's full check-in history (their "journey")
router.get("/:traineeId", async (req, res) => {
  try {
    const history = await CheckIn.find({ trainee: req.params.traineeId }).sort({ createdAt: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
