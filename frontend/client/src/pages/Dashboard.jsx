import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byProgram, setByProgram] = useState([]);
  const [byDistrict, setByDistrict] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, d] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/outcomes-by-program"),
          api.get("/analytics/outcomes-by-district"),
        ]);
        setSummary(s.data);
        setByProgram(p.data);
        setByDistrict(d.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="page-title">Outcome Dashboard</h2>
      <p className="page-subtitle">Aggregated employment outcomes across programs and districts</p>

      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total Trainees</div>
            <div className="value">{summary.totalTrainees}</div>
          </div>
          <div className="stat-card">
            <div className="label">Checked In</div>
            <div className="value">{summary.trainesWithCheckIn}</div>
          </div>
          <div className="stat-card">
            <div className="label">Employment Rate</div>
            <div className="value">{summary.employmentRatePct}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Employer-Verified</div>
            <div className="value">{summary.employerVerifiedPct}%</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Employment Rate by Program</h3>
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : byProgram.length === 0 ? (
          <p className="empty-state">No data yet — run the seed script or add trainees.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byProgram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="program" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="employmentRate" fill="#1C7293" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Employment Rate by District</h3>
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : byDistrict.length === 0 ? (
          <p className="empty-state">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDistrict}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="district" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="employmentRate" fill="#065A82" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
