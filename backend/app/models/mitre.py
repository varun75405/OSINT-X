from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey

from app.core.database import Base


class MitreMapping(Base):
    __tablename__ = "mitre_mappings"

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

    technique_id = Column(
        String,
        nullable=False
    )

    technique_name = Column(
        String,
        nullable=False
    )

    tactic = Column(
        String,
        nullable=False
    )