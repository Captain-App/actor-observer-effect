import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PlayerBarProps {
  progress: number;
  isPlaying: boolean;
  isReaderMode: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onToggleReaderMode: () => void;
  onProgressChange: (newProgress: number) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ 
  progress, 
  isPlaying, 
  isReaderMode, 
  onTogglePlay, 
  onReset, 
  onToggleReaderMode,
  onProgressChange
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border z-50 group">
      {/* Full width interactive progress bar */}
      <div className="absolute top-0 left-0 right-0 -translate-y-1/2 px-0">
        <div className="relative w-full h-1.5 bg-muted hover:h-2 transition-all cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Drag handle */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform pointer-events-none"
            style={{ left: `${progress}%`, marginLeft: '-8px' }}
          />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Progress text */}
        <div className="text-sm font-medium tabular-nums text-muted-foreground w-20">
          {Math.round(progress)}%
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            title="Reset to beginning (Esc)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all shadow-md active:scale-95"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </button>

          <button
            onClick={onToggleReaderMode}
            className={`p-2 rounded-full transition-colors ${isReaderMode ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            title={isReaderMode ? "Reader Mode: ON" : "Reader Mode: OFF"}
          >
            {isReaderMode ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Right: Empty spacer to keep center centered */}
        <div className="w-20" />
      </div>
    </div>
  );
};

export default PlayerBar;
