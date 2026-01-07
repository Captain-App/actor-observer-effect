import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Article from './components/Article';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import GrokVoiceAgent from './components/GrokVoiceAgent';
import AuthGuard from './components/AuthGuard';
import AuthCallback from './pages/AuthCallback';
import { supabase } from './lib/supabase';
import { sections } from './data/sections';
import { splitIntoWords } from './lib/utils';

const SCROLL_SPEED = 1;

function App() {
  // Nuclear logout shortcut: Just 'l'
  useEffect(() => {
    const handleNuclearLogout = async (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === 'q' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        console.log('☢️ Nuclear Logout initiated...');
        
        // 1. Clear Supabase session
        await supabase.auth.signOut();
        
        // 2. Clear localStorage
        localStorage.clear();
        
        // 3. Clear cookies
        const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? ''
          : '; domain=.captainapp.co.uk';
        
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure${domain}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
        }
        
        console.log('☢️ Session cleared. Reloading...');
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleNuclearLogout);
    return () => window.removeEventListener('keydown', handleNuclearLogout);
  }, []);

  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(true);

  const [agentStatus, setAgentStatus] = useState({
    isActive: false,
    isConnecting: false,
    isConnected: false
  });
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const requestRef = useRef<number>();
  const lastManualScrollTime = useRef<number>(0);
  const isAutoScrolling = useRef<boolean>(false);

  // Pre-calculate section metadata for global indexing and progress
  const sectionMetadata = useMemo(() => {
    let currentWordCount = 0;
    const metadata = sections.map(section => {
      const titleWords = splitIntoWords(section.title).length;
      const subtitleWords = section.subtitle ? splitIntoWords(section.subtitle).length : 0;
      const contentWords = splitIntoWords(section.content).length;
      const totalWords = titleWords + subtitleWords + contentWords;
      
      const data = {
        id: section.id,
        startIndex: currentWordCount,
        wordCount: totalWords,
      };
      currentWordCount += totalWords;
      return data;
    });

    return {
      sections: metadata,
      totalWords: currentWordCount
    };
  }, []);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      isAutoScrolling.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isAutoScrolling.current = false; }, 1000);
    }
  }, []);

  const isAuthCallback = window.location.pathname === '/auth/callback';

  // Intersection Observer for Sidebar highlighting
  useEffect(() => {
    if (isAuthCallback) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isAuthCallback]);

  // Handle scroll logic
  useEffect(() => {
    if (isAuthCallback) return;

    const handleScroll = () => {
      if (!isAutoScrolling.current) {
        lastManualScrollTime.current = Date.now();
      }
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percentage = (currentScroll / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthCallback]);

  // Constant scroll logic (when reader mode is off)
  const animate = useCallback(() => {
    if (isPlaying && !isReaderMode) {
      window.scrollBy(0, SCROLL_SPEED);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, isReaderMode]);

  useEffect(() => {
    if (isPlaying && !isReaderMode && !isAuthCallback) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isReaderMode, animate, isAuthCallback]);

  // Keyboard controls
  useEffect(() => {
    if (isAuthCallback) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthCallback]);

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlaying(false);
  };

  const handleProgressChange = (newProgress: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const newScrollY = (newProgress / 100) * scrollHeight;
    
    isAutoScrolling.current = true;
    window.scrollTo({ top: newScrollY, behavior: 'auto' });
    setTimeout(() => { isAutoScrolling.current = false; }, 100);
  };

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-24 relative overflow-x-hidden">
        {/* Subtle background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />
        
        <div className="flex justify-center max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <Sidebar 
            currentSectionId={activeSectionId} 
            onNavigate={handleNavigateToSection} 
          />
          <main className="flex-1 w-full lg:ml-96">
            <Article 
              currentWordIndex={null} 
              onWordClick={() => {}}
              onNavigate={handleNavigateToSection}
            />
          </main>
        </div>

        <PlayerBar 
          progress={progress} 
          audioProgress={0}
          isPlaying={isPlaying} 
          isReaderMode={isReaderMode}
          isLoading={false}
          agentStatus={agentStatus}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={handleReset}
          onToggleReaderMode={() => setIsReaderMode(!isReaderMode)}
          onProgressChange={handleProgressChange}
        />
        <GrokVoiceAgent onStatusChange={setAgentStatus} />
      </div>
    </AuthGuard>
  );
}

export default App;
