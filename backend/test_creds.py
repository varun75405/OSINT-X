import requests

BASE = "http://127.0.0.1:8000"

# Get users
r = requests.get(f"{BASE}/users")
print("USERS:", r.status_code, r.text[:500])

# Try login
for u in ["[email protected]", "[email protected]"]:
    r = requests.post(f"{BASE}/auth/login", json={"email": u, "password": "varun"})
    print(f"LOGIN {u}:", r.status_code, r.text[:300])
