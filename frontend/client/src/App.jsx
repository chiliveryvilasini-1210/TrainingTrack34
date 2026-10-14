import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SkillGaps from "./pages/SkillGaps.jsx";
import RiskAlerts from "./pages/RiskAlerts.jsx";
import CurriculumFeedback from "./pages/CurriculumFeedback.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<CheckIn />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skill-gaps" element={<SkillGaps />} />
          <Route path="/risk-alerts" element={<RiskAlerts />} />
          <Route path="/curriculum-feedback" element={<CurriculumFeedback />} />
        </Routes>
      </div>
    </div>
  );
}
