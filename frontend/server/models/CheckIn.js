const mongoose = require("mongoose");

const CheckInSchema = new mongoose.Schema(
  {
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: "Trainee", required: true },
    employmentStatus: {
      type: String,
      enum: ["employed", "self_employed", "seeking"],
      required: true,
    },
    sector: { type: String, default: "" },
    wageBand: {
      type: String,
      enum: ["<10k", "10k-20k", "20k-30k", "30k+", "not_applicable"],
      default: "not_applicable",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckIn", CheckInSchema);
