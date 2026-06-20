import { useEffect, useState } from "react";
import api from "../services/api";

function MITRE() {
    const [mappings, setMappings] = useState([]);
    const [caseId, setCaseId] = useState("");
    const [techniqueId, setTechniqueId] = useState("");
    const [techniqueName, setTechniqueName] = useState("");
    const [tactic, setTactic] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const createMapping = async () => {
        if (!caseId || !techniqueId || !techniqueName || !tactic) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await api.post("/mitre/", { case_id: parseInt(caseId), technique_id: techniqueId, technique_name: techniqueName, tactic: tactic });
            setCaseId("");
            setTechniqueId("");
            setTechniqueName("");
            setTactic("");
            const response = await api.get("/mitre/");
            setMappings(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to create mapping");
        }
    };

    const deleteMapping = async (id) => {
        if (!window.confirm("Delete this mapping?")) return;
        try {
            await api.delete(`/mitre/${id}`);
            setMappings(mappings.filter(m => m.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete mapping");
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await api.get("/mitre/");
                if (mounted) setMappings(response.data);
            } catch (err) {
                console.error(err);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const getTacticColor = (t) => {
        const colors = {
            "Reconnaissance": "#0dcaf0",
            "Resource Development": "#6c757d",
            "Initial Access": "#dc3545",
            "Execution": "#ffc107",
            "Persistence": "#198754",
            "Privilege Escalation": "#dc3545",
            "Defense Evasion": "#ffc107",
            "Credential Access": "#dc3545",
            "Discovery": "#0dcaf0",
            "Lateral Movement": "#ffc107",
            "Collection": "#0dcaf0",
            "Command and Control": "#0d6efd",
            "Exfiltration": "#dc3545",
            "Impact": "#dc3545"
        };
        return colors[t] || "#6c757d";
    };

    const filteredMappings = mappings.filter(m => {
        const term = searchTerm.toLowerCase();
        return m.technique_id.toLowerCase().includes(term) ||
               m.technique_name.toLowerCase().includes(term) ||
               m.tactic.toLowerCase().includes(term);
    });

    const groupedByTactic = {};
    filteredMappings.forEach(m => {
        if (!groupedByTactic[m.tactic]) groupedByTactic[m.tactic] = [];
        groupedByTactic[m.tactic].push(m);
    });

    const tactics = Object.keys(groupedByTactic).sort();

    return (
        <div className="container-fluid p-0">
            {/* Create Mapping Panel */}
            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Add MITRE ATT&CK Mapping</span>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        createMapping();
                    }}
                >
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-2">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Case ID"
                                value={caseId}
                                onChange={(e) => setCaseId(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Technique ID (e.g., T1234)"
                                value={techniqueId}
                                onChange={(e) => setTechniqueId(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Technique Name"
                                value={techniqueName}
                                onChange={(e) => setTechniqueName(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Tactic"
                                value={tactic}
                                onChange={(e) => setTactic(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <button type="submit" className="btn btn-warning w-100">+ Add Mapping</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Search */}
            <div className="row g-2 mb-4">
                <div className="col-12">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Search by technique ID, name, or tactic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: "var(--bg-panel-2)",
                            border: "1px solid var(--border-soft)",
                            color: "var(--text-primary)",
                            borderRadius: "8px",
                        }}
                    />
                </div>
            </div>

            {/* MITRE by Tactic */}
            <div className="row">
                {tactics.length === 0 ? (
                    <div className="col-12">
                        <div className="panel">
                            <div className="panel-header">
                                <span className="panel-title">No MITRE mappings found</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    tactics.map(tacticName => (
                        <div key={tacticName} className="col-md-6 col-lg-4 mb-4">
                            <div className="panel h-100">
                                <div className="panel-header" style={{ backgroundColor: getTacticColor(tacticName), borderRadius: "12px 12px 0 0", color: "#fff" }}>
                                    <span className="panel-title">🛡️ {tacticName}</span>
                                </div>
                                <div className="p-3" style={{ color: "var(--text-primary)" }}>
                                    {groupedByTactic[tacticName].map(mapping => (
                                        <div key={mapping.id} className="mb-2 pb-2 border-bottom" style={{ borderColor: "var(--border-soft)" }}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <span className="badge bg-dark me-2">{mapping.technique_id}</span>
                                                    <br />
                                                    <small className="d-block mt-1">{mapping.technique_name}</small>
                                                    <small className="text-muted d-block">Case #{mapping.case_id}</small>
                                                </div>
                                                <button className="btn btn-sm btn-danger ms-2" onClick={() => deleteMapping(mapping.id)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default MITRE;
