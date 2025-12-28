import json
import os
import re
import numpy as np
import soundfile as sf
import subprocess
from kokoro_onnx import Kokoro

def extract_sections():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sections_path = os.path.join(script_dir, "../src/data/sections.ts")
    
    if not os.path.exists(sections_path):
        print(f"Error: {sections_path} not found.")
        return []
        
    with open(sections_path, 'r') as f:
        content = f.read()
    
    # We find all objects in the array that have an 'id'
    section_blocks = re.findall(r'\{[\s\S]*?id:[\s\S]*?\}', content)
    
    sections = []
    for block in section_blocks:
        id_match = re.search(r'id:\s*"((?:\\.|[^"])*)"', block)
        title_match = re.search(r'title:\s*"((?:\\.|[^"])*)"', block)
        subtitle_match = re.search(r'subtitle:\s*"((?:\\.|[^"])*)"', block)
        content_match = re.search(r'content:\s*"((?:\\.|[^"])*)"', block)
        
        if id_match and title_match and content_match:
            sec_id = id_match.group(1)
            title = title_match.group(1).replace('\\"', '"')
            subtitle = subtitle_match.group(1).replace('\\"', '"') if subtitle_match else None
            content_text = content_match.group(1).replace('\\"', '"')
            
            sections.append({
                "id": sec_id,
                "title": title,
                "subtitle": subtitle,
                "content": content_text
            })
            
    return sections

def split_into_words(text):
    """Matches the logic in src/lib/utils.ts: text.trim().split(/\s+/).filter(Boolean)"""
    return [w for w in text.strip().split() if w]

def generate_sectional_audio():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "kokoro.onnx")
    voices_path = os.path.join(script_dir, "voices.bin")
    output_dir = os.path.join(script_dir, "../public/audio/sections")
    
    if not os.path.exists(model_path) or not os.path.exists(voices_path):
        print(f"Error: Model files not found in {script_dir}.")
        return

    # Initialize Kokoro
    kokoro = Kokoro(model_path, voices_path)
    
    sections = extract_sections()
    if not sections:
        print("Error: No sections found in sections.ts")
        return

    print(f"Extracted {len(sections)} sections.")
    os.makedirs(output_dir, exist_ok=True)
    
    sample_rate = 24000 # Kokoro default
    
    for i, section in enumerate(sections):
        print(f"--- Processing section {i+1}/{len(sections)}: {section['id']} ({section['title']}) ---")
        
        section_samples = []
        timing = []
        current_time_offset = 0
        
        # Build list of segments to read (title, optional subtitle, content)
        segments = [section['title']]
        if section['subtitle']:
            segments.append(section['subtitle'])
        segments.append(section['content'])
        
        for segment in segments:
            # Split segment into sentences for TTS processing
            # We want to maintain word order across sentences
            sentences = re.split(r'(?<=[.!?])\s+', segment.strip())
            
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                    
                print(f"  Sentence: {sentence[:60]}...")
                try:
                    samples, sr = kokoro.create(
                        sentence, 
                        voice="bm_lewis", 
                        speed=1.0, 
                        lang="en-gb"
                    )
                    sample_rate = sr
                    section_samples.append(samples)
                    
                    # Calculate timing for words in this sentence
                    words = split_into_words(sentence)
                    duration = len(samples) / sr
                    avg_word_dur = duration / len(words) if words else 0
                    
                    for word in words:
                        timing.append({
                            "word": word,
                            "start": round(current_time_offset, 3)
                        })
                        current_time_offset += avg_word_dur
                        
                    # Add a small silence between sentences
                    silence_dur = 0.3
                    silence = np.zeros(int(sr * silence_dur)) 
                    section_samples.append(silence)
                    current_time_offset += silence_dur
                except Exception as e:
                    print(f"  Error processing sentence: {e}")
                    continue
            
            # Add a bit more silence between title/subtitle/content segments
            segment_silence_dur = 0.2
            segment_silence = np.zeros(int(sample_rate * segment_silence_dur))
            section_samples.append(segment_silence)
            current_time_offset += segment_silence_dur

        if not section_samples:
            print(f"Error: No audio generated for section {section['id']}")
            continue

        # Concatenate and save wav
        final_samples = np.concatenate(section_samples)
        wav_path = os.path.join(output_dir, f"{section['id']}.wav")
        sf.write(wav_path, final_samples, sample_rate)
        
        # Convert to high-quality MP3
        mp3_path = os.path.join(output_dir, f"{section['id']}.mp3")
        print(f"  Converting to MP3: {mp3_path}")
        subprocess.run([
            "ffmpeg", "-y", "-i", wav_path, 
            "-codec:a", "libmp3lame", "-qscale:a", "2", # High quality (approx 190kbps)
            mp3_path
        ], capture_output=True)
        
        # Remove wav to save space (keep only mp3)
        os.remove(wav_path)

        # Save timing
        json_path = os.path.join(output_dir, f"{section['id']}.json")
        with open(json_path, "w") as f:
            json.dump(timing, f, indent=2)
        
        print(f"  Completed {section['id']}.mp3 and {section['id']}.json")

    print("\nAll sections processed successfully.")

if __name__ == "__main__":
    generate_sectional_audio()

