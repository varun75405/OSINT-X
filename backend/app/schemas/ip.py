from pydantic import BaseModel


class IPRequest(BaseModel):
    ip: str