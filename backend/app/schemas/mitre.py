from pydantic import BaseModel


class MitreCreate(BaseModel):
    case_id: int
    technique_id: str
    technique_name: str
    tactic: str


class MitreResponse(BaseModel):
    id: int
    case_id: int
    technique_id: str
    technique_name: str
    tactic: str

    class Config:
        from_attributes = True