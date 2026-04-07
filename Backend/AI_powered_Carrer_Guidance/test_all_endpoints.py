#!/usr/bin/env python
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_endpoint(name, endpoint, payload):
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")
    try:
        response = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        data = response.json()
        if "error" in data:
            print(f"❌ ERROR: {data['error']}")
        elif "recommendations" in data:
            print(f"✅ SUCCESS: {len(data['recommendations'])} recommendations")
            if data['recommendations']:
                print(f"   First: {data['recommendations'][0].get('title', 'N/A')}")
        elif "quiz" in data:
            print(f"✅ SUCCESS: {len(data['quiz'])} quiz questions")
            if data['quiz']:
                print(f"   First: {data['quiz'][0].get('q', 'N/A')[:50]}...")
        elif "resources" in data:
            print(f"✅ SUCCESS: Resources for {len(data['resources'])} topics")
        elif "internships" in data:
            print(f"✅ SUCCESS: {len(data['internships'])} internships found")
            if data['internships']:
                print(f"   First: {data['internships'][0].get('title', 'N/A')}")
        else:
            print(f"✅ Response received: {list(data.keys())}")
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")

# Test Career Recommendations
test_endpoint(
    "Career Recommendations",
    "/career-recommend",
    {
        "interests": ["web_development", "ai_ml"], 
        "skills": "Python, JavaScript",
        "experience": "fresher"
    }
)

# Test Quiz Generation
test_endpoint(
    "Quiz Generation",
    "/generate-quiz",
    {
        "skills": ["Python", "JavaScript"],
        "count": 3
    }
)

# Test Learning Resources
test_endpoint(
    "Learning Resources",
    "/learning-resources",
    {
        "interests": ["python", "javascript"],
        "freeOnly": False
    }
)

# Test Internship Finder
test_endpoint(
    "Internship Finder",
    "/internships",
    {
        "location": "any",
        "skills": ["Python", "JavaScript"],
        "minStipend": 0,
        "maxStipend": 100000,
        "domain": "web development"
    }
)

print(f"\n{'='*60}")
print("ALL TESTS COMPLETED")
print(f"{'='*60}")
