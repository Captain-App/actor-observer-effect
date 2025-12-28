import React from 'react';
import { sections } from '../data/sections';

interface SidebarProps {
  currentSectionId: string | null;
  onNavigate: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentSectionId, onNavigate }) => {
  const scrollToSection = (id: string) => {
    onNavigate(id);
  };

  return (
    <aside className="hidden lg:block fixed left-6 top-12 bottom-24 w-72 pr-4 z-40">
      <div className="h-full flex flex-col">
        <div className="mb-12 px-2 flex items-center gap-3 group">
          <img 
            src="/logo.png" 
            alt="CaptainApp" 
            className="w-10 h-10 object-contain dark:invert grayscale brightness-150 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
          />
          <h1 className="text-xl font-black tracking-tighter text-foreground uppercase">
            CaptainApp
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
          {sections.map((section) => {
            const isActive = currentSectionId === section.id;
            const isAppendix = section.id.startsWith('appendix');
            
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left py-2 transition-all duration-300 group relative ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
                <span className={`text-[9px] uppercase tracking-[0.2em] leading-relaxed transition-all duration-300 ${
                  isActive ? 'font-black text-primary scale-105 origin-left' : 'font-bold opacity-40 group-hover:opacity-100'
                } ${isAppendix ? 'mt-6 block border-t border-border/10 pt-6' : ''}`}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-border/10">
          <div className="flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="text-[10px] font-black uppercase tracking-tighter">v1.0.0</div>
            <div className="h-px flex-1 bg-border/20" />
            <div className="text-[10px] font-black uppercase tracking-tighter">Final Draft</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

