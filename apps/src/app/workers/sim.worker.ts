import { step } from '@conways-game-of-life/sim';
import type { Grid } from '@conways-game-of-life/types';

export interface StepRequest {
  type: 'step';
  width: number;
  height: number;
  cells: ArrayBuffer;
}

export interface StepResponse {
  type: 'stepped';
  width: number;
  height: number;
  cells: ArrayBuffer;
}

self.onmessage = (e: MessageEvent<StepRequest>) => {
  const { width, height, cells } = e.data;
  const grid: Grid = { width, height, cells: new Uint8Array(cells) };

  const next = step(grid);

  const response: StepResponse = {
    type: 'stepped',
    width: next.width,
    height: next.height,
    cells: next.cells.buffer as ArrayBuffer,
  };

  (self as unknown as Worker).postMessage(response, [response.cells]);
};
