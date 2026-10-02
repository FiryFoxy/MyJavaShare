import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Pause, Volume2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface GraphicsCanvasRunnerProps {
  projectId: string;
  projectTitle: string;
}

export const GraphicsCanvasRunner: React.FC<GraphicsCanvasRunnerProps> = ({ projectId, projectTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Snake state ref
  const snakeState = useRef<{
    snake: { x: number; y: number }[];
    dir: { x: number; y: number };
    nextDir: { x: number; y: number };
    apple: { x: number; y: number };
    gridSize: number;
    tileCount: number;
    speed: number;
    lastTick: number;
  }>({
    snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    apple: { x: 15, y: 5 },
    gridSize: 20,
    tileCount: 20,
    speed: 110,
    lastTick: 0,
  });

  // Physics balls state ref
  const physicsState = useRef<{
    balls: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }[];
  }>({
    balls: [
      { x: 100, y: 50, vx: 3, vy: 0, radius: 16, color: '#f59e0b' },
      { x: 200, y: 80, vx: -2, vy: 1, radius: 22, color: '#3b82f6' },
      { x: 300, y: 40, vx: 1.5, vy: -1, radius: 18, color: '#10b981' },
      { x: 150, y: 120, vx: -3, vy: -2, radius: 14, color: '#ec4899' },
    ],
  });

  const isSnake = projectId.includes('snake');
  const isPhysics = projectId.includes('physics') || projectId.includes('bouncing');

  // Snake reset
  const resetSnake = () => {
    snakeState.current = {
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      apple: {
        x: Math.floor(Math.random() * 18) + 1,
        y: Math.floor(Math.random() * 18) + 1,
      },
      gridSize: 20,
      tileCount: 20,
      speed: 110,
      lastTick: performance.now(),
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  // Keyboard controls for Snake
  useEffect(() => {
    if (!isSnake) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { dir } = snakeState.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y === 0) {
        snakeState.current.nextDir = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y === 0) {
        snakeState.current.nextDir = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x === 0) {
        snakeState.current.nextDir = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x === 0) {
        snakeState.current.nextDir = { x: 1, y: 0 };
        e.preventDefault();
      } else if (e.key === ' ' && gameOver) {
        resetSnake();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSnake, gameOver]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      if (isSnake) {
        // --- SNAKE LOGIC ---
        const s = snakeState.current;
        if (isPlaying && !gameOver && time - s.lastTick > s.speed) {
          s.lastTick = time;
          s.dir = s.nextDir;
          const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

          // Wall collision
          if (head.x < 0 || head.x >= s.tileCount || head.y < 0 || head.y >= s.tileCount) {
            setGameOver(true);
          } else if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            // Tail collision
            setGameOver(true);
          } else {
            s.snake.unshift(head);
            // Check apple
            if (head.x === s.apple.x && head.y === s.apple.y) {
              setScore(prev => {
                const nextScore = prev + 10;
                setHighScore(h => Math.max(h, nextScore));
                return nextScore;
              });
              // spawn new apple
              s.apple = {
                x: Math.floor(Math.random() * s.tileCount),
                y: Math.floor(Math.random() * s.tileCount),
              };
              // slight speed increase
              s.speed = Math.max(70, s.speed - 2);
            } else {
              s.snake.pop();
            }
          }
        }

        // Draw Snake Canvas
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines (subtle)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        const cellSize = canvas.width / s.tileCount;
        for (let i = 0; i <= s.tileCount; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellSize, 0);
          ctx.lineTo(i * cellSize, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cellSize);
          ctx.lineTo(canvas.width, i * cellSize);
          ctx.stroke();
        }

        // Draw Apple
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(
          (s.apple.x + 0.5) * cellSize,
          (s.apple.y + 0.5) * cellSize,
          cellSize * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Snake
        s.snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? '#10b981' : '#059669';
          ctx.shadowColor = i === 0 ? '#34d399' : 'transparent';
          ctx.shadowBlur = i === 0 ? 6 : 0;
          ctx.fillRect(
            seg.x * cellSize + 1.5,
            seg.y * cellSize + 1.5,
            cellSize - 3,
            cellSize - 3
          );
        });
        ctx.shadowBlur = 0;

        // Game over overlay
        if (gameOver) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 15);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '14px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('Press Space or Restart below to play again', canvas.width / 2, canvas.height / 2 + 45);
        }
      } else {
        // --- PHYSICS / BOUNCING BALLS LOGIC ---
        const p = physicsState.current;
        const width = canvas.width;
        const height = canvas.height;
        const gravity = 0.25;
        const friction = 0.99;
        const bounce = 0.82;

        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        if (isPlaying) {
          p.balls.forEach(b => {
            b.vy += gravity;
            b.vx *= friction;
            b.vy *= friction;

            b.x += b.vx;
            b.y += b.vy;

            // Floor collision
            if (b.y + b.radius > height) {
              b.y = height - b.radius;
              b.vy = -b.vy * bounce;
            }
            // Ceiling collision
            if (b.y - b.radius < 0) {
              b.y = b.radius;
              b.vy = -b.vy * bounce;
            }
            // Walls collision
            if (b.x + b.radius > width) {
              b.x = width - b.radius;
              b.vx = -b.vx * bounce;
            }
            if (b.x - b.radius < 0) {
              b.x = b.radius;
              b.vx = -b.vx * bounce;
            }
          });
        }

        // Draw balls
        p.balls.forEach(b => {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          // Highlight reflex
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Overlay text
        ctx.fillStyle = '#64748b';
        ctx.font = '12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Particles: ${p.balls.length} (Click anywhere to spawn)`, 16, 24);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isSnake, isPlaying, gameOver, score]);

  // Click on canvas to spawn physics ball
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isSnake) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const radius = Math.floor(Math.random() * 14) + 12;

    physicsState.current.balls.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 6,
      radius,
      color,
    });
  };

  const handleDPad = (dx: number, dy: number) => {
    if (!isSnake) return;
    const { dir } = snakeState.current;
    if (dx !== 0 && dir.x === 0) {
      snakeState.current.nextDir = { x: dx, y: 0 };
    } else if (dy !== 0 && dir.y === 0) {
      snakeState.current.nextDir = { x: 0, y: dy };
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Game Header Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-t-xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            {isSnake ? 'Java 2D Canvas Arcade' : 'Java Physics Engine'}
          </span>
          {isSnake && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-300">Score: <strong className="text-emerald-400 text-sm">{score}</strong></span>
              <span className="text-slate-400">Best: {highScore}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              if (isSnake) resetSnake();
              else {
                physicsState.current.balls = [
                  { x: 100, y: 50, vx: 3, vy: 0, radius: 16, color: '#f59e0b' },
                  { x: 200, y: 80, vx: -2, vy: 1, radius: 22, color: '#3b82f6' },
                  { x: 300, y: 40, vx: 1.5, vy: -1, radius: 18, color: '#10b981' },
                ];
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative border-x border-b border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex justify-center w-full">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onClick={handleCanvasClick}
          className="cursor-pointer max-w-full aspect-square"
        />
      </div>

      {/* On-screen controls for mobile/tablet friends */}
      {isSnake && (
        <div className="w-full bg-slate-900 border border-slate-800 border-t-0 rounded-b-xl p-3 flex flex-col items-center">
          <div className="text-xs text-slate-400 mb-2">Controls: Arrow keys on keyboard or buttons below</div>
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => handleDPad(0, -1)}
              className="p-2.5 bg-slate-800 active:bg-amber-600 rounded-lg text-slate-200"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDPad(-1, 0)}
                className="p-2.5 bg-slate-800 active:bg-amber-600 rounded-lg text-slate-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDPad(0, 1)}
                className="p-2.5 bg-slate-800 active:bg-amber-600 rounded-lg text-slate-200"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDPad(1, 0)}
                className="p-2.5 bg-slate-800 active:bg-amber-600 rounded-lg text-slate-200"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isPhysics && (
        <div className="w-full bg-slate-900 border border-slate-800 border-t-0 rounded-b-xl p-3 text-center text-xs text-slate-400">
          💡 Click or tap anywhere in the box above to drop more bouncing balls!
        </div>
      )}
    </div>
  );
};
