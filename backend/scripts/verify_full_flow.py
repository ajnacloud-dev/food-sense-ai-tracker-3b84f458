
import requests
import json
import base64
import os
import sys
import time

# Configuration
API_URL = "http://localhost:8000"
TEST_FILE = "test_upload.txt"
TEST_CONTENT = "This is a test file for Ibex Proxy Storage."

def verify_backend():
    print(f"🔍 Starting Full Backend Verification against {API_URL}...\n")

    # 1. Test Health / Root (if available)
    try:
        # local_server usually doesn't have root, but let's try storage upload directly
        pass
    except Exception as e:
        print(f"⚠️ Health check skipped: {e}")

    # 2. Test Upload (POST /storage/upload)
    print("👉 Testing Upload (POST /storage/upload)...")
    
    # Create mock base64 payload
    b64_content = base64.b64encode(TEST_CONTENT.encode('utf-8')).decode('utf-8')
    
    payload = {
        "path": f"tests/{int(time.time())}_{TEST_FILE}",
        "file": b64_content,
        "mime_type": "text/plain",
        "size_bytes": len(TEST_CONTENT)
    }
    
    try:
        res = requests.post(f"{API_URL}/storage/upload", json=payload)
        
        if res.status_code == 200:
            data = res.json()
            print("✅ Upload Successful!")
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            s3_key = data.get('s3_key')
            file_path = data.get('path')
            
            if not s3_key:
                print("❌ Verification Failed: No s3_key in response.")
                return
                
            # 3. Test Download/Redirect (GET /storage/{path})
            print("\n👉 Testing Download Redirect (GET /storage/{path})...")
            # Note: The backend uses path parameter lookup
            # path needs to be URL encoded if it contains slashes? requests handles it usually but acts weird with path params sometimes.
            # Lambda router might expect /storage/tests/123...
            # Router defines GET /v1/storage/(?P<path>.+)
            download_url = f"{API_URL}/v1/storage/{file_path}"
            print(f"   Requesting: {download_url}")
            
            # Don't follow redirect automatically to check 302
            res_dl = requests.get(download_url, allow_redirects=False)
            
            if res_dl.status_code == 302:
                redirect_loc = res_dl.headers.get('Location')
                print("✅ Download Redirect Successful (302 Found)!")
                print(f"   Redirect Location: {redirect_loc}")
                
                if "s3" in redirect_loc or "amazonaws" in redirect_loc:
                     print("   ✅ Location looks like a valid S3 URL.")
                else:
                     print("   ⚠️ Location does not look like S3 URL (might be proxied or different provider).")
            else:
                print(f"❌ Download Failed. Status: {res_dl.status_code}")
                print(f"   Response: {res_dl.text}")

        else:
            print(f"❌ Upload Failed. Status: {res.status_code}")
            print(f"   Error: {res.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Refused. Is the backend running on localhost:8000?")
    except Exception as e:
        print(f"❌ Error during test: {e}")

if __name__ == "__main__":
    verify_backend()
