"""
MITRE ATT&CK Auto-Mapping
==========================
Instead of manually typing technique_id/name/tactic every time (the current
MITRE.jsx form), this derives mappings automatically from:
  - IOC types present on the case (ip -> C2, hash -> malware, etc.)
  - Keywords in case title/description (phishing, ransomware, brute force...)

Manual entry via POST /mitre/ still works and is preserved untouched —
this only ADDS an auto-suggestion layer.
"""
from sqlalchemy.orm import Session
from typing import List, Dict

from app.models.case import Case
from app.models.ioc import IOC

# keyword/type -> ATT&CK techniques
ATTACK_RULES = {
    "ip": [{"technique_id": "T1071", "technique_name": "Application Layer Protocol", "tactic": "Command and Control"}],
    "domain": [{"technique_id": "T1583", "technique_name": "Acquire Infrastructure", "tactic": "Resource Development"}],
    "hash": [{"technique_id": "T1105", "technique_name": "Ingress Tool Transfer", "tactic": "Command and Control"}],
    "email": [{"technique_id": "T1566", "technique_name": "Phishing", "tactic": "Initial Access"}],
    "phishing": [{"technique_id": "T1566", "technique_name": "Phishing", "tactic": "Initial Access"}],
    "ransomware": [{"technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "tactic": "Impact"}],
    "brute": [{"technique_id": "T1110", "technique_name": "Brute Force", "tactic": "Credential Access"}],
    "tor": [{"technique_id": "T1090", "technique_name": "Proxy", "tactic": "Command and Control"}],
    "exfilt": [{"technique_id": "T1041", "technique_name": "Exfiltration Over C2 Channel", "tactic": "Exfiltration"}],
    "lateral": [{"technique_id": "T1021", "technique_name": "Remote Services", "tactic": "Lateral Movement"}],
}


def auto_map_case(db: Session, case_id: int) -> List[Dict]:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return []

    iocs = db.query(IOC).filter(IOC.case_id == case_id).all()
    blob = f"{case.title} {case.description}".lower()

    seen_ids = set()
    suggestions = []

    # From IOC types present
    for ioc in iocs:
        key = (ioc.ioc_type or "").lower()
        for rule in ATTACK_RULES.get(key, []):
            if rule["technique_id"] not in seen_ids:
                seen_ids.add(rule["technique_id"])
                suggestions.append({**rule, "case_id": case_id, "source": f"ioc:{ioc.ioc_type}"})

    # From keywords in title/description
    for keyword, rules in ATTACK_RULES.items():
        if keyword in blob:
            for rule in rules:
                if rule["technique_id"] not in seen_ids:
                    seen_ids.add(rule["technique_id"])
                    suggestions.append({**rule, "case_id": case_id, "source": f"keyword:{keyword}"})

    if not suggestions:
        suggestions.append({
            "technique_id": "T1583", "technique_name": "Acquire Infrastructure",
            "tactic": "Resource Development", "case_id": case_id, "source": "default",
        })

    return suggestions


def auto_map_all(db: Session) -> List[Dict]:
    cases = db.query(Case).all()
    out = []
    for c in cases:
        out.extend(auto_map_case(db, c.id))
    return out