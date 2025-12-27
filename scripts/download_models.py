import requests
import os

def download_file(url, dest):
    print(f"Downloading {url} to {dest}...")
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(dest, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Done.")
    else:
        print(f"Failed to download. Status code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    # Using the hexgrad/Kokoro-82M repository on Hugging Face
    model_url = "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/kokoro-v0_19.onnx"
    voices_url = "https://huggingface.co/hexgrad/Kokoro-82M/resolve/main/voices.json"
    
    os.makedirs("scripts", exist_ok=True)
    download_file(model_url, "scripts/kokoro.onnx")
    download_file(voices_url, "scripts/voices.json")

