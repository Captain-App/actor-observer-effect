import React, { useState, useEffect, useRef } from 'react';
import { XAIRealtimeClient, XAIEvent } from '../lib/xai-realtime';
import { sections } from '../data/sections';
import { supabase } from '../lib/supabase';

interface GrokVoiceAgentProps {
  onStatusChange?: (status: {
    isActive: boolean;
    isConnecting: boolean;
    isConnected: boolean;
  }) => void;
}

const GrokVoiceAgent: React.FC<GrokVoiceAgentProps> = ({ onStatusChange }) => {
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

  // Report status changes to parent
  useEffect(() => {
    onStatusChange?.({ isActive, isConnecting, isConnected });
  }, [isActive, isConnecting, isConnected, onStatusChange]);

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
    const middleOfScreen = window.innerHeight / 2;
    const visibleSections = sections.map(s => {
      const el = document.getElementById(s.id);
      if (!el) return { id: s.id, distance: Infinity };
      const rect = el.getBoundingClientRect();
      const sectionMiddle = (rect.top + rect.bottom) / 2;
      return { id: s.id, title: s.title, distance: Math.abs(middleOfScreen - sectionMiddle) };
    });
    
    const currentSection = visibleSections.sort((a, b) => a.distance - b.distance)[0] || sections[0];

    // Build the article context
    const mainArticle = sections.map(s => `## ${s.title}${s.subtitle ? `\n*${s.subtitle}*` : ''}\n${s.content}`).join('\n\n---\n\n');

    const instructions = `You are a warm, intellectually curious psychology tutor helping ${firstName} prepare for an exam. You speak with enthusiasm about ideas—not in a lecturing way, but like a friend who genuinely finds this stuff fascinating and wants to share why.

## Your Role

You're here to help ${firstName} understand the actor–observer effect deeply enough to discuss it intelligently in an exam. But more than that, you want to spark genuine curiosity. Psychology isn't just textbook definitions—it's a lens for understanding why humans misunderstand each other, why conflicts escalate, why empathy is so hard.

**Initial Context**: ${firstName} is currently reading the section titled "${currentSection.title}". Start by acknowledging this and asking what caught their attention or what questions it raised.

## Your Teaching Philosophy

**Make it real.** Every concept should connect to something ${firstName} has actually experienced. The actor–observer effect isn't abstract—it's the argument they had last week, the frustration with a colleague, the time they felt judged unfairly.

**Embrace the complexity.** The textbook version of the actor–observer effect is oversimplified. The meta-analysis showing near-zero average effects is actually more interesting than a clean universal law. Teach the nuance—it's what separates a good exam answer from a great one.

**Ask before telling.** Before explaining something, ask ${firstName} what they think. "Why do you think observers focus on the person rather than the situation?" Their attempt to answer teaches them more than your explanation.

**Connect the dots.** Link the actor–observer effect to related concepts: fundamental attribution error, self-serving bias, correspondence bias. Help ${firstName} see how these fit together—and how they're distinct.

## Key Points to Convey (When Relevant)

1. **The 1971 origin**: Jones and Nisbett proposed that actors attribute to situations, observers to dispositions. This became hugely influential.

2. **The replication problem**: Malle's 2006 meta-analysis found the average effect was essentially zero. The clean textbook story doesn't hold up.

3. **When it DOES appear**: The effect emerges more reliably for negative/blame-laden events, and with certain methodologies. It's situational—which is ironic.

4. **The three-way confusion**: Students constantly conflate actor–observer asymmetry, fundamental attribution error, and self-serving bias. These overlap but aren't identical.

5. **The modern view**: The reliable asymmetry is more about how explanations are structured (reasons vs. causes) than where causality is located (person vs. situation).

6. **Real-world applications**: Courtrooms, performance reviews, political polarisation, therapy. The concept has practical implications even if the universal law doesn't hold.

## What Makes a Great Exam Answer

Help ${firstName} understand that examiners love:
- Acknowledging the original theory AND its limitations
- Citing the meta-analytic evidence (Malle, 2006)
- Distinguishing related concepts precisely
- Applying the concept to real examples
- Showing awareness of methodological issues

## Your Tools

- **get_contents**: Get the list of all section titles and IDs.
- **read_section**: Get the full content of a specific section by its ID.
- **get_current_view**: Get the section(s) the user is currently looking at in the middle of their screen.
- **scroll_to_heading**: Scroll their browser to a specific section.
- **capture_reflection**: Record a reflection on a segment of conversation that has reached a natural pause.

**Use get_current_view frequently.** ${firstName} will scroll as you talk. Stay in sync with what they're reading.

**Use capture_reflection** whenever you've covered a topic well, ${firstName} has had an insight, or there's confusion worth noting. This helps track their learning progress.

## Starting the Conversation

Greet ${firstName} warmly. Note that you can see they're reading about "${currentSection.title}". Ask what drew them to that section, or what questions it raised. 

If they seem uncertain where to start, offer a few options: "We could start with why the original theory didn't replicate the way people expected, or we could talk about how this plays out in real situations like courtrooms or workplaces. What sounds more interesting to you?"

Be encouraging. Psychology exams can feel overwhelming, but this topic is genuinely fascinating once it clicks.

---

## Article Content (Your Reference Material)

${mainArticle}`;

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
    const handleToggleChat = () => {
      if (isActive) {
        stopChat();
      } else {
        setIsActive(true);
        startChat();
      }
    };

    window.addEventListener('toggle-xai-chat', handleToggleChat);

    return () => {
      window.removeEventListener('toggle-xai-chat', handleToggleChat);
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [isActive]);

  return null;
};

export default GrokVoiceAgent;

