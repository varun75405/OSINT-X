import requests

BASE = "http://127.0.0.1:8000"

# Login
r = requests.post(
    f"{BASE}/auth/login", json={"email": "varun@admin.com", "password": "varun"}
)
print("LOGIN:", r.status_code, r.text[:300])
if r.status_code != 200:
    r = requests.post(
        f"{BASE}/auth/login", json={"email": "varun@test.com", "password": "varun"}
    )
    print("LOGIN2:", r.status_code, r.text[:300])

data = r.json()
token = data.get("access_token")
print("TOKEN:", token[:30] if token else None)

headers = {"Authorization": f"Bearer {token}"}

# List cases
r = requests.get(f"{BASE}/cases", headers=headers)
print("CASES:", r.status_code, r.text[:500])
