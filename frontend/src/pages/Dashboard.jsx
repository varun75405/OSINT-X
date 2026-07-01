import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../layouts/Layout";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import ActiveInvestigationsPanel from "../components/dashboard/ActiveInvestigationsPanel";
import IOCSeverityPanel from "../components/dashboard/IOCSeverityPanel";
import MitreCoveragePanel from "../components/dashboard/MitreCoveragePanel";
import TopIOCTypesPanel from "../components/dashboard/TopIOCTypesPanel";
import CorrelationGraphPanel from "../components/dashboard/CorrelationGraphPanel";
import TrendLineChart from "../components/charts/TrendLineChart";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [severityDist, setSeverityDist] = useState(null);
  const [typeDist, setTypeDist] = useState(null);
  const [mitreCoverage, setMitreCoverage] = useState(null);
  const [activeCases, setActiveCases] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [
          summaryRes, trendRes, sevRes, typeRes,
          mitreRes, activeRes, alertsRes, corrRes,
        ] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/trend?days=7"),
          api.get("/dashboard/ioc-distribution"),
          api.get("/dashboard/ioc-types"),
          api.get("/dashboard/mitre-coverage"),
          api.get("/dashboard/active-investigations"),
          api.get("/dashboard/recent-alerts"),
          api.get("/correlation/"),
        ]);
        if (!mounted) return;
        setSummary(summaryRes.data);
        setTrend(trendRes.data);
        setSeverityDist(sevRes.data);
        setTypeDist(typeRes.data);
        setMitreCoverage(mitreRes.data);
        setActiveCases(activeRes.data);
        setAlerts(alertsRes.data);
        setCorrelations(corrRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-title">Dashboard</div>
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Overview of your security operations</div>

      <StatsGrid summary={summary} />

      <div className="row g-3 mb-3">
        <div className="col-lg-5">
          <div className="panel" style={{ height: "100%" }}>
            <div className="panel-header">
              <span className="panel-title">Incident Trend</span>
              <span className="text-muted small">Last 7 Days</span>
            </div>
            {trend && <TrendLineChart labels={trend.labels} values={trend.values} />}
          </div>
        </div>
        <div className="col-lg-4">
          <IOCSeverityPanel data={severityDist} />
        </div>
        <div className="col-lg-3">
          <MitreCoveragePanel data={mitreCoverage} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <RecentActivity alerts={alerts} />
        </div>
        <div className="col-lg-5">
          <ActiveInvestigationsPanel cases={activeCases} />
        </div>
        <div className="col-lg-3">
          <TopIOCTypesPanel data={typeDist} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <CorrelationGraphPanel correlations={correlations} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;