import type { Grid } from './types.js';

describe('Grid type', () => {
  it('should be structurally assignable from a conforming object', () => {
    const grid: Grid = {
      width: 3,
      height: 3,
      cells: new Uint8Array(9),
    };
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(3);
    expect(grid.cells).toBeInstanceOf(Uint8Array);
    expect(grid.cells.length).toBe(9);
  });
});
