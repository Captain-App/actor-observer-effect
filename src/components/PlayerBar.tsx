import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface PlayerBarProps {
  progress: number;
  audioProgress: number;
  isPlaying: boolean;
  isReaderMode: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onToggleReaderMode: () => void;
  onProgressChange: (newProgress: number) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ 
  progress, 
  audioProgress,
  isPlaying, 
  isReaderMode, 
  isLoading,
  onTogglePlay, 
  onReset, 
  onToggleReaderMode,
  onProgressChange
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-background/80 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex items-center gap-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={isLoading}
          className={`p-4 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95 group relative overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        {/* Progress & Info */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">The Plan 2026</span>
              <span className="text-xs font-bold text-foreground opacity-60 tracking-tight italic">A new agent platform</span>
            </div>
            <div className="text-[10px] font-black tabular-nums text-foreground/40 tracking-widest">
              {Math.round(progress)}% COMPLETE
            </div>
          </div>
          
          <div className="relative h-1 w-full group/progress">
            <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
              {/* Audio Progress (Ghostly Marker) */}
              <div 
                className="absolute top-0 bottom-0 bg-primary/30 transition-all duration-300 ease-out"
                style={{ width: `${audioProgress}%` }}
              />
              {/* Scroll Progress */}
              <div 
                className="h-full bg-primary transition-all duration-150 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)] relative z-10"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleReaderMode}
            className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 border ${
              isReaderMode 
                ? 'bg-primary/5 border-primary/20 text-primary' 
                : 'border-white/5 text-muted-foreground hover:text-foreground hover:border-white/10'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isReaderMode ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-50" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLoading ? 'Loading...' : 'Reader'}
            </span>
          </button>

          <button
            onClick={onReset}
            className="p-3 text-muted-foreground hover:text-foreground transition-all duration-300 group"
            title="Reset to beginning (Esc)"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform opacity-40 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
