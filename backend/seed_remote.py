"""
Remote seed script for OSINT-X production deployment.
Seeds data into the Render-hosted backend via API calls.

Run:  python seed_remote.py
"""

import requests
import random
from datetime import datetime, timedelta

# ── Config ───────────────────────────────────────────────────────
BASE_URL = "https://osint-x-h72j.onrender.com"

print(f"[*] Target: {BASE_URL}")
print("[*] Checking backend health...")

try:
    r = requests.get(f"{BASE_URL}/health", timeout=60)
    print(f"[+] Backend is up: {r.json()}")
except Exception as e:
    print(f"[!] Backend health check failed: {e}")
    print("[!] The Render instance may need to wake up. Try again in 1-2 minutes.")
    exit(1)

# ── 1. Register + Login to get JWT ──────────────────────────────
print("\n[*] Registering admin user...")
reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
    "username": "admin",
    "email": "admin@osintx.com",
    "password": "admin123"
}, timeout=30)
print(f"    Register: {reg_resp.status_code} - {reg_resp.text}")

print("[*] Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@osintx.com",
    "password": "admin123"
}, timeout=30)

if login_resp.status_code != 200:
    print(f"[!] Login failed: {login_resp.status_code} - {login_resp.text}")
    exit(1)

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"[+] Got JWT token")

# ── Helper ───────────────────────────────────────────────────────
now = datetime.utcnow()

def days_ago_str(n):
    dt = now - timedelta(days=n, hours=random.randint(0, 12))
    return dt.isoformat()

# ── 2. Seed Cases ────────────────────────────────────────────────
print("\n[*] Seeding cases...")
CASES = [
    {"title": "APT-29 Phishing Campaign", "description": "Sophisticated spear-phishing campaign targeting government agencies. Multiple malicious Word documents with macro-enabled payloads detected. Initial access vector appears to be compromised email accounts.", "priority": "Critical"},
    {"title": "Ransomware Incident - LockBit 3.0", "description": "LockBit 3.0 ransomware detected on 12 endpoints in the finance department. Lateral movement observed via RDP and PsExec. Data exfiltration suspected prior to encryption. Ransom note demands $500K in BTC.", "priority": "Critical"},
    {"title": "Credential Stuffing on Customer Portal", "description": "Automated credential stuffing attack detected against customer-facing portal. Over 50,000 login attempts from 200+ unique IPs in 2 hours. Multiple successful logins detected.", "priority": "High"},
    {"title": "Insider Threat - Data Exfiltration", "description": "Anomalous data transfer pattern detected from employee workstation. Large volumes of sensitive files uploaded to personal cloud storage. USB device usage also flagged by DLP solution.", "priority": "High"},
    {"title": "Supply Chain Compromise - NPM Package", "description": "Malicious code discovered in widely-used NPM dependency. Package was backdoored to harvest environment variables and API keys. 12 internal microservices confirmed affected.", "priority": "Critical"},
    {"title": "DNS Tunneling Detected", "description": "Unusual DNS query patterns suggesting DNS tunneling for C2 communication. Encoded data payloads detected in TXT record queries to suspicious domains.", "priority": "Medium"},
    {"title": "Cryptojacking on Cloud Infrastructure", "description": "Unauthorized cryptocurrency mining processes detected on AWS EC2 instances. Compromised IAM credentials used to spin up GPU instances. Estimated $8,000 in unauthorized charges.", "priority": "Medium"},
    {"title": "Watering Hole Attack - Tech Blog", "description": "Company tech blog compromised to serve drive-by download exploits. Visitors redirected through iframe injection to exploit kit. CVE-2024-21412 bypass confirmed.", "priority": "High"},
]

case_ids = []
for c in CASES:
    resp = requests.post(f"{BASE_URL}/cases/", json=c, headers=headers, timeout=30)
    if resp.status_code == 200:
        cid = resp.json()["id"]
        case_ids.append(cid)
        print(f"    [+] Case #{cid}: {c['title']}")
    else:
        print(f"    [!] Failed: {resp.status_code} - {resp.text}")
        # Try without auth
        resp2 = requests.post(f"{BASE_URL}/cases/", json=c, timeout=30)
        if resp2.status_code == 200:
            cid = resp2.json()["id"]
            case_ids.append(cid)
            print(f"    [+] Case #{cid}: {c['title']} (no-auth)")
        else:
            print(f"    [!] Also failed without auth: {resp2.status_code}")

if len(case_ids) < 8:
    print(f"\n[!] Only {len(case_ids)} cases created. Some features may be incomplete.")
    if len(case_ids) == 0:
        print("[!] No cases created. Exiting.")
        exit(1)

# ── 3. Seed IOCs ────────────────────────────────────────────────
print("\n[*] Seeding IOCs...")
# Build IOCs referencing created case IDs
# Some shared between cases to trigger correlations
IOCS = [
    # Case 1: APT-29
    {"case_id": case_ids[0], "ioc_type": "domain", "value": "secure-update-srv.com", "severity": "Critical"},
    {"case_id": case_ids[0], "ioc_type": "domain", "value": "microsft-auth.net", "severity": "High"},
    {"case_id": case_ids[0], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High"},
    {"case_id": case_ids[0], "ioc_type": "hash", "value": "a3f5b2c8d1e9f4a7b6c3d2e1f0a9b8c7", "severity": "Critical"},
    {"case_id": case_ids[0], "ioc_type": "email", "value": "hr-noreply@secure-update-srv.com", "severity": "Medium"},
]

if len(case_ids) > 1:
    IOCS += [
        {"case_id": case_ids[1], "ioc_type": "hash", "value": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9", "severity": "Critical"},
        {"case_id": case_ids[1], "ioc_type": "ip", "value": "91.215.85.142", "severity": "Critical"},
        {"case_id": case_ids[1], "ioc_type": "domain", "value": "lockbit-decryptor.onion", "severity": "High"},
        {"case_id": case_ids[1], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High"},  # Shared!
        {"case_id": case_ids[1], "ioc_type": "hash", "value": "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", "severity": "High"},
    ]

if len(case_ids) > 2:
    IOCS += [
        {"case_id": case_ids[2], "ioc_type": "ip", "value": "103.152.220.14", "severity": "High"},
        {"case_id": case_ids[2], "ioc_type": "ip", "value": "45.95.168.227", "severity": "High"},
        {"case_id": case_ids[2], "ioc_type": "ip", "value": "193.56.29.88", "severity": "Medium"},
        {"case_id": case_ids[2], "ioc_type": "domain", "value": "proxy-rotator.xyz", "severity": "Medium"},
    ]

if len(case_ids) > 3:
    IOCS += [
        {"case_id": case_ids[3], "ioc_type": "domain", "value": "mega.nz", "severity": "Medium"},
        {"case_id": case_ids[3], "ioc_type": "domain", "value": "dropbox.com", "severity": "Low"},
        {"case_id": case_ids[3], "ioc_type": "ip", "value": "10.0.15.42", "severity": "Low"},
    ]

if len(case_ids) > 4:
    IOCS += [
        {"case_id": case_ids[4], "ioc_type": "domain", "value": "npm-registry-mirror.com", "severity": "Critical"},
        {"case_id": case_ids[4], "ioc_type": "hash", "value": "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6", "severity": "Critical"},
        {"case_id": case_ids[4], "ioc_type": "ip", "value": "91.215.85.142", "severity": "High"},  # Shared!
        {"case_id": case_ids[4], "ioc_type": "domain", "value": "secure-update-srv.com", "severity": "High"},  # Shared!
    ]

if len(case_ids) > 5:
    IOCS += [
        {"case_id": case_ids[5], "ioc_type": "domain", "value": "t1.dnstunnel.xyz", "severity": "High"},
        {"case_id": case_ids[5], "ioc_type": "domain", "value": "c2.dnstunnel.xyz", "severity": "High"},
        {"case_id": case_ids[5], "ioc_type": "ip", "value": "103.152.220.14", "severity": "Medium"},  # Shared!
    ]

if len(case_ids) > 6:
    IOCS += [
        {"case_id": case_ids[6], "ioc_type": "ip", "value": "52.14.88.201", "severity": "Medium"},
        {"case_id": case_ids[6], "ioc_type": "domain", "value": "xmr-pool.minexmr.com", "severity": "Medium"},
        {"case_id": case_ids[6], "ioc_type": "hash", "value": "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", "severity": "Low"},
    ]

if len(case_ids) > 7:
    IOCS += [
        {"case_id": case_ids[7], "ioc_type": "domain", "value": "exploit-kit-cdn.ru", "severity": "Critical"},
        {"case_id": case_ids[7], "ioc_type": "ip", "value": "185.220.101.45", "severity": "High"},  # Shared!
        {"case_id": case_ids[7], "ioc_type": "hash", "value": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", "severity": "Critical"},
    ]

ioc_ok = 0
for ioc in IOCS:
    resp = requests.post(f"{BASE_URL}/ioc/", json=ioc, timeout=30)
    if resp.status_code == 200:
        ioc_ok += 1
    else:
        print(f"    [!] IOC failed: {resp.status_code}")
print(f"    [+] Seeded {ioc_ok}/{len(IOCS)} IOCs")

# ── 4. Seed Timeline Events ─────────────────────────────────────
print("\n[*] Seeding timeline events...")
TIMELINE = []

if len(case_ids) > 0:
    TIMELINE += [
        {"case_id": case_ids[0], "event": "Phishing email detected by email gateway", "event_type": "detection"},
        {"case_id": case_ids[0], "event": "Malicious attachment opened by user john.doe", "event_type": "compromise"},
        {"case_id": case_ids[0], "event": "Outbound C2 connection to secure-update-srv.com", "event_type": "network"},
        {"case_id": case_ids[0], "event": "PowerShell encoded command executed", "event_type": "execution"},
        {"case_id": case_ids[0], "event": "Credential dump from LSASS memory detected", "event_type": "credential_access"},
    ]

if len(case_ids) > 1:
    TIMELINE += [
        {"case_id": case_ids[1], "event": "Unusual RDP connections from workstation WS-FIN-004", "event_type": "lateral_movement"},
        {"case_id": case_ids[1], "event": "PsExec deployment detected across finance subnet", "event_type": "execution"},
        {"case_id": case_ids[1], "event": "Large file transfer to external IP 91.215.85.142", "event_type": "exfiltration"},
        {"case_id": case_ids[1], "event": "File encryption started on 12 endpoints", "event_type": "impact"},
        {"case_id": case_ids[1], "event": "Ransom note README.txt dropped in all directories", "event_type": "impact"},
        {"case_id": case_ids[1], "event": "Backup systems checked - offline backups intact", "event_type": "response"},
    ]

if len(case_ids) > 2:
    TIMELINE += [
        {"case_id": case_ids[2], "event": "WAF alert: 50,000+ login attempts in 2 hours", "event_type": "detection"},
        {"case_id": case_ids[2], "event": "312 successful logins from suspicious IPs", "event_type": "compromise"},
        {"case_id": case_ids[2], "event": "Rate limiting and IP blocking implemented", "event_type": "response"},
        {"case_id": case_ids[2], "event": "Forced password reset for 312 compromised accounts", "event_type": "response"},
    ]

if len(case_ids) > 3:
    TIMELINE += [
        {"case_id": case_ids[3], "event": "DLP alert: 2.3 GB uploaded to mega.nz", "event_type": "exfiltration"},
        {"case_id": case_ids[3], "event": "USB device connected - serial number logged", "event_type": "detection"},
        {"case_id": case_ids[3], "event": "Employee access revoked pending investigation", "event_type": "response"},
    ]

if len(case_ids) > 4:
    TIMELINE += [
        {"case_id": case_ids[4], "event": "Dependency audit flagged event-stream-utils v2.1.3", "event_type": "detection"},
        {"case_id": case_ids[4], "event": "Malicious postinstall script identified", "event_type": "analysis"},
        {"case_id": case_ids[4], "event": "12 microservices confirmed running backdoored package", "event_type": "compromise"},
        {"case_id": case_ids[4], "event": "All API keys rotated; packages pinned to known good versions", "event_type": "response"},
    ]

if len(case_ids) > 5:
    TIMELINE += [
        {"case_id": case_ids[5], "event": "Anomalous DNS TXT queries to t1.dnstunnel.xyz", "event_type": "detection"},
        {"case_id": case_ids[5], "event": "Base64-encoded payloads extracted from DNS traffic", "event_type": "analysis"},
    ]

if len(case_ids) > 6:
    TIMELINE += [
        {"case_id": case_ids[6], "event": "Spike in CPU usage on EC2 instances", "event_type": "detection"},
        {"case_id": case_ids[6], "event": "XMRig binary found in /tmp on 4 instances", "event_type": "analysis"},
        {"case_id": case_ids[6], "event": "Compromised IAM access key identified and revoked", "event_type": "response"},
        {"case_id": case_ids[6], "event": "Instances terminated; MFA enforced for all IAM users", "event_type": "response"},
    ]

if len(case_ids) > 7:
    TIMELINE += [
        {"case_id": case_ids[7], "event": "Google Safe Browsing flag on company blog URL", "event_type": "detection"},
        {"case_id": case_ids[7], "event": "Iframe injection found in blog template header", "event_type": "analysis"},
        {"case_id": case_ids[7], "event": "Exploit kit serving CVE-2024-21412 payload", "event_type": "compromise"},
        {"case_id": case_ids[7], "event": "Blog taken offline; CMS credentials rotated", "event_type": "response"},
    ]

tl_ok = 0
for tl in TIMELINE:
    resp = requests.post(f"{BASE_URL}/timeline/", json=tl, timeout=30)
    if resp.status_code == 200:
        tl_ok += 1
    else:
        print(f"    [!] Timeline failed: {resp.status_code} - {resp.text[:100]}")
print(f"    [+] Seeded {tl_ok}/{len(TIMELINE)} timeline events")

# ── 5. Seed MITRE ATT&CK Mappings ───────────────────────────────
print("\n[*] Seeding MITRE ATT&CK mappings...")
MITRE = []

if len(case_ids) > 0:
    MITRE += [
        {"case_id": case_ids[0], "technique_id": "T1566.001", "technique_name": "Spearphishing Attachment", "tactic": "Initial Access"},
        {"case_id": case_ids[0], "technique_id": "T1059.001", "technique_name": "PowerShell", "tactic": "Execution"},
        {"case_id": case_ids[0], "technique_id": "T1003.001", "technique_name": "LSASS Memory", "tactic": "Credential Access"},
        {"case_id": case_ids[0], "technique_id": "T1071.001", "technique_name": "Web Protocols", "tactic": "Command and Control"},
    ]

if len(case_ids) > 1:
    MITRE += [
        {"case_id": case_ids[1], "technique_id": "T1021.001", "technique_name": "Remote Desktop Protocol", "tactic": "Lateral Movement"},
        {"case_id": case_ids[1], "technique_id": "T1569.002", "technique_name": "Service Execution", "tactic": "Execution"},
        {"case_id": case_ids[1], "technique_id": "T1486", "technique_name": "Data Encrypted for Impact", "tactic": "Impact"},
        {"case_id": case_ids[1], "technique_id": "T1048.003", "technique_name": "Exfiltration Over Unencrypted Protocol", "tactic": "Exfiltration"},
        {"case_id": case_ids[1], "technique_id": "T1490", "technique_name": "Inhibit System Recovery", "tactic": "Impact"},
    ]

if len(case_ids) > 2:
    MITRE += [
        {"case_id": case_ids[2], "technique_id": "T1110.004", "technique_name": "Credential Stuffing", "tactic": "Credential Access"},
        {"case_id": case_ids[2], "technique_id": "T1078", "technique_name": "Valid Accounts", "tactic": "Initial Access"},
    ]

if len(case_ids) > 3:
    MITRE += [
        {"case_id": case_ids[3], "technique_id": "T1567.002", "technique_name": "Exfiltration to Cloud Storage", "tactic": "Exfiltration"},
        {"case_id": case_ids[3], "technique_id": "T1052.001", "technique_name": "Exfiltration over USB", "tactic": "Exfiltration"},
        {"case_id": case_ids[3], "technique_id": "T1530", "technique_name": "Data from Cloud Storage", "tactic": "Collection"},
    ]

if len(case_ids) > 4:
    MITRE += [
        {"case_id": case_ids[4], "technique_id": "T1195.002", "technique_name": "Compromise Software Supply Chain", "tactic": "Initial Access"},
        {"case_id": case_ids[4], "technique_id": "T1059.007", "technique_name": "JavaScript", "tactic": "Execution"},
        {"case_id": case_ids[4], "technique_id": "T1552.001", "technique_name": "Credentials In Files", "tactic": "Credential Access"},
    ]

if len(case_ids) > 5:
    MITRE += [
        {"case_id": case_ids[5], "technique_id": "T1071.004", "technique_name": "DNS", "tactic": "Command and Control"},
        {"case_id": case_ids[5], "technique_id": "T1572", "technique_name": "Protocol Tunneling", "tactic": "Command and Control"},
    ]

if len(case_ids) > 6:
    MITRE += [
        {"case_id": case_ids[6], "technique_id": "T1496", "technique_name": "Resource Hijacking", "tactic": "Impact"},
        {"case_id": case_ids[6], "technique_id": "T1078.004", "technique_name": "Cloud Accounts", "tactic": "Initial Access"},
    ]

if len(case_ids) > 7:
    MITRE += [
        {"case_id": case_ids[7], "technique_id": "T1189", "technique_name": "Drive-by Compromise", "tactic": "Initial Access"},
        {"case_id": case_ids[7], "technique_id": "T1203", "technique_name": "Exploitation for Client Execution", "tactic": "Execution"},
        {"case_id": case_ids[7], "technique_id": "T1059.007", "technique_name": "JavaScript", "tactic": "Execution"},
    ]

mitre_ok = 0
for m in MITRE:
    resp = requests.post(f"{BASE_URL}/mitre/", json=m, timeout=30)
    if resp.status_code == 200:
        mitre_ok += 1
    else:
        print(f"    [!] MITRE failed: {resp.status_code} - {resp.text[:100]}")
print(f"    [+] Seeded {mitre_ok}/{len(MITRE)} MITRE mappings")

# ── Summary ──────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"SEEDING COMPLETE")
print(f"{'='*50}")
print(f"  Cases:    {len(case_ids)}")
print(f"  IOCs:     {ioc_ok}")
print(f"  Timeline: {tl_ok}")
print(f"  MITRE:    {mitre_ok}")
print(f"\nThe data should now be visible at https://osint-x-1.onrender.com")
