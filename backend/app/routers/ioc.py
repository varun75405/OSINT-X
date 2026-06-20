from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ioc import IOC

router = APIRouter(
    prefix="/ioc",
    tags=["IOC"]
)


@router.get("/")
def get_iocs(
    db: Session = Depends(get_db)
):
    return (
        db.query(IOC)
        .order_by(IOC.id.desc())
        .all()
    )


@router.post("/")
def create_ioc(
    data: dict,
    db: Session = Depends(get_db)
):
    new_ioc = IOC(
        case_id=data["case_id"],
        ioc_type=data["ioc_type"],
        value=data["value"],
        severity=data.get("severity", "Medium")
    )

    db.add(new_ioc)
    db.commit()
    db.refresh(new_ioc)

    return new_ioc


@router.get("/{ioc_id}")
def get_ioc(
    ioc_id: int,
    db: Session = Depends(get_db)
):
    ioc = (
        db.query(IOC)
        .filter(IOC.id == ioc_id)
        .first()
    )

    if not ioc:
        raise HTTPException(
            status_code=404,
            detail="IOC not found"
        )

    return ioc


@router.get("/case/{case_id}")
def get_case_iocs(
    case_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(IOC)
        .filter(IOC.case_id == case_id)
        .order_by(IOC.id.desc())
        .all()
    )


@router.put("/{ioc_id}")
def update_ioc(
    ioc_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    ioc = (
        db.query(IOC)
        .filter(IOC.id == ioc_id)
        .first()
    )

    if not ioc:
        raise HTTPException(
            status_code=404,
            detail="IOC not found"
        )

    ioc.case_id = data.get("case_id", ioc.case_id)
    ioc.ioc_type = data.get("ioc_type", ioc.ioc_type)
    ioc.value = data.get("value", ioc.value)
    ioc.severity = data.get("severity", ioc.severity)

    db.commit()
    db.refresh(ioc)

    return ioc


@router.delete("/{ioc_id}")
def delete_ioc(
    ioc_id: int,
    db: Session = Depends(get_db)
):
    ioc = (
        db.query(IOC)
        .filter(IOC.id == ioc_id)
        .first()
    )

    if not ioc:
        raise HTTPException(
            status_code=404,
            detail="IOC not found"
        )

    db.delete(ioc)
    db.commit()

    return {
        "message": "IOC deleted"
    }