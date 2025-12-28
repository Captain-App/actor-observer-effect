import json
import os
import re
import numpy as np
import soundfile as sf
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
        # Regex to handle escaped quotes: "((?:\\.|[^"])*)"
        title_match = re.search(r'title:\s*"((?:\\.|[^"])*)"', block)
        subtitle_match = re.search(r'subtitle:\s*"((?:\\.|[^"])*)"', block)
        content_match = re.search(r'content:\s*"((?:\\.|[^"])*)"', block)
        
        if title_match and content_match:
            title = title_match.group(1).replace('\\"', '"')
            subtitle = subtitle_match.group(1).replace('\\"', '"') if subtitle_match else None
            content_text = content_match.group(1).replace('\\"', '"')
            
            sections.append({
                "title": title,
                "subtitle": subtitle,
                "content": content_text
            })
            
    return sections

def generate_article_audio():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "kokoro.onnx")
    voices_path = os.path.join(script_dir, "voices.bin")
    output_dir = os.path.join(script_dir, "../public/audio")
    
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
    
    all_samples = []
    sample_rate = 24000 # Kokoro default
    
    timing = []
    current_time_offset = 0
    
    for i, section in enumerate(sections):
        print(f"--- Processing section {i+1}/{len(sections)}: {section['title']} ---")
        
        # Build text for this section
        section_text = section['title'] + ". "
        if section['subtitle']:
            section_text += section['subtitle'] + ". "
        section_text += section['content']
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', section_text.strip())
        
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
                all_samples.append(samples)
                
                # Calculate timing
                words = sentence.split()
                duration = len(samples) / sr
                avg_word_dur = duration / len(words) if words else 0
                
                for word in words:
                    # Clean word for timing (remove punctuation for better matching if needed, 
                    # but original script kept it)
                    timing.append({
                        "word": word,
                        "start": round(current_time_offset, 3)
                    })
                    current_time_offset += avg_word_dur
                    
                # Add a small silence between sentences
                silence = np.zeros(int(sr * 0.3)) 
                all_samples.append(silence)
                current_time_offset += 0.3
            except Exception as e:
                print(f"  Error processing sentence: {e}")
                continue
        
        # Add a longer silence between sections
        section_silence = np.zeros(int(sample_rate * 0.7)) 
        all_samples.append(section_silence)
        current_time_offset += 0.7

    if not all_samples:
        print("Error: No audio generated")
        return

    print("Concatenating audio segments...")
    final_samples = np.concatenate(all_samples)
    
    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, "article.wav")
    
    print(f"Saving audio to {audio_path}...")
    sf.write(audio_path, final_samples, sample_rate)
    print(f"Audio saved successfully.")

    timing_path = os.path.join(output_dir, "timing.json")
    print(f"Saving timing data to {timing_path}...")
    with open(timing_path, "w") as f:
        json.dump(timing, f, indent=2)
    print(f"Timing data saved successfully.")

if __name__ == "__main__":
    generate_article_audio()
