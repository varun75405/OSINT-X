from pydantic import BaseModel
from datetime import datetime


class TimelineCreate(BaseModel):
    case_id: int
    event: str
    event_type: str


class TimelineResponse(BaseModel):
    id: int
    case_id: int
    event: str
    event_type: str
    timestamp: datetime

    class Config:
        from_attributes = True