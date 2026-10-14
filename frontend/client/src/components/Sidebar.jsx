import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Trainee Check-In", end: true },
  { to: "/dashboard", label: "Outcome Dashboard" },
  { to: "/skill-gaps", label: "Skill Gap Analytics" },
  { to: "/risk-alerts", label: "Risk Alerts" },
  { to: "/curriculum-feedback", label: "Curriculum Feedback" },
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h1>KaushalTrack</h1>
      <span className="subtitle">SIH26135 · TEAM KAUSHALYA</span>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
