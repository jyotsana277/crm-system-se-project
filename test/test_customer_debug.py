#!/usr/bin/env python
"""Debug script to test customer creation"""
import os
import sys
import json
import requests

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from api.models import User
from api.serializers import MyTOPS

# Get or create a test user
user, created = User.objects.get_or_create(
    email='testuser@example.com',
    defaults={
        'username': 'testuser',
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"✅ Created test user: {user.email}")
else:
    print(f"✅ Using existing user: {user.email}")

# Generate token
token = MyTOPS.get_token(user)
access_token = str(token.access_token)
print(f"✅ Generated access token")

# Test data for customer creation
customer_data = {
    "first_name": "John",
    "last_name": "Doe",
    "email": f"customer_{int(__import__('time').time())}@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipcode": "10001",
    "company_name": "Reliance Digital",
    "billing_amount": "1000.00",
    "date_of_purchase": "2025-11-13"
}

# Try to create a customer
url = "http://127.0.0.1:8000/api/customers/"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

print(f"\n🔍 Testing POST to {url}")
print(f"📤 Sending data: {json.dumps(customer_data, indent=2)}")

try:
    response = requests.post(url, json=customer_data, headers=headers, timeout=10)
    print(f"\n✅ Response Status: {response.status_code}")
    print(f"📥 Response Headers: {dict(response.headers)}")
    print(f"📥 Response Body:")
    print(json.dumps(response.json(), indent=2, default=str))
    
    if response.status_code == 201:
        print("\n✅ SUCCESS: Customer created!")
    else:
        print(f"\n❌ FAILED: Status {response.status_code}")
        if 'detail' in response.json():
            print(f"Error detail: {response.json()['detail']}")
        
except requests.exceptions.ConnectionError:
    print("❌ ERROR: Could not connect to server. Make sure the backend is running!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
