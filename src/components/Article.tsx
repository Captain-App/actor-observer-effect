import React, { useMemo } from 'react';
import { sections } from '../data/sections';

interface HighlightableTextProps {
  text: string;
  currentWordIndex: number | null;
  baseIndex: number;
}

const HighlightableText: React.FC<HighlightableTextProps> = ({ text, currentWordIndex, baseIndex }) => {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  
  let wordCounter = 0;

  return (
    <>
      {words.map((part, i) => {
        if (part.trim() === '') return part;
        
        const currentIndex = baseIndex + wordCounter;
        const isHighlighted = currentWordIndex === currentIndex;
        wordCounter++;

        return (
          <span
            key={i}
            id={isHighlighted ? 'current-reading-word' : undefined}
            className={isHighlighted ? 'bg-yellow-400/30 text-primary-foreground font-bold rounded px-0.5 transition-colors duration-150' : ''}
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
}

const Article: React.FC<ArticleProps> = ({ currentWordIndex }) => {
  // Map words to global indices
  let globalWordCounter = 0;

  return (
    <article className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      {sections.map((section) => {
        const titleIndex = globalWordCounter;
        globalWordCounter += section.title.split(/\s+/).length;

        const subtitleIndex = globalWordCounter;
        if (section.subtitle) {
          globalWordCounter += section.subtitle.split(/\s+/).length;
        }

        const contentIndex = globalWordCounter;
        globalWordCounter += section.content.split(/\s+/).length;

        return (
          <section key={section.id} id={section.id} className="space-y-6 scroll-mt-24">
            <header className="space-y-4">
              <h2 className={section.id === 'intro' ? "text-5xl font-bold tracking-tight" : "text-3xl font-semibold"}>
                <HighlightableText text={section.title} currentWordIndex={currentWordIndex} baseIndex={titleIndex} />
              </h2>
              {section.subtitle && (
                <p className="text-xl text-muted-foreground italic">
                  <HighlightableText text={section.subtitle} currentWordIndex={currentWordIndex} baseIndex={subtitleIndex} />
                </p>
              )}
            </header>
            <p className="text-lg leading-relaxed text-muted-foreground/90">
              <HighlightableText text={section.content} currentWordIndex={currentWordIndex} baseIndex={contentIndex} />
            </p>
            
            {section.id === 'execution' && (
              <div className="bg-muted p-8 rounded-lg font-mono text-sm overflow-x-auto mt-6">
                <pre>
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
          </section>
        );
      })}
    </article>
  );
};

export default Article;
