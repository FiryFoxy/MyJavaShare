import React from 'react';
import { X, Share2, Link, Laptop, Smartphone, CheckCircle, Sparkles, Heart } from 'lucide-react';

interface ShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareGuideModal: React.FC<ShareGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Heart className="w-4 h-4 fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sharing with Family & Friends</h2>
              <p className="text-xs text-slate-400">Simple 1-click access with zero technical friction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                <Link className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">1. Direct Link to Just One Project</h4>
                <p className="leading-relaxed">
                  Every project has its own dedicated link (e.g. <code>#share=...</code> or <code>?p=project-id</code>). When you send this link, your friend or family member is taken straight to that project's runner without having to look through a catalog!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">2. No Java Installation Needed for Browser Play</h4>
                <p className="leading-relaxed">
                  Grandparents, parents, or friends on mobile and laptops don't need JDK or Java installed! The in-browser JVM runner compiles and runs the code directly in their web browser.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">3. Double-Click PC Launcher (.bat / .sh)</h4>
                <p className="leading-relaxed">
                  If they want to run your full <code>.jar</code> or <code>.class</code> file natively on Windows, they can download the 1-click <code>run_on_windows.bat</code> file generated for them. Double-clicking it automatically checks Java and runs your project!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200/90 leading-relaxed">
            <strong className="text-amber-400 font-bold">💡 Tip:</strong> Write clear "Instructions for Family & Friends" when creating or uploading projects. Tell them things like: <em>"Type numbers and press Enter"</em> or <em>"Use arrow keys to move the snake"</em> so they feel comfortable right away!
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
