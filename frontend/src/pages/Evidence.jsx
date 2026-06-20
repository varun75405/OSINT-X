import { useEffect, useState } from "react";
import api from "../services/api";

function Evidence() {
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const uploadEvidence = async () => {
        if (!file) {
            alert("Please select a file");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();

            formData.append("file", file);

            await api.post(
                "/evidence/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setFile(null);

            const response = await api.get("/evidence/");

            setFiles(response.data);

        } catch (error) {

            console.error(error);

            alert("Failed to upload file");

        } finally {

            setUploading(false);

        }
    };

    const deleteEvidence = async (id) => {

        if (!window.confirm("Delete this file?")) {
            return;
        }

        try {

            await api.delete(`/evidence/${id}`);

            setFiles(
                files.filter(
                    f => f.id !== id
                )
            );

        } catch (error) {

            console.error(error);

            alert("Failed to delete file");

        }
    };

    useEffect(() => {

        let mounted = true;

        (async () => {

            try {

                const response = await api.get("/evidence/");

                if (mounted) {
                    setFiles(response.data);
                }

            } catch (err) {

                console.error(err);

            }

        })();

        return () => {
            mounted = false;
        };

    }, []);

    const getFileIcon = (ext = "") => {

        const icons = {
            ".pdf": "📄",
            ".txt": "📝",
            ".jpg": "🖼️",
            ".jpeg": "🖼️",
            ".png": "🖼️",
            ".gif": "🎞️",
            ".zip": "📦",
            ".rar": "📦",
            ".7z": "📦",
            ".doc": "📄",
            ".docx": "📄",
            ".xls": "📊",
            ".xlsx": "📊",
            ".csv": "📊",
            ".json": "{ }",
            ".xml": "< >",
            ".log": "📋",
            ".exe": "⚙️",
            ".dll": "⚙️",
            ".bin": "💾"
        };

        return icons[ext.toLowerCase()] || "📎";
    };

    const formatBytes = (bytes = 0) => {

        if (bytes === 0) {
            return "0 Bytes";
        }

        const k = 1024;

        const sizes = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];

        const i = Math.floor(
            Math.log(bytes) / Math.log(k)
        );

        return (
            Math.round(
                (bytes / Math.pow(k, i)) * 100
            ) / 100
        ) + " " + sizes[i];
    };

    return (
        <div className="container-fluid p-0">

            <div className="panel mb-4">

                <div className="panel-header">
                    <span className="panel-title">
                        Upload Evidence File
                    </span>
                </div>

                <div className="row g-2">

                    <div className="col-md-10">

                        <input
                            type="file"
                            className="form-control"
                            onChange={(e) =>
                                setFile(
                                    e.target.files[0]
                                )
                            }
                            style={{
                                background:
                                    "var(--bg-panel-2)",
                                border:
                                    "1px solid var(--border-soft)",
                                color:
                                    "var(--text-primary)"
                            }}
                        />

                        {file && (
                            <small className="text-muted">
                                Selected: {file.name}
                            </small>
                        )}

                    </div>

                    <div className="col-md-2">

                        <button
                            className="btn btn-success w-100"
                            onClick={uploadEvidence}
                            disabled={uploading}
                        >
                            {uploading
                                ? "Uploading..."
                                : "📤 Upload"}
                        </button>

                    </div>

                </div>

            </div>

            <div className="mt-4">

                <h5 className="mb-3">
                    Uploaded Evidence ({files.length})
                </h5>

                {files.length === 0 ? (

                    <div className="panel">

                        <div className="text-center text-muted py-5">
                            No evidence files uploaded yet.
                        </div>

                    </div>

                ) : (

                    <div className="row g-3">

                        {files.map((item) => (

                            <div
                                key={item.id}
                                className="col-md-4 col-lg-3"
                            >

                                <div
                                    className="panel h-100"
                                    style={{
                                        padding: "16px"
                                    }}
                                >

                                    <div className="d-flex flex-column h-100">

                                        <div
                                            className="text-center mb-3"
                                            style={{
                                                fontSize: "2.5rem"
                                            }}
                                        >
                                            {getFileIcon(
                                                item.extension
                                            )}
                                        </div>

                                        <h6
                                            className="text-truncate"
                                            title={item.filename}
                                            style={{
                                                color:
                                                    "var(--text-primary)"
                                            }}
                                        >
                                            {item.filename}
                                        </h6>

                                        <small className="text-muted mb-2">

                                            <span className="badge bg-info">
                                                {item.extension
                                                    ?.replace(".", "")
                                                    ?.toUpperCase()}
                                            </span>

                                        </small>

                                        <small className="text-muted mb-3">
                                            {formatBytes(item.size)}
                                        </small>

                                        <div className="mt-auto d-flex gap-2">

                                            <button
                                                className="btn btn-sm btn-outline-primary flex-grow-1"
                                                onClick={() =>
                                                    window.open(
                                                        `http://127.0.0.1:8000/evidence/${item.id}/download`
                                                    )
                                                }
                                            >
                                                ⬇️ Download
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() =>
                                                    deleteEvidence(
                                                        item.id
                                                    )
                                                }
                                            >
                                                🗑️
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default Evidence;