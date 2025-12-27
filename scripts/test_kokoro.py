try:
    from kokoro_onnx import Kokoro
    print("Kokoro-onnx is installed.")
except ImportError:
    print("Kokoro-onnx is not installed.")

import os
import requests

# Direct links that are known to work (if they exist)
files = {
    "kokoro.onnx": "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/kokoro-v0_19.onnx",
    "voices.json": "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/voices.json"
}

for filename, url in files.items():
    print(f"Attempting to download {filename}...")
    # Use headers to mimic a browser
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers, stream=True)
    if r.status_code == 200:
        with open(filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Successfully downloaded {filename}")
    else:
        print(f"Failed {filename}: {r.status_code}")

