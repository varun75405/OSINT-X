from pydantic import BaseModel


class EvidenceResponse(BaseModel):
    filename: str
    size: int
    extension: str