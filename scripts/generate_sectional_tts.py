import json
import os
import re
import numpy as np
import soundfile as sf
import subprocess
import librosa
import argparse
import time
from tqdm import tqdm
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
    return [w for w in text.strip().split() if w]

def calculate_precise_timings(kokoro, natural_samples, words, sr):
    """
    Distributes the total natural sentence duration across words based on 
    their measured isolated durations (trimmed).
    """
    if not words:
        return []

    iso_lengths = []
    for word in words:
        try:
            # Generate isolated word
            iso_samples, _ = kokoro.create(word, voice="bm_lewis", speed=1.0, lang="en-gb")
            # Trim silence to get the actual "content" length of the word
            trimmed, _ = librosa.effects.trim(iso_samples, top_db=25)
            iso_lengths.append(max(len(trimmed), 1)) # Ensure at least 1 sample
        except:
            # Fallback to character length if word generation fails
            iso_lengths.append(len(word) * 1000)

    total_iso_len = sum(iso_lengths)
    total_nat_dur = len(natural_samples) / sr
    
    word_timings = []
    current_offset = 0
    
    for i, word in enumerate(words):
        # Calculate weight of this word relative to total content
        weight = iso_lengths[i] / total_iso_len
        word_nat_dur = weight * total_nat_dur
        
        word_timings.append({
            "word": word,
            "start": round(current_offset, 3)
        })
        current_offset += word_nat_dur
        
    return word_timings

def generate_sectional_audio(target_id=None):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "kokoro.onnx")
    voices_path = os.path.join(script_dir, "voices.bin")
    output_dir = os.path.join(script_dir, "../public/audio/sections")
    
    if not os.path.exists(model_path) or not os.path.exists(voices_path):
        print(f"Error: Model files not found in {script_dir}.")
        return

    print("Initializing Kokoro engine...")
    kokoro = Kokoro(model_path, voices_path)
    
    all_sections = extract_sections()
    if target_id:
        sections = [s for s in all_sections if s['id'] == target_id]
    else:
        sections = all_sections

    print(f"Processing {len(sections)} sections...")
    os.makedirs(output_dir, exist_ok=True)
    
    sample_rate = 24000
    
    for i, section in enumerate(sections):
        start_time = time.time()
        print(f"\n[{i+1}/{len(sections)}] Section: {section['id']} ({section['title']})")
        
        section_samples = []
        timing = []
        current_time_offset = 0
        
        segments = [section['title']]
        if section['subtitle']:
            segments.append(section['subtitle'])
        segments.append(section['content'])
        
        total_sentences = 0
        for seg in segments:
            total_sentences += len(re.split(r'(?<=[.!?])\s+', seg.strip()))

        with tqdm(total=total_sentences, desc="  Timing", unit="sent", leave=False) as pbar:
            for segment in segments:
                sentences = re.split(r'(?<=[.!?])\s+', segment.strip())
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        pbar.update(1)
                        continue
                        
                    try:
                        # 1. Generate natural audio for sentence
                        samples, sr = kokoro.create(sentence, voice="bm_lewis", speed=1.0, lang="en-gb")
                        sample_rate = sr
                        
                        # 2. Calculate proportional timings based on isolated measurements
                        words = split_into_words(sentence)
                        sentence_timing = calculate_precise_timings(kokoro, samples, words, sr)
                        
                        for t in sentence_timing:
                            t["start"] = round(t["start"] + current_time_offset, 3)
                            timing.append(t)
                        
                        section_samples.append(samples)
                        current_time_offset += len(samples) / sr
                            
                        # Add small silence
                        silence_dur = 0.3
                        silence = np.zeros(int(sr * silence_dur)) 
                        section_samples.append(silence)
                        current_time_offset += silence_dur
                    except Exception as e:
                        print(f"\n  Error in '{sentence[:30]}...': {e}")
                    
                    pbar.update(1)
                
                # Inter-segment silence
                segment_silence_dur = 0.2
                segment_silence = np.zeros(int(sample_rate * segment_silence_dur))
                section_samples.append(segment_silence)
                current_time_offset += segment_silence_dur

        if not section_samples:
            continue

        final_samples = np.concatenate(section_samples)
        wav_path = os.path.join(output_dir, f"{section['id']}.wav")
        sf.write(wav_path, final_samples, sample_rate)
        
        mp3_path = os.path.join(output_dir, f"{section['id']}.mp3")
        subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path], capture_output=True)
        os.remove(wav_path)

        json_path = os.path.join(output_dir, f"{section['id']}.json")
        with open(json_path, "w") as f:
            json.dump(timing, f, indent=2)
        
        elapsed = time.time() - start_time
        print(f"  Done in {elapsed:.1f}s -> {section['id']}.mp3")

    print("\nAll tasks completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate high-precision sectional TTS.")
    parser.add_argument("--section", type=str, help="ID of a specific section to generate (for testing)")
    args = parser.parse_args()
    generate_sectional_audio(args.section)
