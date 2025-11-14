#!/usr/bin/env python
"""Debug script to check what's happening with the CustomerViewSet"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from api.models import Customer, User
from api.views import CustomerViewSet
from api.serializers import CustomerSerializer
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

# Create a mock request
factory = APIRequestFactory()
django_request = factory.get('/api/customers/')

# Add an authenticated user
user = User.objects.first()
django_request.user = user

# Create request object
request = Request(django_request)

# Create viewset instance
viewset = CustomerViewSet()
viewset.action = 'list'
viewset.request = request
viewset.format_kwarg = None

# Test the queryset
print("=== DEBUG INFO ===")
print(f"Authenticated User: {user.email}")
print(f"User ID: {user.id}")
print(f"\n1. Testing Customer.objects.all():")
all_customers = Customer.objects.all()
print(f"   Count: {all_customers.count()}")
for c in all_customers:
    print(f"   - {c.id}: {c.first_name} {c.last_name}")

print(f"\n2. Testing viewset.get_queryset():")
qs = viewset.get_queryset()
print(f"   Count: {qs.count()}")
for c in qs:
    print(f"   - {c.id}: {c.first_name} {c.last_name}")

print(f"\n3. Checking if ViewSet has filter_queryset:")
print(f"   Has filter_queryset: {hasattr(viewset, 'filter_queryset')}")

print(f"\n4. Testing filter_queryset:")
filtered_qs = viewset.filter_queryset(qs)
print(f"   Count after filter: {filtered_qs.count()}")
for c in filtered_qs:
    print(f"   - {c.id}: {c.first_name} {c.last_name}")

print(f"\n5. Checking permissions:")
try:
    viewset.check_permissions(request)
    print(f"   Permission check: PASSED")
except Exception as e:
    print(f"   Permission check: FAILED - {e}")

print(f"\n6. Manual API call simulation:")
try:
    list_view = viewset.list(request)
    print(f"   Response status: {list_view.status_code}")
    print(f"   Response data count: {len(list_view.data)}")
except Exception as e:
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()
