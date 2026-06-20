function timeAgo(ts) {
  if (!ts) return "";
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RecentActivity({ alerts }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Recent Alerts</span>
        <a className="panel-link">View All</a>
      </div>

      {(!alerts || alerts.length === 0) && (
        <p className="text-muted small">No recent activity.</p>
      )}

      {alerts && alerts.map((a, idx) => (
        <div className="alert-row" key={idx}>
          <span className={`alert-dot ${(a.severity || "").toLowerCase()}`} />
          <div className="alert-text">
            <div className="alert-title">{a.message}</div>
            <div className="alert-detail">{a.detail}</div>
          </div>
          <div className="alert-time">{timeAgo(a.timestamp)}</div>
        </div>
      ))}
    </div>
  );
}

export default RecentActivity;