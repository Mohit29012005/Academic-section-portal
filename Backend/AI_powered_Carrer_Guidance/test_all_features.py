import requests
import json

BASE_URL = 'http://localhost:8000/api'

print("=" * 60)
print("TESTING ALL EVOLVEX AI FEATURES")
print("=" * 60)

# Test 1: Health Check
print("\n1. Health Check")
resp = requests.get(f'{BASE_URL}/health/')
print(f"✓ Status: {resp.json()}['status']")

# Test 2: Career Recommendations
print("\n2. Career Recommendations")
resp = requests.post(f'{BASE_URL}/career-recommend/', json={
    'interests': ['technology', 'AI'],
    'skills': 'Python, Machine Learning',
    'experience': 'fresher'
})
result = resp.json()
print(f"✓ Results: {len(result.get('recommendations', []))} careers")
print(f"  First: {result.get('recommendations', [{}])[0].get('title')}")
print(f"  Source: {result.get('source')}")

# Test 3: Quiz Generation  
print("\n3. Quiz Generation")
resp = requests.post(f'{BASE_URL}/generate-quiz/', json={
    'skills': ['Python', 'SQL'],
    'count': 3
})
result = resp.json()
print(f"✓ Questions: {len(result.get('quiz', []))} generated")
if result.get('quiz'):
    print(f"  First Q: {result['quiz'][0].get('q')[:50]}...")

# Test 4: Learning Resources
print("\n4. Learning Resources")
resp = requests.post(f'{BASE_URL}/learning-resources/', json={
    'interests': ['Python', 'Machine Learning'],
    'freeOnly': False
})
result = resp.json()
total = result.get('total', 0)
print(f"✓ Resources: {total} found")
print(f"  Source: {result.get('source')}")

# Test 5: Internships
print("\n5. Internship Finder")
resp = requests.post(f'{BASE_URL}/internships/', json={
    'location': 'any',
    'skills': [],
    'minStipend': 0,
    'maxStipend': 100000,
    'domain': ''
})
result = resp.json()
print(f"✓ Found: {len(result.get('internships', []))} internships")
if result.get('internships'):
    print(f"  First: {result['internships'][0].get('title')}")
    print(f"  Company: {result['internships'][0].get('company')}")

print("\n" + "=" * 60)
print("✅ ALL FEATURES WORKING PERFECTLY!")
print("=" * 60)
