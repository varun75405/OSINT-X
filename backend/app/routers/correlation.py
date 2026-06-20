from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import correlation_service

router = APIRouter(prefix="/correlation", tags=["Correlation"])


@router.get("/")
def all_correlations(
    db: Session = Depends(get_db),
):
    """All IOCs shared across 2+ cases, sorted by confidence score."""
    return correlation_service.get_all_correlations(db)


@router.get("/case/{case_id}")
def case_correlations(
    case_id: int,
    db: Session = Depends(get_db),
):
    """Correlations scoped to one case."""
    return correlation_service.get_case_correlations(db, case_id)


@router.get("/clusters")
def threat_clusters(
    db: Session = Depends(get_db),
):
    """Threat actor clusters — cases grouped by shared infrastructure."""
    return correlation_service.cluster_threat_actors(db)