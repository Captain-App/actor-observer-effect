import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Article from './components/Article';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import AuthGuard from './components/AuthGuard';
import AuthCallback from './pages/AuthCallback';
import { sections } from './data/sections';
import { splitIntoWords } from './lib/utils';

const SCROLL_SPEED = 1;
const AUTO_SCROLL_DELAY = 5000; // 5 seconds pause after manual scroll

interface TimingWord {
  word: string;
  start: number;
}

const SUPABASE_STORAGE_URL = "https://kjbcjkihxskuwwfdqklt.supabase.co/storage/v1/object/public/the-plan/audio/sections";

function App() {
  const [progress, setProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [timingData, setTimingData] = useState<Record<string, TimingWord[]>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Load timing for a specific section
  const loadSectionTiming = useCallback(async (sectionId: string) => {
    if (timingData[sectionId]) return;
    try {
      const res = await fetch(`${SUPABASE_STORAGE_URL}/${sectionId}.json`);
      if (res.ok) {
        const data = await res.json();
        setTimingData(prev => ({ ...prev, [sectionId]: data }));
      }
    } catch (e) {
      console.error(`Failed to load timing for ${sectionId}`);
    }
  }, [timingData]);

  // Load first section immediately and background load others
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadSectionTiming(sections[0].id);
      setIsLoading(false);
      
      // Background load the rest
      sections.slice(1).forEach(section => {
        loadSectionTiming(section.id);
        const audio = new Audio(`${SUPABASE_STORAGE_URL}/${section.id}.mp3`);
        audio.preload = "auto";
      });
    };
    init();
  }, []);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    const sectionIdx = sections.findIndex(s => s.id === sectionId);
    if (sectionIdx !== -1) {
      setCurrentSectionIndex(sectionIdx);
      const metadata = sectionMetadata.sections[sectionIdx];
      setCurrentWordIndex(metadata.startIndex);
      
      if (audioRef.current) {
        audioRef.current.src = `${SUPABASE_STORAGE_URL}/${sectionId}.mp3`;
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

  // Audio Sync Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isReaderMode || isAuthCallback) return;

    const handleTimeUpdate = () => {
      const sectionId = sections[currentSectionIndex].id;
      const sectionTiming = timingData[sectionId];
      if (!sectionTiming) return;
      
      const currentTime = audio.currentTime;
      const sectionWordIdx = sectionTiming.findIndex((t, i) => {
        const nextStart = sectionTiming[i + 1]?.start ?? Infinity;
        return currentTime >= t.start && currentTime < nextStart;
      });

      if (sectionWordIdx !== -1) {
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
    };

    const handleEnded = () => {
      if (currentSectionIndex < sections.length - 1) {
        const nextIdx = currentSectionIndex + 1;
        setCurrentSectionIndex(nextIdx);
        audio.src = `${SUPABASE_STORAGE_URL}/${sections[nextIdx].id}.mp3`;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isReaderMode, timingData, currentWordIndex, currentSectionIndex, sectionMetadata, isAuthCallback]);

  // Play/Pause Control
  useEffect(() => {
    if (isAuthCallback) return;

    if (isPlaying) {
      if (isReaderMode && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Playback failed', e));
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isPlaying, isReaderMode, isAuthCallback]);

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
    if (audioRef.current) {
      audioRef.current.src = `${SUPABASE_STORAGE_URL}/${sections[0].id}.mp3`;
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
          src={`${SUPABASE_STORAGE_URL}/${sections[currentSectionIndex].id}.mp3`} 
          preload="auto" 
        />
        
        {/* Subtle background glow */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />
        
        <div className="flex justify-center max-w-[1600px] mx-auto px-12 relative z-10">
          <Sidebar 
            currentSectionId={activeSectionId} 
            onNavigate={handleNavigateToSection} 
          />
          <main className="flex-1 w-full lg:ml-96">
            <Article currentWordIndex={currentWordIndex} />
          </main>
        </div>

        <PlayerBar 
          progress={progress} 
          audioProgress={audioProgress}
          isPlaying={isPlaying} 
          isReaderMode={isReaderMode}
          isLoading={isLoading}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={handleReset}
          onToggleReaderMode={() => setIsReaderMode(!isReaderMode)}
          onProgressChange={handleProgressChange}
        />
      </div>
    </AuthGuard>
  );
}

export default App;
