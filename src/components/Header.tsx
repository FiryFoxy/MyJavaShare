import React from 'react';
import { Plus, Coffee, FolderGit2 } from 'lucide-react';

interface HeaderProps {
  onNewProject: () => void;
  onViewGallery: () => void;
  projectCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewProject,
  onViewGallery,
  projectCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <button
          onClick={onViewGallery}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            JavaDrop
          </span>
        </button>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={onViewGallery}
            className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Projects</span>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-mono">
              {projectCount}
            </span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Java Project</span>
          </button>
        </div>
      </div>
    </header>
  );
};
