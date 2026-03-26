import requests
import random
import string
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_marketplace_search_fuzzing():
    print("--- Testing Marketplace Search Fuzzing ---")
    dangerous_payloads = [
        "A" * 1000,           # Long string
        "'; DROP TABLE experts; --", # Pseudo-SQL injection
        "<script>alert(1)</script>", # Pseudo-XSS
        "!@#$%^&*()_+",      # Special characters
        "1234567890",        # Numeric only
    ]
    
    for payload in dangerous_payloads:
        print(f"Testing City: {payload[:20]}...")
        params = {"city": payload}
        try:
            r = requests.get(f"{BASE_URL}/marketplace/profiles/search", params=params)
            print(f"Status: {r.status_code}")
        except Exception as e:
            print(f"Failed: {e}")

def test_filter_boundaries():
    print("\n--- Testing Filter Boundary Cases ---")
    cases = [
        {"min_price": 50000, "max_price": 1000}, # Min > Max
        {"min_price": -100, "max_price": 5000},  # Negative min
        {"rating": 10},                         # Rating > 5
        {"specialization": "non_existent_spec"}, # Invalid spec
    ]
    
    for case in cases:
        print(f"Testing Params: {case}")
        try:
            r = requests.get(f"{BASE_URL}/marketplace/profiles/search", params=case)
            print(f"Status: {r.status_code}")
        except Exception as e:
            print(f"Failed: {e}")

def test_unauthorized_admin():
    print("\n--- Testing Unauthorized Admin Access ---")
    endpoints = [
        "/admin/verification/pending",
        "/admin/verification/1/approve",
    ]
    
    for ep in endpoints:
        print(f"Testing {ep} without token")
        try:
            r = requests.get(f"{BASE_URL}{ep}") if ep.startswith("/admin/profiles/p") else requests.post(f"{BASE_URL}{ep}")
            print(f"Status: {r.status_code} (Expected 401 or 403)")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    try:
        test_marketplace_search_fuzzing()
        test_filter_boundaries()
        test_unauthorized_admin()
        print("\nStress test complete.")
    except Exception as e:
        print(f"Execution failed: {e}")
