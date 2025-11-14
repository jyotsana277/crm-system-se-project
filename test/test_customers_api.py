#!/usr/bin/env python
"""Test script to verify the customers API endpoint"""
import requests
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from api.models import User
from rest_framework_simplejwt.tokens import Token
from api.serializers import MyTOPS

# Get any user
try:
    user = User.objects.first()
    if not user:
        print("❌ No users found in database")
        sys.exit(1)
    
    # Generate token for that user
    token = MyTOPS.get_token(user)
    access_token = str(token.access_token)
    
    print(f"✅ Using user: {user.email}")
    print(f"✅ Generated access token: {access_token[:20]}...")
    
    # Test the customers endpoint
    url = "http://127.0.0.1:8000/api/customers/"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print(f"\n🔍 Testing endpoint: {url}")
    response = requests.get(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body:")
    print(json.dumps(response.json(), indent=2, default=str))
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCESS: Found {len(data)} customers")
    else:
        print(f"\n❌ FAILED: Status {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
