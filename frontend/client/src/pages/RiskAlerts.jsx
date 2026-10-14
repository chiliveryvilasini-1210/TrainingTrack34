import { useEffect, useState } from "react";
import api from "../api";

function levelForScore(score) {
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}

export default function RiskAlerts() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadFlagged() {
    setLoading(true);
    try {
      const { data } = await api.get("/risk/flagged?threshold=0.33");
      setFlagged(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFlagged();
  }, []);

  async function handleRescoreAll() {
    setRescoring(true);
    setMessage(null);
    try {
      const { data } = await api.post("/risk/predict-all");
      setMessage({ type: "success", text: `Scored ${data.scored} trainees.` });
      await loadFlagged();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Could not reach the ML service. Is it running?",
      });
    } finally {
      setRescoring(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Predictive Risk Alerts</h2>
      <p className="page-subtitle">
        Trainees flagged while their program is still running — not after it ends
      </p>

      <div className="card">
        <button onClick={handleRescoreAll} disabled={rescoring}>
          {rescoring ? "Scoring..." : "Re-score All Trainees via ML Service"}
        </button>
        {message && <div className={`toast ${message.type}`}>{message.text}</div>}
      </div>

      <div className="card">
        <h3>At-Risk Trainees ({flagged.length})</h3>
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : flagged.length === 0 ? (
          <p className="empty-state">
            No flagged trainees yet. Click "Re-score All Trainees" above (make sure ml-service is running).
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Program</th>
                <th>District</th>
                <th>Risk</th>
                <th>Why flagged</th>
              </tr>
            </thead>
            <tbody>
              {flagged.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.program}</td>
                  <td>{t.district}</td>
                  <td>
                    <span className={`badge ${levelForScore(t.latestRisk?.score || 0)}`}>
                      {Math.round((t.latestRisk?.score || 0) * 100)}% — {levelForScore(t.latestRisk?.score || 0)}
                    </span>
                  </td>
                  <td>
                    <ul className="reason-list">
                      {(t.latestRisk?.reasons || []).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
