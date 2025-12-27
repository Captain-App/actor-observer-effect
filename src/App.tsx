import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Article from './components/Article';
import PlayerBar from './components/PlayerBar';
import Sidebar from './components/Sidebar';
import AuthGuard from './components/AuthGuard';
import AuthCallback from './pages/AuthCallback';
import { sections } from './data/sections';

const SCROLL_SPEED = 1;

interface TimingWord {
  word: string;
  start: number;
}

function App() {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [timingData, setTimingData] = useState<TimingWord[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>();

  // Simple routing for AuthCallback
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

  // Load timing data
  useEffect(() => {
    if (isAuthCallback) return;
    
    fetch('/audio/timing.json')
      .then(res => res.json())
      .then(data => setTimingData(data))
      .catch(() => console.log('Static timing data not found. Run scripts/generate_tts.py to generate it.'));
  }, [isAuthCallback]);

  // Handle progress & scroll logic
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

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    setCurrentWordIndex(null);
  }, []);

  // Audio Sync Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isReaderMode || isAuthCallback) return;

    const handleTimeUpdate = () => {
      if (!timingData.length) return;
      
      const currentTime = audio.currentTime;
      const wordIdx = timingData.findIndex((t, i) => {
        const nextStart = timingData[i + 1]?.start ?? Infinity;
        return currentTime >= t.start && currentTime < nextStart;
      });

      if (wordIdx !== -1 && wordIdx !== currentWordIndex) {
        setCurrentWordIndex(wordIdx);
        
        const element = document.getElementById('current-reading-word');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isReaderMode, timingData, currentWordIndex, isAuthCallback]);

  // Play/Pause Control
  useEffect(() => {
    if (isAuthCallback) return;

    if (isPlaying) {
      if (isReaderMode) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            console.log('Audio file not found or playback failed.');
          });
        }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isAuthCallback]);

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPlaying(false);
    setCurrentWordIndex(null);
  };

  const handleProgressChange = (newProgress: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const newScrollY = (newProgress / 100) * scrollHeight;
    
    // If reader mode is on, we should also update audio time
    if (isReaderMode && audioRef.current && timingData.length) {
      const totalDuration = audioRef.current.duration;
      if (!isNaN(totalDuration)) {
        audioRef.current.currentTime = (newProgress / 100) * totalDuration;
      }
    }
    
    window.scrollTo({ top: newScrollY, behavior: 'auto' });
  };

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-24 relative">
        <audio ref={audioRef} src="/audio/article.wav" preload="auto" />
        
        <div className="flex justify-center max-w-[1400px] mx-auto px-4">
          <Sidebar currentSectionId={activeSectionId} />
          <main className="flex-1 w-full lg:ml-64">
            <Article currentWordIndex={currentWordIndex} />
          </main>
        </div>

        <PlayerBar 
          progress={progress} 
          isPlaying={isPlaying} 
          isReaderMode={isReaderMode}
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
