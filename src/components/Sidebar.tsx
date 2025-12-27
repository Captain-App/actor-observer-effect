import React from 'react';
import { sections } from '../data/sections';

interface SidebarProps {
  currentSectionId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentSectionId }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-64 max-h-[80vh] overflow-y-auto pr-4 scrollbar-hide">
      <nav className="space-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
          Contents
        </h3>
        {sections.map((section) => {
          const isActive = currentSectionId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 group flex items-center gap-3 ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isActive ? 'bg-primary scale-110' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
              }`} />
              <span className="truncate">{section.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

