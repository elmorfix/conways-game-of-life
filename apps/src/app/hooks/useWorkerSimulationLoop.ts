'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Grid } from '@conways-game-of-life/types';
import type { StepResponse } from '../workers/sim.worker';

/**
 * Drives the simulation via a Web Worker + rAF accumulator.
 *
 * The worker runs step() off the main thread. The rAF loop on the main
 * thread handles timing — when a tick is due it posts the current grid's
 * ArrayBuffer to the worker (as a transferable copy) and waits for the
 * result. An in-flight flag prevents queueing multiple steps at once.
 */
export function useWorkerSimulationLoop(
  running: boolean,
  genPerSec: number,
  grid: Grid,
  onTicked: (nextGrid: Grid) => void
): { stepOnce: () => void } {
  const workerRef = useRef<Worker | null>(null);
  const genPerSecRef = useRef(genPerSec);
  const gridRef = useRef(grid);
  const onTickedRef = useRef(onTicked);
  const inFlightRef = useRef(false);

  useEffect(() => {
    genPerSecRef.current = genPerSec;
  }, [genPerSec]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    onTickedRef.current = onTicked;
  }, [onTicked]);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/sim.worker.ts', import.meta.url)
    );

    worker.onmessage = (e: MessageEvent<StepResponse>) => {
      inFlightRef.current = false;
      const { width, height, cells } = e.data;
      const nextGrid: Grid = { width, height, cells: new Uint8Array(cells) };
      onTickedRef.current(nextGrid);
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const sendStep = useCallback((g: Grid) => {
    const worker = workerRef.current;
    if (!worker || inFlightRef.current) return;
    inFlightRef.current = true;

    const buffer = g.cells.buffer.slice(0) as ArrayBuffer;
    worker.postMessage(
      { type: 'step', width: g.width, height: g.height, cells: buffer },
      [buffer]
    );
  }, []);

  // rAF accumulator loop — same pattern as useSimulationLoop but posts to worker
  useEffect(() => {
    if (!running) return;

    let accumulator = 0;
    let lastTimestamp: number | null = null;
    let rafId: number;

    function loop(timestamp: number) {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
        rafId = requestAnimationFrame(loop);
        return;
      }

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      accumulator += delta;

      const interval = 1000 / genPerSecRef.current;

      if (accumulator >= interval) {
        accumulator -= interval;
        if (accumulator > interval) accumulator = interval;
        sendStep(gridRef.current);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [running, sendStep]);

  const stepOnce = useCallback(() => {
    sendStep(gridRef.current);
  }, [sendStep]);

  return { stepOnce };
}
