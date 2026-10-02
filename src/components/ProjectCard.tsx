import React from 'react';
import { Play, Share2, Download, Terminal, Gamepad2, Wrench, FileCode, Archive } from 'lucide-react';
import { JavaProject } from '../types';

interface ProjectCardProps {
  project: JavaProject;
  onSelect: (project: JavaProject) => void;
  onShare: (project: JavaProject) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onShare }) => {
  const getCategoryIcon = () => {
    switch (project.category) {
      case 'game':
      case 'graphics':
        return <Gamepad2 className="w-5 h-5 text-amber-400" />;
      case 'utility':
        return <Wrench className="w-5 h-5 text-blue-400" />;
      default:
        return project.type === 'jar' ? (
          <Archive className="w-5 h-5 text-purple-400" />
        ) : (
          <Terminal className="w-5 h-5 text-emerald-400" />
        );
    }
  };

  const getFormatLabel = () => {
    if (project.type === 'jar') return '.jar Archive';
    if (project.type === 'class') return '.class Bytecode';
    return `${project.files.length} .java File${project.files.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="group relative flex flex-col bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all duration-200 overflow-hidden shadow-lg hover:shadow-amber-500/5">
      {/* Top Header Section */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
          <span className="text-amber-400 capitalize">{project.category}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{getFormatLabel()}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>By {project.author || 'Author'}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(project)}
          className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors cursor-pointer mb-2 line-clamp-1"
        >
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2 flex-1">
          {project.description}
        </p>

        {/* Tags without pills: clean unboxed typographic list */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mb-4 font-mono">
            {project.tags.map((tag, idx) => (
              <React.Fragment key={tag}>
                <span>#{tag}</span>
                {idx < project.tags.length - 1 && <span className="text-slate-700">·</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-auto">
          <button
            onClick={() => onSelect(project)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run / Play</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShare(project)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Share Project Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelect(project)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="View Source & Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
