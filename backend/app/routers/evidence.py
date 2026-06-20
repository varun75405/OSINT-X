from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import os
import hashlib

from app.core.database import get_db
from app.models.evidence import Evidence

router = APIRouter(prefix="/evidence", tags=["Evidence"])

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    case_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    content = await file.read()
    sha256 = hashlib.sha256(content).hexdigest()

    safe_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_name)
    with open(filepath, "wb") as f:
        f.write(content)

    ev = Evidence(
        case_id=case_id,
        uploaded_by=None,
        filename=safe_name,
        original_filename=file.filename,
        extension=os.path.splitext(file.filename)[1],
        size=len(content),
        sha256_hash=sha256,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    return {
        "id": ev.id,
        "filename": ev.original_filename,
        "size": ev.size,
        "extension": ev.extension,
        "sha256_hash": ev.sha256_hash,
        "case_id": ev.case_id,
    }


@router.get("/")
def list_evidence(
    db: Session = Depends(get_db),
):
    rows = db.query(Evidence).order_by(Evidence.uploaded_at.desc()).all()
    return [
        {
            "id": e.id, "filename": e.original_filename, "size": e.size,
            "extension": e.extension, "sha256_hash": e.sha256_hash,
            "case_id": e.case_id, "uploaded_at": e.uploaded_at,
        }
        for e in rows
    ]


@router.get("/case/{case_id}")
def list_evidence_for_case(
    case_id: int,
    db: Session = Depends(get_db),
):
    """This is the missing Evidence-Case relationship view used on CaseDetails."""
    rows = db.query(Evidence).filter(Evidence.case_id == case_id).order_by(Evidence.uploaded_at.desc()).all()
    return [
        {
            "id": e.id, "filename": e.original_filename, "size": e.size,
            "extension": e.extension, "sha256_hash": e.sha256_hash,
            "uploaded_at": e.uploaded_at,
        }
        for e in rows
    ]


@router.get("/{evidence_id}/download")
def download_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    path = os.path.join(UPLOAD_DIR, ev.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(path=path, filename=ev.original_filename)


@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")
    path = os.path.join(UPLOAD_DIR, ev.filename)
    if os.path.exists(path):
        os.remove(path)
    db.delete(ev)
    db.commit()
    return {"message": "Evidence deleted"}