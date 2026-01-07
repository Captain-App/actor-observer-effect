import React, { useState, useEffect, useRef, useCallback } from 'react';
import Article from './components/Article';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import GrokVoiceAgent from './components/GrokVoiceAgent';
import AuthGuard from './components/AuthGuard';
import AuthCallback from './pages/AuthCallback';
import { supabase } from './lib/supabase';
import { sections } from './data/sections';

const SCROLL_SPEED = 1;

function App() {
  // Nuclear logout shortcut: Shift+Q
  useEffect(() => {
    const handleNuclearLogout = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === 'q' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        console.log('☢️ Nuclear Logout initiated...');
        await supabase.auth.signOut();
        localStorage.clear();
        
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

  const [agentStatus, setAgentStatus] = useState({
    isActive: false,
    isConnecting: false,
    isConnected: false
  });
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const requestRef = useRef<number>();
  const isAutoScrolling = useRef<boolean>(false);

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

  // Handle scroll progress tracking
  useEffect(() => {
    if (isAuthCallback) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percentage = (currentScroll / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthCallback]);

  // Auto-scroll animation when playing
  const animate = useCallback(() => {
    if (isPlaying) {
      window.scrollBy(0, SCROLL_SPEED);
      
      // Update progress directly since scroll events may be throttled
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percentage = (currentScroll / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, percentage)));
      
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && !isAuthCallback) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate, isAuthCallback]);

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
          isPlaying={isPlaying} 
          agentStatus={agentStatus}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={handleReset}
          onProgressChange={handleProgressChange}
        />
        <GrokVoiceAgent onStatusChange={setAgentStatus} />
      </div>
    </AuthGuard>
  );
}

export default App;
