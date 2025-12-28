import os
import json
import whisper
import re
from tqdm import tqdm
import argparse

def extract_canonical_words():
    """Extracts the exact words we expect in the UI from sections.ts."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sections_path = os.path.join(script_dir, "../src/data/sections.ts")
    
    with open(sections_path, 'r') as f:
        content = f.read()
    
    section_blocks = re.findall(r'\{[\s\S]*?id:[\s\S]*?\}', content)
    
    canonical_data = {}
    for block in section_blocks:
        id_match = re.search(r'id:\s*"((?:\\.|[^"])*)"', block)
        title_match = re.search(r'title:\s*"((?:\\.|[^"])*)"', block)
        subtitle_match = re.search(r'subtitle:\s*"((?:\\.|[^"])*)"', block)
        content_match = re.search(r'content:\s*"((?:\\.|[^"])*)"', block)
        
        if id_match and title_match and content_match:
            sec_id = id_match.group(1)
            title = title_match.group(1).replace('\\"', '"')
            subtitle = subtitle_match.group(1).replace('\\"', '"') if subtitle_match else ""
            content_text = content_match.group(1).replace('\\"', '"')
            
            # Combine all text fields into one clean string
            full_text = f"{title} {subtitle} {content_text}".strip()
            # Split into words exactly like src/lib/utils.ts
            words = [w for w in full_text.split() if w]
            canonical_data[sec_id] = words
            
    return canonical_data

def align_whisper_to_canonical(whisper_segments, canonical_words):
    """
    Matches Whisper's timestamped words to our canonical word list.
    Handles small differences like "U.K." vs "UK".
    """
    whisper_words = []
    for segment in whisper_segments:
        if 'words' in segment:
            for w in segment['words']:
                whisper_words.append({
                    "word": w['word'].strip(),
                    "start": w['start']
                })
    
    aligned_timing = []
    w_idx = 0
    
    for c_word in canonical_words:
        # Simple heuristic: find the next whisper word that matches or starts with the canonical word
        # We also keep track of current index to avoid jumping backwards
        found = False
        # Normalize for comparison
        c_norm = re.sub(r'[^\w]', '', c_word.lower())
        
        for i in range(w_idx, min(w_idx + 10, len(whisper_words))):
            w_norm = re.sub(r'[^\w]', '', whisper_words[i]['word'].lower())
            
            if c_norm == w_norm or c_norm in w_norm or w_norm in c_norm:
                aligned_timing.append({
                    "word": c_word,
                    "start": whisper_words[i]['start']
                })
                w_idx = i + 1
                found = True
                break
        
        if not found:
            # Fallback: if Whisper missed it, use the previous word's start or 0
            prev_start = aligned_timing[-1]['start'] if aligned_timing else 0
            aligned_timing.append({
                "word": c_word,
                "start": prev_start
            })
            
    return aligned_timing

def main(target_section=None):
    print("Loading Whisper model (base)...")
    model = whisper.load_model("base")
    
    print("Extracting canonical text from sections.ts...")
    canonical_data = extract_canonical_words()
    
    audio_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/audio/sections"))
    
    sections_to_process = [target_section] if target_section else canonical_data.keys()
    
    print(f"Aligning {len(sections_to_process)} sections...")
    
    for sec_id in tqdm(sections_to_process):
        mp3_path = os.path.join(audio_dir, f"{sec_id}.mp3")
        json_path = os.path.join(audio_dir, f"{sec_id}.json")
        
        if not os.path.exists(mp3_path):
            print(f"  Warning: {mp3_path} not found. Skipping.")
            continue
            
        # Run Whisper
        # We use fp16=False if running on CPU/standard hardware to avoid warnings
        result = model.transcribe(mp3_path, word_timestamps=True, fp16=False, language='en')
        
        # Align
        canonical_words = canonical_data.get(sec_id, [])
        aligned = align_whisper_to_canonical(result['segments'], canonical_words)
        
        # Save JSON
        with open(json_path, 'w') as f:
            json.dump(aligned, f, indent=2)
            
    print("\nAlignment complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Align existing MP3s with text using Whisper.")
    parser.add_argument("--section", type=str, help="Specific section ID to align")
    args = parser.parse_args()
    
    main(args.section)

