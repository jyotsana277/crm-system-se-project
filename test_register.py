#!/usr/bin/env python
import requests
import json
import time

# Test Registration
url = "http://127.0.0.1:8000/api/register/"

# Use timestamp to make unique email/username
timestamp = int(time.time())
data = {
    "full_name": "Test User",
    "email": f"testuser{timestamp}@company.com",
    "username": f"testuser{timestamp}",
    "password": "TestPass123!",
    "password2": "TestPass123!"
}

print("Testing Registration...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(
        url,
        json=data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("\n✅ Registration successful!")
    else:
        print(f"\n❌ Error: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw error: {response.text}")
            
except Exception as e:
    print(f"❌ Error making request: {e}")
