import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import AppLayout from "../layouts/Layout";

function Cases() {
    const [cases, setCases] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPriority, setFilterPriority] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    const createCase = async () => {
        if (!title.trim()) {
            alert("Please enter a case title");
            return;
        }
        try {
            await api.post("/cases/", { title, description, priority });
            setTitle("");
            setDescription("");
            setPriority("Medium");
            const response = await api.get("/cases/");
            setCases(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to create case");
        }
    };

    const deleteCase = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/cases/${id}`);
            setCases(cases.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete case");
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await api.get("/cases/");
                if (mounted) setCases(response.data);
            } catch (err) {
                console.error(err);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const filteredCases = cases.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchPriority = filterPriority === "All" || c.priority === filterPriority;
        const matchStatus = filterStatus === "All" || c.status === filterStatus;
        return matchSearch && matchPriority && matchStatus;
    });

    const getPriorityBadge = (p) => {
        const classMap = { Low: "low", Medium: "medium", High: "high" };
        return <span className={`badge-soft ${classMap[p] || "low"}`}>{p}</span>;
    };

    const getStatusBadge = (s) => {
        const classMap = { Open: "open", Closed: "closed", Pending: "inprogress" };
        return <span className={`badge-soft ${classMap[s] || "closed"}`}>{s}</span>;
    };

    return (
        <div>
            <div className="page-title">Cases</div>
            <div className="page-subtitle">Manage and track your investigation cases</div>

            {/* Create Case Panel */}
            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Create New Case</span>
                </div>
                <div>
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Case Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px"
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                className="form-select"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px"
                                }}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-2">
                            <button
                                className="btn btn-primary w-100"
                                onClick={createCase}
                                style={{ borderRadius: "8px" }}
                            >
                                + Create
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                            background: "var(--bg-panel-2)",
                            border: "1px solid var(--border-soft)",
                            color: "var(--text-primary)",
                            borderRadius: "8px"
                        }}
                    />
                </div>
            </div>

            {/* Filters & Search */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Search cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: "var(--bg-panel-2)",
                            border: "1px solid var(--border-soft)",
                            color: "var(--text-primary)",
                            borderRadius: "8px"
                        }}
                    />
                </div>
                <div className="col-12 col-md-2">
                    <select
                        className="form-select"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{
                            background: "var(--bg-panel-2)",
                            border: "1px solid var(--border-soft)",
                            color: "var(--text-primary)",
                            borderRadius: "8px"
                        }}
                    >
                        <option value="All">All Priorities</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
                <div className="col-12 col-md-2">
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            background: "var(--bg-panel-2)",
                            border: "1px solid var(--border-soft)",
                            color: "var(--text-primary)",
                            borderRadius: "8px"
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option>Open</option>
                        <option>Closed</option>
                        <option>Pending</option>
                    </select>
                </div>
                <div className="col-12 col-md-4" style={{ color: "var(--text-muted)", fontSize: "0.88rem", display: "flex", alignItems: "center" }}>
                    {filteredCases.length} of {cases.length} cases found
                </div>
            </div>

            {/* Cases Table Panel */}
            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Cases ({filteredCases.length})</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                    {filteredCases.length === 0 ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                            No cases found
                        </div>
                    ) : (
                        <table className="table-dark-clean">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: "bold" }}>#{item.id}</td>
                                        <td>{item.title}</td>
                                        <td>{getPriorityBadge(item.priority)}</td>
                                        <td>{getStatusBadge(item.status)}</td>
                                        <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}</td>
                                        <td>
                                            <Link
                                                to={`/cases/${item.id}`}
                                                className="btn btn-sm btn-info me-2"
                                                style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                                            >
                                                View
                                            </Link>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => deleteCase(item.id)}
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

export default Cases;