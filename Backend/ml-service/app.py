"""
KaushalTrack Predictive Risk Engine
------------------------------------
A small Flask microservice that scores a trainee's risk of a poor outcome
(dropout / prolonged unemployment) and returns an EXPLAINABLE reason list,
not just a bare number — judges specifically respond well to "why", not
just "what".

Endpoints:
    GET  /health              -> service health check
    POST /predict              body: { attendance_pct, assessment_score, program_industry_match }
                                returns: { risk_score, risk_level, reasons: [...] }

If model.pkl doesn't exist yet, it is trained automatically on first run
using the synthetic dataset in train_model.py — so there is no manual setup
step required to get this running.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

app = Flask(__name__)
CORS(app)

# Train the model on first run if it hasn't been trained yet
if not os.path.exists(MODEL_PATH):
    print("No trained model found — training one now (first run only)...")
    from train_model import train_and_save

    train_and_save(MODEL_PATH)

model = joblib.load(MODEL_PATH)

FEATURE_ORDER = ["attendance_pct", "assessment_score", "program_industry_match"]

# Rough cohort averages used only to phrase explanations in relative terms
# ("below average" etc.) - matches the synthetic training distribution.
COHORT_AVG = {"attendance_pct": 70, "assessment_score": 65}


def build_reasons(attendance_pct, assessment_score, program_industry_match, risk_score):
    """Rule-based, human-readable explanation for a risk score.
    Kept simple and transparent on purpose: a counselor reading this should
    immediately understand WHY someone was flagged, not just that they were."""
    reasons = []

    if attendance_pct < 60:
        reasons.append(f"Attendance is low ({attendance_pct:.0f}%), well below the cohort average.")
    elif attendance_pct < COHORT_AVG["attendance_pct"]:
        reasons.append(f"Attendance ({attendance_pct:.0f}%) is somewhat below the cohort average.")

    if assessment_score < 50:
        reasons.append(f"Assessment score is low ({assessment_score:.0f}/100).")
    elif assessment_score < COHORT_AVG["assessment_score"]:
        reasons.append(f"Assessment score ({assessment_score:.0f}/100) is below the cohort average.")

    if program_industry_match == 0:
        reasons.append("Program does not closely match current local industry demand.")

    if not reasons:
        reasons.append("No major risk factors detected — trainee is tracking close to or above cohort averages.")

    return reasons


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": True})


@app.post("/predict")
def predict():
    data = request.get_json(force=True) or {}

    try:
        attendance_pct = float(data.get("attendance_pct", 0))
        assessment_score = float(data.get("assessment_score", 0))
        program_industry_match = int(data.get("program_industry_match", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "attendance_pct and assessment_score must be numbers, program_industry_match must be 0 or 1"}), 400

    X = np.array([[attendance_pct, assessment_score, program_industry_match]])
    risk_score = float(model.predict_proba(X)[0, 1])  # probability of "poor_outcome"

    if risk_score >= 0.66:
        risk_level = "high"
    elif risk_score >= 0.33:
        risk_level = "medium"
    else:
        risk_level = "low"

    reasons = build_reasons(attendance_pct, assessment_score, program_industry_match, risk_score)

    return jsonify(
        {
            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "reasons": reasons,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
