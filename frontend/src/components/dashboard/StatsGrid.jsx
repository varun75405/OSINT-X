import StatCard from "../StatCard";
import { FaFolderOpen, FaBiohazard, FaExclamationTriangle, FaShieldAlt, FaClock, FaProjectDiagram } from "react-icons/fa";

function StatsGrid({ summary }) {
  if (!summary) return null;

  const cards = [
    { key: "total_cases", title: "Total Cases", color: "blue", icon: <FaFolderOpen /> },
    { key: "active_iocs", title: "Active IOCs", color: "red", icon: <FaBiohazard /> },
    { key: "high_severity_alerts", title: "High Severity Alerts", color: "orange", icon: <FaExclamationTriangle /> },
    { key: "mitre_techniques", title: "MITRE Techniques", color: "green", icon: <FaShieldAlt /> },
    { key: "timeline_events", title: "Timeline Events", color: "purple", icon: <FaClock /> },
    { key: "correlations_found", title: "Correlations Found", color: "cyan", icon: <FaProjectDiagram /> },
  ];

  return (
    <div className="row g-3 mb-3">
      {cards.map(c => {
        const d = summary[c.key];
        if (!d) return null;
        return (
          <div className="col-md-2 col-sm-4 col-6" key={c.key}>
            <StatCard
              title={c.title}
              value={d.value}
              delta={d.delta}
              trend={d.trend}
              color={c.color}
              icon={c.icon}
            />
          </div>
        );
      })}
    </div>
  );
}

export default StatsGrid;