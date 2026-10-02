import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, Archive, Cpu, Sparkles, Check, AlertCircle } from 'lucide-react';
import { JavaProject, ProjectType, ProjectCategory, JavaFile } from '../types';
import { parseClassFile, parseJarArchive } from '../services/bytecodeParser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: JavaProject) => void;
}

const TEMPLATES: { label: string; code: string; title: string; category: ProjectCategory; instructions: string }[] = [
  {
    label: 'Interactive Scanner Game',
    title: 'Dice Roll Challenge',
    category: 'game',
    instructions: 'Enter your bet amount and roll the dice against the computer! Try to double your coins.',
    code: `import java.util.Scanner;
import java.util.Random;

public class DiceGame {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Random random = new Random();

        int coins = 100;
        System.out.println("=== WELCOME TO DICE ROLLER ===");
        System.out.println("You have 100 coins. Can you reach 250?\\n");

        while (coins > 0 && coins < 250) {
            System.out.println("Coins: " + coins);
            System.out.print("Enter bet amount (or 0 to quit): ");
            int bet = scanner.nextInt();

            if (bet == 0) break;
            if (bet > coins) {
                System.out.println("You don't have that many coins!\\n");
                continue;
            }

            int playerRoll = random.nextInt(6) + 1;
            int computerRoll = random.nextInt(6) + 1;

            System.out.println("You rolled: " + playerRoll);
            System.out.println("Computer rolled: " + computerRoll);

            if (playerRoll > computerRoll) {
                System.out.println("🎉 You won " + bet + " coins!\\n");
                coins += bet;
            } else if (playerRoll < computerRoll) {
                System.out.println("❌ Computer won. You lost " + bet + " coins.\\n");
                coins -= bet;
            } else {
                System.out.println("🤝 Tie! Bet returned.\\n");
            }
        }

        System.out.println("Game over! Final coins: " + coins);
    }
}
`,
  },
  {
    label: 'Math & Calculator',
    title: 'Java Smart Calculator',
    category: 'utility',
    instructions: 'Choose an operation and type your numbers to compute roots, powers, factorials, and trigonometry.',
    code: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("==================================");
        System.out.println("      JAVA SMART CALCULATOR       ");
        System.out.println("==================================");
        System.out.println("1. Addition (+)");
        System.out.println("2. Subtraction (-)");
        System.out.println("3. Multiplication (*)");
        System.out.println("4. Division (/)");
        System.out.println("5. Square Root (√)");

        System.out.print("\\nEnter operation (1-5): ");
        int choice = scanner.nextInt();

        if (choice >= 1 && choice <= 4) {
            System.out.print("Enter first number: ");
            double a = scanner.nextDouble();
            System.out.print("Enter second number: ");
            double b = scanner.nextDouble();

            double result = 0;
            if (choice == 1) result = a + b;
            if (choice == 2) result = a - b;
            if (choice == 3) result = a * b;
            if (choice == 4) result = b != 0 ? a / b : Double.NaN;

            System.out.println("\\nResult: " + result);
        } else if (choice == 5) {
            System.out.print("Enter number: ");
            double num = scanner.nextDouble();
            System.out.println("\\nSquare root of " + num + " = " + Math.sqrt(num));
        }

        System.out.println("\\nDone.");
    }
}
`,
  },
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [tab, setTab] = useState<'upload' | 'write'>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(() => localStorage.getItem('javadrop_author') || 'Fulvio');
  const [category, setCategory] = useState<ProjectCategory>('game');
  const [instructions, setInstructions] = useState('');
  const [tagsInput, setTagsInput] = useState('Java, Family');

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<JavaFile[]>([]);
  const [binaryData, setBinaryData] = useState<string | undefined>();
  const [binaryFilename, setBinaryFilename] = useState<string | undefined>();
  const [projectType, setProjectType] = useState<ProjectType>('code');
  const [jarManifest, setJarManifest] = useState<any>();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Write code state
  const [codeContent, setCodeContent] = useState(TEMPLATES[0].code);
  const [mainFilename, setMainFilename] = useState('Main.java');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessingStatus('Analyzing uploaded file...');

    const file = files[0];
    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();

    // Auto-generate title from filename if empty
    if (!title) {
      const cleanName = filename.replace(/\.(java|jar|class)$/i, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      if (ext === 'jar') {
        setProjectType('jar');
        setBinaryFilename(filename);

        const arrayBuffer = await file.arrayBuffer();
        // Convert to base64 for persistent storage & 1-click download
        let binaryStr = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binaryStr);
        setBinaryData(b64);

        // Inspect JAR contents
        const parsed = await parseJarArchive(arrayBuffer);
        setJarManifest(parsed.manifest);

        const javaFiles: JavaFile[] = [];
        if (parsed.sourceFiles.length > 0) {
          parsed.sourceFiles.forEach((sf, i) => {
            javaFiles.push({ name: sf.name, content: sf.content, isMain: i === 0 });
          });
        } else if (parsed.decompiledClasses.length > 0) {
          parsed.decompiledClasses.forEach((dc, i) => {
            javaFiles.push({
              name: `${dc.className.split('.').pop()}.java`,
              content: dc.decompiledCode,
              isMain: i === 0,
            });
          });
        } else {
          javaFiles.push({
            name: 'Manifest.txt',
            content: `JAR Entries (${parsed.entries.length} items):\n` + parsed.entries.join('\n'),
            isMain: true,
          });
        }

        setUploadedFiles(javaFiles);
        setProcessingStatus(`Extracted JAR archive successfully! (${parsed.entries.length} files detected)`);
      } else if (ext === 'class') {
        setProjectType('class');
        setBinaryFilename(filename);

        const arrayBuffer = await file.arrayBuffer();
        let binaryStr = '';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.length; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        setBinaryData(btoa(binaryStr));

        // Disassemble class bytecode
        const parsedClass = parseClassFile(arrayBuffer);
        setUploadedFiles([
          {
            name: `${parsedClass.className.split('.').pop()}.java`,
            content: parsedClass.decompiledCode,
            isMain: true,
          },
        ]);
        setProcessingStatus(`Disassembled ${parsedClass.javaVersionName} class file!`);
      } else if (ext === 'java') {
        setProjectType('code');
        const text = await file.text();
        const extractedClassName = text.match(/public\s+class\s+(\w+)/)?.[1] || filename.replace('.java', '');
        setUploadedFiles([
          {
            name: `${extractedClassName}.java`,
            content: text,
            isMain: true,
          },
        ]);
        setProcessingStatus(`Loaded ${filename} (${text.split('\n').length} lines)`);
      } else {
        alert('Please upload a .java, .jar, or .class file.');
        setProcessingStatus(null);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Error parsing file: ' + (err.message || 'Unknown format issue'));
      setProcessingStatus(null);
    }
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setCodeContent(tmpl.code);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setInstructions(tmpl.instructions);
    setMainFilename('Main.java');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a project title');
      return;
    }

    let files: JavaFile[] = [];
    if (tab === 'upload') {
      if (uploadedFiles.length === 0) {
        alert('Please choose a .java, .jar, or .class file to upload.');
        return;
      }
      files = uploadedFiles;
    } else {
      files = [
        {
          name: mainFilename.endsWith('.java') ? mainFilename : `${mainFilename}.java`,
          content: codeContent,
          isMain: true,
        },
      ];
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const project: JavaProject = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `java-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'A Java project created for friends and family.',
      author: author.trim() || 'Author',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: tab === 'upload' ? projectType : 'code',
      category,
      instructions: instructions.trim() || 'Run this project online or download and run on your computer.',
      files,
      binaryBase64: binaryData,
      binaryFilename,
      jarManifest,
      tags: tags.length > 0 ? tags : ['Java', 'Console'],
    };

    localStorage.setItem('javadrop_author', author.trim());
    onProjectCreated(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white">Add New Java Project</h2>
            <p className="text-xs text-slate-400">
              Upload .jar, .class, or .java code to host and share with family
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'upload'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File (.jar / .class / .java)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'write'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Write Java Code / Pick Template</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {tab === 'upload' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".java,.jar,.class"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Upload className="w-6 h-6" />
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Click to browse or drop your Java file here
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports <strong>.jar</strong> (packaged executable), <strong>.class</strong> (bytecode), or <strong>.java</strong> (source)
                </p>
              </div>

              {processingStatus && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{processingStatus}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Template selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quick Start Templates:
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-200 transition-colors cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Java Code:
                </label>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Project Details Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dungeon Explorer RPG"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name (Author)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Fulvio"
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
                <option value="game">Interactive Game</option>
                <option value="console">Console Application</option>
                <option value="utility">Utility / Tool</option>
                <option value="graphics">2D Graphics / Canvas</option>
                <option value="educational">Educational / Learning</option>
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
                placeholder="Game, Fun, School"
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
              <span>Instructions for Family & Friends</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. 'Type numbers 1-100 to guess my secret number! Press Enter after each guess.'"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Modal Footer */}
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
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Save & Create Share Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
