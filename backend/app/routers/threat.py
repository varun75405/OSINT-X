from fastapi import APIRouter

from app.schemas.threat import ThreatRequest

import requests

router = APIRouter(
    prefix="/threat",
    tags=["Threat Intelligence"]
)


@router.post("/analyze")
def analyze_indicator(
    request: ThreatRequest
):

    indicator = request.indicator

    result = {
        "indicator": indicator
    }

    try:

        response = requests.get(
            f"https://otx.alienvault.com/api/v1/indicators/domain/{indicator}/general",
            timeout=10
        )

        if response.status_code == 200:

            data = response.json()

            pulse_count = len(
                data.get("pulse_info", {}).get("pulses", [])
            )

            result["otx_pulses"] = pulse_count

            result["reputation"] = (
                "Suspicious"
                if pulse_count > 0
                else "No Known Threat"
            )

        else:

            result["reputation"] = "Unknown"

    except Exception as e:

        result["error"] = str(e)

    return result