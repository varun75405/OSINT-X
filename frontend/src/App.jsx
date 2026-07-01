import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { setAuthToken } from "./services/api";

import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import IOC from "./pages/IOC";
import Timeline from "./pages/Timeline";
import MITRE from "./pages/MITRE";
import Evidence from "./pages/Evidence";
import Reports from "./pages/Reports";
import ThreatIntel from "./pages/ThreatIntel";
import CaseDetails from "./pages/CaseDetails";
import Correlation from "./pages/Correlation";
import AppLayout from "./layouts/Layout";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auto-authenticate: if no token exists, login silently with default creds
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token) {
      setReady(true);
      return;
    }

    // Try to auto-login with the seeded admin user
    (async () => {
      try {
        const res = await api.post("/auth/login", {
          email: "admin@osintx.com",
          password: "admin123",
        });
        setAuthToken(res.data.access_token);
        localStorage.setItem("user", JSON.stringify({ username: "admin" }));
      } catch {
        // If login fails (e.g. local dev with no auth), that's fine
        console.log("Auto-login skipped (no auth required or user not found)");
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return null; // Brief pause while auto-login runs

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/cases" element={<AppLayout><Cases /></AppLayout>} />
        <Route path="/ioc" element={<AppLayout><IOC /></AppLayout>} />
        <Route path="/timeline" element={<AppLayout><Timeline /></AppLayout>} />
        <Route path="/mitre" element={<AppLayout><MITRE /></AppLayout>} />
        <Route path="/evidence" element={<AppLayout><Evidence /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
        <Route path="/threat-intel" element={<AppLayout><ThreatIntel /></AppLayout>} />
        <Route path="/cases/:id" element={<AppLayout><CaseDetails /></AppLayout>} />
        <Route path="/correlation" element={<AppLayout><Correlation /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;