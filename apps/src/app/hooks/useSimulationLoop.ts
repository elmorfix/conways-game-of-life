'use client';

import { useRef, useEffect } from 'react';

/**
 * Drives the simulation loop using requestAnimationFrame with a time
 * accumulator so speed (genPerSec) can change mid-run without restarting.
 *
 * Architecture §5.2: rAF + accumulator pattern; genPerSec stored in a ref
 * so the loop always reads the latest value without re-subscribing.
 */
export function useSimulationLoop(
  running: boolean,
  genPerSec: number,
  onTick: () => void
): void {
  const genPerSecRef = useRef(genPerSec);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    genPerSecRef.current = genPerSec;
  }, [genPerSec]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

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

      while (accumulator >= interval) {
        accumulator -= interval;
        onTickRef.current();
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [running]);
}
