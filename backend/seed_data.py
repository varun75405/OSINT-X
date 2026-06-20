"""
Seed script for OSINT-X — populates the database with realistic investigation data
so every feature (Dashboard, Cases, IOCs, Timeline, MITRE, Evidence, Correlations,
Reports, Search, Notifications) has meaningful content to display.

Run:  python seed_data.py
"""

import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import random
import hashlib

from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.case import Case
from app.models.ioc import IOC
from app.models.timeline import Timeline
from app.models.mitre import MitreMapping
from app.models.evidence import Evidence
from app.core.security import hash_password

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Helpers ──────────────────────────────────────────────────────
now = datetime.utcnow()

def days_ago(n):
    return now - timedelta(days=n, hours=random.randint(0, 23), minutes=random.randint(0, 59))

# ── 1. Seed a default user ──────────────────────────────────────
existing_user = db.query(User).filter(User.email == "admin@osintx.com").first()
if not existing_user:
    user = User(
        username="admin",
        email="admin@osintx.com",
        hashed_password=hash_password("admin123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("[+] Created admin user")
else:
    user = existing_user
    print("[=] Admin user already exists")

# ── 2. Seed Cases ────────────────────────────────────────────────
CASES = [
    {
        "title": "APT-29 Phishing Campaign",
        "description": "Sophisticated spear-phishing campaign targeting government agencies. "
                       "Multiple malicious Word documents with macro-enabled payloads detected. "
                       "Initial access vector appears to be compromised email accounts.",
        "priority": "Critical",
        "status": "Open",
        "created_at": days_ago(6),
    },
    {
        "title": "Ransomware Incident — LockBit 3.0",
        "description": "LockBit 3.0 ransomware detected on 12 endpoints in the finance department. "
                       "Lateral movement observed via RDP and PsExec. Data exfiltration suspected "
                       "prior to encryption. Ransom note demands $500K in BTC.",
        "priority": "Critical",
        "status": "In Progress",
        "created_at": days_ago(5),
    },
    {
        "title": "Credential Stuffing on Customer Portal",
        "description": "Automated credential stuffing attack detected against customer-facing portal. "
                       "Over 50,000 login attempts from 200+ unique IPs in 2 hours. "
                       "Multiple successful logins detected from leaked credential databases.",
        "priority": "High",
        "status": "Open",
        "created_at": days_ago(4),
    },
    {
        "title": "Insider Threat — Data Exfiltration",
        "description": "Anomalous data transfer pattern detected from employee workstation. "
                       "Large volumes of sensitive files uploaded to personal cloud storage. "
                       "USB device usage also flagged by DLP solution.",
        "priority": "High",
        "status": "In Progress",
        "created_at": days_ago(3),
    },
    {
        "title": "Supply Chain Compromise — NPM Package",
        "description": "Malicious code discovered in widely-used NPM dependency 'event-stream-utils'. "
                       "Package was backdoored to harvest environment variables and API keys. "
                       "12 internal microservices confirmed affected.",
        "priority": "Critical",
        "status": "Open",
        "created_at": days_ago(2),
    },
    {
        "title": "DNS Tunneling Detected",
        "description": "Unusual DNS query patterns suggesting DNS tunneling for C2 communication. "
                       "Encoded data payloads detected in TXT record queries to suspicious domains. "
                       "Workstation belongs to R&D department.",
        "priority": "Medium",
        "status": "Open",
        "created_at": days_ago(1),
    },
    {
        "title": "Cryptojacking on Cloud Infrastructure",
        "description": "Unauthorized cryptocurrency mining processes detected on AWS EC2 instances. "
                       "Compromised IAM credentials used to spin up GPU instances in us-east-1. "
                       "Estimated $8,000 in unauthorized compute charges.",
        "priority": "Medium",
        "status": "Closed",
        "created_at": days_ago(7),
    },
    {
        "title": "Watering Hole Attack — Tech Blog",
        "description": "Company tech blog compromised to serve drive-by download exploits. "
                       "Visitors redirected through iframe injection to exploit kit. "
                       "CVE-2024-21412 Windows SmartScreen bypass confirmed in payload.",
        "priority": "High",
        "status": "Closed",
        "created_at": days_ago(5),
    },
]

case_ids = []
# Clear existing data
db.query(Evidence).delete()
db.query(MitreMapping).delete()
db.query(Timeline).delete()
db.query(IOC).delete()
db.query(Case).delete()
db.commit()
print("[*] Cleared existing data")

for c in CASES:
    case = Case(**c)
    db.add(case)
    db.commit()
    db.refresh(case)
    case_ids.append(case.id)
    print(f"[+] Case #{case.id}: {case.title}")

# ── 3. Seed IOCs ────────────────────────────────────────────────
# Spread IOCs across cases, with some shared between cases to trigger correlations
IOCS = [
    # Case 1: APT-29 Phishing
    {"case_id": case_ids[0], "ioc_type": "domain", "value": "secure-update-srv.com", "severity": "Critical", "created_at": days_ago(6)},
    {"case_id": case_ids[0], "ioc_type": "domain", "value": "microsft-auth.net", "severity": "High", "created_at": days_ago(6)},
    {"case_id": case_ids[0], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High", "created_at": days_ago(5)},
    {"case_id": case_ids[0], "ioc_type": "hash", "value": "a3f5b2c8d1e9f4a7b6c3d2e1f0a9b8c7", "severity": "Critical", "created_at": days_ago(5)},
    {"case_id": case_ids[0], "ioc_type": "email", "value": "hr-noreply@secure-update-srv.com", "severity": "Medium", "created_at": days_ago(5)},
    
    # Case 2: Ransomware LockBit
    {"case_id": case_ids[1], "ioc_type": "hash", "value": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9", "severity": "Critical", "created_at": days_ago(5)},
    {"case_id": case_ids[1], "ioc_type": "ip", "value": "91.215.85.142", "severity": "Critical", "created_at": days_ago(4)},
    {"case_id": case_ids[1], "ioc_type": "domain", "value": "lockbit-decryptor.onion", "severity": "High", "created_at": days_ago(4)},
    {"case_id": case_ids[1], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High", "created_at": days_ago(4)},  # Shared with Case 1!
    {"case_id": case_ids[1], "ioc_type": "hash", "value": "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", "severity": "High", "created_at": days_ago(3)},
    
    # Case 3: Credential Stuffing
    {"case_id": case_ids[2], "ioc_type": "ip", "value": "103.152.220.14", "severity": "High", "created_at": days_ago(4)},
    {"case_id": case_ids[2], "ioc_type": "ip", "value": "45.95.168.227", "severity": "High", "created_at": days_ago(4)},
    {"case_id": case_ids[2], "ioc_type": "ip", "value": "193.56.29.88", "severity": "Medium", "created_at": days_ago(3)},
    {"case_id": case_ids[2], "ioc_type": "domain", "value": "proxy-rotator.xyz", "severity": "Medium", "created_at": days_ago(3)},
    
    # Case 4: Insider Threat
    {"case_id": case_ids[3], "ioc_type": "domain", "value": "mega.nz", "severity": "Medium", "created_at": days_ago(3)},
    {"case_id": case_ids[3], "ioc_type": "domain", "value": "dropbox.com", "severity": "Low", "created_at": days_ago(3)},
    {"case_id": case_ids[3], "ioc_type": "ip", "value": "10.0.15.42", "severity": "Low", "created_at": days_ago(2)},
    
    # Case 5: Supply Chain
    {"case_id": case_ids[4], "ioc_type": "domain", "value": "npm-registry-mirror.com", "severity": "Critical", "created_at": days_ago(2)},
    {"case_id": case_ids[4], "ioc_type": "hash", "value": "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6", "severity": "Critical", "created_at": days_ago(2)},
    {"case_id": case_ids[4], "ioc_type": "ip", "value": "91.215.85.142", "severity": "High", "created_at": days_ago(1)},  # Shared with Case 2!
    {"case_id": case_ids[4], "ioc_type": "domain", "value": "secure-update-srv.com", "severity": "High", "created_at": days_ago(1)},  # Shared with Case 1!
    
    # Case 6: DNS Tunneling
    {"case_id": case_ids[5], "ioc_type": "domain", "value": "t1.dnstunnel.xyz", "severity": "High", "created_at": days_ago(1)},
    {"case_id": case_ids[5], "ioc_type": "domain", "value": "c2.dnstunnel.xyz", "severity": "High", "created_at": days_ago(1)},
    {"case_id": case_ids[5], "ioc_type": "ip", "value": "103.152.220.14", "severity": "Medium", "created_at": days_ago(0)},  # Shared with Case 3!
    
    # Case 7: Cryptojacking
    {"case_id": case_ids[6], "ioc_type": "ip", "value": "52.14.88.201", "severity": "Medium", "created_at": days_ago(7)},
    {"case_id": case_ids[6], "ioc_type": "domain", "value": "xmr-pool.minexmr.com", "severity": "Medium", "created_at": days_ago(7)},
    {"case_id": case_ids[6], "ioc_type": "hash", "value": "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", "severity": "Low", "created_at": days_ago(6)},
    
    # Case 8: Watering Hole
    {"case_id": case_ids[7], "ioc_type": "domain", "value": "exploit-kit-cdn.ru", "severity": "Critical", "created_at": days_ago(5)},
    {"case_id": case_ids[7], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High", "created_at": days_ago(5)},  # Shared with Cases 1 & 2!
    {"case_id": case_ids[7], "ioc_type": "hash", "value": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", "severity": "Critical", "created_at": days_ago(4)},
]

for ioc_data in IOCS:
    ioc = IOC(**ioc_data)
    db.add(ioc)
db.commit()
print(f"[+] Seeded {len(IOCS)} IOCs")

# ── 4. Seed Timeline Events ─────────────────────────────────────
TIMELINE = [
    # Case 1
    {"case_id": case_ids[0], "event": "Phishing email detected by email gateway", "event_type": "detection", "timestamp": days_ago(6)},
    {"case_id": case_ids[0], "event": "Malicious attachment opened by user john.doe", "event_type": "compromise", "timestamp": days_ago(6)},
    {"case_id": case_ids[0], "event": "Outbound C2 connection to secure-update-srv.com", "event_type": "network", "timestamp": days_ago(5)},
    {"case_id": case_ids[0], "event": "PowerShell encoded command executed", "event_type": "execution", "timestamp": days_ago(5)},
    {"case_id": case_ids[0], "event": "Credential dump from LSASS memory detected", "event_type": "credential_access", "timestamp": days_ago(4)},
    
    # Case 2
    {"case_id": case_ids[1], "event": "Unusual RDP connections from workstation WS-FIN-004", "event_type": "lateral_movement", "timestamp": days_ago(5)},
    {"case_id": case_ids[1], "event": "PsExec deployment detected across finance subnet", "event_type": "execution", "timestamp": days_ago(5)},
    {"case_id": case_ids[1], "event": "Large file transfer to external IP 91.215.85.142", "event_type": "exfiltration", "timestamp": days_ago(4)},
    {"case_id": case_ids[1], "event": "File encryption started on 12 endpoints", "event_type": "impact", "timestamp": days_ago(4)},
    {"case_id": case_ids[1], "event": "Ransom note README.txt dropped in all directories", "event_type": "impact", "timestamp": days_ago(4)},
    {"case_id": case_ids[1], "event": "Backup systems checked — offline backups intact", "event_type": "response", "timestamp": days_ago(3)},
    
    # Case 3
    {"case_id": case_ids[2], "event": "WAF alert: 50,000+ login attempts in 2 hours", "event_type": "detection", "timestamp": days_ago(4)},
    {"case_id": case_ids[2], "event": "312 successful logins from suspicious IPs", "event_type": "compromise", "timestamp": days_ago(4)},
    {"case_id": case_ids[2], "event": "Rate limiting and IP blocking implemented", "event_type": "response", "timestamp": days_ago(3)},
    {"case_id": case_ids[2], "event": "Forced password reset for 312 compromised accounts", "event_type": "response", "timestamp": days_ago(3)},
    
    # Case 4
    {"case_id": case_ids[3], "event": "DLP alert: 2.3 GB uploaded to mega.nz", "event_type": "exfiltration", "timestamp": days_ago(3)},
    {"case_id": case_ids[3], "event": "USB device connected — serial number logged", "event_type": "detection", "timestamp": days_ago(2)},
    {"case_id": case_ids[3], "event": "Employee access revoked pending investigation", "event_type": "response", "timestamp": days_ago(2)},
    
    # Case 5
    {"case_id": case_ids[4], "event": "Dependency audit flagged event-stream-utils v2.1.3", "event_type": "detection", "timestamp": days_ago(2)},
    {"case_id": case_ids[4], "event": "Malicious postinstall script identified", "event_type": "analysis", "timestamp": days_ago(2)},
    {"case_id": case_ids[4], "event": "12 microservices confirmed running backdoored package", "event_type": "compromise", "timestamp": days_ago(1)},
    {"case_id": case_ids[4], "event": "All API keys rotated; packages pinned to known good versions", "event_type": "response", "timestamp": days_ago(1)},
    
    # Case 6
    {"case_id": case_ids[5], "event": "Anomalous DNS TXT queries to t1.dnstunnel.xyz", "event_type": "detection", "timestamp": days_ago(1)},
    {"case_id": case_ids[5], "event": "Base64-encoded payloads extracted from DNS traffic", "event_type": "analysis", "timestamp": days_ago(0)},
    
    # Case 7
    {"case_id": case_ids[6], "event": "Spike in CPU usage on ec2 instances", "event_type": "detection", "timestamp": days_ago(7)},
    {"case_id": case_ids[6], "event": "XMRig binary found in /tmp on 4 instances", "event_type": "analysis", "timestamp": days_ago(7)},
    {"case_id": case_ids[6], "event": "Compromised IAM access key identified and revoked", "event_type": "response", "timestamp": days_ago(6)},
    {"case_id": case_ids[6], "event": "Instances terminated; MFA enforced for all IAM users", "event_type": "response", "timestamp": days_ago(6)},
    
    # Case 8
    {"case_id": case_ids[7], "event": "Google Safe Browsing flag on company blog URL", "event_type": "detection", "timestamp": days_ago(5)},
    {"case_id": case_ids[7], "event": "Iframe injection found in blog template header", "event_type": "analysis", "timestamp": days_ago(5)},
    {"case_id": case_ids[7], "event": "Exploit kit serving CVE-2024-21412 payload", "event_type": "compromise", "timestamp": days_ago(4)},
    {"case_id": case_ids[7], "event": "Blog taken offline; CMS credentials rotated", "event_type": "response", "timestamp": days_ago(4)},
]

for tl_data in TIMELINE:
    tl = Timeline(**tl_data)
    db.add(tl)
db.commit()
print(f"[+] Seeded {len(TIMELINE)} timeline events")

# ── 5. Seed MITRE ATT&CK Mappings ───────────────────────────────
MITRE = [
    # Case 1: APT-29
    {"case_id": case_ids[0], "technique_id": "T1566.001", "technique_name": "Spearphishing Attachment", "tactic": "Initial Access"},
    {"case_id": case_ids[0], "technique_id": "T1059.001", "technique_name": "PowerShell", "tactic": "Execution"},
    {"case_id": case_ids[0], "technique_id": "T1003.001", "technique_name": "LSASS Memory", "tactic": "Credential Access"},
    {"case_id": case_ids[0], "technique_id": "T1071.001", "technique_name": "Web Protocols", "tactic": "Command and Control"},
    
    # Case 2: Ransomware
    {"case_id": case_ids[1], "technique_id": "T1021.001", "technique_name": "Remote Desktop Protocol", "tactic": "Lateral Movement"},
    {"case_id": case_ids[1], "technique_id": "T1569.002", "technique_name": "Service Execution", "tactic": "Execution"},
    {"case_id": case_ids[1], "technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "tactic": "Impact"},
    {"case_id": case_ids[1], "technique_id": "T1048.003", "technique_name": "Exfiltration Over Unencrypted Protocol", "tactic": "Exfiltration"},
    {"case_id": case_ids[1], "technique_id": "T1490", "technique_name": "Inhibit System Recovery", "tactic": "Impact"},
    
    # Case 3: Credential Stuffing
    {"case_id": case_ids[2], "technique_id": "T1110.004", "technique_name": "Credential Stuffing", "tactic": "Credential Access"},
    {"case_id": case_ids[2], "technique_id": "T1078", "technique_name": "Valid Accounts", "tactic": "Initial Access"},
    
    # Case 4: Insider Threat
    {"case_id": case_ids[3], "technique_id": "T1567.002", "technique_name": "Exfiltration to Cloud Storage", "tactic": "Exfiltration"},
    {"case_id": case_ids[3], "technique_id": "T1052.001", "technique_name": "Exfiltration over USB", "tactic": "Exfiltration"},
    {"case_id": case_ids[3], "technique_id": "T1530", "technique_name": "Data from Cloud Storage", "tactic": "Collection"},
    
    # Case 5: Supply Chain
    {"case_id": case_ids[4], "technique_id": "T1195.002", "technique_name": "Compromise Software Supply Chain", "tactic": "Initial Access"},
    {"case_id": case_ids[4], "technique_id": "T1059.007", "technique_name": "JavaScript", "tactic": "Execution"},
    {"case_id": case_ids[4], "technique_id": "T1552.001", "technique_name": "Credentials In Files", "tactic": "Credential Access"},
    
    # Case 6: DNS Tunneling
    {"case_id": case_ids[5], "technique_id": "T1071.004", "technique_name": "DNS", "tactic": "Command and Control"},
    {"case_id": case_ids[5], "technique_id": "T1572", "technique_name": "Protocol Tunneling", "tactic": "Command and Control"},
    
    # Case 7: Cryptojacking
    {"case_id": case_ids[6], "technique_id": "T1496", "technique_name": "Resource Hijacking", "tactic": "Impact"},
    {"case_id": case_ids[6], "technique_id": "T1078.004", "technique_name": "Cloud Accounts", "tactic": "Initial Access"},
    
    # Case 8: Watering Hole
    {"case_id": case_ids[7], "technique_id": "T1189", "technique_name": "Drive-by Compromise", "tactic": "Initial Access"},
    {"case_id": case_ids[7], "technique_id": "T1203", "technique_name": "Exploitation for Client Execution", "tactic": "Execution"},
    {"case_id": case_ids[7], "technique_id": "T1059.007", "technique_name": "JavaScript", "tactic": "Execution"},
]

for m_data in MITRE:
    m = MitreMapping(**m_data)
    db.add(m)
db.commit()
print(f"[+] Seeded {len(MITRE)} MITRE ATT&CK mappings")

# ── 6. Seed Evidence records ─────────────────────────────────────
EVIDENCE = [
    {"case_id": case_ids[0], "filename": "phishing_email_sample.eml", "original_filename": "phishing_email_sample.eml", "extension": ".eml", "size": 45230, "sha256_hash": hashlib.sha256(b"phishing1").hexdigest()},
    {"case_id": case_ids[0], "filename": "malicious_macro.docm", "original_filename": "malicious_macro.docm", "extension": ".docm", "size": 128500, "sha256_hash": hashlib.sha256(b"macro1").hexdigest()},
    {"case_id": case_ids[1], "filename": "lockbit_ransom_note.txt", "original_filename": "README.txt", "extension": ".txt", "size": 2048, "sha256_hash": hashlib.sha256(b"ransom1").hexdigest()},
    {"case_id": case_ids[1], "filename": "encrypted_sample.lockbit", "original_filename": "quarterly_report.xlsx.lockbit", "extension": ".lockbit", "size": 892400, "sha256_hash": hashlib.sha256(b"lockbit1").hexdigest()},
    {"case_id": case_ids[2], "filename": "access_logs_portal.csv", "original_filename": "access_logs_2026-06.csv", "extension": ".csv", "size": 5432100, "sha256_hash": hashlib.sha256(b"logs1").hexdigest()},
    {"case_id": case_ids[3], "filename": "dlp_alert_report.pdf", "original_filename": "DLP_Alert_Report.pdf", "extension": ".pdf", "size": 234500, "sha256_hash": hashlib.sha256(b"dlp1").hexdigest()},
    {"case_id": case_ids[4], "filename": "package_json_diff.txt", "original_filename": "package-lock-diff.txt", "extension": ".txt", "size": 12300, "sha256_hash": hashlib.sha256(b"npm1").hexdigest()},
    {"case_id": case_ids[5], "filename": "dns_pcap_capture.pcap", "original_filename": "dns_tunnel_capture.pcap", "extension": ".pcap", "size": 3456000, "sha256_hash": hashlib.sha256(b"pcap1").hexdigest()},
    {"case_id": case_ids[6], "filename": "xmrig_binary.bin", "original_filename": "xmrig", "extension": ".bin", "size": 4567800, "sha256_hash": hashlib.sha256(b"xmrig1").hexdigest()},
    {"case_id": case_ids[7], "filename": "exploit_kit_payload.js", "original_filename": "injected_script.js", "extension": ".js", "size": 8900, "sha256_hash": hashlib.sha256(b"exploit1").hexdigest()},
]

for ev_data in EVIDENCE:
    ev = Evidence(uploaded_by=user.id, uploaded_at=days_ago(random.randint(0, 6)), **ev_data)
    db.add(ev)
db.commit()
print(f"[+] Seeded {len(EVIDENCE)} evidence records")

db.close()
print("\n✅ Database seeded successfully! All features should now have data.")
print("   - 8 Cases (mix of Open, In Progress, Closed)")
print(f"   - {len(IOCS)} IOCs (with shared indicators for correlations)")
print(f"   - {len(TIMELINE)} Timeline events")
print(f"   - {len(MITRE)} MITRE ATT&CK mappings")
print(f"   - {len(EVIDENCE)} Evidence files")
print("   - Correlations will auto-derive from shared IOCs")
