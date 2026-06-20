from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from datetime import datetime

from app.core.database import Base


class IOC(Base):
    __tablename__ = "iocs"

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

    ioc_type = Column(
        String,
        nullable=False
    )

    value = Column(
        String,
        nullable=False
    )

    severity = Column(
        String,
        default="Medium"
    )

    # NEW: needed for "Active IOCs +18% from last week" delta
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )