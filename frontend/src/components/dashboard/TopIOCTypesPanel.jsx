import DonutChart from "../charts/DonutChart";

const PALETTE = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ef4444"];

function TopIOCTypesPanel({ data }) {
  if (!data || data.segments.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Top IOC Types</span></div>
        <p className="text-muted small">No IOCs yet.</p>
      </div>
    );
  }

  const sorted = [...data.segments].sort((a, b) => b.count - a.count);
  const colors = sorted.map((_, i) => PALETTE[i % PALETTE.length]);

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Top IOC Types</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <DonutChart
          segments={sorted}
          colors={colors}
          centerValue={data.total}
          centerLabel="Total"
        />
        <div className="flex-grow-1">
          {sorted.map((s, i) => (
            <div className="legend-row" key={s.label}>
              <span className="legend-dot" style={{ background: colors[i] }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TopIOCTypesPanel;