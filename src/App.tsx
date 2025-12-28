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
const AUTO_SCROLL_DELAY = 5000; // 5 seconds pause after manual scroll
const SYNC_LOOKAHEAD = 0.045; // Reduced by 70% from 0.15 to be more immediate

interface TimingWord {
  word: string;
  start: number;
}

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
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [audioIsLoading, setAudioIsLoading] = useState(false);
  const [timingIsLoading, setTimingIsLoading] = useState(false);
  
  // Overall loading state is true if either audio or timing data is missing
  useEffect(() => {
    setIsLoading(audioIsLoading || timingIsLoading);
  }, [audioIsLoading, timingIsLoading]);

  const [agentStatus, setAgentStatus] = useState({
    isActive: false,
    isConnecting: false,
    isConnected: false
  });
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [timingData, setTimingData] = useState<Record<string, TimingWord[]>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>();
  const syncRequestRef = useRef<number>();
  const lastManualScrollTime = useRef<number>(0);
  const isAutoScrolling = useRef<boolean>(false);
  const lastWordIdxRef = useRef<number>(-1);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check actual status of audio element relative to current section
    const checkAudioStatus = () => {
      const currentSrc = `/audio/sections/${sections[currentSectionIndex].id}.mp3`;
      const actualSrc = audio.getAttribute('src') || audio.src;
      
      // If the src is wrong, it's definitely loading
      if (!actualSrc.includes(currentSrc)) {
        setAudioIsLoading(true);
        return;
      }

      // If readyState is 3 (future data) or 4 (enough data), it's not loading
      if (audio.readyState >= 3) {
        setAudioIsLoading(false);
      } else {
        setAudioIsLoading(true);
      }
    };

    const handleLoadStart = () => setAudioIsLoading(true);
    const handleCanPlay = () => setAudioIsLoading(false);
    const handleWaiting = () => setAudioIsLoading(true);
    const handlePlaying = () => setAudioIsLoading(false);
    const handleStalled = () => {
      // Stalled just means it's not currently downloading, but might have enough data
      if (audio.readyState < 3) setAudioIsLoading(true);
      else setAudioIsLoading(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('loadeddata', checkAudioStatus);
    audio.addEventListener('progress', checkAudioStatus);

    // Initial check
    checkAudioStatus();

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('loadeddata', checkAudioStatus);
      audio.removeEventListener('progress', checkAudioStatus);
    };
  }, [currentSectionIndex]);

  // Monitor current section timing availability with a timeout fallback
  useEffect(() => {
    const sectionId = sections[currentSectionIndex].id;
    
    if (timingData[sectionId]) {
      setTimingIsLoading(false);
      return;
    }

    setTimingIsLoading(true);
    loadSectionTiming(sectionId);

    // Fallback: If timing data takes too long or fails, don't stay stuck
    const timer = setTimeout(() => {
      setTimingIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentSectionIndex, timingData]);

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

  // Load timing for a specific section
  const loadSectionTiming = useCallback(async (sectionId: string) => {
    if (timingData[sectionId]) return;
    try {
      const res = await fetch(`/audio/sections/${sectionId}.json`);
      if (res.ok) {
        const data = await res.json();
        setTimingData(prev => ({ ...prev, [sectionId]: data }));
      } else {
        // Mark as empty so we don't keep retrying and stay in loading state
        setTimingData(prev => ({ ...prev, [sectionId]: [] }));
      }
    } catch (e) {
      console.error(`Failed to load timing for ${sectionId}`);
      setTimingData(prev => ({ ...prev, [sectionId]: [] }));
    }
  }, [timingData]);

  // Load first section immediately and then lazy-load others one by one
  useEffect(() => {
    const init = async () => {
      // 1. Prioritize the first section's data
      await loadSectionTiming(sections[0].id);
      
      // 2. Load the rest sequentially to avoid saturating the connection pool
      const loadOthers = async () => {
        for (const section of sections.slice(1)) {
          await loadSectionTiming(section.id);
          // Just hint to the browser to get metadata, don't saturate
          const audio = new Audio(`/audio/sections/${section.id}.mp3`);
          audio.preload = "metadata";
        }
      };
      
      loadOthers();
    };
    init();
  }, []);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    const sectionIdx = sections.findIndex(s => s.id === sectionId);
    if (sectionIdx !== -1) {
      setCurrentSectionIndex(sectionIdx);
      lastWordIdxRef.current = -1; // Reset for new section
      const metadata = sectionMetadata.sections[sectionIdx];
      setCurrentWordIndex(metadata.startIndex);
      
      if (audioRef.current) {
        audioRef.current.src = `/audio/sections/${sectionId}.mp3`;
        audioRef.current.currentTime = 0;
        if (isPlaying) audioRef.current.play();
      }
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      isAutoScrolling.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isAutoScrolling.current = false; }, 1000);
    }
  }, [sectionMetadata, isPlaying]);

  const handleWordClick = useCallback((globalWordIndex: number) => {
    const sectionIdx = sectionMetadata.sections.findIndex(
      (s, i) => {
        const nextStart = sectionMetadata.sections[i + 1]?.startIndex ?? Infinity;
        return globalWordIndex >= s.startIndex && globalWordIndex < nextStart;
      }
    );

    if (sectionIdx !== -1) {
      const metadata = sectionMetadata.sections[sectionIdx];
      const sectionId = metadata.id;
      const localWordIdx = globalWordIndex - metadata.startIndex;
      
      const setTime = () => {
        const sectionTiming = timingData[sectionId];
        if (sectionTiming && sectionTiming[localWordIdx] && audioRef.current) {
          audioRef.current.currentTime = sectionTiming[localWordIdx].start;
          setIsPlaying(true);
        }
      };

      if (audioRef.current) {
        if (currentSectionIndex !== sectionIdx) {
          setCurrentSectionIndex(sectionIdx);
          lastWordIdxRef.current = localWordIdx;
          setCurrentWordIndex(globalWordIndex);
          
          // Wait for the new section's metadata to load before seeking
          const playNewSection = () => {
            setTime();
            audioRef.current?.removeEventListener('loadedmetadata', playNewSection);
          };
          audioRef.current.addEventListener('loadedmetadata', playNewSection);
        } else {
          setTime();
        }
      }
    }
  }, [sectionMetadata, timingData, currentSectionIndex]);

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

  // Audio Sync Logic (High Precision with Lookahead)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isReaderMode || isAuthCallback) return;

    const syncWord = () => {
      const sectionId = sections[currentSectionIndex].id;
      const sectionTiming = timingData[sectionId];
      if (!sectionTiming) {
        syncRequestRef.current = requestAnimationFrame(syncWord);
        return;
      }
      
      const currentTime = audio.currentTime + SYNC_LOOKAHEAD;
      
      // Optimization: Start searching from the last found index
      let sectionWordIdx = -1;
      const startSearchIdx = Math.max(0, lastWordIdxRef.current);
      
      // Look forward first
      for (let i = startSearchIdx; i < sectionTiming.length; i++) {
        const t = sectionTiming[i];
        const nextStart = sectionTiming[i + 1]?.start ?? Infinity;
        if (currentTime >= t.start && currentTime < nextStart) {
          sectionWordIdx = i;
          break;
        }
      }

      // If not found (e.g. jumped back), search the whole array
      if (sectionWordIdx === -1) {
        sectionWordIdx = sectionTiming.findIndex((t, i) => {
          const nextStart = sectionTiming[i + 1]?.start ?? Infinity;
          return currentTime >= t.start && currentTime < nextStart;
        });
      }

      if (sectionWordIdx !== -1) {
        lastWordIdxRef.current = sectionWordIdx;
        const metadata = sectionMetadata.sections[currentSectionIndex];
        const globalWordIdx = metadata.startIndex + sectionWordIdx;
        
        if (globalWordIdx !== currentWordIndex) {
          setCurrentWordIndex(globalWordIdx);
          
          // Update audio progress
          const totalWords = sectionMetadata.totalWords;
          setAudioProgress((globalWordIdx / totalWords) * 100);

          // Auto-scroll logic
          const now = Date.now();
          if (now - lastManualScrollTime.current > AUTO_SCROLL_DELAY) {
            const element = document.getElementById('current-reading-word');
            if (element) {
              isAutoScrolling.current = true;
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { isAutoScrolling.current = false; }, 500);
            }
          }
        }
      }

      syncRequestRef.current = requestAnimationFrame(syncWord);
    };

    const handleEnded = () => {
      if (currentSectionIndex < sections.length - 1) {
        // Brief pause before next section
        setTimeout(() => {
          setCurrentSectionIndex(prev => prev + 1);
          lastWordIdxRef.current = -1; // Reset for next section
        }, 400); // 0.4 second pause
      } else {
        setIsPlaying(false);
      }
    };

    if (isPlaying) {
      syncRequestRef.current = requestAnimationFrame(syncWord);
    }

    audio.addEventListener('ended', handleEnded);
    return () => {
      if (syncRequestRef.current) cancelAnimationFrame(syncRequestRef.current);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, isReaderMode, timingData, currentWordIndex, currentSectionIndex, sectionMetadata, isAuthCallback]);

  // Play/Pause Control
  useEffect(() => {
    if (isAuthCallback) return;

    if (isPlaying) {
      if (isReaderMode && audioRef.current) {
        // Only call play if not already playing or if src just changed
        audioRef.current.play().catch(e => {
          // If play() was interrupted by a src change, it's fine
          if (e.name !== 'AbortError') console.log('Playback failed', e);
        });
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isPlaying, isReaderMode, isAuthCallback, currentSectionIndex]);

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
    setCurrentSectionIndex(0);
    lastWordIdxRef.current = -1; // Reset for reset
    if (audioRef.current) {
      audioRef.current.src = `/audio/sections/${sections[0].id}.mp3`;
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlaying(false);
    setCurrentWordIndex(null);
    setAudioProgress(0);
  };

  const handleProgressChange = (newProgress: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const newScrollY = (newProgress / 100) * scrollHeight;
    
    lastWordIdxRef.current = -1; // Force search from beginning after jump
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
        <audio 
          ref={audioRef} 
          src={`/audio/sections/${sections[currentSectionIndex].id}.mp3`} 
          preload="auto" 
        />
        
        {/* Subtle background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />
        
        <div className="flex justify-center max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          <Sidebar 
            currentSectionId={activeSectionId} 
            onNavigate={handleNavigateToSection} 
          />
          <main className="flex-1 w-full lg:ml-96">
            <Article 
              currentWordIndex={currentWordIndex} 
              onWordClick={handleWordClick}
              onNavigate={handleNavigateToSection}
            />
          </main>
        </div>

        <PlayerBar 
          progress={progress} 
          audioProgress={audioProgress}
          isPlaying={isPlaying} 
          isReaderMode={isReaderMode}
          isLoading={isLoading}
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
