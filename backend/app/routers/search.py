from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.case import Case
from app.models.ioc import IOC
from app.models.mitre import MitreMapping
from app.models.evidence import Evidence

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """
    One query box -> results from Cases, IOCs, Evidence, and MITRE mappings.
    Powers the navbar search bar.
    """
    like = f"%{q}%"

    cases = db.query(Case).filter(
        or_(Case.title.ilike(like), Case.description.ilike(like))
    ).limit(10).all()

    iocs = db.query(IOC).filter(IOC.value.ilike(like)).limit(10).all()

    evidence = db.query(Evidence).filter(
        Evidence.original_filename.ilike(like)
    ).limit(10).all()

    mitre = db.query(MitreMapping).filter(
        or_(MitreMapping.technique_id.ilike(like), MitreMapping.technique_name.ilike(like))
    ).limit(10).all()

    return {
        "cases": [{"id": c.id, "title": c.title, "status": c.status, "priority": c.priority} for c in cases],
        "iocs": [{"id": i.id, "case_id": i.case_id, "value": i.value, "ioc_type": i.ioc_type} for i in iocs],
        "evidence": [{"id": e.id, "filename": e.original_filename, "case_id": e.case_id} for e in evidence],
        "mitre": [{"id": m.id, "technique_id": m.technique_id, "technique_name": m.technique_name} for m in mitre],
        "total": len(cases) + len(iocs) + len(evidence) + len(mitre),
    }