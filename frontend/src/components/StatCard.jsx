import Sparkline from "./charts/Sparkline";

const COLOR_MAP = {
  blue:   { wrap: "kpi-blue",   accent: "#3b82f6" },
  red:    { wrap: "kpi-red",    accent: "#ef4444" },
  orange: { wrap: "kpi-orange", accent: "#f59e0b" },
  green:  { wrap: "kpi-green",  accent: "#22c55e" },
  purple: { wrap: "kpi-purple", accent: "#a855f7" },
  cyan:   { wrap: "kpi-cyan",   accent: "#06b6d4" },
};

function StatCard({ title, value, delta = 0, trend = [], color = "blue", icon }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.blue;
  const isUp = delta >= 0;

  return (
    <div className={`kpi-card ${theme.wrap}`}>
      <div className="kpi-icon" style={{ background: `${theme.accent}22`, color: theme.accent }}>
        {icon}
      </div>
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${isUp ? "up" : "down"}`}>
        {isUp ? "↑" : "↓"} {Math.abs(delta)}% from last week
      </div>
      {trend.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline values={trend} color={theme.accent} />
        </div>
      )}
    </div>
  );
}

export default StatCard;