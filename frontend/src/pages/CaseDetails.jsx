import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../services/api";
function CaseDetails() {

    const { id } = useParams();

    const [caseData, setCaseData] = useState(null);
    const [iocs, setIocs] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [mitre, setMitre] = useState([]);
    const [correlations, setCorrelations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const casesResponse = await api.get("/cases/");
                const selectedCase = casesResponse.data.find((c) => c.id === parseInt(id));
                if (mounted) setCaseData(selectedCase);

                const [iocResponse, timelineResponse, mitreResponse, correlationResponse] = await Promise.all([
                    api.get(`/ioc/case/${id}`),
                    api.get(`/timeline/case/${id}`),
                    api.get(`/mitre/case/${id}`),
                    api.get(`/correlation/case/${id}`).catch(() => ({ data: { shared_iocs: [] } })),
                ]);

                if (mounted) {
                    setIocs(iocResponse.data);
                    setTimeline(timelineResponse.data);
                    setMitre(mitreResponse.data);
                    setCorrelations(correlationResponse.data.shared_iocs || []);
                }
            } catch (err) {
                console.error(err);
                if (mounted) setError(err.message || "Failed to load case data");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [id]);

    if (loading) return <div className="container-fluid p-0"><div className="page-title">Loading Case</div><p className="text-muted">Please wait while case data loads...</p></div>;
    if (error) return <div className="container-fluid p-0"><div className="panel"><div className="panel-header"><span className="panel-title">Error</span></div><div className="text-danger">{error}</div></div></div>;

    return (
        <div className="container-fluid p-0">
            <div className="page-title">Case #{caseData.id}</div>
            <div className="page-subtitle">Detailed case view with report generation and export options.</div>

            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Case Overview</span>
                </div>
                <div className="row g-3">
                    <div className="col-12 col-lg-6">
                        <div style={{ color: "var(--text-primary)", marginBottom: "10px" }}>
                            <h5>{caseData.title}</h5>
                            <p className="text-muted mb-0">{caseData.description}</p>
                        </div>
                    </div>
                    <div className="col-12 col-lg-6">
                        <div className="d-flex flex-wrap gap-2">
                            <span className={`badge-soft ${caseData.priority.toLowerCase()}`}>{caseData.priority}</span>
                            <span className={`badge-soft ${caseData.status === "Open" ? "open" : caseData.status === "Closed" ? "closed" : "inprogress"}`}>
                                {caseData.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "ioc" ? "active" : ""}`} onClick={() => setActiveTab("ioc")}>IOC</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "timeline" ? "active" : ""}`} onClick={() => setActiveTab("timeline")}>Timeline</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "mitre" ? "active" : ""}`} onClick={() => setActiveTab("mitre")}>MITRE</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "correlation" ? "active" : ""}`} onClick={() => setActiveTab("correlation")}>Correlation</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "evidence" ? "active" : ""}`} onClick={() => setActiveTab("evidence")}>Evidence</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === "report" ? "active" : ""}`} onClick={() => setActiveTab("report")}>Report</button>
                </li>
            </ul>

            <div className="mt-3">
                {activeTab === "overview" && (
                    <div>
                        <div className="card p-3 mb-3">
                            <h3>{caseData.title}</h3>
                            <p>{caseData.description}</p>
                            <p>Priority: {caseData.priority}</p>
                            <p>Status: {caseData.status}</p>
                        </div>
                    </div>
                )}

                {activeTab === "ioc" && (
                    <div>
                        {iocs.map((ioc) => (
                            <div key={ioc.id} className="card p-2 mb-2">
                                <b>{ioc.ioc_type}</b>
                                <p>{ioc.value}</p>
                                <p>Severity: <span className="badge bg-secondary">{ioc.severity}</span></p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "timeline" && (
                    <div>
                        {timeline.map((item) => (
                            <div key={item.id} className="card p-2 mb-2">
                                <b>{item.event}</b>
                                <p>{item.event_type}</p>
                                <p>{item.timestamp}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "mitre" && (
                    <div>
                        {mitre.map((item) => (
                            <div key={item.id} className="card p-2 mb-2">
                                <b>{item.technique_id}</b>
                                <p>{item.technique_name}</p>
                                <p>{item.tactic}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "correlation" && (
                    <div>
                        <h5 className="mb-3">🔗 IOC Correlations</h5>
                        {correlations.length === 0 ? (
                            <div className="alert alert-info">No IOC correlations found with other cases.</div>
                        ) : (
                            <div className="row g-3">
                                {correlations.map((corr, index) => (
                                    <div key={index} className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-header bg-light">
                                                <h6 className="mb-0">📊 {corr.type}</h6>
                                            </div>
                                            <div className="card-body">
                                                <p className="font-monospace text-truncate"><strong>{corr.value}</strong></p>
                                                <div className="mb-2">
                                                    <span className={`badge bg-${corr.severity === 'High' ? 'danger' : corr.severity === 'Medium' ? 'warning' : 'info'}`}>
                                                        {corr.severity}
                                                    </span>
                                                </div>
                                                <h6 className="text-muted">Shared by cases:</h6>
                                                <div>
                                                    {corr.cases.map((c) => (
                                                        <span key={c.case_id} className="badge bg-secondary me-2">Case #{c.case_id}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "evidence" && (
                    <div>
                        <p>Evidence listing is available on the Evidence page.</p>
                    </div>
                )}

                {activeTab === "report" && (
                    <div className="panel">
                        <div className="panel-header">
                            <span className="panel-title">Report Preview</span>
                            <button className="btn btn-sm btn-primary" onClick={() => window.open(`${api.defaults.baseURL}/report/case/${id}`)}>
                                Generate Report (PDF)
                            </button>
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-xl-4">
                                <div className="panel mb-3">
                                    <div className="panel-header">
                                        <span className="panel-title">Case Summary</span>
                                    </div>
                                    <div style={{ color: "var(--text-primary)" }}>
                                        <p><strong>Title:</strong> {caseData.title}</p>
                                        <p><strong>Status:</strong> {caseData.status}</p>
                                        <p><strong>Priority:</strong> {caseData.priority}</p>
                                        <p><strong>Created:</strong> {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : "N/A"}</p>
                                    </div>
                                </div>
                                <div className="panel">
                                    <div className="panel-header">
                                        <span className="panel-title">Counts</span>
                                    </div>
                                    <div className="row g-2" style={{ color: "var(--text-primary)" }}>
                                        <div className="col-6">
                                            <div className="badge-soft open w-100 text-center">IOCs: {iocs.length}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="badge-soft medium w-100 text-center">Timeline: {timeline.length}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="badge-soft low w-100 text-center">MITRE: {mitre.length}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="badge-soft critical w-100 text-center">Correlations: {correlations.length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-xl-8">
                                <div className="panel mb-3">
                                    <div className="panel-header">
                                        <span className="panel-title">Top IOCs</span>
                                    </div>
                                    {iocs.length === 0 ? (
                                        <div style={{ color: "var(--text-muted)" }}>No IOCs available.</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table-dark-clean mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Type</th>
                                                        <th>Value</th>
                                                        <th>Severity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {iocs.slice(0, 4).map((ioc) => (
                                                        <tr key={ioc.id}>
                                                            <td>{ioc.ioc_type}</td>
                                                            <td className="font-monospace">{ioc.value}</td>
                                                            <td><span className={`badge-soft ${ioc.severity.toLowerCase()}`}>{ioc.severity}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <div className="panel mb-3">
                                    <div className="panel-header">
                                        <span className="panel-title">Recent Timeline</span>
                                    </div>
                                    {timeline.length === 0 ? (
                                        <div style={{ color: "var(--text-muted)" }}>No timeline events available.</div>
                                    ) : (
                                        <div style={{ display: "grid", gap: "10px" }}>
                                            {timeline.slice(0, 4).map((item) => (
                                                <div key={item.id} className="panel" style={{ padding: "12px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                        <strong>{item.event_type}</strong>
                                                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : "No date"}
                                                        </span>
                                                    </div>
                                                    <div>{item.event}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="panel">
                                    <div className="panel-header">
                                        <span className="panel-title">MITRE Mapping</span>
                                    </div>
                                    {mitre.length === 0 ? (
                                        <div style={{ color: "var(--text-muted)" }}>No MITRE techniques mapped.</div>
                                    ) : (
                                        <ul style={{ color: "var(--text-primary)", paddingLeft: "18px", margin: 0 }}>
                                            {mitre.slice(0, 4).map((item) => (
                                                <li key={item.id}>
                                                    <strong>{item.technique_id}</strong> — {item.technique_name} <span className="text-muted">({item.tactic})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default CaseDetails;