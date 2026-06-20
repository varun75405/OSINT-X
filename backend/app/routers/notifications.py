from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.timeline import Timeline
from app.models.ioc import IOC
from app.models.case import Case
from app.services.correlation_service import get_all_correlations

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
):
    """
    No dedicated notifications table needed — this derives a live feed from:
      - recent timeline events
      - newly added CRITICAL/High severity IOCs
      - fresh correlations (2+ cases sharing an indicator)
    """
    notifications = []

    recent_events = db.query(Timeline).order_by(Timeline.timestamp.desc()).limit(5).all()
    for e in recent_events:
        notifications.append({
            "type": "timeline",
            "severity": "info",
            "message": f"Case #{e.case_id}: {e.event}",
            "timestamp": e.timestamp,
        })

    high_iocs = db.query(IOC).filter(IOC.severity == "High").order_by(IOC.id.desc()).limit(5).all()
    for ioc in high_iocs:
        notifications.append({
            "type": "ioc",
            "severity": "high",
            "message": f"High severity IOC added: {ioc.value} ({ioc.ioc_type}) on Case #{ioc.case_id}",
            "timestamp": None,
        })

    correlations = get_all_correlations(db)
    for corr in correlations[:5]:
        notifications.append({
            "type": "correlation",
            "severity": "critical" if corr["confidence"] >= 70 else "medium",
            "message": f"Correlation found: '{corr['value']}' links {corr['case_count']} cases (confidence {corr['confidence']}%)",
            "timestamp": None,
        })

    notifications.sort(key=lambda n: n["timestamp"] or "", reverse=True)
    return {"notifications": notifications, "unread_count": len(notifications)}