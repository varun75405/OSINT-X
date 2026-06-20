"""
Correlation Engine + Threat Actor Clustering
==============================================
Built directly on top of the existing `IOC` table (case_id, ioc_type, value,
severity). No new tables required.

1. Correlation: same `value` appearing in 2+ different cases = automatic link.
2. Confidence scoring: weighted by IOC type (hash > domain > ip > email).
3. Clustering: union-find over cases that share any IOC -> "Cluster A/B/C..."
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict

from app.models.ioc import IOC
from app.models.case import Case

# Shared-infrastructure scoring weights (point 3 from the original request)
TYPE_WEIGHT = {
    "hash": 50,
    "domain": 40,
    "ip": 30,
    "email": 20,
    "url": 15,
}


def get_all_correlations(db: Session) -> List[Dict]:
    """
    SELECT value, COUNT(DISTINCT case_id) FROM iocs
    GROUP BY value HAVING COUNT(DISTINCT case_id) > 1
    """
    rows = (
        db.query(IOC.value, IOC.ioc_type, func.count(func.distinct(IOC.case_id)).label("case_count"))
        .group_by(IOC.value, IOC.ioc_type)
        .having(func.count(func.distinct(IOC.case_id)) > 1)
        .all()
    )

    results = []
    for value, ioc_type, case_count in rows:
        linked = db.query(IOC, Case).join(Case, Case.id == IOC.case_id).filter(IOC.value == value).all()

        cases_out = []
        for ioc, case in linked:
            cases_out.append({
                "case_id": case.id,
                "title": case.title,
                "priority": case.priority,
                "status": case.status,
                "severity": ioc.severity,
            })

        weight = TYPE_WEIGHT.get((ioc_type or "").lower(), 20)
        shared_score = weight * case_count
        confidence = min(100, shared_score)

        results.append({
            "value": value,
            "ioc_type": ioc_type,
            "case_count": case_count,
            "cases": cases_out,
            "shared_score": shared_score,
            "confidence": confidence,
            "recommendation": _recommend(ioc_type, case_count),
        })

    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results


def get_case_correlations(db: Session, case_id: int) -> Dict:
    """Correlation scoped to a single case (used on CaseDetails page)."""
    case_iocs = db.query(IOC).filter(IOC.case_id == case_id).all()
    if not case_iocs:
        return {"shared_iocs": [], "total_correlations": 0}

    values = [i.value for i in case_iocs]
    others = db.query(IOC, Case).join(Case, Case.id == IOC.case_id).filter(
        IOC.value.in_(values), IOC.case_id != case_id
    ).all()

    grouped: Dict[str, Dict] = {}
    for ioc, case in others:
        if ioc.value not in grouped:
            grouped[ioc.value] = {
                "value": ioc.value,
                "type": ioc.ioc_type,
                "severity": ioc.severity,
                "cases": [],
            }
        grouped[ioc.value]["cases"].append({"case_id": case.id, "title": case.title})

    return {"shared_iocs": list(grouped.values()), "total_correlations": len(grouped)}


def cluster_threat_actors(db: Session) -> List[Dict]:
    """
    Union-Find clustering: any two cases sharing >=1 IOC value end up
    in the same cluster. Produces named groups like "Cluster A".
    """
    all_case_ids = [c.id for c in db.query(Case.id).all()]
    parent = {cid: cid for cid in all_case_ids}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    correlations = get_all_correlations(db)
    cluster_indicators: Dict[int, List[str]] = {cid: [] for cid in all_case_ids}

    for corr in correlations:
        case_ids = [c["case_id"] for c in corr["cases"]]
        for cid in case_ids:
            cluster_indicators.setdefault(cid, []).append(corr["value"])
            for other in case_ids:
                if other != cid:
                    union(cid, other)

    groups: Dict[int, List[int]] = {}
    for cid in all_case_ids:
        root = find(cid)
        groups.setdefault(root, []).append(cid)

    clusters = []
    idx = 0
    for root, case_ids in groups.items():
        if len(case_ids) < 2:
            continue
        letter = chr(65 + idx)
        idx += 1
        shared_vals = sorted(set(v for cid in case_ids for v in cluster_indicators.get(cid, [])))
        cases = db.query(Case).filter(Case.id.in_(case_ids)).all()

        relevant = [c for c in correlations if any(x["case_id"] in case_ids for x in c["cases"])]
        confidence = round(sum(r["confidence"] for r in relevant) / max(len(relevant), 1), 1) if relevant else 0

        clusters.append({
            "name": f"Cluster {letter}",
            "case_ids": case_ids,
            "cases": [{"id": c.id, "title": c.title, "priority": c.priority, "status": c.status} for c in cases],
            "shared_indicators": shared_vals,
            "confidence": confidence,
        })

    clusters.sort(key=lambda c: c["confidence"], reverse=True)
    return clusters


def _recommend(ioc_type: str, case_count: int) -> str:
    t = (ioc_type or "").lower()
    if t == "hash":
        return f"File hash seen in {case_count} cases — strongest signal of same actor. Submit to VirusTotal/MalwareBazaar."
    if t == "domain":
        return f"Domain seen in {case_count} cases. Check WHOIS registration date and pivot on nameservers."
    if t == "ip":
        return f"IP seen in {case_count} cases. Block at firewall, check AbuseIPDB, pivot on ASN."
    if t == "email":
        return f"Email seen in {case_count} cases. Check breach databases, pivot on username across platforms."
    return f"Indicator seen in {case_count} cases — investigate for shared threat actor."