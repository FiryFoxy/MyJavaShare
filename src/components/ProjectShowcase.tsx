import React, { useState } from 'react';
import {
  Play,
  Download,
  Code,
  Share2,
  ArrowLeft,
  Terminal,
  Gamepad2,
  Copy,
  Check,
  FileCode,
  Archive,
  ExternalLink,
  Laptop,
  QrCode,
  MessageCircle,
  Mail,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { JavaProject } from '../types';
import { RealJvmRunner } from './RealJvmRunner';
import { generateShareUrl, generateWindowsLauncherScript, generateUnixLauncherScript } from '../services/share';

interface ProjectShowcaseProps {
  project: JavaProject;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ project, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'run' | 'download' | 'code' | 'share'>('run');
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const mainFile = project.files[selectedFileIdx] || project.files[0] || { name: 'Main.java', content: '// No source code available' };
  const shareUrl = generateShareUrl(project);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mainFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadFile = (filename: string, content: string | Blob, mimeType = 'text/plain') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBinary = () => {
    if (project.binaryBase64 && project.binaryFilename) {
      // Decode base64 to binary blob
      const byteCharacters = atob(project.binaryBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/java-archive' });
      downloadFile(project.binaryFilename, blob);
    } else {
      // Download .java file
      downloadFile(mainFile.name, mainFile.content, 'text/x-java-source');
    }
  };

  const handleDownloadWindowsBat = () => {
    const batScript = generateWindowsLauncherScript(project);
    downloadFile(`run_${project.title.replace(/\s+/g, '_').toLowerCase()}.bat`, batScript, 'application/x-bat');
  };

  const handleDownloadUnixSh = () => {
    const shScript = generateUnixLauncherScript(project);
    downloadFile(`run_${project.title.replace(/\s+/g, '_').toLowerCase()}.sh`, shScript, 'application/x-sh');
  };

  const isGraphicsProject = project.category === 'graphics' || project.id.includes('snake') || project.id.includes('physics');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share Direct Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Project Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Unboxed Metadata (Zero-Pill Discipline) */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-amber-400 font-semibold uppercase">{project.category}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Format: {project.type === 'jar' ? 'JAR Archive' : project.type === 'class' ? 'Class Bytecode' : 'Java Source'}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>By {project.author || 'Author'}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
              {project.description}
            </p>

            {/* Note for Family & Friends */}
            {project.instructions && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Instructions for Family & Friends
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-100/90 mt-1 leading-relaxed">
                      {project.instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action CTA Box */}
          <div className="flex flex-col gap-2 shrink-0 sm:min-w-[200px]">
            <button
              onClick={() => setActiveTab('run')}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Online Now</span>
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download & PC Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs / Segmented Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('run')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'run'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Online</span>
        </button>
        <button
          onClick={() => setActiveTab('download')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'download'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Run on PC</span>
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'code'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Source Code</span>
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'share'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* TAB 1: RUN ONLINE */}
      {activeTab === 'run' && (
        <div className="space-y-4">
          <RealJvmRunner project={project} />
        </div>
      )}

      {/* TAB 2: RUN ON PC (FRIENDLY GUIDE FOR FAMILY & FRIENDS) */}
      {activeTab === 'download' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 1-Click Launchers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                <span>1-Click PC Download Kit</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Download the project and a pre-configured double-click runner script for Windows or Mac.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleDownloadBinary}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Download {project.binaryFilename || mainFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    The raw Java binary / source code file
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>

              <button
                onClick={handleDownloadWindowsBat}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Download run_on_windows.bat
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Windows batch script (double-click to auto-launch)
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>

              <button
                onClick={handleDownloadUnixSh}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    Download run_on_mac_linux.sh
                  </div>
                  <div className="text-[11px] text-slate-400">
                    macOS & Linux terminal runner script
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Simple Guide for Friends & Family */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>Easy Guide for Family & Friends</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-white">Make sure Java is installed:</strong> If your computer doesn't have Java, grab free OpenJDK from{' '}
                  <a
                    href="https://adoptium.net"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5"
                  >
                    Adoptium.net <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  (takes 1 minute).
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-white">Place both files in the same folder:</strong> Put the Java file and the downloaded <code>.bat</code> or <code>.sh</code> launcher in your Downloads or Desktop folder.
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-white">Double-click to play:</strong> On Windows, just double click <code>run_on_windows.bat</code>!
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400">
              <div className="text-slate-500 mb-1"># Or run manually in terminal:</div>
              <div className="text-amber-300 select-all">
                {project.type === 'jar'
                  ? `java -jar "${project.binaryFilename || 'project.jar'}"`
                  : `java "${mainFile.name}"`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOURCE CODE & BYTECODE */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* File Selector Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {project.files.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                    selectedFileIdx === idx
                      ? 'bg-slate-800 text-amber-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer text-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax Display */}
          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-amber-500/30">
            <code>{mainFile.content}</code>
          </pre>
        </div>
      )}

      {/* TAB 4: SHARING */}
      {activeTab === 'share' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-400" />
              <span>Share Link Pointing Directly to This Project</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Send this single link to family and friends. When they open it, it opens directly to this project without needing a backend server!
            </p>
          </div>

          {/* Share URL Box */}
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 py-1 font-mono text-xs text-amber-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Sharing Channels */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Quick Share Channels
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out my Java project "${project.title}": ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out my Java project "${project.title}"!`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-3 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 rounded-xl text-sky-300 text-xs font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Telegram</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(`My Java Project: ${project.title}`)}&body=${encodeURIComponent(`Hi,\n\nI built a Java project called "${project.title}".\n\nYou can run and play it right in your browser here:\n${shareUrl}\n\nHave fun!\n${project.author || ''}`)}`}
                className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 text-xs font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>

              <button
                onClick={() => setShowQr(!showQr)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
              </button>
            </div>
          </div>

          {/* QR Code view */}
          {showQr && (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                {/* Clean inline SVG QR code render via external reliable api or canvas */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-40 h-40"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-xs text-slate-400">
                Scan with any smartphone camera to open this project instantly!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
