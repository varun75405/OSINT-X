from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case
from app.models.ioc import IOC
from app.models.mitre import MitreMapping
from app.models.timeline import Timeline
from app.models.evidence import Evidence
from app.schemas.case import CaseCreate, CaseResponse
import os

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.post("/")
def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
):
    db_case = Case(
        title=case.title,
        description=case.description,
        priority=case.priority,
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.get("/", response_model=list[CaseResponse])
def get_cases(
    db: Session = Depends(get_db),
):
    return db.query(Case).all()


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/{case_id}")
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Cascading delete: remove all child rows first to avoid FK violations
    db.query(IOC).filter(IOC.case_id == case_id).delete(synchronize_session=False)
    db.query(MitreMapping).filter(MitreMapping.case_id == case_id).delete(synchronize_session=False)
    db.query(Timeline).filter(Timeline.case_id == case_id).delete(synchronize_session=False)

    # Delete evidence files from disk
    evidences = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    for ev in evidences:
        try:
            if ev.filename and os.path.exists(ev.filename):
                os.remove(ev.filename)
        except Exception:
            pass
    db.query(Evidence).filter(Evidence.case_id == case_id).delete(synchronize_session=False)

    db.delete(case)
    db.commit()
    return {"message": "Case deleted successfully"}
