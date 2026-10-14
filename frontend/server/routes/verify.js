const express = require("express");
const router = express.Router();
const Trainee = require("../models/Trainee");

// POST /api/verify/send/:traineeId
// -> simulates sending an SMS/email confirmation link to the employer.
//    In production this would call an SMS/email provider (e.g. Twilio, MSG91).
//    For the prototype, it just marks the record "pending" and returns the
//    link that WOULD be sent, so the flow can be demoed end-to-end.
router.post("/send/:traineeId", async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.traineeId);
    if (!trainee) return res.status(404).json({ error: "Trainee not found" });
    if (!trainee.employerContact) {
      return res.status(400).json({ error: "No employer contact on file for this trainee." });
    }

    trainee.verificationStatus = "pending";
    await trainee.save();

    const confirmationLink = `${req.protocol}://${req.get("host")}/api/verify/confirm/${trainee._id}`;

    res.json({
      message: `(Simulated) confirmation link sent to ${trainee.employerContact}`,
      confirmationLink,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verify/confirm/:traineeId
// -> what the employer "taps" — a single no-login confirmation action
router.get("/confirm/:traineeId", async (req, res) => {
  try {
    const trainee = await Trainee.findById(req.params.traineeId);
    if (!trainee) return res.status(404).json({ error: "Trainee not found" });

    trainee.verificationStatus = "verified";
    await trainee.save();

    res.json({ message: "Employment confirmed. Thank you.", trainee: trainee.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
