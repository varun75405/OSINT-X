import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaFolderOpen,
  FaBug,
  FaClock,
  FaShieldAlt,
  FaFileUpload,
  FaFilePdf,
  FaSearch,
  FaProjectDiagram,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const LINKS = [
  { to: "/", label: "Dashboard", icon: <FaHome /> },
  { to: "/cases", label: "Cases", icon: <FaFolderOpen /> },
  { to: "/ioc", label: "IOC Database", icon: <FaBug /> },
  { to: "/timeline", label: "Timeline", icon: <FaClock /> },
  { to: "/mitre", label: "MITRE ATT&CK", icon: <FaShieldAlt /> },
  { to: "/evidence", label: "Evidence", icon: <FaFileUpload /> },
  { to: "/reports", label: "Reports", icon: <FaFilePdf /> },
  { to: "/threat-intel", label: "Threat Intel", icon: <FaSearch /> },
  {
    to: "/correlation",
    label: "Correlations",
    icon: <FaProjectDiagram />,
    badge: "NEW",
  },
];

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.username || "AD").slice(0, 2).toUpperCase();

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`sidebar-dark d-flex flex-column ${mobileOpen ? "show" : ""}`}>
        <div className="sidebar-brand">
          <div className="icon-badge">🛡️</div>
          <div className="titles">
            <div>OSINT-X</div>
            <div>Cyber Investigation Platform</div>
          </div>
        </div>

        <div className="flex-grow-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link-dark ${isActive ? "active" : ""}`
              }
            >
              {link.icon}
              <span>{link.label}</span>

              {link.badge && (
                <span className="nav-badge">{link.badge}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="avatar-circle">{initials}</div>

          <div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {user.username || "Admin"}
            </div>

            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--accent-green)",
              }}
            >
              ● Online
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;