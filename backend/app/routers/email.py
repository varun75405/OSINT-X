from fastapi import APIRouter
from app.schemas.email import EmailRequest

import dns.resolver

router = APIRouter(
prefix="/email",
tags=["Email Intelligence"]
)

FREE_PROVIDERS = [
"gmail.com",
"outlook.com",
"hotmail.com",
"live.com",
"yahoo.com",
"icloud.com",
"proton.me",
"protonmail.com"
]

@router.post("/analyze")
def analyze_email(request: EmailRequest):
    email = request.email.strip()

    if "@" not in email:
        return {
            "error": "Invalid email address"
        }

    domain = email.split("@")[1].lower()

    result = {
        "email": email,
        "domain": domain,

        "provider_type": (
            "Free Provider"
            if domain in FREE_PROVIDERS
            else "Corporate / Educational"
        ),

        "mx_records": [],

        "spf_present": False,
        "dmarc_present": False,

        "security_score": 0,
        "risk_rating": "Unknown"
    }

    # MX RECORDS
    try:

        mx_records = dns.resolver.resolve(
            domain,
            "MX"
        )

        result["mx_records"] = [
            str(record.exchange)
            for record in mx_records
        ]

    except Exception:
        pass

    # SPF
    try:

        txt_records = dns.resolver.resolve(
            domain,
            "TXT"
        )

        for record in txt_records:

            text = str(record)

            if "v=spf1" in text.lower():

                result["spf_present"] = True
                break

    except Exception:
        pass

    # DMARC
    try:

        dns.resolver.resolve(
            f"_dmarc.{domain}",
            "TXT"
        )

        result["dmarc_present"] = True

    except Exception:
        pass

    score = 0

    score = 0

    if result["mx_records"]:
        score += 35

    if result["spf_present"]:
        score += 35

    if result["dmarc_present"]:
        score += 30

    # Corporate domains get extra trust
    if result["provider_type"] == "Corporate / Educational":
        score += 10

    score = min(score, 100)

    result["security_score"] = score

    if score >= 90:
        result["risk_rating"] = "Low"

    elif score >= 40:
        result["risk_rating"] = "Medium"

    else:
        result["risk_rating"] = "High"

    return result
