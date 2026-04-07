#!/usr/bin/env python
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

tests = [
    ("Career Recommendations", "/career-recommend", {
        "interests": ["web_development", "ai_ml"],
        "skills": "Python, JavaScript",
        "experience": "fresher"
    }, 60),
    
    ("Quiz Generation", "/generate-quiz", {
        "skills": ["Python", "JavaScript"],
        "count": 3
    }, 60),
    
    ("Learning Resources", "/learning-resources", {
        "interests": ["python", "javascript"],
        "freeOnly": False
    }, 60),
    
    ("Internship Finder", "/internships", {
        "location": "Bengaluru",
        "skills": ["Python"],
        "minStipend": 0,
        "maxStipend": 100000,
        "domain": "any"
    }, 120),
    
    ("Resume Export", "/resume-export", {
        "resume": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "9999999999",
            "skills": ["Python", "JavaScript"],
            "summary": "Experienced developer"
        }
    }, 10)
]

print("\n" + "="*70)
print("AI powered Career Guidance system - FEATURE TEST SUITE")
print("="*70)

results = []
for name, endpoint, payload, timeout in tests:
    print(f"\n📌 Testing: {name}")
    start = time.time()
    try:
        response = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=timeout)
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            
            # Determine success
            success = False
            if "error" in data:
                results.append((name, "❌ ERROR", data['error']))
            elif "recommendations" in data:
                results.append((name, "✅ WORKING", f"{len(data['recommendations'])} items in {elapsed:.1f}s"))
                success = True
            elif "quiz" in data:
                results.append((name, "✅ WORKING", f"{len(data['quiz'])} questions in {elapsed:.1f}s"))
                success = True
            elif "resources" in data:
                results.append((name, "✅ WORKING", f"Resources retrieved in {elapsed:.1f}s"))
                success = True
            elif "internships" in data:
                results.append((name, "✅ WORKING", f"{len(data['internships'])} internships in {elapsed:.1f}s"))
                success = True
            elif "text" in data:
                results.append((name, "✅ WORKING", f"Resume exported in {elapsed:.1f}s"))
                success = True
            else:
                results.append((name, "✅ WORKING", f"Response received in {elapsed:.1f}s"))
                success = True
                
        else:
            results.append((name, "❌ ERROR", f"HTTP {response.status_code}"))
            
    except requests.exceptions.Timeout:
        elapsed = time.time() - start
        results.append((name, "⏱️ TIMEOUT", f"No response after {elapsed:.1f}s"))
    except Exception as e:
        elapsed = time.time() - start
        results.append((name, "❌ FAILED", str(e)))

print("\n" + "="*70)
print("TEST RESULTS SUMMARY")
print("="*70)

for name, status, info in results:
    print(f"{status} {name}: {info}")

passed = sum(1 for _, s, _ in results if "✅" in s)
print(f"\n{'='*70}")
print(f"PASSED: {passed}/{len(results)}")
print(f"{'='*70}\n")
