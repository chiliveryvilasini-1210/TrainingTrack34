import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import api from "../api";

export default function SkillGaps() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics/skill-gap")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="page-title">Skill Gap Analytics</h2>
      <p className="page-subtitle">
        Where training content does not match current local industry demand — highest gap first
      </p>

      <div className="card">
        <h3>Skill Gap % by Program</h3>
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : data.length === 0 ? (
          <p className="empty-state">No data yet — run the seed script or add trainees.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="program" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="skillGapPct" radius={[0, 6, 6, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.skillGapPct > 40 ? "#B3261E" : entry.skillGapPct > 20 ? "#B98900" : "#1E7B4D"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3>Detail</h3>
        <table>
          <thead>
            <tr>
              <th>Program</th>
              <th>Avg. Industry Match</th>
              <th>Skill Gap</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.program}>
                <td>{row.program}</td>
                <td>{row.avgIndustryMatchPct}%</td>
                <td>{row.skillGapPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
