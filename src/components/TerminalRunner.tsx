import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Trash2, Send, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JavaRuntime } from '../services/javaRunner';
import { ExecutionLog } from '../types';

interface TerminalRunnerProps {
  code: string;
  projectTitle: string;
  instructions?: string;
  autoStart?: boolean;
}

export const TerminalRunner: React.FC<TerminalRunnerProps> = ({
  code,
  projectTitle,
  instructions,
  autoStart = true,
}) => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingInput, setIsWaitingInput] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [inputPrompt, setInputPrompt] = useState<string | undefined>();
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const runtimeRef = useRef<JavaRuntime | null>(null);
  const inputResolverRef = useRef<((val: string) => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputFieldRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isWaitingInput]);

  // Focus input field when waiting for user response
  useEffect(() => {
    if (isWaitingInput && inputFieldRef.current) {
      inputFieldRef.current.focus();
    }
  }, [isWaitingInput]);

  const addLog = (text: string, type: 'stdout' | 'stderr' | 'system' | 'input') => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        text,
        timestamp: Date.now(),
      },
    ]);

    // Check if celebration trigger (e.g. congratulations or won in game)
    if (text.includes('CONGRATULATIONS') || text.includes('victorious') || text.includes('🎉')) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleStart = async () => {
    if (isRunning) return;

    // Reset state
    setLogs([]);
    setIsRunning(true);
    setIsWaitingInput(false);
    setElapsedMs(0);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    const runtime = new JavaRuntime();
    runtimeRef.current = runtime;

    await runtime.run(code, {
      onOutput: (text, type) => {
        addLog(text, type);
      },
      onClear: () => {
        setLogs([]);
      },
      onRequestInput: (promptText) => {
        return new Promise<string>((resolve) => {
          setIsWaitingInput(true);
          setInputPrompt(promptText);
          inputResolverRef.current = (val: string) => {
            setIsWaitingInput(false);
            setInputPrompt(undefined);
            resolve(val);
          };
        });
      },
      onFinished: (code) => {
        setIsRunning(false);
        setIsWaitingInput(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
    });

    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStop = () => {
    if (runtimeRef.current) {
      runtimeRef.current.stop();
    }
    if (inputResolverRef.current) {
      inputResolverRef.current('');
      inputResolverRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingInput(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSendInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isWaitingInput || !inputResolverRef.current) return;

    const val = inputVal;
    setInputVal('');
    const resolver = inputResolverRef.current;
    inputResolverRef.current = null;
    resolver(val);
  };

  // Start on mount or code change if autoStart
  useEffect(() => {
    if (autoStart) {
      handleStart();
    }
    return () => {
      handleStop();
    };
  }, [code]);

  return (
    <div className="flex flex-col w-full h-[520px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-300 font-mono flex items-center gap-1.5 ml-2">
            <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>JVM Terminal · {projectTitle}</span>
          </span>
          {isRunning && (
            <span className="text-emerald-400 font-mono text-[11px] animate-pulse">
              ● Running ({(elapsedMs / 1000).toFixed(1)}s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={() => {
              handleStop();
              setTimeout(handleStart, 150);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Screen */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs sm:text-sm overflow-y-auto terminal-screen selection:bg-amber-500/30 text-slate-200 leading-relaxed"
      >
        {logs.length === 0 && !isRunning && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <TerminalIcon className="w-10 h-10 mb-2 opacity-40 text-amber-500" />
            <p className="text-sm">Click "Run" above to start the Java program.</p>
            {instructions && (
              <p className="text-xs text-slate-400 mt-2 max-w-md text-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {instructions}
              </p>
            )}
          </div>
        )}

        {logs.map((log) => {
          if (log.type === 'system') {
            return (
              <div key={log.id} className="text-cyan-400/90 whitespace-pre-wrap py-0.5">
                {log.text}
              </div>
            );
          }
          if (log.type === 'stderr') {
            return (
              <div key={log.id} className="text-rose-400 whitespace-pre-wrap font-semibold py-0.5">
                {log.text}
              </div>
            );
          }
          if (log.type === 'input') {
            return (
              <div key={log.id} className="text-amber-300 whitespace-pre-wrap font-bold py-0.5 flex items-center gap-1">
                <span>&gt; {log.text}</span>
              </div>
            );
          }
          // Standard stdout
          return (
            <span key={log.id} className="text-slate-100 whitespace-pre-wrap">
              {log.text}
            </span>
          );
        })}

        {/* Flashing waiting indicator if waiting for input */}
        {isWaitingInput && (
          <div className="flex items-center gap-2 text-amber-400 font-bold mt-1 animate-pulse">
            <span>&gt;</span>
            <span className="text-xs font-normal text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              {inputPrompt || 'Waiting for your input below...'}
            </span>
            <span className="w-2 h-4 bg-amber-400 inline-block animate-bounce" />
          </div>
        )}
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={handleSendInput}
        className={`flex items-center gap-2 p-2.5 border-t transition-colors ${
          isWaitingInput
            ? 'bg-amber-950/30 border-amber-600/50'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <span className="font-mono text-sm font-bold text-amber-400 pl-2 select-none">&gt;</span>
        <input
          ref={inputFieldRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={!isWaitingInput}
          placeholder={
            isWaitingInput
              ? 'Type response and press Enter (or click Send)...'
              : isRunning
              ? 'Program running...'
              : 'Program not running. Click Run above.'
          }
          className="flex-1 bg-transparent border-0 outline-none font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:ring-0"
        />
        <button
          type="submit"
          disabled={!isWaitingInput}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            isWaitingInput
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
