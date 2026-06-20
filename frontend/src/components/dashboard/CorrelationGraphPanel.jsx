import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_COLOR = {
  case: "#3b82f6",
  ip: "#22c55e",
  domain: "#a855f7",
  hash: "#06b6d4",
  email: "#f59e0b",
};

const TYPE_ICON = {
  case: "👤",
  ip: "🖥",
  domain: "🌐",
  hash: "📄",
  email: "✉",
};

/**
 * correlations: output of GET /correlation/ — [{ value, ioc_type, cases: [{case_id, title}], confidence }]
 * Builds a small bipartite layout: case nodes on the outside, indicator nodes in the middle,
 * laid out on a simple horizontal chain so it stays readable without a physics engine.
 */
function CorrelationGraphPanel({ correlations }) {
  const navigate = useNavigate();

  const { nodes, edges, width, height } = useMemo(() => {
    if (!correlations || correlations.length === 0) {
      return { nodes: [], edges: [], width: 680, height: 200 };
    }

    const top = correlations.slice(0, 4); // keep the dashboard preview light
    const nodeMap = new Map();
    const edgeList = [];
    const W = 680;
    const rowY = [90, 230];
    let col = 0;

    top.forEach((corr, i) => {
      const indId = `ind-${i}`;
      const x = 90 + i * (W - 180) / Math.max(top.length - 1, 1);
      nodeMap.set(indId, {
        id: indId, type: corr.ioc_type.toLowerCase(), label: corr.value,
        sub: corr.ioc_type, x, y: rowY[i % 2 === 0 ? 0 : 1] === rowY[0] ? 160 : 160,
      });

      corr.cases.forEach((cs, j) => {
        const caseId = `case-${cs.case_id}`;
        if (!nodeMap.has(caseId)) {
          nodeMap.set(caseId, {
            id: caseId, type: "case", label: `Case #${cs.case_id}`,
            sub: cs.title, x: 0, y: 0, caseId: cs.case_id,
          });
        }
        edgeList.push({ from: caseId, to: indId, pct: corr.confidence });
      });
    });

    // crude layout: spread case nodes alternating top/bottom around their linked indicator
    const caseNodes = [...nodeMap.values()].filter(n => n.type === "case");
    const indNodes = [...nodeMap.values()].filter(n => n.type !== "case");

    indNodes.forEach((ind, i) => {
      ind.x = 110 + i * (W - 220) / Math.max(indNodes.length - 1, 1);
      ind.y = 160;
    });

    const linkedCases = {};
    edgeList.forEach(e => {
      linkedCases[e.to] = linkedCases[e.to] || [];
      linkedCases[e.to].push(e.from);
    });

    indNodes.forEach(ind => {
      const linked = linkedCases[ind.id] || [];
      linked.forEach((caseId, idx) => {
        const node = nodeMap.get(caseId);
        if (node && node.x === 0 && node.y === 0) {
          node.x = ind.x + (idx % 2 === 0 ? -120 : 120);
          node.y = idx % 2 === 0 ? 70 : 250;
        }
      });
    });

    // fallback positions for any case node still unplaced
    let fallbackIdx = 0;
    caseNodes.forEach(n => {
      if (n.x === 0 && n.y === 0) {
        n.x = 60 + fallbackIdx * 100;
        n.y = fallbackIdx % 2 === 0 ? 70 : 250;
        fallbackIdx++;
      }
    });

    return { nodes: [...nodeMap.values()], edges: edgeList, width: W, height: 320 };
  }, [correlations]);

  if (nodes.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Correlation Overview</span></div>
        <p className="text-muted small">No correlations yet — add matching IOC values to 2+ cases.</p>
      </div>
    );
  }

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Correlation Overview</span>
        <a className="panel-link" onClick={() => navigate("/correlation")}>View All Correlations</a>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={320} style={{ overflow: "visible" }}>
        {edges.map((e, i) => {
          const a = nodeMap[e.from];
          const b = nodeMap[e.to];
          if (!a || !b) return null;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#232a3d" strokeWidth="1.5" />
              <text x={midX} y={midY - 6} fill="#8d93a6" fontSize="11" textAnchor="middle">{e.pct}%</text>
            </g>
          );
        })}

        {nodes.map(n => {
          const color = TYPE_COLOR[n.type] || "#8d93a6";
          return (
            <g
              key={n.id}
              style={{ cursor: n.caseId ? "pointer" : "default" }}
              onClick={() => n.caseId && navigate(`/cases/${n.caseId}`)}
            >
              <circle cx={n.x} cy={n.y} r="22" fill={`${color}22`} stroke={color} strokeWidth="2" />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14">{TYPE_ICON[n.type] || "•"}</text>
              <text x={n.x} y={n.y + 38} textAnchor="middle" fontSize="11" fill="#e8eaf0" fontWeight="600">
                {n.label.length > 18 ? n.label.slice(0, 17) + "…" : n.label}
              </text>
              <text x={n.x} y={n.y + 52} textAnchor="middle" fontSize="10" fill="#8d93a6">
                {n.sub.length > 20 ? n.sub.slice(0, 19) + "…" : n.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default CorrelationGraphPanel;