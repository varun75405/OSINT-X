from fastapi import APIRouter
from app.schemas.domain import DomainRequest

import whois
import dns.resolver
from datetime import datetime

router = APIRouter(
    prefix="/domain",
    tags=["Domain Intelligence"]
)


def format_date(value):
    if value is None:
        return None

    if isinstance(value, list):
        value = value[0]

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")

    return str(value)


@router.post("/lookup")
def domain_lookup(request: DomainRequest):

    domain = request.domain.strip()

    result = {
        "domain": domain,
        "whois": {},
        "dns": {},
        "risk_score": 0
    }

    try:

        w = whois.whois(domain)

        result["whois"] = {
            "registrar": str(w.registrar) if w.registrar else "Unknown",
            "created_date": format_date(w.creation_date),
            "expiration_date": format_date(w.expiration_date),
            "updated_date": format_date(w.updated_date)
        }

    except Exception as e:

        result["whois_error"] = str(e)

    try:

        a_records = dns.resolver.resolve(domain, "A")

        result["dns"]["a_records"] = [
            str(record)
            for record in a_records
        ]

    except Exception as e:

        result["dns_A_error"] = str(e)

    try:

        mx_records = dns.resolver.resolve(domain, "MX")

        result["dns"]["mx_records"] = [
            str(record.exchange)
            for record in mx_records
        ]

    except Exception as e:

        result["dns_MX_error"] = str(e)

    try:

        ns_records = dns.resolver.resolve(domain, "NS")

        result["dns"]["name_servers"] = [
            str(record)
            for record in ns_records
        ]

    except Exception as e:

        result["dns_NS_error"] = str(e)

    score = 0

    if result["dns"].get("a_records"):
        score += 30

    if result["dns"].get("mx_records"):
        score += 20

    if result["dns"].get("name_servers"):
        score += 20

    if result.get("whois"):
        score += 30

    result["risk_score"] = score

    return result