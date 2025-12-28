import os
import requests
import mimetypes

# Configuration
SUPABASE_URL = "https://kjbcjkihxskuwwfdqklt.supabase.co"
# We prefer the SERVICE_ROLE_KEY for uploads if available
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "the-plan"
LOCAL_DIR = "public/audio/sections"

def upload_files():
    if not os.path.exists(LOCAL_DIR):
        print(f"Error: Directory {LOCAL_DIR} not found.")
        return

    files = [f for f in os.listdir(LOCAL_DIR) if os.path.isfile(os.path.join(LOCAL_DIR, f))]
    print(f"Found {len(files)} files to upload.")

    for file_name in files:
        file_path = os.path.join(LOCAL_DIR, file_name)
        mime_type, _ = mimetypes.guess_type(file_path)
        
        # Supabase storage path
        storage_path = f"audio/sections/{file_name}"
        
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
        
        print(f"Uploading {file_name} to {storage_path}...")
        
        with open(file_path, "rb") as f:
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": mime_type or "application/octet-stream",
                "x-upsert": "true"
            }
            response = requests.post(url, headers=headers, data=f)
            
            if response.status_code == 200:
                print(f"  Successfully uploaded {file_name}")
            else:
                print(f"  Failed to upload {file_name}: {response.status_code} - {response.text}")

if __name__ == "__main__":
    if not SUPABASE_KEY:
        print("Error: SUPABASE_SERVICE_ROLE_KEY not found in environment.")
    else:
        upload_files()

