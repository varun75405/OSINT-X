from pydantic import BaseModel


class IOCCreate(BaseModel):
    case_id: int
    ioc_type: str
    value: str
    severity: str = "Medium"


class IOCResponse(BaseModel):
    id: int
    case_id: int
    ioc_type: str
    value: str
    severity: str

    class Config:
        from_attributes = True