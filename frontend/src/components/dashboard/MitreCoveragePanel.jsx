import DonutChart from "../charts/DonutChart";

function MitreCoveragePanel({ data }) {
  if (!data) return null;

  const segments = [
    { label: "Tactic Covered", count: data.tactics_covered },
    { label: "Techniques Used", count: data.techniques_used },
    { label: "Not Used", count: data.not_used },
  ];
  const colors = ["#3b82f6", "#22c55e", "#a855f7"];

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">MITRE Coverage</span>
      </div>
      <div className="d-flex align-items-center gap-3">
        <DonutChart
          segments={segments}
          colors={colors}
          centerValue={data.techniques_used}
          centerLabel="Techniques"
        />
        <div className="flex-grow-1">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: colors[0] }} />
            <span className="legend-label">Tactic Covered</span>
            <span className="legend-value">{data.tactics_covered} / {data.tactics_total}</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: colors[1] }} />
            <span className="legend-label">Techniques Used</span>
            <span className="legend-value">{data.techniques_used} / {data.techniques_total}</span>
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: colors[2] }} />
            <span className="legend-label">Not Used</span>
            <span className="legend-value">{data.not_used} / {data.techniques_total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MitreCoveragePanel;