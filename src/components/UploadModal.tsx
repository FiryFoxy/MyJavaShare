import React, { useState, useRef } from 'react';
import { X, Upload, Archive, Cpu, Sparkles, Check, AlertCircle } from 'lucide-react';
import { JavaProject, ProjectType, ProjectCategory } from '../types';
import { parseClassFile, parseJarArchive } from '../services/bytecodeParser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: JavaProject) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(() => localStorage.getItem('javadrop_author') || '');
  const [category, setCategory] = useState<ProjectCategory>('game');
  const [instructions, setInstructions] = useState('');
  const [tagsInput, setTagsInput] = useState('Java');

  const [binaryData, setBinaryData] = useState<string | null>(null);
  const [binaryFilename, setBinaryFilename] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectType>('jar');
  const [jarManifest, setJarManifest] = useState<any>();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext !== 'jar' && ext !== 'class') {
      alert('Please upload a compiled Java file (.jar executable archive or .class bytecode).');
      return;
    }

    setProcessingStatus(`Analyzing ${filename}...`);
    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
    setFileDetails({ name: filename, size: sizeKb, type: ext === 'jar' ? 'JAR Archive' : 'Class Bytecode' });

    // Auto-generate title from filename if empty
    if (!title) {
      const cleanName = filename.replace(/\.(jar|class)$/i, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert to base64 for persistent storage and 1-click download
      let binaryStr = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binaryStr);
      setBinaryData(b64);
      setBinaryFilename(filename);

      if (ext === 'jar') {
        setProjectType('jar');
        const parsed = await parseJarArchive(arrayBuffer);
        setJarManifest(parsed.manifest);
        setProcessingStatus(
          `Verified JAR: ${parsed.manifest.mainClass ? `Main-Class: ${parsed.manifest.mainClass}` : `${parsed.entries.length} entries`}`
        );
      } else {
        setProjectType('class');
        const parsedClass = parseClassFile(arrayBuffer);
        setJarManifest({ mainClass: parsedClass.className });
        setProcessingStatus(`Verified Class: ${parsedClass.className} (${parsedClass.javaVersionName})`);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Error parsing Java file: ' + (err.message || 'Corrupted file'));
      setProcessingStatus(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!binaryData || !binaryFilename) {
      alert('Please upload a .jar or .class file first.');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a project title.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const project: JavaProject = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `java-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Java project ready to run and share.',
      author: author.trim() || 'Author',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: projectType,
      category,
      instructions: instructions.trim() || 'Run this project online or download and run on your computer.',
      files: [],
      binaryBase64: binaryData,
      binaryFilename,
      jarManifest,
      tags: tags.length > 0 ? tags : ['Java', projectType.toUpperCase()],
    };

    if (author.trim()) {
      localStorage.setItem('javadrop_author', author.trim());
    }

    onProjectCreated(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Java Project</h2>
              <p className="text-xs text-slate-400">
                Upload your compiled <strong className="text-amber-300">.jar</strong> or <strong className="text-amber-300">.class</strong> to run and share
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              fileDetails
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-slate-700 hover:border-amber-400/80 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jar,.class"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex justify-center mb-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  fileDetails
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                }`}
              >
                {fileDetails ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
            </div>

            {fileDetails ? (
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{fileDetails.name}</h4>
                <p className="text-xs text-emerald-400 font-mono">
                  {fileDetails.type} · {fileDetails.size} · Ready to run
                </p>
                <p className="text-[11px] text-slate-400 pt-1">Click to choose a different file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Click or drag & drop your Java file</h4>
                <p className="text-xs text-slate-400">
                  Select your compiled <strong>.jar</strong> executable archive or <strong>.class</strong> file
                </p>
              </div>
            )}
          </div>

          {processingStatus && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{processingStatus}</span>
            </div>
          )}

          {/* Project Details Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Game"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="game">Game / Interactive</option>
                <option value="console">Console Application</option>
                <option value="utility">Utility / Tool</option>
                <option value="graphics">AWT / Swing / GUI</option>
                <option value="educational">Educational / Demo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Java, Game, Fun"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your Java project do?"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Project Instructions / Notes</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. 'Type your moves in the console' or 'Click the buttons on screen'"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!binaryData}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                binaryData
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Save & Get Share Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
