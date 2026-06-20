from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime

from datetime import datetime

from app.core.database import Base


class Timeline(Base):
    __tablename__ = "timeline"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    case_id = Column(
        Integer,
        ForeignKey("cases.id"),
        nullable=False
    )

    event = Column(
        String,
        nullable=False
    )

    event_type = Column(
        String,
        nullable=False
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )