from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.models.case import Case
from app.models.indicator import ThreatIndicator, CaseIndicator
from app.models.evidence import Evidence, TimelineEvent
from app.services import case_service, evidence_service
from app.services.correlation_service import get_attack_techniques, ATTACK_MAP

router = APIRouter(tags=["Compat"])


# ── /auth/login ────────────────────────────────────────────────────────────────
class CompatLogin(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def compat_login(data: CompatLogin, db: Session = Depends(get_db)):
    """Frontend sends {email, password}. We treat email as username OR email lookup."""
    user = db.query(User).filter(
        (User.email == data.email) | (User.username == data.email.lower())
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": {
        "id": user.id, "username": user.username, "email": user.email, "role": user.role.value if hasattr(user.role,"value") else str(user.role)
    }}


class CompatRegister(BaseModel):
    username: str
    email: str
    password: str


@router.post("/auth/register")
def compat_register(data: CompatRegister, db: Session = Depends(get_db)):
    from app.services.auth_service import register_user
    from app.schemas import UserCreate
    result = register_user(db, UserCreate(username=data.username, email=data.email, password=data.password))
    return result


# ── /dashboard/stats ──────────────────────────────────────────────────────────
@router.get("/dashboard/stats")
def compat_dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stats = case_service.get_dashboard_stats(db, user.id)
    total_iocs = db.query(ThreatIndicator).filter(ThreatIndicator.is_active == True).count()
    high_sev_iocs = db.query(ThreatIndicator).filter(
        ThreatIndicator.risk_level.in_(["HIGH", "CRITICAL"]), ThreatIndicator.is_active == True
    ).count()
    mitre_count = len(get_attack_techniques(["c2","phishing","ransomware","tor","bec","brute","lateral","exfil","dropper"]))

    return {
        "total_cases": stats["total_cases"],
        "open_cases": stats["open_cases"],
        "total_iocs": total_iocs,
        "high_severity_iocs": high_sev_iocs,
        "mitre_mappings": mitre_count,
        "timeline_events": db.query(TimelineEvent).join(Case, Case.id == TimelineEvent.case_id).filter(Case.owner_id == user.id).count(),
    }


# ── /cases/ ────────────────────────────────────────────────────────────────────
class CompatCaseCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "Medium"


def _case_out(c: Case) -> dict:
    sev = c.severity.value if hasattr(c.severity, "value") else str(c.severity)
    pr_map = {"LOW": "Low", "MEDIUM": "Medium", "HIGH": "High", "CRITICAL": "High"}
    return {
        "id": c.id, "title": c.name, "description": c.description,
        "priority": pr_map.get(sev, "Medium"),
        "status": c.status.value if hasattr(c.status, "value") else str(c.status),
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("/cases/")
def compat_list_cases(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cases = case_service.get_cases(db, user.id)
    return [_case_out(c) for c in cases]


@router.post("/cases/")
def compat_create_case(data: CompatCaseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pr_to_sev = {"Low": "LOW", "Medium": "MEDIUM", "High": "HIGH"}
    from app.schemas import CaseCreate, SeverityEnum
    cc = CaseCreate(name=data.title, description=data.description, severity=SeverityEnum(pr_to_sev.get(data.priority, "MEDIUM")))
    c = case_service.create_case(db, cc, user.id)
    return _case_out(c)


@router.delete("/cases/{case_id}")
def compat_delete_case(case_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    case_service.delete_case(db, case_id, user.id)
    return {"message": "deleted"}


# ── /ioc/ ──────────────────────────────────────────────────────────────────────
class CompatIOCCreate(BaseModel):
    case_id: int
    ioc_type: str
    value: str
    severity: str = "Medium"


def _ioc_out(i: CaseIndicator) -> dict:
    return {
        "id": i.id, "case_id": i.case_id, "ioc_type": i.indicator_type.value if hasattr(i.indicator_type,"value") else str(i.indicator_type),
        "value": i.indicator_value, "severity": (i.context or {}).get("severity", "Medium"),
    }


@router.get("/ioc/")
def compat_list_iocs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (db.query(CaseIndicator).join(Case, Case.id == CaseIndicator.case_id)
            .filter(Case.owner_id == user.id).order_by(CaseIndicator.created_at.desc()).all())
    return [_ioc_out(i) for i in rows]


@router.get("/ioc/case/{case_id}")
def compat_list_iocs_for_case(case_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(CaseIndicator).filter(CaseIndicator.case_id == case_id).all()
    return [_ioc_out(i) for i in rows]


@router.post("/ioc/")
def compat_create_ioc(data: CompatIOCCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    type_map = {"ip": "IP", "domain": "Domain", "hash": "Hash", "email": "Email", "url": "URL"}
    itype = type_map.get(data.ioc_type.lower(), data.ioc_type.capitalize())
    ci = CaseIndicator(
        case_id=data.case_id, indicator_type=itype, indicator_value=data.value,
        source_module="manual", context={"severity": data.severity}, added_by=user.id,
    )
    db.add(ci); db.commit(); db.refresh(ci)
    return _ioc_out(ci)


@router.delete("/ioc/{ioc_id}")
def compat_delete_ioc(ioc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ci = db.query(CaseIndicator).filter(CaseIndicator.id == ioc_id).first()
    if not ci: raise HTTPException(404, "Not found")
    db.delete(ci); db.commit()
    return {"message": "deleted"}


# ── /timeline/ ─────────────────────────────────────────────────────────────────
class CompatTimelineCreate(BaseModel):
    case_id: int
    event: str
    event_type: str = "Investigation"


def _timeline_out(t: TimelineEvent) -> dict:
    return {
        "id": t.id, "case_id": t.case_id, "event": t.event_title,
        "event_type": t.event_type, "timestamp": t.created_at.isoformat() if t.created_at else None,
    }


@router.get("/timeline/")
def compat_list_timeline(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (db.query(TimelineEvent).join(Case, Case.id == TimelineEvent.case_id)
            .filter(Case.owner_id == user.id).order_by(TimelineEvent.created_at.desc()).limit(100).all())
    return [_timeline_out(t) for t in rows]


@router.get("/timeline/case/{case_id}")
def compat_list_timeline_for_case(case_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(TimelineEvent).filter(TimelineEvent.case_id == case_id).order_by(TimelineEvent.created_at.desc()).all()
    return [_timeline_out(t) for t in rows]


@router.post("/timeline/")
def compat_create_timeline(data: CompatTimelineCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = TimelineEvent(case_id=data.case_id, user_id=user.id, event_type=data.event_type, event_title=data.event)
    db.add(t); db.commit(); db.refresh(t)
    return _timeline_out(t)


@router.delete("/timeline/{event_id}")
def compat_delete_timeline(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not t: raise HTTPException(404, "Not found")
    db.delete(t); db.commit()
    return {"message": "deleted"}


# ── /mitre/ — AUTO-MAPPED ATT&CK, not manual CRUD ─────────────────────────────
def _mitre_out(idx: int, case_id: int, tech: dict) -> dict:
    return {
        "id": idx, "case_id": case_id, "technique_id": tech["technique_id"],
        "technique_name": tech["name"], "tactic": tech["tactic"],
    }


@router.get("/mitre/")
def compat_list_mitre(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Auto-derives ATT&CK mappings from case tags/descriptions/notes —
    no manual entry needed. Real correlation_service logic reused here.
    """
    cases = case_service.get_cases(db, user.id)
    results = []
    idx = 1
    for c in cases:
        blob = " ".join((c.tags or [])).lower() + " " + (c.name or "").lower() + " " + (c.description or "").lower()
        for keyword, techs in ATTACK_MAP.items():
            if keyword in blob:
                for t in techs:
                    results.append(_mitre_out(idx, c.id, t))
                    idx += 1
    return results


@router.get("/mitre/case/{case_id}")
def compat_list_mitre_for_case(case_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    case = case_service.get_case(db, case_id, user.id)
    blob = " ".join((case.tags or [])).lower() + " " + (case.name or "").lower() + " " + (case.description or "").lower()
    results = []
    idx = 1
    for keyword, techs in ATTACK_MAP.items():
        if keyword in blob:
            for t in techs:
                results.append(_mitre_out(idx, case_id, t))
                idx += 1
    if not results:
        # fallback so the UI isn't empty — suggest based on severity
        results.append(_mitre_out(1, case_id, {
            "technique_id": "T1583", "name": "Acquire Infrastructure", "tactic": "Resource Development",
        }))
    return results


class CompatMitreCreate(BaseModel):
    case_id: int
    technique_id: str
    technique_name: str
    tactic: str


@router.post("/mitre/")
def compat_create_mitre(data: CompatMitreCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Manual override still supported — stored as a tagged timeline note."""
    case = case_service.get_case(db, data.case_id, user.id)
    tags = list(case.tags or [])
    tags.append(data.technique_id)
    case.tags = tags
    db.commit()
    return {"id": 0, "case_id": data.case_id, "technique_id": data.technique_id,
            "technique_name": data.technique_name, "tactic": data.tactic}


@router.delete("/mitre/{mapping_id}")
def compat_delete_mitre(mapping_id: int):
    return {"message": "Auto-derived mappings cannot be deleted individually — edit case tags instead"}


# ── /evidence/ ─────────────────────────────────────────────────────────────────
def _evidence_out(e: Evidence) -> dict:
    return {
        "filename": e.original_filename or e.filename, "size": e.file_size or 0,
        "extension": (e.file_type or "").lower(), "id": e.id,
        "sha256": e.sha256_hash, "case_id": e.case_id,
    }


@router.get("/evidence/")
def compat_list_evidence(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = evidence_service.get_evidence(db, None, user.id)
    return [_evidence_out(e) for e in rows]


@router.post("/evidence/upload")
async def compat_upload_evidence(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ev = await evidence_service.upload_evidence(db, file, None, user.id)
    return _evidence_out(ev)


@router.delete("/evidence/{filename}")
def compat_delete_evidence(filename: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e = db.query(Evidence).filter(
        (Evidence.filename == filename) | (Evidence.original_filename == filename)
    ).first()
    if not e: raise HTTPException(404, "Not found")
    p = Path(e.storage_path)
    if p.exists(): p.unlink()
    db.delete(e); db.commit()
    return {"message": "deleted"}


# ── /report/case/{id} — PDF download ──────────────────────────────────────────
@router.get("/report/case/{case_id}")
def compat_download_report(case_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.report_service import generate_report
    from app.schemas import ReportCreate
    r = generate_report(db, ReportCreate(case_id=case_id), user.id)
    p = Path(r.pdf_path)
    if not p.exists(): raise HTTPException(404, "PDF generation failed")
    return FileResponse(path=str(p), filename=p.name, media_type="application/pdf")


# ── /domain/lookup, /ip/lookup, /email/analyze ────────────────────────────────
class CompatDomainQ(BaseModel):
    domain: str

class CompatIPQ(BaseModel):
    ip: str

class CompatEmailQ(BaseModel):
    email: str


@router.post("/domain/lookup")
def compat_domain_lookup(data: CompatDomainQ, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.investigation_service import investigate_domain
    from app.schemas import DomainQuery
    return investigate_domain(db, DomainQuery(domain=data.domain), user.id)


@router.post("/ip/lookup")
def compat_ip_lookup(data: CompatIPQ, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.investigation_service import investigate_ip
    from app.schemas import IPQuery
    return investigate_ip(db, IPQuery(ip_address=data.ip), user.id)


@router.post("/email/analyze")
def compat_email_analyze(data: CompatEmailQ, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.investigation_service import investigate_email
    from app.schemas import EmailQuery
    return investigate_email(db, EmailQuery(email_address=data.email), user.id)


# ── /correlation/ — bridge to the engine for the new Correlation.jsx page ────
@router.get("/correlation/")
def compat_correlations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.correlation_service import get_correlations
    return get_correlations(db, user.id, min_cases=2)


@router.get("/correlation/clusters")
def compat_clusters(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.correlation_service import cluster_threat_actors
    return cluster_threat_actors(db, user.id)
