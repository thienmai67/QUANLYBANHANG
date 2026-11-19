import os
import sys
import json
import urllib.request
import hashlib
from PIL import Image
import io

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def download_image(url, out_path, seen_hashes):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status != 200:
                print(f"[ERROR] Failed {url}: Status {resp.status}")
                return False
            data = resp.read()
            if len(data) < 1000:
                print(f"[ERROR] File too small ({len(data)} bytes) from {url}")
                return False
            
            # Check MD5 hash to guarantee NO duplicate image
            file_hash = hashlib.md5(data).hexdigest()
            if file_hash in seen_hashes:
                print(f"[ERROR] DUPLICATE IMAGE DETECTED! MD5: {file_hash} from {url} matches previously downloaded image for {seen_hashes[file_hash]}")
                return False
            
            # Verify it's a valid image using PIL
            try:
                img = Image.open(io.BytesIO(data))
                img.verify()
            except Exception as e:
                print(f"[ERROR] Invalid image format from {url}: {e}")
                return False
            
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, 'wb') as f:
                f.write(data)
            
            seen_hashes[file_hash] = out_path
            print(f"[SUCCESS] Saved {out_path} ({len(data)} bytes, MD5: {file_hash[:8]})")
            return True
    except Exception as e:
        print(f"[ERROR] Download exception for {url}: {e}")
        return False

if __name__ == '__main__':
    print("Image download and validation helper ready.")
