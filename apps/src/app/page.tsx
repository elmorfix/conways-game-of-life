'use client';

import { useReducer, useRef, useEffect, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';
import { createGrid, toggleCell, getCell } from '@conways-game-of-life/sim';
import { GridSizeForm } from './components/GridSizeForm';

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
  | { type: 'tick' }
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
  const { grid, genCount } = state;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 px-4 py-3 lg:px-6">
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
            width={canvasWidth}
            height={canvasHeight}
            onPointerDown={handleCanvasPointerDown}
            className={`rounded border border-neutral-800 ${state.running ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        {/* Controls sidebar */}
        <aside className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0">
          <section>
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Grid Size
            </h2>
            <GridSizeForm
              currentWidth={grid.width}
              currentHeight={grid.height}
              onResize={handleResize}
            />
          </section>

          {/* Placeholder sections for future controls (Stories 3.3–3.5) */}
          <section>
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Controls
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-500"
              >
                Play
              </button>
              <button
                type="button"
                disabled
                className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-500"
              >
                Step
              </button>
              <button
                type="button"
                disabled
                className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-500"
              >
                Clear
              </button>
              <button
                type="button"
                disabled
                className="rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-500"
              >
                Random
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium text-neutral-400">
              Speed
            </h2>
            <input
              type="range"
              min={1}
              max={60}
              disabled
              aria-label="Generations per second"
              className="w-full accent-cyan-400 disabled:opacity-40"
            />
          </section>
        </aside>
      </main>
    </div>
  );
}
