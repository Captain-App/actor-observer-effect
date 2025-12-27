import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PlayerBarProps {
  progress: number;
  isPlaying: boolean;
  isReaderMode: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onToggleReaderMode: () => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ 
  progress, 
  isPlaying, 
  isReaderMode, 
  onTogglePlay, 
  onReset, 
  onToggleReaderMode 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 flex items-center justify-center z-50">
      <div className="max-w-3xl w-full flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Reset to beginning (Esc)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleReaderMode}
            className={`p-2 rounded-full transition-colors ${isReaderMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted text-muted-foreground'}`}
            title={isReaderMode ? "Reader Mode: ON" : "Reader Mode: OFF"}
          >
            {isReaderMode ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm font-medium tabular-nums min-w-[3rem] text-right">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
