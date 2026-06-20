import { useEffect, useState } from "react";
import api from "../services/api";

function Timeline() {
    const [events, setEvents] = useState([]);
    const [caseId, setCaseId] = useState("");
    const [event, setEvent] = useState("");
    const [eventType, setEventType] = useState("Investigation");

    const createEvent = async () => {
        if (!caseId || !event) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await api.post("/timeline/", { case_id: parseInt(caseId), event: event, event_type: eventType });
            setCaseId("");
            setEvent("");
            setEventType("Investigation");
            const response = await api.get("/timeline/");
            setEvents(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to create event");
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        try {
            await api.delete(`/timeline/${id}`);
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete event");
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await api.get("/timeline/");
                if (mounted) setEvents(response.data);
            } catch (err) {
                console.error(err);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const getEventIcon = (type) => {
        const icons = { Investigation: "🔍", IOC: "⚠️", Evidence: "📦", MITRE: "🛡️", ThreatIntel: "🌐" };
        return icons[type] || "📌";
    };

    const getEventColor = (type) => {
        const colors = {
            Investigation: "blue",
            IOC: "red",
            Evidence: "green",
            MITRE: "orange",
            ThreatIntel: "cyan",
        };
        return colors[type] || "gray";
    };

    const getBadgeClass = (type) => {
        const map = {
            Investigation: "open",
            IOC: "high",
            Evidence: "low",
            MITRE: "medium",
            ThreatIntel: "critical",
        };
        return map[type] || "open";
    };

    const sortedEvents = [...events].sort((a, b) => {
        const timeA = new Date(a.timestamp || 0);
        const timeB = new Date(b.timestamp || 0);
        return timeB - timeA;
    });

    return (
        <div>
            <div className="page-title">Timeline</div>
            <div className="page-subtitle">Track case events and investigations over time</div>

            <div className="panel mb-4">
                <div className="panel-header">
                    <span className="panel-title">Add Timeline Event</span>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        createEvent();
                    }}
                >
                    <div className="row g-3">
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
                        <div className="col-12 col-md-4">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Event description"
                                value={event}
                                onChange={(e) => setEvent(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <select
                                className="form-select"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                style={{
                                    background: "var(--bg-panel-2)",
                                    border: "1px solid var(--border-soft)",
                                    color: "var(--text-primary)",
                                    borderRadius: "8px",
                                }}
                            >
                                <option>Investigation</option>
                                <option>IOC</option>
                                <option>Evidence</option>
                                <option>MITRE</option>
                                <option>ThreatIntel</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-3">
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                style={{ borderRadius: "8px" }}
                            >
                                + Add Event
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <span className="panel-title">Timeline Events ({events.length})</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                    {events.length === 0 ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                            No events yet. Add the first event to get started!
                        </div>
                    ) : (
                        <div style={{ position: "relative", paddingLeft: "32px" }}>
                            {sortedEvents.map((item, index) => (
                                <div key={item.id} style={{ position: "relative", paddingBottom: "24px" }}>
                                    {index < sortedEvents.length - 1 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "-10px",
                                                top: "28px",
                                                width: "2px",
                                                height: "calc(100% - 28px)",
                                                backgroundColor: "var(--border-soft)",
                                            }}
                                        />
                                    )}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "-18px",
                                            top: "12px",
                                            width: "14px",
                                            height: "14px",
                                            borderRadius: "50%",
                                            background: `var(--accent-${getEventColor(item.event_type)})`,
                                            border: "3px solid var(--bg-panel)",
                                        }}
                                    />
                                    <div className="panel mb-3">
                                        <div className="panel-header" style={{ alignItems: "flex-start" }}>
                                            <div>
                                                <span className="panel-title" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <span>{getEventIcon(item.event_type)}</span>
                                                    Case #{item.case_id}
                                                </span>
                                                <div style={{ marginTop: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : "No date"}
                                                </div>
                                            </div>
                                            <button className="btn btn-sm btn-danger" onClick={() => deleteEvent(item.id)}>
                                                Delete
                                            </button>
                                        </div>
                                        <div style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{item.event}</p>
                                            <div style={{ marginTop: "10px" }}>
                                                <span className={`badge-soft ${getBadgeClass(item.event_type)}`}>
                                                    {item.event_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Timeline;
