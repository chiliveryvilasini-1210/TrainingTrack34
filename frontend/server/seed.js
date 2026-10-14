// Seeds the database with a realistic-looking synthetic dataset so the
// dashboard, analytics, and risk engine all have something meaningful to
// show at internal evaluation. This is clearly synthetic demo data, not
// real trainee records — say so if asked, per the plan.

require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const Trainee = require("./models/Trainee");
const CheckIn = require("./models/CheckIn");
const Program = require("./models/Program");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kaushaltrack";
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const DISTRICTS = ["Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur"];
const PROGRAMS = ["Tailoring", "Electrician", "IT Support", "Beautician", "Plumbing", "Data Entry"];
const SECTORS = ["Retail", "Manufacturing", "IT Services", "Construction", "Personal Care"];

const FIRST_NAMES = ["Asha", "Rohit", "Priya", "Vikram", "Sneha", "Aarav", "Divya", "Karan", "Meera", "Sanjay",
  "Pooja", "Rahul", "Kavita", "Suresh", "Anjali", "Deepak", "Rekha", "Manoj", "Neha", "Ganesh"];
const LAST_NAMES = ["Patil", "Sharma", "Kulkarni", "Deshmukh", "More", "Jadhav", "Pawar", "Shinde", "Gaikwad", "Chavan"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected. Clearing old data...");
  await Trainee.deleteMany({});
  await CheckIn.deleteMany({});
  await Program.deleteMany({});

  console.log("Generating synthetic trainees...");
  const NUM_TRAINEES = 120;
  const trainees = [];

  for (let i = 0; i < NUM_TRAINEES; i++) {
    const program = choice(PROGRAMS);
    const district = choice(DISTRICTS);

    // Bake in realistic correlations: lower attendance/score/match -> more likely to be "seeking"
    const attendancePct = Math.round(rand(40, 100));
    const assessmentScore = Math.round(rand(30, 100));
    const programIndustryMatch = Math.random() < 0.65 ? 1 : 0;

    const riskFactorRaw =
      (100 - attendancePct) * 0.4 + (100 - assessmentScore) * 0.4 + (1 - programIndustryMatch) * 40 * 0.2;
    const likelyPoorOutcome = riskFactorRaw > 35 ? Math.random() < 0.7 : Math.random() < 0.15;

    const hasEmployer = Math.random() < 0.5 && !likelyPoorOutcome;

    const trainee = {
      name: `${choice(FIRST_NAMES)} ${choice(LAST_NAMES)}`,
      phone: `9${randInt(100000000, 999999999)}`,
      district,
      program,
      attendancePct,
      assessmentScore,
      programIndustryMatch,
      consentGiven: true,
      employerContact: hasEmployer ? `employer${i}@example.com` : "",
      verificationStatus: hasEmployer ? (Math.random() < 0.6 ? "verified" : "pending") : "not_applicable",
      _likelyPoorOutcome: likelyPoorOutcome, // internal flag, stripped before insert
    };
    trainees.push(trainee);
  }

  const inserted = await Trainee.insertMany(trainees.map(({ _likelyPoorOutcome, ...t }) => t));

  console.log("Generating check-ins...");
  const checkIns = [];
  inserted.forEach((t, i) => {
    const poorOutcome = trainees[i]._likelyPoorOutcome;
    let employmentStatus;
    if (poorOutcome) {
      employmentStatus = Math.random() < 0.8 ? "seeking" : "self_employed";
    } else {
      employmentStatus = Math.random() < 0.75 ? "employed" : "self_employed";
    }
    const wageBand =
      employmentStatus === "seeking"
        ? "not_applicable"
        : choice(["<10k", "10k-20k", "20k-30k", "30k+"]);

    checkIns.push({
      trainee: t._id,
      employmentStatus,
      sector: employmentStatus === "seeking" ? "" : choice(SECTORS),
      wageBand,
    });
  });
  await CheckIn.insertMany(checkIns);

  console.log("Seeding program records...");
  for (const program of PROGRAMS) {
    await Program.findOneAndUpdate(
      { name: program },
      { name: program, district: choice(DISTRICTS) },
      { upsert: true }
    );
  }

  console.log(`Seeded ${inserted.length} trainees and ${checkIns.length} check-ins.`);

  // Try to score everyone via the ML service, if it's running
  console.log("Attempting to score trainees via ML service at " + ML_SERVICE_URL + " ...");
  let scored = 0;
  for (const t of inserted) {
    try {
      const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, {
        attendance_pct: t.attendancePct,
        assessment_score: t.assessmentScore,
        program_industry_match: t.programIndustryMatch,
      });
      t.latestRisk = { score: data.risk_score, reasons: data.reasons, computedAt: new Date() };
      await t.save();
      scored++;
    } catch (err) {
      // ML service not running yet — that's fine, can be scored later via /api/risk/predict-all
      break;
    }
  }
  console.log(scored > 0 ? `Scored ${scored} trainees via ML service.` : "ML service not reachable — skipped risk scoring (start ml-service, then POST /api/risk/predict-all).");

  console.log("Done.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
