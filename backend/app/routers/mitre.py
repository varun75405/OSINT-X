from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.case import Case
from app.models.mitre import MitreMapping

from app.schemas.mitre import (
    MitreCreate,
    MitreResponse
)

from app.services.mitre_auto_service import auto_map_case, auto_map_all

router = APIRouter(
    prefix="/mitre",
    tags=["MITRE ATT&CK"]
)


@router.get("/auto/case/{case_id}")
def auto_mitre_for_case(
    case_id: int,
    db: Session = Depends(get_db),
):
    """Auto-derived ATT&CK suggestions for one case — no manual typing needed."""
    return auto_map_case(db, case_id)


@router.get("/auto/all")
def auto_mitre_all(
    db: Session = Depends(get_db),
):
    """Auto-derived ATT&CK suggestions across every case."""
    return auto_map_all(db)


@router.post("/")
def create_mapping(
    mapping: MitreCreate,
    db: Session = Depends(get_db)
):

    case = db.query(Case).filter(
        Case.id == mapping.case_id
    ).first()

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    mitre = MitreMapping(
        case_id=mapping.case_id,
        technique_id=mapping.technique_id,
        technique_name=mapping.technique_name,
        tactic=mapping.tactic
    )

    db.add(mitre)
    db.commit()
    db.refresh(mitre)

    return mitre


@router.get(
    "/",
    response_model=list[MitreResponse]
)
def get_mappings(
    db: Session = Depends(get_db)
):
    return db.query(MitreMapping).all()


@router.get(
    "/case/{case_id}",
    response_model=list[MitreResponse]
)
def get_case_mappings(
    case_id: int,
    db: Session = Depends(get_db)
):
    return db.query(MitreMapping).filter(
        MitreMapping.case_id == case_id
    ).all()


@router.delete("/{mapping_id}")
def delete_mapping(
    mapping_id: int,
    db: Session = Depends(get_db)
):

    mapping = db.query(
        MitreMapping
    ).filter(
        MitreMapping.id == mapping_id
    ).first()

    if not mapping:
        raise HTTPException(
            status_code=404,
            detail="Mapping not found"
        )

    db.delete(mapping)
    db.commit()

    return {
        "message": "Mapping deleted"
    }