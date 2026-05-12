'use client';

import { useReducer, useRef, useEffect, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';
import { createGrid, toggleCell, getCell, randomizeGrid } from '@conways-game-of-life/sim';
import { Play, Pause, SkipForward, Trash2, Shuffle, Gauge } from 'lucide-react';
import { GridSizeForm } from './components/GridSizeForm';
import { useWorkerSimulationLoop } from './hooks/useWorkerSimulationLoop';

const DEFAULT_WIDTH = 30;
const DEFAULT_HEIGHT = 30;
const DEFAULT_GEN_PER_SEC = 10;

interface SimState {
  grid: Grid;
  running: boolean;
  genCount: number;
  genPerSec: number;
}

type SimAction =
  | { type: 'resize'; width: number; height: number }
  | { type: 'workerTick'; grid: Grid }
  | { type: 'toggleCell'; x: number; y: number }
  | { type: 'clear' }
  | { type: 'randomize' }
  | { type: 'setRunning'; running: boolean }
  | { type: 'setGenPerSec'; genPerSec: number };

function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'resize':
      return {
        ...state,
        grid: createGrid(action.width, action.height),
        running: false,
        genCount: 0,
      };
    case 'setRunning':
      return { ...state, running: action.running };
    case 'setGenPerSec':
      return { ...state, genPerSec: action.genPerSec };
    case 'workerTick':
      return {
        ...state,
        grid: action.grid,
        genCount: state.genCount + 1,
      };
    case 'toggleCell':
      return {
        ...state,
        grid: toggleCell(state.grid, action.x, action.y),
      };
    case 'clear':
      return {
        ...state,
        grid: createGrid(state.grid.width, state.grid.height),
        running: false,
        genCount: 0,
      };
    case 'randomize':
      return {
        ...state,
        grid: randomizeGrid(state.grid),
        running: false,
        genCount: 0,
      };
    default:
      return state;
  }
}

function initState(): SimState {
  return {
    grid: createGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    running: false,
    genCount: 0,
    genPerSec: DEFAULT_GEN_PER_SEC,
  };
}

const DEAD_COLOR = '#0a0a0a';
const ALIVE_COLOR = '#22d3ee';
const GRID_LINE_COLOR = '#1a1a1a';

function computeCellSize(
  containerWidth: number,
  gridWidth: number,
  gridHeight: number
): number {
  const maxByWidth = Math.floor(containerWidth / gridWidth);
  const maxByViewportHeight = Math.floor(
    (typeof window !== 'undefined' ? window.innerHeight * 0.65 : 600) /
      gridHeight
  );
  return Math.max(4, Math.min(20, maxByWidth, maxByViewportHeight));
}

export default function GamePage() {
  const [state, dispatch] = useReducer(simReducer, undefined, initState);
  const { grid, running, genCount, genPerSec } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWorkerTick = useCallback(
    (nextGrid: Grid) => dispatch({ type: 'workerTick', grid: nextGrid }),
    []
  );
  const { stepOnce } = useWorkerSimulationLoop(
    running,
    genPerSec,
    grid,
    handleWorkerTick
  );

  const cellSize = containerRef.current
    ? computeCellSize(
        containerRef.current.clientWidth,
        grid.width,
        grid.height
      )
    : Math.min(20, Math.floor(600 / Math.max(grid.width, grid.height)));

  const canvasWidth = grid.width * cellSize;
  const canvasHeight = grid.height * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = DEAD_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = ALIVE_COLOR;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (getCell(grid, x, y) === 1) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= grid.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvasWidth, y * cellSize);
      ctx.stroke();
    }
  }, [grid, cellSize, canvasWidth, canvasHeight]);

  const handleResize = useCallback(
    (width: number, height: number) => {
      dispatch({ type: 'resize', width, height });
    },
    []
  );

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (state.running) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (event.clientX - rect.left) * scaleX;
      const canvasY = (event.clientY - rect.top) * scaleY;

      const x = Math.floor(canvasX / cellSize);
      const y = Math.floor(canvasY / cellSize);

      if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return;

      dispatch({ type: 'toggleCell', x, y });
    },
    [state.running, grid.width, grid.height, cellSize]
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-lg lg:px-6">
        <h1 className="text-lg font-semibold tracking-tight">
          Conway&apos;s Game of Life
        </h1>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>Generation:</span>
          <span
            data-testid="gen-count"
            className="font-mono text-cyan-400"
          >
            {genCount}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex flex-1 items-start justify-center"
        >
          <canvas
            ref={canvasRef}
            data-testid="grid-canvas"
            role="img"
            aria-label={`Game of Life grid, ${grid.width} columns by ${grid.height} rows, generation ${genCount}`}
            width={canvasWidth}
            height={canvasHeight}
            onPointerDown={handleCanvasPointerDown}
            className={`rounded border border-neutral-800 ${state.running ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Controls sidebar */}
        <aside className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0">
          <section className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-lg">
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Grid Size
            </h2>
            <GridSizeForm
              currentWidth={grid.width}
              currentHeight={grid.height}
              onResize={handleResize}
            />
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-lg">
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Controls
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="play-pause-btn"
                aria-label={running ? 'Pause simulation' : 'Play simulation'}
                onClick={() =>
                  dispatch({ type: 'setRunning', running: !running })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-600/80 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-cyan-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                data-testid="step-btn"
                aria-label="Step one generation"
                disabled={running}
                onClick={stepOnce}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-neutral-100 backdrop-blur-sm hover:bg-white/15 disabled:text-neutral-500 disabled:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <SkipForward size={14} />
                Step
              </button>
              <button
                type="button"
                data-testid="clear-btn"
                aria-label="Clear grid"
                onClick={() => dispatch({ type: 'clear' })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-neutral-100 backdrop-blur-sm hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Trash2 size={14} />
                Clear
              </button>
              <button
                type="button"
                data-testid="randomize-btn"
                aria-label="Randomize grid"
                onClick={() => dispatch({ type: 'randomize' })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-neutral-100 backdrop-blur-sm hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Shuffle size={14} />
                Randomize
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-lg">
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Speed
            </h2>
            <div className="flex items-center gap-3">
              <Gauge size={14} className="shrink-0 text-neutral-400" />
              <input
                type="range"
                data-testid="speed-slider"
                min={1}
                max={60}
                value={genPerSec}
                onChange={(e) =>
                  dispatch({
                    type: 'setGenPerSec',
                    genPerSec: Number(e.target.value),
                  })
                }
                aria-label="Generations per second"
                aria-valuemin={1}
                aria-valuemax={60}
                aria-valuenow={genPerSec}
                className="w-full accent-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-sm"
              />
              <span
                data-testid="speed-value"
                className="shrink-0 min-w-[4ch] text-right font-mono text-sm text-cyan-400"
              >
                {genPerSec}
              </span>
              <span className="shrink-0 text-xs text-neutral-500">gen/s</span>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
