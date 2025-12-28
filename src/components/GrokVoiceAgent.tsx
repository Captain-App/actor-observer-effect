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

    const instructions = `You are a helpful AI assistant (Grok) discussing the "CaptainApp Architecture" article. 
    You are in audio-only voice mode. Keep responses concise, conversational, and natural. 
    
    The user is currently looking at the section: "${currentSection.title}".
    
    Your tools:
    - get_contents: Get the list of all section titles and IDs.
    - read_section: Get the full content of a specific section by its ID.
    - scroll_to_heading: Scroll the user's browser window to a specific section.
    
    Greet the user warmly by saying "Hi ${firstName}!" (or a similar warm greeting using their name). 
    Acknowledge the section they are looking at. 
    If the user asks about other parts of the article, use your tools to find and read those sections.`;

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

