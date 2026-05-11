import {
  createGrid,
  cloneGrid,
  getCell,
  setCell,
  toggleCell,
  clearGrid,
} from './grid.js';

describe('createGrid', () => {
  it('produces cells.length === width * height, all zero', () => {
    const g = createGrid(4, 3);
    expect(g.width).toBe(4);
    expect(g.height).toBe(3);
    expect(g.cells).toBeInstanceOf(Uint8Array);
    expect(g.cells.length).toBe(12);
    expect(g.cells.every((c) => c === 0)).toBe(true);
  });

  it('creates a 1x1 grid', () => {
    const g = createGrid(1, 1);
    expect(g.cells.length).toBe(1);
    expect(g.cells[0]).toBe(0);
  });

  it('throws RangeError for negative width', () => {
    expect(() => createGrid(-1, 5)).toThrow(RangeError);
  });

  it('throws RangeError for negative height', () => {
    expect(() => createGrid(5, -1)).toThrow(RangeError);
  });

  it('throws RangeError for zero width', () => {
    expect(() => createGrid(0, 5)).toThrow(RangeError);
  });

  it('throws RangeError for zero height', () => {
    expect(() => createGrid(5, 0)).toThrow(RangeError);
  });
});

describe('setCell', () => {
  it('sets exactly the targeted cell to alive', () => {
    const g = createGrid(3, 3);
    const g2 = setCell(g, 1, 2, 1);
    expect(getCell(g2, 1, 2)).toBe(1);
    // all other cells remain 0
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (x !== 1 || y !== 2) {
          expect(getCell(g2, x, y)).toBe(0);
        }
      }
    }
  });

  it('does not mutate the original grid', () => {
    const g = createGrid(3, 3);
    const cellsBefore = new Uint8Array(g.cells);
    setCell(g, 1, 1, 1);
    expect(g.cells).toEqual(cellsBefore);
  });

  it('can set a cell back to dead', () => {
    const g = setCell(createGrid(3, 3), 1, 1, 1);
    const g2 = setCell(g, 1, 1, 0);
    expect(getCell(g2, 1, 1)).toBe(0);
  });

  it('returns original grid unchanged for out-of-bounds coordinates', () => {
    const g = createGrid(3, 3);
    const g2 = setCell(g, -1, 0, 1);
    expect(g2.cells).toEqual(g.cells);
    const g3 = setCell(g, 0, 3, 1);
    expect(g3.cells).toEqual(g.cells);
  });
});

describe('toggleCell', () => {
  it('toggles a dead cell to alive', () => {
    const g = createGrid(3, 3);
    const g2 = toggleCell(g, 1, 1);
    expect(getCell(g2, 1, 1)).toBe(1);
  });

  it('is its own inverse (toggle twice = original)', () => {
    const g = createGrid(3, 3);
    const g2 = toggleCell(toggleCell(g, 1, 1), 1, 1);
    expect(g2.cells).toEqual(g.cells);
  });

  it('does not mutate the original grid', () => {
    const g = createGrid(3, 3);
    const cellsBefore = new Uint8Array(g.cells);
    toggleCell(g, 0, 0);
    expect(g.cells).toEqual(cellsBefore);
  });
});

describe('clearGrid', () => {
  it('zeroes every cell', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 1, 1, 1);
    g = setCell(g, 2, 2, 1);
    const cleared = clearGrid(g);
    expect(cleared.cells.every((c) => c === 0)).toBe(true);
  });

  it('preserves dimensions', () => {
    const g = createGrid(5, 7);
    const cleared = clearGrid(g);
    expect(cleared.width).toBe(5);
    expect(cleared.height).toBe(7);
    expect(cleared.cells.length).toBe(35);
  });

  it('does not mutate the original grid', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    const cellsBefore = new Uint8Array(g.cells);
    clearGrid(g);
    expect(g.cells).toEqual(cellsBefore);
  });
});

describe('cloneGrid', () => {
  it('returns a deep-equal but reference-distinct grid', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    const clone = cloneGrid(g);
    expect(clone.width).toBe(g.width);
    expect(clone.height).toBe(g.height);
    expect(clone.cells).toEqual(g.cells);
    expect(clone.cells).not.toBe(g.cells);
    expect(clone).not.toBe(g);
  });

  it('modifying the clone does not affect the original', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    const clone = cloneGrid(g);
    const modified = setCell(clone, 0, 0, 0);
    expect(getCell(g, 0, 0)).toBe(1);
    expect(getCell(modified, 0, 0)).toBe(0);
  });
});

describe('getCell', () => {
  it('returns the correct value for valid coordinates', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 2, 1, 1);
    expect(getCell(g, 2, 1)).toBe(1);
    expect(getCell(g, 0, 0)).toBe(0);
  });

  it('returns 0 for negative x', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, -1, 0)).toBe(0);
  });

  it('returns 0 for negative y', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, 0, -1)).toBe(0);
  });

  it('returns 0 for x beyond width', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, 3, 0)).toBe(0);
    expect(getCell(g, 100, 0)).toBe(0);
  });

  it('returns 0 for y beyond height', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, 0, 3)).toBe(0);
    expect(getCell(g, 0, 100)).toBe(0);
  });

  it('returns correct values at grid boundary cells', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 2, 0, 1);
    g = setCell(g, 0, 2, 1);
    g = setCell(g, 2, 2, 1);
    expect(getCell(g, 0, 0)).toBe(1);
    expect(getCell(g, 2, 0)).toBe(1);
    expect(getCell(g, 0, 2)).toBe(1);
    expect(getCell(g, 2, 2)).toBe(1);
  });
});
