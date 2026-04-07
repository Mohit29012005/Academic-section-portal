#!/usr/bin/env python
import requests
import time

BASE_URL = "http://localhost:8000/api"

print("Testing optimized internship endpoint...")
payload = {
    "location": "any",
    "skills": ["Python", "JavaScript"],
    "minStipend": 0,
    "maxStipend": 100000,
    "domain": "web development"
}

start = time.time()
try:
    response = requests.post(f"{BASE_URL}/internships", json=payload, timeout=120)
    elapsed = time.time() - start
    print(f"Status: {response.status_code} (took {elapsed:.1f}s)")
    
    data = response.json()
    if "internships" in data:
        print(f"✅ SUCCESS: {len(data['internships'])} internships found")
        if data['internships']:
            print(f"   First: {data['internships'][0].get('title', 'N/A')}")
            print(f"   Company: {data['internships'][0].get('company', 'N/A')}")
    else:
        print(f"Response: {data}")
except Exception as e:
    elapsed = time.time() - start
    print(f"❌ FAILED ({elapsed:.1f}s): {str(e)}")
