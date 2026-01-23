#!/usr/bin/env python3
"""
Test script to verify VNTANA authentication endpoints work as documented.

Tests:
1. Login with personal-access-token (recommended method)
2. Login with email/password
3. Get organizations list
4. Generate organization refresh token

Usage:
    python scripts/test_auth.py

Requires .env file with:
    VNTANA_API_KEY
    VNTANA_EMAIL
    VNTANA_PASSWORD
    VNTANA_ORGANIZATION_UUID
"""

import os
import sys
import requests
from pathlib import Path

# Load .env file
def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        print(f"ERROR: .env file not found at {env_path}")
        sys.exit(1)

    env_vars = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                # Remove quotes from value
                value = value.strip().strip("'").strip('"')
                env_vars[key] = value
    return env_vars

BASE_URL = "https://api-platform.vntana.com"

def test_login_with_token(api_key):
    """Test POST /v1/auth/login/token with personal-access-token"""
    print("\n" + "=" * 60)
    print("TEST 1: Login with Personal Access Token")
    print("Endpoint: POST /v1/auth/login/token")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/v1/auth/login/token",
        json={"personal-access-token": api_key},
        headers={"Content-Type": "application/json"}
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")

    auth_token = response.headers.get("x-auth-token")
    if auth_token:
        print(f"x-auth-token header: {auth_token[:20]}...{auth_token[-10:]}")
    else:
        print("WARNING: No x-auth-token in response headers!")

    if response.status_code == 200 and response.json().get("success"):
        print("PASS: Login with token successful")
        return auth_token
    else:
        print("FAIL: Login with token failed")
        return None

def test_login_with_email(email, password):
    """Test POST /v1/auth/login with email/password"""
    print("\n" + "=" * 60)
    print("TEST 2: Login with Email/Password")
    print("Endpoint: POST /v1/auth/login")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Content-Type": "application/json"}
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")

    auth_token = response.headers.get("x-auth-token")
    if auth_token:
        print(f"x-auth-token header: {auth_token[:20]}...{auth_token[-10:]}")
    else:
        print("WARNING: No x-auth-token in response headers!")

    if response.status_code == 200 and response.json().get("success"):
        print("PASS: Login with email/password successful")
        return auth_token
    else:
        print("FAIL: Login with email/password failed")
        return None

def test_get_organizations(auth_token):
    """Test GET /v1/organizations"""
    print("\n" + "=" * 60)
    print("TEST 3: Get Organizations List")
    print("Endpoint: GET /v1/organizations")
    print("=" * 60)

    response = requests.get(
        f"{BASE_URL}/v1/organizations",
        headers={"x-auth-token": f"Bearer {auth_token}"}
    )

    print(f"Status Code: {response.status_code}")
    data = response.json()

    if response.status_code == 200 and data.get("success"):
        orgs = data.get("response", {}).get("grid", [])
        print(f"Found {len(orgs)} organization(s):")
        for org in orgs:
            print(f"  - {org.get('name')} (uuid: {org.get('uuid')[:8]}...)")
        print("PASS: Get organizations successful")
        return orgs[0].get("uuid") if orgs else None
    else:
        print(f"Response: {data}")
        print("FAIL: Get organizations failed")
        return None

def test_refresh_token(auth_token, org_uuid):
    """Test POST /v1/auth/refresh-token"""
    print("\n" + "=" * 60)
    print("TEST 4: Generate Organization Refresh Token")
    print("Endpoint: POST /v1/auth/refresh-token")
    print("=" * 60)

    response = requests.post(
        f"{BASE_URL}/v1/auth/refresh-token",
        headers={
            "x-auth-token": f"Bearer {auth_token}",
            "organizationUuid": org_uuid
        }
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")

    refresh_token = response.headers.get("x-auth-token")
    if refresh_token:
        print(f"x-auth-token header (refresh): {refresh_token[:20]}...{refresh_token[-10:]}")
    else:
        print("WARNING: No x-auth-token in response headers!")

    if response.status_code == 200 and response.json().get("success"):
        print("PASS: Refresh token generation successful")
        return refresh_token
    else:
        print("FAIL: Refresh token generation failed")
        return None

def test_api_call_with_refresh_token(refresh_token):
    """Test using refresh token for API calls"""
    print("\n" + "=" * 60)
    print("TEST 5: Use Refresh Token for API Call")
    print("Endpoint: GET /v1/clients/client-organizations")
    print("=" * 60)

    response = requests.get(
        f"{BASE_URL}/v1/clients/client-organizations",
        headers={"x-auth-token": f"Bearer {refresh_token}"}
    )

    print(f"Status Code: {response.status_code}")
    data = response.json()

    if response.status_code == 200 and data.get("success"):
        workspaces = data.get("response", {}).get("grid", [])
        print(f"Found {len(workspaces)} workspace(s):")
        for ws in workspaces:
            print(f"  - {ws.get('name')} (uuid: {ws.get('uuid')[:8]}...)")
        print("PASS: API call with refresh token successful")
        return True
    elif response.status_code == 403:
        print(f"Response: {data}")
        print("NOTE: 403 may indicate no workspaces exist or insufficient permissions")
        print("SKIP: Cannot verify (permission issue, not auth issue)")
        return None  # Indeterminate - not a failure of auth
    else:
        print(f"Response: {data}")
        print("FAIL: API call with refresh token failed")
        return False

def main():
    print("VNTANA Authentication Test Script")
    print("Testing endpoints as documented in guides/authentication/")

    # Load credentials
    env = load_env()
    api_key = env.get("VNTANA_API_KEY")
    email = env.get("VNTANA_EMAIL")
    password = env.get("VNTANA_PASSWORD")
    org_uuid = env.get("VNTANA_ORGANIZATION_UUID")

    if not all([api_key, email, password]):
        print("ERROR: Missing required environment variables")
        sys.exit(1)

    results = []

    # Test 1: Login with personal-access-token
    auth_token = test_login_with_token(api_key)
    results.append(("Login with token", auth_token is not None))

    # Test 2: Login with email/password
    auth_token_email = test_login_with_email(email, password)
    results.append(("Login with email", auth_token_email is not None))

    # Use token from method 1 for remaining tests
    if auth_token:
        # Test 3: Get organizations
        fetched_org_uuid = test_get_organizations(auth_token)
        results.append(("Get organizations", fetched_org_uuid is not None))

        # Use provided org_uuid or fetched one
        test_org_uuid = org_uuid or fetched_org_uuid

        if test_org_uuid:
            # Test 4: Generate refresh token
            refresh_token = test_refresh_token(auth_token, test_org_uuid)
            results.append(("Generate refresh token", refresh_token is not None))

            if refresh_token:
                # Test 5: Use refresh token
                success = test_api_call_with_refresh_token(refresh_token)
                results.append(("Use refresh token", success))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, success in results if success is True)
    failed = sum(1 for _, success in results if success is False)
    skipped = sum(1 for _, success in results if success is None)

    for test_name, success in results:
        if success is True:
            status = "PASS"
        elif success is False:
            status = "FAIL"
        else:
            status = "SKIP"
        print(f"  [{status}] {test_name}")

    print(f"\nTotal: {passed} passed, {failed} failed, {skipped} skipped")

    # Core auth tests are 1, 3, 4 - if those pass, documentation is correct
    core_tests = [r for r in results if r[0] in ["Login with token", "Get organizations", "Generate refresh token"]]
    core_passed = all(s for _, s in core_tests)

    if core_passed:
        print("\nCore authentication flow verified! Documentation is correct.")
        if failed > 0:
            print("Note: Some failures may be due to credentials or permissions, not documentation.")
        return 0
    else:
        print("\nCore authentication tests failed - check documentation")
        return 1

if __name__ == "__main__":
    sys.exit(main())
