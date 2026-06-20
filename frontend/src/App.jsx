import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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