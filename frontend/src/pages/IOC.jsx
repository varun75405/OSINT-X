import { useEffect, useState } from "react";
import api from "../services/api";

function IOC() {
    const [iocs, setIocs] = useState([]);
    const [caseId, setCaseId] = useState("");
    const [iocType, setIocType] = useState("");
    const [value, setValue] = useState("");
    const [severity, setSeverity] = useState("Medium");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("All");

    const createIoc = async () => {
        if (!caseId || !iocType || !value) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await api.post("/ioc/", { case_id: parseInt(caseId), ioc_type: iocType, value: value, severity: severity });
            setCaseId("");
            setIocType("");
            setValue("");
            setSeverity("Medium");
            const response = await api.get("/ioc/");
            setIocs(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to create IOC");
        }
    };

    const deleteIoc = async (id) => {
        if (!window.confirm("Delete this IOC?")) return;
        try {
            await api.delete(`/ioc/${id}`);
            setIocs(iocs.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete IOC");
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get("/ioc/");
                if (mounted) setIocs(response.data);
            } catch (err) {
                console.error(err);
                if (mounted) setError(err.message || "Failed to load IOCs");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const getSeverityBadge = (sev) => {
        const classMap = { Low: "low", Medium: "medium", High: "high", Critical: "critical" };
        return <span className={`badge-soft ${classMap[sev] || "closed"}`}>{sev}</span>;
    };

    const severityCounts = iocs.reduce((counts, ioc) => {
        counts[ioc.severity] = (counts[ioc.severity] || 0) + 1;
        return counts;
    }, {});

    const filteredIocs = iocs.filter(i => {
        const valueText = i.value || "";
        const typeText = i.ioc_type || "";
        const matchSearch = valueText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           typeText.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSeverity = filterSeverity === "All" || i.severity === filterSeverity;
        return matchSearch && matchSeverity;
    });

    if (loading) {
        return (
            <div>
                <div className="page-title">IOC Database</div>
                <div className="page-subtitle">Loading indicators of compromise...</div>
                <div className="panel">
                    <div style={{ color: "var(--text-muted)" }}>Please wait while IOCs load.</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="page-title">IOC Database</div>
                <div className="page-subtitle">Indicators of compromise across investigation cases</div>
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title">Error</span>
                    </div>
                    <div className="text-danger">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-title">IOC Database</div>
            <div className="page-subtitle">Track indicators of compromise across investigation cases</div>

            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="kpi-card kpi-red">
                        <div className="kpi-label">Total IOCs</div>
                        <div className="kpi-value">{iocs.length}</div>
                        <div className="kpi-delta">Active indicators</div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="kpi-card kpi-orange">
                        <div className="kpi-label">Critical</div>
                        <div className="kpi-value">{severityCounts.Critical || 0}</div>
                        <div className="kpi-delta">Highest priority</div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="kpi-card kpi-blue">
                        <div className="kpi-label">High</div>
                        <div className="kpi-value">{severityCounts.High || 0}</div>
                        <div className="kpi-delta">Needs review</div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="kpi-card kpi-green">
                        <div className="kpi-label">Filtered</div>
                        <div className="kpi-value">{filteredIocs.length}</div>
                        <div className="kpi-delta">Current results</div>
                    </div>
                </div>
            </div>

            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Add Indicator of Compromise</span>
                </div>

                <form
                    className="row g-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        createIoc();
                    }}
                >
                    <div className="col-12 col-sm-6 col-xl-2">
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Case ID"
                            value={caseId}
                            onChange={(e) => setCaseId(e.target.value)}
                        />
                    </div>
                    <div className="col-12 col-sm-6 col-xl-2">
                        <select
                            className="form-select"
                            value={iocType}
                            onChange={(e) => setIocType(e.target.value)}
                        >
                            <option value="">Select Type</option>
                            <option>IP</option>
                            <option>Domain</option>
                            <option>Hash</option>
                            <option>Email</option>
                            <option>URL</option>
                        </select>
                    </div>
                    <div className="col-12 col-xl-4">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="IOC value"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                    <div className="col-12 col-sm-6 col-xl-2">
                        <select
                            className="form-select"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-2">
                        <button type="submit" className="btn btn-danger w-100">
                            + Add IOC
                        </button>
                    </div>
                </form>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Indicators ({filteredIocs.length})</span>
                    <span className="text-muted small">{filteredIocs.length} of {iocs.length} IOCs found</span>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-lg-8">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search IOCs by value or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-12 col-lg-4">
                        <select
                            className="form-select"
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                        >
                            <option value="All">All Severities</option>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    {filteredIocs.length === 0 ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                            No IOCs found
                        </div>
                    ) : (
                        <table className="table-dark-clean mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Case</th>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Severity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIocs.map((ioc) => (
                                    <tr key={ioc.id}>
                                        <td style={{ fontWeight: 700 }}>#{ioc.id}</td>
                                        <td>
                                            <span className="badge-soft closed">Case #{ioc.case_id}</span>
                                        </td>
                                        <td>
                                            <span className="badge-soft open">{ioc.ioc_type}</span>
                                        </td>
                                        <td className="font-monospace">{ioc.value}</td>
                                        <td>{getSeverityBadge(ioc.severity)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => deleteIoc(ioc.id)}
                                                style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IOC;
