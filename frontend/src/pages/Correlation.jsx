import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LegacyCorrelation() {
  const [correlations, setCorrelations] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [tab, setTab] = useState("correlations");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [corrRes, clusterRes] = await Promise.all([
        api.get("/correlation/"),
        api.get("/correlation/clusters"),
      ]);
      setCorrelations(corrRes.data);
      setClusters(clusterRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await load();
    };
    fetchData();
  }, []);

  const sevColor = level => (level === "High" ? "danger" : level === "Medium" ? "warning" : "secondary");

  return (
      <div className="container-fluid p-0">
        <div className="panel mb-4">
          <div className="panel-header">
            <div>
              <h1 className="mb-1">Case-to-Case Correlation</h1>
              <p className="text-muted mb-0">Indicators shared across multiple cases, scored by confidence, and clustered into likely threat actors.</p>
            </div>
          </div>
        </div>

        <div className="panel mb-4">
          <div className="panel-header">
            <span className="panel-title">Correlation Explorer</span>
          </div>
          <ul className="nav nav-tabs mb-0">
          <li className="nav-item">
            <button className={`nav-link ${tab === "correlations" ? "active" : ""}`} onClick={() => setTab("correlations")}>
              Shared Indicators ({correlations.length})
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "clusters" ? "active" : ""}`} onClick={() => setTab("clusters")}>
              Threat Clusters ({clusters.length})
            </button>
          </li>
        </ul>
        </div>

        {loading && <div className="panel"><div className="text-center text-muted py-4">Loading...</div></div>}

        {!loading && tab === "correlations" && (
          <div className="row">
            {correlations.length === 0 && (
              <div className="col-12">
                <div className="panel">
                  <div className="text-center text-muted py-4">No correlations yet — add the same IOC value to two or more cases to see them linked here.</div>
                </div>
              </div>
            )}
            {correlations.map((c, idx) => (
              <div key={idx} className="col-md-6 mb-3">
                <div className="panel h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-dark">{c.ioc_type}</span>
                    <span className="badge bg-info">Confidence {c.confidence}%</span>
                  </div>
                  <div>
                    <h6 className="font-monospace" style={{ color: "var(--text-primary)" }}>{c.value}</h6>
                    <div className="progress mb-2" style={{ height: "6px" }}>
                      <div className="progress-bar bg-info" style={{ width: `${c.confidence}%` }} />
                    </div>
                    <p className="small text-muted mb-2">Shared infrastructure score: <strong>{c.shared_score}</strong></p>

                    <div className="mb-2">
                      {c.cases.map(cs => (
                        <span key={cs.case_id} className={`badge bg-${sevColor(cs.priority)} me-1`}>
                          #{cs.case_id} {cs.title}
                        </span>
                      ))}
                    </div>

                    <div className="panel" style={{ background: "rgba(255,255,255,0.05)", padding: "12px" }}>
                      <div className="small mb-0">{c.recommendation}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "clusters" && (
          <div className="row">
            {clusters.length === 0 && (
              <div className="col-12">
                <div className="panel">
                  <div className="text-center text-muted py-4">No clusters yet — clusters form once 2+ cases share an IOC.</div>
                </div>
              </div>
            )}
            {clusters.map((cl, idx) => (
              <div key={idx} className="col-md-6 mb-3">
                <div className="panel h-100" style={{ borderColor: "#0d6efd" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3" style={{ borderBottom: "1px solid var(--border-soft)", paddingBottom: "10px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{cl.name}</span>
                    <span className="badge bg-light text-dark">Confidence {cl.confidence}%</span>
                  </div>
                  <div>
                    <p className="small text-muted">Cases in this cluster:</p>
                    {cl.cases.map(c => (
                      <span key={c.id} className="badge bg-secondary me-1 mb-1">#{c.id} {c.title}</span>
                    ))}
                    <p className="small text-muted mt-3 mb-1">Shared indicators:</p>
                    {cl.shared_indicators.map((v, i) => (
                      <div key={i} className="font-monospace small" style={{ color: "var(--text-primary)" }}>{v}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}

const IOC_WEIGHTS = {
  domain: 40,
  ip: 40,
  email: 30,
  hash: 60,
  url: 35,
  mitre: 20,
  default: 25,
};

const NODE_COLORS = {
  case: "#3b82f6",
  ioc: "#ef4444",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function typeKey(type) {
  return normalize(type).replace(/\s+/g, "");
}

function buildDerivedCorrelations(iocs, cases) {
  const caseTitle = new Map(cases.map((item) => [item.id, item.title]));
  const groups = new Map();

  iocs.forEach((ioc) => {
    const key = `${typeKey(ioc.ioc_type)}:${normalize(ioc.value)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        value: ioc.value,
        ioc_type: ioc.ioc_type,
        severity: ioc.severity,
        cases: new Map(),
      });
    }

    groups.get(key).cases.set(ioc.case_id, {
      case_id: ioc.case_id,
      title: caseTitle.get(ioc.case_id) || `Case #${ioc.case_id}`,
      priority: ioc.severity || "Medium",
    });
  });

  return [...groups.values()]
    .filter((item) => item.cases.size > 1)
    .map((item) => {
      const weight = IOC_WEIGHTS[typeKey(item.ioc_type)] || IOC_WEIGHTS.default;
      return {
        ...item,
        cases: [...item.cases.values()],
        confidence: Math.min(100, item.cases.size * weight),
        shared_score: item.cases.size * weight,
        recommendation: "Review linked cases for shared infrastructure, actor behavior, and evidence overlap.",
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

function buildSimilarity(cases, iocs, mappings) {
  const iocsByCase = new Map();
  const mitreByCase = new Map();

  cases.forEach((item) => {
    iocsByCase.set(item.id, []);
    mitreByCase.set(item.id, []);
  });

  iocs.forEach((ioc) => {
    const list = iocsByCase.get(ioc.case_id) || [];
    list.push(ioc);
    iocsByCase.set(ioc.case_id, list);
  });

  mappings.forEach((mapping) => {
    const list = mitreByCase.get(mapping.case_id) || [];
    list.push(mapping);
    mitreByCase.set(mapping.case_id, list);
  });

  const results = [];

  for (let i = 0; i < cases.length; i += 1) {
    for (let j = i + 1; j < cases.length; j += 1) {
      const left = cases[i];
      const right = cases[j];
      const leftIocs = iocsByCase.get(left.id) || [];
      const rightIocs = iocsByCase.get(right.id) || [];
      const leftMitre = mitreByCase.get(left.id) || [];
      const rightMitre = mitreByCase.get(right.id) || [];
      const reasons = [];
      let score = 0;

      leftIocs.forEach((a) => {
        rightIocs.forEach((b) => {
          if (normalize(a.value) !== normalize(b.value)) return;
          const points = IOC_WEIGHTS[typeKey(a.ioc_type)] || IOC_WEIGHTS.default;
          score += points;
          reasons.push(`Same ${a.ioc_type}: ${a.value} (+${points})`);
        });
      });

      leftMitre.forEach((a) => {
        rightMitre.forEach((b) => {
          if (normalize(a.technique_id) !== normalize(b.technique_id)) return;
          score += IOC_WEIGHTS.mitre;
          reasons.push(`Same MITRE ${a.technique_id} (+${IOC_WEIGHTS.mitre})`);
        });
      });

      if (score > 0) {
        results.push({
          left,
          right,
          score: Math.min(100, score),
          reasons: [...new Set(reasons)],
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

function RelationshipGraph({ correlations, selectedCase }) {
  const navigate = useNavigate();

  const graph = useMemo(() => {
    const visible = correlations
      .filter((corr) => selectedCase === "All" || corr.cases.some((item) => String(item.case_id) === selectedCase))
      .slice(0, 12);
    const nodeMap = new Map();
    const edges = [];

    visible.forEach((corr, index) => {
      const iocId = `ioc-${typeKey(corr.ioc_type)}-${normalize(corr.value) || index}`;
      nodeMap.set(iocId, {
        id: iocId,
        kind: "ioc",
        label: corr.value,
        sub: corr.ioc_type,
      });

      corr.cases.forEach((item) => {
        const caseNodeId = `case-${item.case_id}`;
        if (!nodeMap.has(caseNodeId)) {
          nodeMap.set(caseNodeId, {
            id: caseNodeId,
            kind: "case",
            label: `Case #${item.case_id}`,
            sub: item.title,
            caseId: item.case_id,
          });
        }
        edges.push({ from: caseNodeId, to: iocId, confidence: corr.confidence || 0 });
      });
    });

    const nodes = [...nodeMap.values()];
    const caseNodes = nodes.filter((node) => node.kind === "case");
    const iocNodes = nodes.filter((node) => node.kind === "ioc");
    const width = 980;
    const height = Math.max(360, Math.max(caseNodes.length, iocNodes.length) * 62 + 90);

    caseNodes.forEach((node, index) => {
      node.x = 130;
      node.y = 70 + index * ((height - 140) / Math.max(caseNodes.length - 1, 1));
    });

    iocNodes.forEach((node, index) => {
      node.x = 680;
      node.y = 70 + index * ((height - 140) / Math.max(iocNodes.length - 1, 1));
    });

    return { nodes, edges, width, height };
  }, [correlations, selectedCase]);

  const nodeLookup = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));

  if (graph.nodes.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        No shared IOC relationships yet. Add the same IOC value to two or more cases to see the graph.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <svg viewBox={`0 0 ${graph.width} ${graph.height}`} width="100%" height={Math.min(graph.height, 620)} style={{ minWidth: "760px" }}>
        {graph.edges.map((edge, index) => {
          const from = nodeLookup[edge.from];
          const to = nodeLookup[edge.to];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={`${edge.from}-${edge.to}-${index}`}>
              <line x1={from.x + 28} y1={from.y} x2={to.x - 28} y2={to.y} stroke="var(--border-soft)" strokeWidth="2" />
              <text x={midX} y={midY - 8} fill="var(--text-muted)" fontSize="11" textAnchor="middle">
                {edge.confidence}%
              </text>
            </g>
          );
        })}

        {graph.nodes.map((node) => {
          const color = NODE_COLORS[node.kind] || NODE_COLORS.ioc;
          return (
            <g key={node.id} onClick={() => node.caseId && navigate(`/cases/${node.caseId}`)} style={{ cursor: node.caseId ? "pointer" : "default" }}>
              <circle cx={node.x} cy={node.y} r="28" fill={`${color}22`} stroke={color} strokeWidth="2" />
              <text x={node.x} y={node.y + 5} textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="700">
                {node.kind === "case" ? "CASE" : "IOC"}
              </text>
              <text x={node.x + 42} y={node.y - 2} fill="var(--text-primary)" fontSize="13" fontWeight="700">
                {node.label.length > 32 ? `${node.label.slice(0, 31)}...` : node.label}
              </text>
              <text x={node.x + 42} y={node.y + 16} fill="var(--text-muted)" fontSize="11">
                {node.sub ? (node.sub.length > 36 ? `${node.sub.slice(0, 35)}...` : node.sub) : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Correlation() {
  const [cases, setCases] = useState([]);
  const [iocs, setIocs] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [tab, setTab] = useState("graph");
  const [selectedCase, setSelectedCase] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [caseRes, iocRes, mitreRes, corrRes, clusterRes] = await Promise.all([
          api.get("/cases/"),
          api.get("/ioc/"),
          api.get("/mitre/").catch(() => ({ data: [] })),
          api.get("/correlation/").catch(() => ({ data: [] })),
          api.get("/correlation/clusters").catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const caseData = caseRes.data || [];
        const iocData = iocRes.data || [];
        const derived = buildDerivedCorrelations(iocData, caseData);
        const apiCorrelations = corrRes.data || [];

        setCases(caseData);
        setIocs(iocData);
        setMappings(mitreRes.data || []);
        setCorrelations(apiCorrelations.length > 0 ? apiCorrelations : derived);
        setClusters(clusterRes.data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load relationship data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const similarity = useMemo(() => buildSimilarity(cases, iocs, mappings), [cases, iocs, mappings]);
  const sharedIocCount = correlations.length;
  const linkedCaseCount = new Set(correlations.flatMap((item) => item.cases.map((caseItem) => caseItem.case_id))).size;

  return (
    <div>
      <div className="page-title">IOC Relationship Graph</div>
      <div className="page-subtitle">Visualize shared indicators, case similarity, and likely investigation links.</div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="kpi-card kpi-blue">
            <div className="kpi-label">Cases</div>
            <div className="kpi-value">{cases.length}</div>
            <div className="kpi-delta">Loaded investigations</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="kpi-card kpi-red">
            <div className="kpi-label">IOCs</div>
            <div className="kpi-value">{iocs.length}</div>
            <div className="kpi-delta">Tracked indicators</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="kpi-card kpi-orange">
            <div className="kpi-label">Shared IOCs</div>
            <div className="kpi-value">{sharedIocCount}</div>
            <div className="kpi-delta">Correlation signals</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="kpi-card kpi-green">
            <div className="kpi-label">Linked Cases</div>
            <div className="kpi-value">{linkedCaseCount}</div>
            <div className="kpi-delta">Connected by IOCs</div>
          </div>
        </div>
      </div>

      <div className="panel mb-4">
        <div className="panel-header">
          <span className="panel-title">Relationship Workspace</span>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <ul className="nav nav-tabs mb-0">
            <li className="nav-item">
              <button className={`nav-link ${tab === "graph" ? "active" : ""}`} onClick={() => setTab("graph")}>Graph</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === "similarity" ? "active" : ""}`} onClick={() => setTab("similarity")}>Similarity ({similarity.length})</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === "clusters" ? "active" : ""}`} onClick={() => setTab("clusters")}>Clusters ({clusters.length})</button>
            </li>
          </ul>

          <select className="form-select" value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={{ width: "min(100%, 260px)" }}>
            <option value="All">All Cases</option>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>Case #{item.id} - {item.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="panel"><div className="text-center text-muted py-5">Loading relationship data...</div></div>}

      {!loading && error && <div className="panel"><div className="text-danger">{error}</div></div>}

      {!loading && !error && tab === "graph" && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Case to IOC Graph</span>
            <span className="text-muted small">Click a case node to open details</span>
          </div>
          <RelationshipGraph correlations={correlations} selectedCase={selectedCase} />
        </div>
      )}

      {!loading && !error && tab === "similarity" && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Case Similarity Score</span>
            <span className="text-muted small">Rule based confidence from shared IOCs and MITRE</span>
          </div>
          {similarity.length === 0 ? (
            <div className="text-center text-muted py-5">No similar cases found yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table-dark-clean mb-0">
                <thead>
                  <tr>
                    <th>Cases</th>
                    <th>Score</th>
                    <th>Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {similarity.slice(0, 20).map((item) => (
                    <tr key={`${item.left.id}-${item.right.id}`}>
                      <td>
                        <span className="badge-soft open">Case #{item.left.id}</span>
                        <span className="mx-2 text-muted">linked to</span>
                        <span className="badge-soft open">Case #{item.right.id}</span>
                      </td>
                      <td>
                        <span className={`badge-soft ${item.score >= 70 ? "critical" : item.score >= 40 ? "medium" : "low"}`}>{item.score}%</span>
                      </td>
                      <td>
                        {item.reasons.slice(0, 4).map((reason) => (
                          <div key={reason} className="small">{reason}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !error && tab === "clusters" && (
        <div className="row g-3">
          {clusters.length === 0 && (
            <div className="col-12">
              <div className="panel">
                <div className="text-center text-muted py-5">No clusters yet. Clusters form once multiple cases share indicators.</div>
              </div>
            </div>
          )}
          {clusters.map((cluster, index) => (
            <div key={`${cluster.name}-${index}`} className="col-md-6">
              <div className="panel h-100">
                <div className="panel-header">
                  <span className="panel-title">{cluster.name || `Cluster ${index + 1}`}</span>
                  <span className="badge-soft open">Confidence {cluster.confidence || 0}%</span>
                </div>
                <p className="small text-muted mb-2">Cases in this cluster:</p>
                {(cluster.cases || []).map((item) => (
                  <span key={item.id || item.case_id} className="badge-soft closed me-2 mb-2 d-inline-block">
                    Case #{item.id || item.case_id} {item.title || ""}
                  </span>
                ))}
                <p className="small text-muted mt-3 mb-1">Shared indicators:</p>
                {(cluster.shared_indicators || []).map((value) => (
                  <div key={value} className="font-monospace small" style={{ color: "var(--text-primary)" }}>{value}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Correlation;
