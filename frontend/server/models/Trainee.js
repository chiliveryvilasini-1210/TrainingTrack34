const mongoose = require("mongoose");

const TraineeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    program: { type: String, required: true }, // e.g. "Tailoring", "Electrician", "IT Support"

    // Features used by the predictive risk engine
    attendancePct: { type: Number, min: 0, max: 100, default: 100 },
    assessmentScore: { type: Number, min: 0, max: 100, default: 0 },
    programIndustryMatch: { type: Number, min: 0, max: 1, default: 1 }, // 1 = good match, 0 = poor match

    consentGiven: { type: Boolean, default: false },

    // Employer verification
    employerContact: { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["not_applicable", "pending", "verified"],
      default: "not_applicable",
    },

    // Cached latest risk assessment (written by the ML service via /api/risk/predict)
    latestRisk: {
      score: { type: Number, default: null }, // 0-1 probability of poor outcome
      reasons: { type: [String], default: [] },
      computedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trainee", TraineeSchema);
