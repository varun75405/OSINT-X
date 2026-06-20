from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from datetime import datetime

from app.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    priority = Column(
        String,
        default="Medium"
    )

    status = Column(
        String,
        default="Open"
    )

    # NEW: needed for "Incident Trend" sparkline / week-over-week deltas
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )