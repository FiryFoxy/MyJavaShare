import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, AlertCircle, Laptop, Download, Check, Sparkles, Cpu } from 'lucide-react';
import { JavaProject } from '../types';
import { runRealJavaJar } from '../services/cheerpjRunner';
import { generateWindowsLauncherScript, generateUnixLauncherScript } from '../services/share';

interface RealJvmRunnerProps {
  project: JavaProject;
}

export const RealJvmRunner: React.FC<RealJvmRunnerProps> = ({ project }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);

  const displayRef = useRef<HTMLDivElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, text]);
  };

  const handleStart = async () => {
    if (isRunning) return;
    if (!project.binaryBase64) {
      addLog('[Error]: No binary data found for this project.\n');
      return;
    }

    setLogs([]);
    setIsRunning(true);
    setExitCode(null);

    try {
      // Decode base64 to binary Uint8Array
      const byteChars = atob(project.binaryBase64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }

      const isClass = project.type === 'class';
      const className = project.jarManifest?.mainClass || project.title.replace(/\s+/g, '');

      const code = await runRealJavaJar({
        binaryBytes: byteNumbers,
        isClassFile: isClass,
        className,
        displayContainer: displayRef.current,
        onOutput: (text) => addLog(text),
      });

      setExitCode(code);
    } catch (err: any) {
      addLog(`\n[Execution Error]: ${err.message || String(err)}\n`);
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownload = () => {
    if (!project.binaryBase64 || !project.binaryFilename) return;
    const byteChars = atob(project.binaryBase64);
    const byteNumbers = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: 'application/java-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = project.binaryFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBat = () => {
    const batScript = generateWindowsLauncherScript(project);
    const blob = new Blob([batScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run_${project.title.replace(/\s+/g, '_').toLowerCase()}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Runner Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Runner Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-slate-200 flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>WebAssembly OpenJDK JVM · {project.binaryFilename || project.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run In Browser</span>
              </button>
            ) : (
              <span className="text-emerald-400 font-mono text-xs flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Running...
              </span>
            )}

            <button
              onClick={() => {
                setLogs([]);
                setExitCode(null);
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Clear Terminal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Graphical Display Mount for AWT / Swing GUI windows */}
        <div
          ref={displayRef}
          className="w-full flex justify-center bg-slate-900/40 min-h-0 empty:hidden"
        />

        {/* Real Console Terminal Output */}
        <div
          ref={terminalScrollRef}
          className="p-5 font-mono text-xs sm:text-sm text-slate-200 h-80 overflow-y-auto terminal-screen selection:bg-amber-500/30 whitespace-pre-wrap leading-relaxed"
        >
          {logs.length === 0 && !isRunning && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-2">
              <Cpu className="w-10 h-10 text-amber-500/40" />
              <p className="text-sm font-medium text-slate-400">Ready to execute real Java bytecode.</p>
              <p className="text-xs text-slate-500 max-w-md">
                Click <strong>"Run In Browser"</strong> above to launch the real OpenJDK Virtual Machine inside WebAssembly.
              </p>
            </div>
          )}

          {logs.map((text, idx) => (
            <span key={idx} className={text.includes('[Error]') || text.includes('Exception') ? 'text-rose-400 font-bold' : text.includes('===') ? 'text-amber-300' : 'text-slate-100'}>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* 1-Click Native PC Launcher Kit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Direct File Download</h4>
          </div>
          <p className="text-xs text-slate-400">
            Download the raw compiled Java binary to run or inspect on your computer.
          </p>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download {project.binaryFilename || 'project.jar'}</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Double-Click Windows Launcher (.bat)</h4>
          </div>
          <p className="text-xs text-slate-400">
            Pre-configured script for Windows. Double-clicking it automatically runs the project with local Java.
          </p>
          <button
            onClick={handleDownloadBat}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download run_on_windows.bat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
