import React from 'react';
import { Plus, Github, Coffee, Share2, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onNewProject: () => void;
  onOpenGitHubGuide: () => void;
  onOpenShareInfo: () => void;
  onViewGallery: () => void;
  projectCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewProject,
  onOpenGitHubGuide,
  onOpenShareInfo,
  onViewGallery,
  projectCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element) */}
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

        {/* Zone 2: Navigation Links (Clean text with hover state) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={onViewGallery}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            All Projects ({projectCount})
          </button>
          <button
            onClick={onOpenShareInfo}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Share with Family & Friends
          </button>
          <button
            onClick={onOpenGitHubGuide}
            className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Github className="w-4 h-4 text-slate-400" />
            <span>GitHub Pages Free Tier</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGitHubGuide}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Deploy Free</span>
          </button>

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
