import requests
import json

# Test career recommend endpoint
endpoint = "http://localhost:8000/api/career-recommend/"
payload = {
    "interests": ["web_development"],
    "skills": "Python",
    "experience": "fresher"
}

try:
    response = requests.post(endpoint, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
