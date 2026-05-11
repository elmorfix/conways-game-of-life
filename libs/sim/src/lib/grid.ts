import type { Grid } from '@conways-game-of-life/types';

export function createGrid(width: number, height: number): Grid {
  if (width <= 0 || height <= 0) {
    throw new RangeError(
      `Grid dimensions must be positive integers, got ${width}×${height}`
    );
  }
  return { width, height, cells: new Uint8Array(width * height) };
}

export function cloneGrid(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: new Uint8Array(grid.cells) };
}

export function getCell(grid: Grid, x: number, y: number): 0 | 1 {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    return 0;
  }
  return grid.cells[y * grid.width + x] as 0 | 1;
}

export function setCell(
  grid: Grid,
  x: number,
  y: number,
  alive: 0 | 1
): Grid {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    return grid;
  }
  const cells = new Uint8Array(grid.cells);
  cells[y * grid.width + x] = alive;
  return { width: grid.width, height: grid.height, cells };
}

export function toggleCell(grid: Grid, x: number, y: number): Grid {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
    return grid;
  }
  const idx = y * grid.width + x;
  const cells = new Uint8Array(grid.cells);
  cells[idx] = cells[idx] === 1 ? 0 : 1;
  return { width: grid.width, height: grid.height, cells };
}

export function clearGrid(grid: Grid): Grid {
  return { width: grid.width, height: grid.height, cells: new Uint8Array(grid.width * grid.height) };
}
