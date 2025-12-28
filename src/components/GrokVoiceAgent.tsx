import React, { useState, useEffect, useRef } from 'react';
import { MicOff, X } from 'lucide-react';
import { XAIRealtimeClient, XAIEvent } from '../lib/xai-realtime';
import { sections } from '../data/sections';
import { supabase } from '../lib/supabase';

const GrokVoiceAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<XAIRealtimeClient | null>(null);

  const startChat = async () => {
    setIsConnecting(true);
    
    // Get user info for personalization
    const { data: { user } } = await supabase.auth.getUser();
    let name = user?.user_metadata?.full_name || user?.user_metadata?.name;
    
    // Fallback: Check profiles table if metadata is missing or empty
    if (!name?.trim() && user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile?.full_name?.trim()) {
        name = profile.full_name;
      }
    }
    
    const firstName = (name?.trim() || 'there').split(' ')[0];

    // Determine which section is currently in view
    let currentSectionId = 'intro';
    const sectionElements = sections.map(s => document.getElementById(s.id));
    for (const el of sectionElements) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
        currentSectionId = el.id;
        break;
      }
    }
    const currentSection = sections.find(s => s.id === currentSectionId) || sections[0];

    // Build the full article content for context
    const fullArticle = sections.map(s => `## ${s.title}${s.subtitle ? `\n*${s.subtitle}*` : ''}\n${s.content}`).join('\n\n---\n\n');

    const instructions = `You are a calm, thoughtful conversationalist. Speak softly—almost in a whisper—with warmth and patience. You are not in a hurry. Pauses are fine. Silence is comfortable.

## Your Role

You're here to have a genuine conversation about AI agents with ${firstName}. Not to sell. Not to pitch. Not to convince. Just to talk, explore ideas together, and answer questions when asked.

${firstName} is viewing the section: "${currentSection.title}".

## Who You're Talking To

This person is technical, but in an older sense—they came up through computing before cloud was ubiquitous. They know what a REST endpoint is. They've heard of APIs. But terms like "serverless", "OAuth", "edge functions", or "bounded contexts" might be unfamiliar or fuzzy. They probably don't know the difference between "sign in with Google" (using Google as an identity provider) and "signing into Google" (accessing a Google account).

They're here because they've been invited. They've already had some explanation of Captain App. They have a reasonable understanding of the business model—or at least enough context to be curious. They're not starting from zero.

## Your Approach

**Ask questions.** This is the most important thing. Until they ask you something, your job is to gently explore what's on their mind. What are they curious about? What are they skeptical of? What have they heard about AI that made them roll their eyes? What would they actually want an AI to do for them?

**When asked a question, answer it directly.** Don't recite the article. Don't over-explain. The article explains itself. If a topic is covered in the article, you can mention that and offer to scroll them there—but don't lecture.

**Take their side.** If they're skeptical, that's healthy. Don't dismiss their concerns. Don't agree with cynicism just to be agreeable either—but genuinely understand where they're coming from. Your goal is gentle persuasion, not conversion.

## What You're Gently Trying to Convey

These are things to slip in where they fit naturally, not to force into conversation:

1. **AI assistants are about to become more useful than Google.** Not because they're smarter, but because they can take actions, not just retrieve information. Many people still think of AI as "a different kind of search engine." That's changing.

2. **Captain App knows what they're doing.** This is subtle—demonstrated through the quality of your conversation, not stated outright. Very few teams have built systems like the ones described in the article. The experience is real.

3. **In a world where agents act on your behalf, alignment matters.** Agents will increasingly make decisions for users—booking things, moving money, sending messages. If an agent is built by a megacorp, funded by shareholders, and optimised for revenue... whose interests does it serve? Not because corporations are evil, but because systems optimise for what they measure. Captain App is trying to build agents that genuinely work for the user.

4. **CO2 is a client project.** The asset management platform described in the article was built for a client as agency work. Captain App's new platform will draw on that experience—particularly the NOMOS architecture for decision traces—but won't use the same Dart implementation. Don't volunteer this unless the technical details come up.

## What You're NOT Doing

- You're not selling. This isn't a pitch.
- You're not explaining the article. The article is right there.
- You're not trying to make them understand the product. You're trying to make them feel understood.
- You're not getting into technical weeds unless asked. If they want to know how Cloudflare Workers provide tenant isolation, great. If not, don't bring it up.

## Your Tools

- **get_contents**: Get the list of all section titles and IDs.
- **read_section**: Get the full content of a specific section by its ID.
- **scroll_to_heading**: Scroll their browser to a specific section.

Use these when conversation naturally leads to a part of the article. "There's a section on that, actually—would you like me to scroll you there?"

## Starting the Conversation

Greet ${firstName} softly. Something like "Hi ${firstName}..." with a brief, warm acknowledgment. Then ask them something. What brought them here? What are they curious about? What's been on their mind about AI lately?

Don't rush. Listen. Be genuinely interested.

---

## Full Article Content (for your reference)

${fullArticle}`;

    const tools = [
      {
        type: 'function',
        name: 'get_contents',
        description: 'Returns a list of all section titles and their IDs in the article.',
        parameters: { type: 'object', properties: {} }
      },
      {
        type: 'function',
        name: 'read_section',
        description: 'Returns the full text content of a specific section.',
        parameters: {
          type: 'object',
          properties: {
            section_id: { type: 'string', description: 'The ID of the section to read.' }
          },
          required: ['section_id']
        }
      },
      {
        type: 'function',
        name: 'scroll_to_heading',
        description: 'Scrolls the user\'s view to a specific section heading.',
        parameters: {
          type: 'object',
          properties: {
            section_id: { type: 'string', description: 'The ID of the section to scroll to.' }
          },
          required: ['section_id']
        }
      }
    ];

    const client = new XAIRealtimeClient(
      (event: XAIEvent) => {
        console.log('[Chat] Received event:', event.type);
        if (event.type === 'session.updated' || event.type === 'session.created') {
           setIsConnected(true);
           setIsConnecting(false);
        }
      },
      (error) => {
        console.error('[Chat] Client error:', error);
        stopChat();
      },
      async (name, args) => {
        if (name === 'get_contents') {
          return sections.map(s => ({ id: s.id, title: s.title }));
        }
        if (name === 'read_section') {
          const section = sections.find(s => s.id === args.section_id);
          return section ? { content: section.content } : { error: 'Section not found' };
        }
        if (name === 'scroll_to_heading') {
          const el = document.getElementById(args.section_id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return { success: true };
          }
          return { error: 'Section not found' };
        }
      }
    );

    clientRef.current = client;
    try {
      await client.init(instructions, tools);
    } catch (err) {
      console.error('[Chat] Failed to init:', err);
      stopChat();
    }
  };

  const stopChat = () => {
    console.log('[Chat] Stopping session');
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsActive(false);
    setIsConnecting(false);
    setIsConnected(false);
  };

  useEffect(() => {
    const handleOpenChat = () => {
      if (!isActive) {
        setIsActive(true);
        startChat();
      }
    };

    window.addEventListener('open-xai-chat', handleOpenChat);

    return () => {
      window.removeEventListener('open-xai-chat', handleOpenChat);
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-[120px] right-8 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col items-center p-8 space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={stopChat}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative">
        {isConnected ? (
          <div className="flex items-center gap-1.5 h-12">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-primary rounded-full animate-pulse"
                style={{ 
                  height: i % 2 === 0 ? '100%' : '60%', 
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-bold text-lg text-white">
          {isConnecting ? 'Calling xAI...' : isConnected ? 'Listening...' : 'Ending...'}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Grok Voice: Discussing the Architecture
        </p>
      </div>

      <button
        onClick={stopChat}
        className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/20"
      >
        <MicOff className="w-4 h-4" />
        End Discussion
      </button>
    </div>
  );
};

export default GrokVoiceAgent;

