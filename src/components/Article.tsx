import React, { useMemo } from 'react';
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
}

const Article: React.FC<ArticleProps> = ({ currentWordIndex, onWordClick }) => {
  // Map words to global indices
  let globalWordCounter = 0;

  return (
    <article className="max-w-4xl mx-auto px-8 lg:px-12 py-32 space-y-24">
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
          <section key={section.id} id={section.id} className="space-y-10 scroll-mt-32 group">
            <header className="space-y-6">
              <div className="flex items-center gap-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-primary/40" />
                <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">Section</span>
              </div>
              <h2 className={`${
                isIntro 
                  ? "text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground" 
                  : "text-4xl font-extrabold tracking-tight text-foreground/90"
              }`}>
                <HighlightableText text={section.title} currentWordIndex={currentWordIndex} baseIndex={titleIndex} onWordClick={onWordClick} />
              </h2>
              {section.subtitle && (
                <p className="text-2xl text-muted-foreground/80 font-medium tracking-tight leading-relaxed max-w-2xl">
                  <HighlightableText text={section.subtitle} currentWordIndex={currentWordIndex} baseIndex={subtitleIndex} onWordClick={onWordClick} />
                </p>
              )}
            </header>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-xl leading-[1.8] text-muted-foreground font-normal">
                <HighlightableText text={section.content} currentWordIndex={currentWordIndex} baseIndex={contentIndex} onWordClick={onWordClick} />
              </p>
            </div>
            
            {section.id === 'execution' && (
              <div className="relative mt-12 p-10 rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Architecture Diagram</div>
                <pre className="text-slate-300 leading-relaxed">
{`[Decision Maker] <-> [WhatsApp / Portal]
                         |
                         v
              [CaptainApp Control Plane]
                         |
              +----------+----------+
              |                     |
     [OpenCode Agent]      [Intent Ledger]
              |                     |
     +--------+--------+      [Audit Timeline]
     |        |        |
   [Xero] [Stripe] [Twilio]`}
                </pre>
              </div>
            )}

            {section.id === 'future-infra' && (
              <div className="relative mt-12 p-10 rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">The VM Problem</div>
                <pre className="text-slate-300 leading-relaxed">
{`[User A] -> [VM A (Ubuntu)] -- $$$ Idle
[User B] -> [VM B (Ubuntu)] -- $$$ Idle
[User C] -> [VM C (Ubuntu)] -- $$$ Idle
    |           |
    +-----------+---- [Management Overhead]
                      [Security Isolation Risk]`}
                </pre>
              </div>
            )}

            {section.id === 'future-cloudflare' && (
              <div className="relative mt-12 p-10 rounded-3xl bg-slate-900/50 border border-slate-800/50 font-mono text-sm overflow-x-auto shadow-inner group/diagram">
                <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Serverless Edge Box</div>
                <pre className="text-slate-300 leading-relaxed">
{`[Users] -> [Cloudflare Edge]
               |
      +--------+--------+
      |                 |
 [Worker A]        [Worker B]  <-- Scale to Zero
      |                 |
 [SQLite FS]       [SQLite FS] <-- Isolated Data
 (D1 / Durable)    (D1 / Durable)`}
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
