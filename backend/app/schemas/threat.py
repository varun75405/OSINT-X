from pydantic import BaseModel


class ThreatRequest(BaseModel):
    indicator: str