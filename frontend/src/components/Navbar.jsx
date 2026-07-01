import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaBell, FaMoon } from "react-icons/fa";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const boxRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/notifications/")
      .then(res => setNotifications(res.data.notifications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const runSearch = async value => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }
    try {
      const res = await api.get(`/search/?q=${encodeURIComponent(value)}`);
      setResults(res.data);
      setShowResults(true);
    } catch {
      setResults(null);
    }
  };

  const goToCase = id => {
    setShowResults(false);
    setQuery("");
    navigate(`/cases/${id}`);
  };

  return (
    <div className="topbar-dark">
      <div className="topbar-search" ref={boxRef}>
        <FaSearch className="search-icon" />
        <input
          placeholder="Search cases, IOCs, domains, IPs..."
          value={query}
          onChange={e => runSearch(e.target.value)}
          onFocus={() => results && setShowResults(true)}
        />
        {showResults && results && (
          <div
            className="position-absolute bg-white text-dark shadow rounded mt-1 p-2"
            style={{ width: "100%", zIndex: 1050, maxHeight: "360px", overflowY: "auto" }}
          >
            {results.total === 0 && <div className="text-muted small p-2">No results</div>}
            {results.cases.length > 0 && (
              <div className="mb-2">
                <div className="small text-muted fw-bold px-2">Cases</div>
                {results.cases.map(c => (
                  <div key={c.id} className="px-2 py-1" style={{ cursor: "pointer" }} onClick={() => goToCase(c.id)}>
                    #{c.id} {c.title} <span className="badge bg-secondary">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
            {results.iocs.length > 0 && (
              <div className="mb-2">
                <div className="small text-muted fw-bold px-2">IOCs</div>
                {results.iocs.map(i => (
                  <div key={i.id} className="px-2 py-1" style={{ cursor: "pointer" }} onClick={() => goToCase(i.case_id)}>
                    {i.ioc_type}: {i.value} <span className="text-muted">(Case #{i.case_id})</span>
                  </div>
                ))}
              </div>
            )}
            {results.evidence.length > 0 && (
              <div className="mb-2">
                <div className="small text-muted fw-bold px-2">Evidence</div>
                {results.evidence.map(e => <div key={e.id} className="px-2 py-1">{e.filename}</div>)}
              </div>
            )}
            {results.mitre.length > 0 && (
              <div>
                <div className="small text-muted fw-bold px-2">MITRE</div>
                {results.mitre.map(m => (
                  <div key={m.id} className="px-2 py-1">{m.technique_id} — {m.technique_name}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ms-auto d-flex align-items-center gap-2">
        <div className="icon-btn"><FaMoon /></div>

        <div className="position-relative">
          <div className="icon-btn" onClick={() => setShowNotifs(p => !p)}>
            <FaBell />
            {notifications.length > 0 && <span className="notif-dot">{notifications.length}</span>}
          </div>
          {showNotifs && (
            <div className="position-absolute end-0 bg-white text-dark shadow rounded mt-2 p-2" style={{ width: "320px", zIndex: 1050, maxHeight: "360px", overflowY: "auto" }}>
              {notifications.length === 0 && <div className="text-muted small p-2">No notifications</div>}
              {notifications.map((n, idx) => (
                <div key={idx} className={`px-2 py-2 border-bottom small ${n.severity === "critical" ? "text-danger" : n.severity === "high" ? "text-warning" : ""}`}>
                  {n.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 ms-2">
          <div className="avatar-circle">{(user.username || "AD").slice(0, 2).toUpperCase()}</div>
          <div className="hide-on-mobile">
            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{user.username || "Admin"}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;