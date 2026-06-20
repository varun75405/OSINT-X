from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.case import Case
from app.models.ioc import IOC
from app.models.timeline import Timeline
from app.models.mitre import MitreMapping

from app.services import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db)
):
    """Kept exactly as-is for backward compatibility with existing pages."""
    total_cases = db.query(Case).count()
    open_cases = db.query(Case).filter(Case.status == "Open").count()
    total_iocs = db.query(IOC).count()
    high_iocs = db.query(IOC).filter(IOC.severity == "High").count()
    total_timeline_events = db.query(Timeline).count()
    total_mitre = db.query(MitreMapping).count()

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "total_iocs": total_iocs,
        "high_severity_iocs": high_iocs,
        "timeline_events": total_timeline_events,
        "mitre_mappings": total_mitre,
    }


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
):
    """NEW: the 6 KPI cards with sparkline + week-over-week delta."""
    return dashboard_service.get_summary_cards(db)


@router.get("/trend")
def dashboard_trend(
    days: int = 7,
    db: Session = Depends(get_db),
):
    """NEW: line chart data for 'Incident Trend'."""
    return dashboard_service.get_incident_trend(db, days)


@router.get("/ioc-distribution")
def ioc_distribution(
    db: Session = Depends(get_db),
):
    """NEW: donut chart — IOC severity breakdown."""
    return dashboard_service.get_ioc_severity_distribution(db)


@router.get("/ioc-types")
def ioc_types(
    db: Session = Depends(get_db),
):
    """NEW: donut chart — IOC type breakdown (Top IOC Types)."""
    return dashboard_service.get_ioc_type_distribution(db)


@router.get("/mitre-coverage")
def mitre_coverage(
    db: Session = Depends(get_db),
):
    """NEW: donut chart — tactic/technique coverage."""
    return dashboard_service.get_mitre_coverage(db)


@router.get("/active-investigations")
def active_investigations(
    db: Session = Depends(get_db),
):
    """NEW: table data for 'Active Investigations'."""
    return dashboard_service.get_active_investigations(db)


@router.get("/recent-alerts")
def recent_alerts(
    db: Session = Depends(get_db),
):
    """NEW: list data for 'Recent Alerts'."""
    return dashboard_service.get_recent_alerts(db)