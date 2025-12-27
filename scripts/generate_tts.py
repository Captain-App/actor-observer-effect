import json
import os
import sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

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
    
    article_text = """
    CaptainApp: The Truth in the Data.
    Removing decision latency for the modern UK SME.
    Picture a typical UK SME on a Tuesday morning. The Managing Director has one question in their head: Are we actually doing alright? Not vibes. Not 'it feels busy'. The real version. What’s cash looking like, right now? Which invoices are drifting? Who owes us money, and how late are they? Which subscriptions are creeping up month-on-month? If we push on hiring, do we stay safe—or do we wobble? And the uncomfortable truth is: the answers are in the business already... just scattered across systems.
    Fragmentation and decision latency.
    Xero knows the truth about invoices and debtors. Stripe knows revenue and churn. WhatsApp is where people actually respond. And the problem isn’t a lack of data. It’s friction. It’s fragmentation. It’s decision latency. CaptainApp’s agent platform is being built to remove that latency. Not by adding another dashboard, but by giving decision makers a simple interface they already use—WhatsApp—and letting them ask plain-English questions that get answered with grounded, auditable summaries.
    Approaching agents differently.
    We’re not building a chatbot that guesses. We’re building an accountable decision layer—an agent that can show its working, and rewind its own history. We’ve been leaning hard into event-sourced thinking—especially the idea that the most valuable thing you can store isn’t the current state... it’s how you got there. Internally, we’ve discussed building systems around a ledger of intents—a record of 'what the user meant to do'—and the resulting directives and events, so you can audit, replay, and even fast-forward a system through time.
    Traceability, Governance, Reversibility.
    This matters because agents are just software that takes actions on your behalf. And if software takes actions on your behalf, you need Traceability: what did it do, and why? Governance: who approved it, and under what policy? And Reversibility: can you undo, compensate, or correct it? In other words: audit logs shouldn’t be a compliance afterthought. They should be the product.
    What the platform will do.
    The inward-facing agent gives you the truth. A director messages: 'Who owes us money right now?' The agent pulls from connected systems like Xero and Stripe, aggregates, and replies with a short answer, a breakdown, and a link to a visual timeline. The outward-facing agent gets the money in. SMEs often don't have time to chase debtors consistently. We’ll offer outward-reaching agents that can send debtor reminders carefully and compliantly: 'Invoice #1042 is now overdue—would you like to pay by card or bank transfer?' This is controlled, reputable comms—more like an assistant than a debt collector.
    WhatsApp first, but not WhatsApp-only.
    WhatsApp is our primary front door, but the rules can change. Meta's updated terms effective January 2026 require specific customer service automation. Our strategy is WhatsApp for adoption, but a CaptainApp portal as the control plane. The portal is where you connect integrations, control permissions, manage billing, and review the agent's story-like history. A normal audit log is a crime against the human attention span. Ours reads like a story: 'Jack asked: What’s overdue? Agent pulled invoices from Xero. Agent drafted reminders. Admin approved. Messages sent.'
    Execution: OpenCode and Cloudflare.
    If you want agents that are safe and scalable, you need a strong execution model. Cloudflare Workers give us isolates—lightweight, fast-starting sandboxed environments. Every SME gets a logically isolated agent runtime. OpenCode becomes the agent framework we build on top—our orchestration layer and tool system—while Cloudflare provides the sandbox and distribution. Compute scales elastically—without forcing customers into 'Kubernetes brain'.
    The Roadmap.
    Stage 1 is the Foundation: defining the intent protocol and implementing the audit timeline early. Stage 2 is Integrations: starting with Xero and Stripe OAuth workflows. Stage 3 is the Channel: WhatsApp via Twilio with human-in-the-loop approvals. Stage 4 is the Portal: onboarding, roles, and Stripe-based billing. Stage 5 is Hosted Execution: deploying tenant agents onto Cloudflare isolates. Finally, Stage 6 is Solutions: providing packaged outcomes like reduced aged receivables and faster reporting.
    Packaged outcomes, not AI.
    We're not just 'integrating Xero'. We're reducing your aged receivables by 18% in 60 days. We're cutting month-end reporting time from 2 days to 30 minutes. We're stopping surprise subscription creep. The agent becomes a productised workflow, sold as an outcome to UK SMEs. This is the future of CaptainApp.
    Appendix 1: The Ghostly Tech Stack.
    Case Study: captainapp.co.uk.
    To understand the foundation of CaptainApp, we look at the existing 'Ghostly' architecture that powers captainapp.co.uk. This is a battle-tested production environment comprising over 1,200 files and 200 edge functions, designed for high-stakes agent orchestration.
    Domain: Frontend and Presentation.
    The frontend is a sophisticated React 18 application built on a Domain-Driven Design structure. It features a custom 'Artefact' system for real-time document collaboration, complex Graphviz-powered conversation visualizations, and a robust Admin control plane for managing multi-tenant organizations and project hierarchies. State is managed via specialized contexts and a massive library of over 100 custom hooks for everything from presence tracking to real-time Excel-diffing.
    Domain: Backend and Serverless.
    The backbone is Supabase, running a highly optimized PostgreSQL schema with over 500 migrations. The logic layer consists of 250 plus Deno Edge Functions. These aren't just endpoints; they are specialized workers handling everything from real-time PDF generation and SendGrid domain verification to complex financial aggregations for Xero and Stripe.
    Domain: AI Orchestration.
    AI isn't a bolt-on; it's the core. The system runs an 'Agent Town' simulation with specialized personas (CEO, CFO, COO, SRE) that collaborate via the Model Context Protocol. These agents have access to a rich toolbelt: executing Python in sandboxes, generating SQL, and even launching 'Cursor Agents' to perform code changes autonomously.
    Domain: Integrations and Infrastructure.
    Infrastructure is truly multi-cloud. It maps business relationships into Neo4j for graph-based insights, synchronizes deep HR data from Rippling, and bridges plain-text WhatsApp conversations via Twilio. The entire stack is enforced with Vitest and Playwright, ensuring that every automated reminder or financial summary is grounded and accurate.
    """

    print("Generating audio in chunks...")
    
    # Split text into sentences for better processing
    import re
    sentences = re.split(r'(?<=[.!?])\s+', article_text.strip())
    
    all_samples = []
    sample_rate = 24000 # Kokoro default
    
    timing = []
    current_time_offset = 0
    
    for sentence in sentences:
        if not sentence.strip():
            continue
            
        print(f"Processing: {sentence[:50]}...")
        samples, sr = kokoro.create(
            sentence.strip(), 
            voice="bm_lewis", 
            speed=1.0, 
            lang="en-gb"
        )
        sample_rate = sr
        all_samples.append(samples)
        
        # Calculate timing for this chunk
        words = sentence.strip().split()
        duration = len(samples) / sr
        avg_word_dur = duration / len(words)
        
        for word in words:
            timing.append({
                "word": word,
                "start": round(current_time_offset, 3)
            })
            current_time_offset += avg_word_dur
            
        # Add a small silence between sentences
        silence = np.zeros(int(sr * 0.3)) # 0.3s silence
        all_samples.append(silence)
        current_time_offset += 0.3

    final_samples = np.concatenate(all_samples)
    
    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, "article.wav")
    
    sf.write(audio_path, final_samples, sample_rate)
    print(f"Audio saved to {audio_path}")

    timing_path = os.path.join(output_dir, "timing.json")
    with open(timing_path, "w") as f:
        json.dump(timing, f, indent=2)
    print(f"Timing data saved to {timing_path}")

if __name__ == "__main__":
    generate_article_audio()
