import DonutChart from "../charts/DonutChart";

const SEVERITY_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

function IOCSeverityPanel({ data }) {
  if (!data || data.segments.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">IOC Severity Distribution</span></div>
        <p className="text-muted small">No IOCs yet.</p>
      </div>
    );
  }

  const colors = data.segments.map(s => SEVERITY_COLORS[s.label] || "#8d93a6");

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">IOC Severity Distribution</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <DonutChart
          segments={data.segments}
          colors={colors}
          centerValue={data.total}
          centerLabel="Total"
        />
        <div className="flex-grow-1">
          {data.segments.map((s, i) => (
            <div className="legend-row" key={s.label}>
              <span className="legend-dot" style={{ background: colors[i] }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{s.count} ({s.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IOCSeverityPanel;