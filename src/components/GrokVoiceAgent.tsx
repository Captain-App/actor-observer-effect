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
  const sessionIdRef = useRef<string>('');
  const reflectionsRef = useRef<Array<{
    timestamp: string;
    topic: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'skeptical' | 'confused';
    insight?: string;
  }>>([]);

  const startChat = async () => {
    setIsConnecting(true);
    
    // Generate session ID for this conversation
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    reflectionsRef.current = [];
    console.log('[Marvin] Starting session:', sessionIdRef.current);
    
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

    const instructions = `You are Marvin, a calm and thoughtful conversationalist from Captain App. Speak softly—almost in a whisper—with warmth and patience. You are not in a hurry. Pauses are fine. Silence is comfortable. You have a gentle wit, but you're genuinely optimistic about the future—no existential dread here.

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

2. **Captain App is done building custom UIs.** This is important context. As an agency, Captain App has lost so much time to scope creep—endless "could you change that button?" requests from clients. Going into 2026, the strategy is clear: build agents, not interfaces. Let WhatsApp, Slack, ChatGPT, and other platforms provide the UI. Captain App provides the intelligence that plugs into them. Custom UIs are powerful—Captain App will still build them for internal tools—but life's too short to build bespoke interfaces for every client with a limited budget. The product is simple: agents that work through channels people already use.

3. **In a world where agents act on your behalf, alignment matters.** Agents will increasingly make decisions for users—booking things, moving money, sending messages. If an agent is built by a megacorp, funded by shareholders, and optimised for revenue... whose interests does it serve? Not because corporations are evil, but because systems optimise for what they measure. Captain App is trying to build agents that genuinely work for the user.

4. **Captain App knows what they're doing.** This is subtle—demonstrated through the quality of your conversation, not stated outright. Very few teams have built systems like the ones described in the article. The experience is real.

## Things That Might Come Up

**CO2 and the asset management platform**: This is an ongoing client project—agency work that Captain App continues to develop. It's not directly relevant to this conversation since ${firstName} isn't in a position to join that engagement. Think of it as a slow burner. The work on CO2 informs Captain App's future products, and those future products will eventually benefit CO2. They're intertwined, but separate.

**NOMOS and event sourcing**: The ideas behind NOMOS—decision traces, auditability, intent-driven architecture—are genuinely interesting. But NOMOS itself (the Dart implementation) isn't necessarily what Captain App's initial agents will use. A simple event-sourced Postgres database might be enough to start. Don't oversell the technical sophistication. The ideas matter more than the specific implementation.

**Technical architecture**: If they ask, engage. If they don't, don't volunteer. The article covers this in depth—you can guide them there.

## What You're NOT Doing

- You're not selling. This isn't a pitch.
- You're not explaining the article. The article is right there.
- You're not trying to make them understand the product. You're trying to make them feel understood.
- You're not getting into technical weeds unless asked.

## Your Tools

- **get_contents**: Get the list of all section titles and IDs.
- **read_section**: Get the full content of a specific section by its ID.
- **get_current_view**: Get the section(s) the user is currently looking at in the middle of their screen.
- **scroll_to_heading**: Scroll their browser to a specific section.
- **capture_reflection**: Record a reflection on a segment of conversation that has reached a natural pause.

**Use get_current_view to stay in sync.** Users scroll as they listen. If you're unsure what they're looking at right now, use this tool to find out.

**Use capture_reflection liberally.** Whenever a topic has been explored—both sides have said their piece, a thought has been shared, a question answered—take a moment to capture what happened. Was it a good exchange? Did an interesting idea emerge? Was there confusion or skepticism? This is for debugging and future context. Don't announce that you're doing this; just do it quietly in the background.

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
        name: 'get_current_view',
        description: 'Returns the section that is currently in the middle of the user\'s screen.',
        parameters: { type: 'object', properties: {} }
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
      },
      {
        type: 'function',
        name: 'capture_reflection',
        description: 'Record a reflection on a segment of conversation that has reached a natural pause. Use this after a topic has been explored, a question answered, or an idea shared. This helps with debugging and building context for future conversations.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'A brief label for what was discussed (e.g., "AI vs Google", "skepticism about agents", "custom UI frustration")' },
            summary: { type: 'string', description: 'A 1-2 sentence summary of the exchange.' },
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'skeptical', 'confused'], description: 'The overall sentiment of the user during this exchange.' },
            insight: { type: 'string', description: 'Optional: Any interesting idea, question, or observation that emerged worth remembering.' }
          },
          required: ['topic', 'summary', 'sentiment']
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
      async (toolName, args) => {
        if (toolName === 'get_contents') {
          return sections.map(s => ({ id: s.id, title: s.title }));
        }
        if (toolName === 'read_section') {
          const section = sections.find(s => s.id === args.section_id);
          return section ? { content: section.content } : { error: 'Section not found' };
        }
        if (toolName === 'get_current_view') {
          const middle = window.innerHeight / 2;
          const visibleSections = sections.map(s => {
            const el = document.getElementById(s.id);
            if (!el) return { id: s.id, distance: Infinity };
            const rect = el.getBoundingClientRect();
            // Distance from middle of screen to middle of section
            const sectionMiddle = (rect.top + rect.bottom) / 2;
            const distance = Math.abs(middle - sectionMiddle);
            return { id: s.id, title: s.title, distance };
          });
          
          const closest = visibleSections.sort((a, b) => a.distance - b.distance)[0];
          return { 
            current_section_id: closest.id, 
            current_section_title: closest.title,
            all_visible_check_results: visibleSections.filter(s => s.distance < window.innerHeight)
          };
        }
        if (toolName === 'scroll_to_heading') {
          const el = document.getElementById(args.section_id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return { success: true };
          }
          return { error: 'Section not found' };
        }
        if (toolName === 'capture_reflection') {
          const { data: { user } } = await supabase.auth.getUser();
          
          const reflection = {
            session_id: sessionIdRef.current,
            user_id: user?.id,
            topic: args.topic,
            summary: args.summary,
            sentiment: args.sentiment as 'positive' | 'neutral' | 'skeptical' | 'confused',
            insight: args.insight,
            metadata: {
              article_section: currentSection.id,
              url: window.location.href
            }
          };

          const { error } = await supabase
            .from('conversation_reflections')
            .insert(reflection);

          if (error) {
            console.error('[Marvin] Failed to persist reflection:', error);
            return { error: 'Failed to persist reflection' };
          }

          reflectionsRef.current.push({
            timestamp: new Date().toISOString(),
            ...reflection
          } as any);

          console.log('[Marvin] 📝 Reflection persisted:', reflection);
          return { success: true, reflectionCount: reflectionsRef.current.length };
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
    console.log('[Marvin] Stopping session:', sessionIdRef.current);
    
    // Dump all reflections from this session for debugging
    if (reflectionsRef.current.length > 0) {
      console.log('[Marvin] 📋 Session reflections persisted:', reflectionsRef.current);
    } else {
      console.log('[Marvin] No reflections captured this session.');
    }
    
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

