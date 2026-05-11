import type { Grid } from '@conways-game-of-life/types';
export declare function createGrid(width: number, height: number): Grid;
export declare function cloneGrid(grid: Grid): Grid;
export declare function getCell(grid: Grid, x: number, y: number): 0 | 1;
export declare function setCell(grid: Grid, x: number, y: number, alive: 0 | 1): Grid;
export declare function toggleCell(grid: Grid, x: number, y: number): Grid;
export declare function clearGrid(grid: Grid): Grid;
//# sourceMappingURL=grid.d.ts.map