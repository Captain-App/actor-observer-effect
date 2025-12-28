import React, { useState, useEffect, useRef } from 'react';
import { MicOff, MessageSquare, X } from 'lucide-react';
import { XAIRealtimeClient, XAIEvent } from '../lib/xai-realtime';
import { sections } from '../data/sections';

const FloatingChatBubble: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<XAIRealtimeClient | null>(null);

  const startChat = async () => {
    setIsConnecting(true);
    
    // Aggregate article content for context
    const context = sections.map(s => `${s.title}: ${s.content}`).join('\n\n');
    const instructions = `You are a helpful AI assistant (Grok) discussing the "CaptainApp Architecture" article. 
    Here is the content of the article for context:
    
    ${context}
    
    Greet the user warmly. You are in audio-only voice mode. Keep responses concise, conversational, and natural. 
    Focus on answering questions about the architecture, the roadmap, and the different apps mentioned in the article.`;

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
      }
    );

    clientRef.current = client;
    try {
      await client.init(instructions);
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
    return (
      <button
        onClick={() => { setIsActive(true); startChat(); }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50 group border-4 border-background"
      >
        <MessageSquare className="w-8 h-8 group-hover:hidden" />
        <span className="hidden group-hover:block font-bold text-[10px] uppercase tracking-widest px-2 text-center">Discuss</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col items-center p-8 space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
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

export default FloatingChatBubble;

