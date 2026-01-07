import React, { useMemo, useState } from 'react';
import { ChevronDown, X, ArrowRight } from 'lucide-react';
import { sections } from '../data/sections';
import { splitIntoWords, splitIntoParts } from '../lib/utils';

interface HighlightableTextProps {
  text: string;
  currentWordIndex: number | null;
  baseIndex: number;
  onWordClick?: (index: number) => void;
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ text, currentWordIndex, baseIndex, onWordClick }) => {
  const parts = useMemo(() => splitIntoParts(text), [text]);
  
  let wordCounter = 0;

  return (
    <>
      {parts.map((part, i) => {
        if (part.trim() === '') return part;
        
        const currentIndex = baseIndex + wordCounter;
        const isHighlighted = currentWordIndex === currentIndex;
        wordCounter++;

        return (
          <span
            key={i}
            id={isHighlighted ? 'current-reading-word' : undefined}
            onClick={() => onWordClick?.(currentIndex)}
            className={`transition-all duration-300 cursor-pointer hover:text-primary/80 ${
              isHighlighted 
                ? 'text-primary font-bold scale-110 inline-block px-1' 
                : 'px-0'
            }`}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

interface ArticleProps {
  currentWordIndex: number | null;
  onWordClick?: (index: number) => void;
  onNavigate?: (id: string) => void;
}

const Article: React.FC<ArticleProps> = ({ currentWordIndex, onWordClick, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Map words to global indices
  let globalWordCounter = 0;

  const handleNavigate = (id: string) => {
    setIsMenuOpen(false);
    onNavigate?.(id);
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-24 sm:py-32 space-y-16 sm:space-y-24">
      {/* Mobile Contents Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-8 py-12">
            <span className="text-xs font-black text-primary uppercase tracking-[0.4em]">Contents</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-4 -mr-4 text-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto px-8 pb-32 space-y-8">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => handleNavigate(section.id)}
                className="w-full text-left group flex items-start gap-6"
              >
                <span className="text-[10px] font-black text-primary/20 group-hover:text-primary transition-colors mt-2 tabular-nums">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors leading-tight">
                    {section.title}
                  </h3>
                  {section.subtitle && (
                    <p className="text-sm text-muted-foreground/60 line-clamp-1 group-hover:text-muted-foreground transition-colors">
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all mt-2" />
              </button>
            ))}
          </nav>
        </div>
      )}

      {sections.map((section) => {
        const titleIndex = globalWordCounter;
        globalWordCounter += splitIntoWords(section.title).length;

        const subtitleIndex = globalWordCounter;
        if (section.subtitle) {
          globalWordCounter += splitIntoWords(section.subtitle).length;
        }

        const contentIndex = globalWordCounter;
        globalWordCounter += splitIntoWords(section.content).length;

        const isIntro = section.id === 'intro';

        return (
          <section key={section.id} id={section.id} className="space-y-8 sm:space-y-10 scroll-mt-32 group">
            <header className="space-y-6">
              <div className="flex items-center gap-4 mb-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-primary/40" />
                {isIntro ? (
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="flex items-center gap-2 group/contents lg:hidden py-1 px-2 -mr-2 hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Contents</span>
                    <ChevronDown className="w-3 h-3 text-primary/40 group-hover/contents:text-primary transition-colors" />
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Section</span>
                )}
                {isIntro && (
                  <span className="hidden lg:inline text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Section</span>
                )}
              </div>
              <h2 className={`${
                isIntro 
                  ? "text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground" 
                  : "text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground/90"
              }`}>
                <HighlightableText text={section.title} currentWordIndex={currentWordIndex} baseIndex={titleIndex} onWordClick={onWordClick} />
              </h2>
              {section.subtitle && (
                <p className="text-xl sm:text-2xl text-muted-foreground/80 font-medium tracking-tight leading-relaxed max-w-2xl">
                  <HighlightableText text={section.subtitle} currentWordIndex={currentWordIndex} baseIndex={subtitleIndex} onWordClick={onWordClick} />
                </p>
              )}
            </header>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg sm:text-xl leading-[1.8] text-muted-foreground font-normal">
                <HighlightableText text={section.content} currentWordIndex={currentWordIndex} baseIndex={contentIndex} onWordClick={onWordClick} />
              </p>
            </div>
            
            {section.id === 'mechanism' && (
              <div className="relative mt-8 sm:mt-12 p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">The Perceptual Asymmetry</div>
                <pre className="text-slate-300 leading-relaxed">
{`ACTOR'S VIEW                    OBSERVER'S VIEW
                                
     [Situation]                     [Person]
    /    |    \\                        ▲
   /     |     \\                       |
  v      v      v                  [Situation]
                                   (background)
"I see constraints"            "I see character"`}
                </pre>
              </div>
            )}

            {section.id === 'confusion' && (
              <div className="relative mt-8 sm:mt-12 p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Three Distinct Biases</div>
                <pre className="text-slate-300 leading-relaxed">
{`┌─────────────────────────────────────────────────┐
│  FUNDAMENTAL ATTRIBUTION ERROR                   │
│  Observers → over-attribute to disposition       │
│  (Even when situation is obvious)                │
├─────────────────────────────────────────────────┤
│  ACTOR–OBSERVER ASYMMETRY                        │
│  Actors → situation  |  Observers → disposition  │
│  (Different perspectives, same behaviour)        │
├─────────────────────────────────────────────────┤
│  SELF-SERVING BIAS                               │
│  Success → "I did it"  |  Failure → "It happened"│
│  (Depends on outcome valence)                    │
└─────────────────────────────────────────────────┘`}
                </pre>
              </div>
            )}

            {section.id === 'storms' && (
              <div className="relative mt-8 sm:mt-12 p-6 sm:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storms (1973) Experiment</div>
                <pre className="text-slate-300 leading-relaxed">
{`CONDITION A: Actor's perspective        CONDITION B: Observer's perspective
                                        
    [Camera] ──────> [Other]                [Camera]
        ▲                                       │
        │                                       ▼
    [Actor]                                 [Actor]
                                        
Result: Situational attributions        Result: Dispositional attributions
        about own behaviour                     about own behaviour`}
                </pre>
              </div>
            )}
            
            {!isIntro && <div className="h-px w-24 bg-gradient-to-r from-primary/10 to-transparent mt-24" />}
          </section>
        );
      })}
    </article>
  );
};

export default Article;
