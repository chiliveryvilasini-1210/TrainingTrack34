import { useState } from "react";
import api from "../api";

const DISTRICTS = ["Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur"];
const PROGRAMS = ["Tailoring", "Electrician", "IT Support", "Beautician", "Plumbing", "Data Entry"];

export default function CheckIn() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    district: DISTRICTS[0],
    program: PROGRAMS[0],
    attendancePct: 80,
    assessmentScore: 70,
    programIndustryMatch: 1,
    employerContact: "",
    employmentStatus: "seeking",
    sector: "",
    wageBand: "not_applicable",
  });
  const [status, setStatus] = useState(null);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    try {
      // Step 1: register trainee (with consent)
      const { data: trainee } = await api.post("/trainees", {
        name: form.name,
        phone: form.phone,
        district: form.district,
        program: form.program,
        attendancePct: Number(form.attendancePct),
        assessmentScore: Number(form.assessmentScore),
        programIndustryMatch: Number(form.programIndustryMatch),
        consentGiven,
        employerContact: form.employerContact,
      });

      // Step 2: submit their outcome check-in
      await api.post("/checkins", {
        traineeId: trainee._id,
        employmentStatus: form.employmentStatus,
        sector: form.sector,
        wageBand: form.wageBand,
      });

      // Step 3: score risk immediately so the demo shows the full loop
      try {
        await api.post(`/risk/predict/${trainee._id}`);
      } catch (riskErr) {
        // ML service may not be running — check-in itself still succeeded
        console.warn("Risk scoring skipped:", riskErr.message);
      }

      // Step 4: if an employer contact was given, trigger the (simulated) verification link
      if (form.employerContact) {
        try {
          await api.post(`/verify/send/${trainee._id}`);
        } catch (verifyErr) {
          console.warn("Verification send skipped:", verifyErr.message);
        }
      }

      setStatus({ type: "success", message: `Check-in recorded for ${trainee.name}.` });
      setForm((f) => ({ ...f, name: "", phone: "", employerContact: "" }));
      setConsentGiven(false);
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || err.message });
    }
  }

  return (
    <div>
      <h2 className="page-title">Trainee Check-In</h2>
      <p className="page-subtitle">Outcome Tracker module — periodic post-training check-in</p>

      <div className="consent-box">
        <strong>Your consent matters</strong>
        Your employment data is used only to improve skilling programs and is reported to
        policymakers in aggregate form. It is never shared individually without your permission.
      </div>

      <div className="card">
        <form className="stack" onSubmit={handleSubmit}>
          <div>
            <label>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ width: "auto", marginRight: 8 }}
              />
              I consent to my data being used as described above
            </label>
          </div>

          <div>
            <label>Full Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <label>Phone (for WhatsApp/SMS check-ins)</label>
            <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>

          <div>
            <label>District</label>
            <select value={form.district} onChange={(e) => update("district", e.target.value)}>
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Training Program</label>
            <select value={form.program} onChange={(e) => update("program", e.target.value)}>
              {PROGRAMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Attendance % during training</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.attendancePct}
              onChange={(e) => update("attendancePct", e.target.value)}
            />
          </div>

          <div>
            <label>Final Assessment Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.assessmentScore}
              onChange={(e) => update("assessmentScore", e.target.value)}
            />
          </div>

          <div>
            <label>Does this program match local industry demand?</label>
            <select
              value={form.programIndustryMatch}
              onChange={(e) => update("programIndustryMatch", e.target.value)}
            >
              <option value={1}>Yes, good match</option>
              <option value={0}>No, poor match</option>
            </select>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #D5DEE2" }} />

          <div>
            <label>Current Employment Status</label>
            <select
              value={form.employmentStatus}
              onChange={(e) => update("employmentStatus", e.target.value)}
            >
              <option value="employed">Employed</option>
              <option value="self_employed">Self-employed</option>
              <option value="seeking">Still seeking</option>
            </select>
          </div>

          <div>
            <label>Sector (if employed)</label>
            <input value={form.sector} onChange={(e) => update("sector", e.target.value)} />
          </div>

          <div>
            <label>Approximate Wage Band</label>
            <select value={form.wageBand} onChange={(e) => update("wageBand", e.target.value)}>
              <option value="not_applicable">Not applicable</option>
              <option value="<10k">Below ₹10,000/month</option>
              <option value="10k-20k">₹10,000 - ₹20,000/month</option>
              <option value="20k-30k">₹20,000 - ₹30,000/month</option>
              <option value="30k+">Above ₹30,000/month</option>
            </select>
          </div>

          <div>
            <label>Employer Contact (optional — for verification)</label>
            <input
              placeholder="employer email or phone"
              value={form.employerContact}
              onChange={(e) => update("employerContact", e.target.value)}
            />
          </div>

          <button type="submit" disabled={!consentGiven}>
            Submit Check-In
          </button>

          {status && <div className={`toast ${status.type}`}>{status.message}</div>}
        </form>
      </div>
    </div>
  );
}
