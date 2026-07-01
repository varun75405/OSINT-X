from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base
from app.core.database import engine

from app.models.user import User
from app.models.case import Case
from app.models.ioc import IOC
from app.models.timeline import Timeline
from app.models.mitre import MitreMapping
from app.models.evidence import Evidence  # NEW: real evidence table

from app.routers.auth import router as auth_router
from app.routers.case import router as case_router
from app.routers.domain import router as domain_router
from app.routers.ip import router as ip_router
from app.routers.email import router as email_router
from app.routers.evidence import router as evidence_router
from app.routers.ioc import router as ioc_router
from app.routers.timeline import router as timeline_router
from app.routers.mitre import router as mitre_router
from app.routers.dashboard import router as dashboard_router
from app.routers.threat import router as threat_router
from app.routers.report import router as report_router
from app.routers.correlation import router as correlation_router       # NEW
from app.routers.search import router as search_router                 # NEW
from app.routers.notifications import router as notifications_router   # NEW

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OSINT-X",
    version="1.1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://osint-x-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(case_router)
app.include_router(domain_router)
app.include_router(ip_router)
app.include_router(email_router)
app.include_router(evidence_router)
app.include_router(ioc_router)
app.include_router(timeline_router)
app.include_router(mitre_router)
app.include_router(dashboard_router)
app.include_router(threat_router)
app.include_router(report_router)
app.include_router(correlation_router)
app.include_router(search_router)
app.include_router(notifications_router)

# NOTE: the old app/routers/compat.py is deleted — it imported models
# (app.models.indicator, app.services.case_service) that never existed
# in this codebase and was always dead code behind ENABLE_COMPAT=0.


@app.get("/")
def root():
    return {"message": "OSINT-X API Running", "version": "1.1.0"}


@app.get("/health")
def health():
    return {"status": "ok"}