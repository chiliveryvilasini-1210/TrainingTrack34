import { useEffect, useState } from "react";
import api from "../api";

export default function CurriculumFeedback() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/feedback");
      setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.post("/feedback/generate");
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Curriculum Feedback Loop</h2>
      <p className="page-subtitle">
        Auto-generated recommendations when a program is flagged as underperforming — closing the
        loop from insight to action
      </p>

      <div className="card">
        <button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate / Refresh Recommendations"}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : programs.length === 0 ? (
          <p className="empty-state">
            No recommendations yet — click "Generate / Refresh Recommendations" above.
          </p>
        ) : (
          programs.map((p) => (
            <div key={p._id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #eee" }}>
              <strong style={{ color: "#065A82" }}>{p.name}</strong>
              <span style={{ color: "#5A6B75", fontSize: 12, marginLeft: 8 }}>{p.district}</span>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>{p.lastRecommendation}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
