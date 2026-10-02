import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Plus,
  Search,
  Upload,
  Github,
  Gamepad2,
  Terminal,
  Wrench,
  Sparkles,
  Share2,
  Filter,
  CheckCircle,
  Archive,
} from 'lucide-react';
import { JavaProject, ProjectCategory } from './types';
import { getStoredProjects, saveProject, deleteProject } from './services/storage';
import { parseProjectFromUrl } from './services/share';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { ProjectShowcase } from './components/ProjectShowcase';
import { UploadModal } from './components/UploadModal';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { ShareGuideModal } from './components/ShareGuideModal';

export default function App() {
  const [projects, setProjects] = useState<JavaProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<JavaProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isShareGuideOpen, setIsShareGuideOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load & URL routing check
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);

    // Check if opened via share link
    const parsed = parseProjectFromUrl();
    if (parsed) {
      if (typeof parsed === 'string') {
        // Project ID
        const match = loadedProjects.find(p => p.id === parsed);
        if (match) {
          setSelectedProject(match);
        }
      } else {
        // Full parsed project object from LZString URL hash!
        // Save to state & storage
        saveProject(parsed);
        const updated = getStoredProjects();
        setProjects(updated);
        setSelectedProject(parsed);
        showToast(`Loaded shared project: ${parsed.title}`);
      }
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const p = parseProjectFromUrl();
      if (!p) {
        setSelectedProject(null);
      } else if (typeof p === 'string') {
        const match = getStoredProjects().find(proj => proj.id === p);
        if (match) setSelectedProject(match);
      } else {
        setSelectedProject(p);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectProject = (project: JavaProject) => {
    setSelectedProject(project);
    window.location.hash = `#p=${project.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToGallery = () => {
    setSelectedProject(null);
    window.location.hash = '';
  };

  const handleProjectCreated = (newProject: JavaProject) => {
    saveProject(newProject);
    const updated = getStoredProjects();
    setProjects(updated);
    setSelectedProject(newProject);
    window.location.hash = `#p=${newProject.id}`;
    showToast(`Project "${newProject.title}" saved!`);
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure you want to remove this project?')) {
      deleteProject(id);
      const updated = getStoredProjects();
      setProjects(updated);
      setSelectedProject(null);
      window.location.hash = '';
      showToast('Project removed.');
    }
  };

  // Filter projects by search and category
  const filteredProjects = projects.filter(project => {
    const matchesCategory =
      selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Bar Contract compliant navigation */}
      <Header
        projectCount={projects.length}
        onNewProject={() => setIsUploadOpen(true)}
        onOpenGitHubGuide={() => setIsGitHubModalOpen(true)}
        onOpenShareInfo={() => setIsShareGuideOpen(true)}
        onViewGallery={handleBackToGallery}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {selectedProject ? (
          // Direct Project Showcase View (The Family & Friends Experience)
          <ProjectShowcase
            project={selectedProject}
            onBack={handleBackToGallery}
            onDelete={handleDeleteProject}
          />
        ) : (
          // Projects Gallery / Catalog View
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-radial from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <Coffee className="w-4 h-4" />
                  <span>Personal Java Hosting for Family & Friends</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Host, run, and share your Java creations.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Upload your <code className="text-amber-300">.jar</code>, <code className="text-amber-300">.class</code>, or <code className="text-amber-300">.java</code> files. Share direct links with family and friends so they can play right in their web browser or download a 1-click PC launcher. Free tier on GitHub Pages ready!
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload or Create Java Project</span>
                  </button>

                  <button
                    onClick={() => setIsGitHubModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    <Github className="w-4 h-4 text-slate-400" />
                    <span>GitHub Pages Free Tier Setup</span>
                  </button>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Segmented Controls (Interactive filter buttons) */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Projects ({projects.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('game')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'game'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Games
                </button>
                <button
                  onClick={() => setSelectedCategory('graphics')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'graphics'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2D Graphics & Canvas
                </button>
                <button
                  onClick={() => setSelectedCategory('console')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'console'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Console Apps
                </button>
                <button
                  onClick={() => setSelectedCategory('utility')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'utility'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Utilities
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or tags..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Projects Grid or Clean Empty State */}
            {projects.length === 0 ? (
              <div className="p-12 sm:p-16 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 max-w-2xl mx-auto shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Archive className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Your Java Hub is Ready</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  No projects loaded yet. Upload your compiled <strong className="text-amber-400 font-semibold">.jar</strong> executable archive or <strong className="text-amber-400 font-semibold">.class</strong> bytecode file to run it with the real WebAssembly OpenJDK JVM and generate shareable links for family and friends.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Java Project (.jar / .class)</span>
                  </button>
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={handleSelectProject}
                    onShare={(proj) => {
                      handleSelectProject(proj);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
                <Coffee className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No projects found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No projects matching "${searchQuery}". Try a different keyword.`
                    : 'No projects in this category.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-400">JavaDrop</span>
            <span>· Dedicated Java hosting for family & friends</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              GitHub Pages Free Tier
            </button>
            <button
              onClick={() => setIsShareGuideOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              How Sharing Works
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <GitHubPagesModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      <ShareGuideModal
        isOpen={isShareGuideOpen}
        onClose={() => setIsShareGuideOpen(false)}
      />

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl shadow-2xl animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
