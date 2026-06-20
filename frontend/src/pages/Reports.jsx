import { useState } from "react";

function Reports() {
    const [caseId, setCaseId] = useState("");

    const downloadReport = () => {
        if (!caseId) {
            alert("Enter Case ID");
            return;
        }

        window.open(`http://127.0.0.1:8000/report/case/${caseId}`, "_blank");
    };

    return (
        <div className="container-fluid p-0">
            <div className="page-title">Reports</div>
            <div className="page-subtitle">Generate downloadable case reports with full incident detail.</div>

            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Generate PDF Report</span>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        downloadReport();
                    }}
                >
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-4">
                            <label className="form-label text-muted">Case ID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={caseId}
                                placeholder="Enter case ID"
                                onChange={(e) => setCaseId(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-5">
                            <div style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
                                Enter the case ID and generate a structured PDF report including summary, IOCs, timeline events, MITRE mappings, and correlation insights.
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <button type="submit" className="btn btn-primary w-100">
                                Download PDF
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Report Output</span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
                    Once generated, the PDF will open in a new browser tab. Use the Case Details page to verify data before exporting.
                </div>
            </div>
        </div>
    );
}

export default Reports;
