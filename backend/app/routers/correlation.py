from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services import correlation_service

router = APIRouter(prefix="/correlation", tags=["Correlation"])


@router.get("/")
def all_correlations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All IOCs shared across 2+ cases, sorted by confidence score."""
    return correlation_service.get_all_correlations(db)


@router.get("/case/{case_id}")
def case_correlations(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Correlations scoped to one case (same as /ioc/correlation/case/{id}, kept for clarity)."""
    return correlation_service.get_case_correlations(db, case_id)


@router.get("/clusters")
def threat_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Threat actor clusters — cases grouped by shared infrastructure."""
    return correlation_service.cluster_threat_actors(db)