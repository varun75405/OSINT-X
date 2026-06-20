from pydantic import BaseModel


class CaseCreate(BaseModel):
    title: str
    description: str
    priority: str = "Medium"


class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    priority: str
    status: str

    class Config:
        from_attributes = True