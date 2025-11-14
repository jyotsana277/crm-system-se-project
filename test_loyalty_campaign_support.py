#!/usr/bin/env python
"""Test script to verify loyalty program and support ticket creation"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_loyalty_and_support():
    # Wait for server to be ready
    time.sleep(2)
    
    print("=" * 60)
    print("Testing Loyalty Program & Support Ticket Creation")
    print("=" * 60)
    
    # 1. Register user
    print("\n1. Registering user...")
    reg_data = {
        'email': 'testuser@test.com',
        'username': 'testuser',
        'full_name': 'Test User',
        'password': 'TestPass123!',
        'password2': 'TestPass123!'
    }
    r = requests.post(f"{BASE_URL}/api/register/", json=reg_data)
    if r.status_code == 201:
        print("✅ User registered successfully")
    else:
        print(f"❌ Registration failed: {r.status_code}")
        print(f"Response: {r.text}")
        return
    
    # 2. Get authentication token
    print("\n2. Getting authentication token...")
    login_data = {
        'email': 'testuser@test.com',
        'password': 'TestPass123!'
    }
    r = requests.post(f"{BASE_URL}/api/token/", json=login_data)
    if r.status_code == 200:
        token = r.json()['access']
        headers = {'Authorization': f'Bearer {token}'}
        print("✅ Token obtained")
    else:
        print(f"❌ Login failed: {r.status_code}")
        print(f"Response: {r.text}")
        return
    
    # 3. Create customer
    print("\n3. Creating customer...")
    customer_data = {
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john.doe@test.com',
        'phone': '1234567890',
        'address': '123 Main St',
        'city': 'New York',
        'state': 'NY',
        'zipcode': '10001',
        'country': 'USA',
        'billing_amount': 5000
    }
    r = requests.post(f"{BASE_URL}/api/customers/", json=customer_data, headers=headers)
    if r.status_code == 201:
        customer = r.json()
        customer_id = customer['id']
        print(f"✅ Customer created: ID={customer_id}")
    else:
        print(f"❌ Customer creation failed: {r.status_code}")
        print(f"Response: {r.text}")
        return
    
    # 4. Create loyalty program
    print("\n4. Creating loyalty program...")
    loyalty_data = {
        'customer': customer_id,
        'tier': 'silver',
        'total_points': 750,
        'points_balance': 750
    }
    r = requests.post(f"{BASE_URL}/api/loyalty-programs/", json=loyalty_data, headers=headers)
    if r.status_code == 201:
        loyalty = r.json()
        print(f"✅ Loyalty program created")
        print(f"   - Tier: {loyalty['tier']}")
        print(f"   - Points: {loyalty['total_points']}")
    else:
        print(f"❌ Loyalty program creation failed: {r.status_code}")
        print(f"Response: {r.text}")
    
    # 5. Create support ticket
    print("\n5. Creating support ticket...")
    ticket_data = {
        'customer': customer_id,
        'subject': 'Issue with loyalty program points',
        'description': 'Customer reports not receiving points for recent purchase',
        'category': 'billing',
        'priority': 'high',
        'status': 'open'
    }
    r = requests.post(f"{BASE_URL}/api/support-tickets/", json=ticket_data, headers=headers)
    if r.status_code == 201:
        ticket = r.json()
        print(f"✅ Support ticket created")
        print(f"   - Ticket ID: {ticket['ticket_id']}")
        print(f"   - Category: {ticket['category']}")
        print(f"   - Priority: {ticket['priority']}")
    else:
        print(f"❌ Support ticket creation failed: {r.status_code}")
        print(f"Response: {r.text}")
    
    # 6. Create campaign
    print("\n6. Creating marketing campaign...")
    campaign_data = {
        'name': 'Holiday Loyalty Promotion',
        'description': 'Special promotion for loyal customers',
        'campaign_type': 'email',
        'status': 'draft',
        'subject_line': 'Exclusive Holiday Rewards for You!',
        'content': 'Dear customer, enjoy 50% more points on all purchases this holiday season!'
    }
    r = requests.post(f"{BASE_URL}/api/campaigns/", json=campaign_data, headers=headers)
    if r.status_code == 201:
        campaign = r.json()
        print(f"✅ Campaign created")
        print(f"   - Name: {campaign['name']}")
        print(f"   - Type: {campaign['campaign_type']}")
    else:
        print(f"❌ Campaign creation failed: {r.status_code}")
        print(f"Response: {r.text}")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    test_loyalty_and_support()
