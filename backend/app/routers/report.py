from fastapi import APIRouter
from fastapi import Depends
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import getSampleStyleSheet

from app.core.database import get_db

from app.models.case import Case
from app.models.ioc import IOC
from app.models.timeline import Timeline
from app.models.mitre import MitreMapping

router = APIRouter(
    prefix="/report",
    tags=["Reports"]
)


@router.get("/case/{case_id}")
def generate_report(
    case_id: int,
    db: Session = Depends(get_db)
):

    case = db.query(Case).filter(
        Case.id == case_id
    ).first()

    if not case:
        return {
            "error": "Case not found"
        }

    iocs = db.query(IOC).filter(
        IOC.case_id == case_id
    ).all()

    timeline = db.query(Timeline).filter(
        Timeline.case_id == case_id
    ).all()

    mitre = db.query(MitreMapping).filter(
        MitreMapping.case_id == case_id
    ).all()

    filename = f"case_{case_id}_report.pdf"

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    content = []

    content.append(
        Paragraph(
            f"OSINT-X Investigation Report",
            styles["Title"]
        )
    )

    content.append(Spacer(1, 12))

    content.append(
        Paragraph(
            f"Case: {case.title}",
            styles["Heading2"]
        )
    )

    content.append(
        Paragraph(
            f"Description: {case.description}",
            styles["Normal"]
        )
    )

    content.append(
        Paragraph(
            f"Priority: {case.priority}",
            styles["Normal"]
        )
    )

    content.append(Spacer(1, 12))

    content.append(
        Paragraph(
            "Indicators of Compromise",
            styles["Heading2"]
        )
    )

    for ioc in iocs:

        content.append(
            Paragraph(
                f"{ioc.ioc_type}: {ioc.value} ({ioc.severity})",
                styles["Normal"]
            )
        )

    content.append(Spacer(1, 12))

    content.append(
        Paragraph(
            "Timeline",
            styles["Heading2"]
        )
    )

    for event in timeline:

        content.append(
            Paragraph(
                f"{event.timestamp} - {event.event}",
                styles["Normal"]
            )
        )

    content.append(Spacer(1, 12))

    content.append(
        Paragraph(
            "MITRE ATT&CK",
            styles["Heading2"]
        )
    )

    for item in mitre:

        content.append(
            Paragraph(
                f"{item.technique_id} - {item.technique_name}",
                styles["Normal"]
            )
        )

    doc.build(content)

    return FileResponse(
        filename,
        media_type="application/pdf",
        filename=filename
    )