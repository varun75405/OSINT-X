import { Link } from "react-router-dom";

function ActiveInvestigationsPanel({ cases }) {
  const sevClass = p => (p === "High" ? "high" : p === "Critical" ? "critical" : p === "Medium" ? "medium" : "low");
  const statusClass = s => (s === "Open" ? "open" : s === "In Progress" ? "inprogress" : "closed");

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Active Investigations</span>
        <Link className="panel-link" to="/cases">View All</Link>
      </div>

      {(!cases || cases.length === 0) && (
        <p className="text-muted small">No active investigations.</p>
      )}

      {cases && cases.length > 0 && (
        <table className="table-dark-clean">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.id}>
                <td>
                  <Link to={`/cases/${c.id}`} style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                    #{c.id}
                  </Link>
                </td>
                <td>{c.title}</td>
                <td><span className={`badge-soft ${sevClass(c.priority)}`}>{c.priority}</span></td>
                <td><span className={`badge-soft ${statusClass(c.status)}`}>{c.status}</span></td>
                <td style={{ width: "120px" }}>
                  <div className="mini-progress">
                    <div style={{ width: `${c.progress}%` }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.progress}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ActiveInvestigationsPanel;