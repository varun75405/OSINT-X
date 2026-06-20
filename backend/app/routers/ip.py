from fastapi import APIRouter
from app.schemas.ip import IPRequest

import socket
import requests

router = APIRouter(
    prefix="/ip",
    tags=["IP Intelligence"]
)


@router.post("/lookup")
def ip_lookup(request: IPRequest):

    ip = request.ip.strip()

    result = {
        "ip": ip
    }

    try:

        response = requests.get(
            f"http://ip-api.com/json/{ip}",
            timeout=10
        )

        data = response.json()

        result.update({
            "country": data.get("country"),
            "region": data.get("regionName"),
            "city": data.get("city"),
            "isp": data.get("isp"),
            "organization": data.get("org"),
            "asn": data.get("as"),
            "latitude": data.get("lat"),
            "longitude": data.get("lon"),
            "timezone": data.get("timezone"),
            "threat_level": "Low"
        })

    except Exception as e:

        result["geo_error"] = str(e)

    try:

        hostname = socket.gethostbyaddr(ip)[0]

        result["reverse_dns"] = hostname

    except Exception as e:

        result["reverse_dns_error"] = str(e)

    return result