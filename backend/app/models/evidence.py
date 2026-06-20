from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger
from datetime import datetime

from app.core.database import Base


class Evidence(Base):
    """
    Evidence is now a real DB row linked to a case, not just a file on disk.
    This is what was missing: Evidence-Case Relationships.
    """
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    filename = Column(String, nullable=False)        # name on disk (timestamped)
    original_filename = Column(String, nullable=False)
    extension = Column(String, nullable=True)
    size = Column(BigInteger, default=0)
    sha256_hash = Column(String(64), nullable=True, index=True)

    uploaded_at = Column(DateTime, default=datetime.utcnow)