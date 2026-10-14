const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "Tailoring"
    district: { type: String, required: true },
    // Filled in / recomputed by the curriculum feedback engine
    lastRecommendation: { type: String, default: "" },
    recommendationGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", ProgramSchema);
