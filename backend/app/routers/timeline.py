from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.timeline import Timeline
from app.models.case import Case

from app.schemas.timeline import (
    TimelineCreate,
    TimelineResponse
)

router = APIRouter(
    prefix="/timeline",
    tags=["Timeline"]
)


@router.post("/")
def create_event(
    timeline: TimelineCreate,
    db: Session = Depends(get_db)
):

    case = db.query(Case).filter(
        Case.id == timeline.case_id
    ).first()

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    event = Timeline(
        case_id=timeline.case_id,
        event=timeline.event,
        event_type=timeline.event_type
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.get(
    "/",
    response_model=list[TimelineResponse]
)
def get_timeline(
    db: Session = Depends(get_db)
):
    return db.query(Timeline).all()


@router.get(
    "/case/{case_id}",
    response_model=list[TimelineResponse]
)
def get_case_timeline(
    case_id: int,
    db: Session = Depends(get_db)
):

    return db.query(Timeline).filter(
        Timeline.case_id == case_id
    ).all()


@router.delete("/{timeline_id}")
def delete_timeline(
    timeline_id: int,
    db: Session = Depends(get_db)
):

    timeline = db.query(Timeline).filter(
        Timeline.id == timeline_id
    ).first()

    if not timeline:
        raise HTTPException(
            status_code=404,
            detail="Timeline event not found"
        )

    db.delete(timeline)
    db.commit()

    return {
        "message": "Timeline event deleted"
    }