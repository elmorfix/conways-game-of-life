import { createGrid, setCell, getCell } from '../grid.js';
import { step, conwayRules } from './conway.js';

function liveCells(g: ReturnType<typeof createGrid>): [number, number][] {
  const result: [number, number][] = [];
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (getCell(g, x, y) === 1) result.push([x, y]);
    }
  }
  return result;
}

describe('Rule 1: underpopulation (< 2 neighbors → dies)', () => {
  it('single live cell with 0 neighbors dies', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    const next = step(g);
    expect(liveCells(next)).toEqual([]);
  });

  it('live cell with exactly 1 neighbor dies', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    g = setCell(g, 2, 1, 1);
    const next = step(g);
    expect(getCell(next, 1, 1)).toBe(0);
    expect(getCell(next, 2, 1)).toBe(0);
  });
});

describe('Rule 2: survival (2–3 neighbors → survives)', () => {
  it('live cell with exactly 2 neighbors survives', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 1, 0, 1);
    g = setCell(g, 0, 1, 1);
    const next = step(g);
    expect(getCell(next, 0, 0)).toBe(1);
  });

  it('live cell with exactly 3 neighbors survives', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 1, 0, 1);
    g = setCell(g, 0, 1, 1);
    g = setCell(g, 1, 1, 1);
    const next = step(g);
    expect(getCell(next, 0, 0)).toBe(1);
  });
});

describe('Rule 3: overpopulation (> 3 neighbors → dies)', () => {
  it('live cell with 4+ neighbors dies', () => {
    // center cell at (1,1) with 4 neighbors: (0,0), (2,0), (0,2), (2,2)
    let g = createGrid(3, 3);
    g = setCell(g, 1, 1, 1);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 2, 0, 1);
    g = setCell(g, 0, 2, 1);
    g = setCell(g, 2, 2, 1);
    const next = step(g);
    expect(getCell(next, 1, 1)).toBe(0);
  });
});

describe('Rule 4: reproduction (dead cell + exactly 3 neighbors → alive)', () => {
  it('dead cell with exactly 3 live neighbors becomes alive', () => {
    let g = createGrid(3, 3);
    g = setCell(g, 0, 0, 1);
    g = setCell(g, 1, 0, 1);
    g = setCell(g, 0, 1, 1);
    // (1,1) is dead with 3 neighbors → should become alive
    const next = step(g);
    expect(getCell(next, 1, 1)).toBe(1);
  });
});

describe('Block still life', () => {
  it('2×2 block remains stable across 5 generations', () => {
    let g = createGrid(4, 4);
    g = setCell(g, 1, 1, 1);
    g = setCell(g, 2, 1, 1);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);
    const initial = g.cells;

    for (let i = 0; i < 5; i++) {
      g = step(g);
      expect(g.cells).toEqual(initial);
    }
  });
});

describe('Blinker oscillator', () => {
  it('horizontal blinker becomes vertical, then horizontal again (period-2)', () => {
    // Horizontal blinker: (1,2), (2,2), (3,2)
    let g = createGrid(5, 5);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);
    g = setCell(g, 3, 2, 1);
    const horizontal = g.cells;

    // After step 1: vertical at (2,1), (2,2), (2,3)
    g = step(g);
    expect(liveCells(g).sort()).toEqual([[2, 1], [2, 2], [2, 3]]);

    // After step 2: back to horizontal
    g = step(g);
    expect(g.cells).toEqual(horizontal);

    // After step 3: vertical again
    g = step(g);
    expect(liveCells(g).sort()).toEqual([[2, 1], [2, 2], [2, 3]]);

    // After step 4: horizontal again
    g = step(g);
    expect(g.cells).toEqual(horizontal);
  });
});

describe('Glider spaceship', () => {
  it('canonical glider translates by (1,1) after 4 steps', () => {
    // Glider: (1,0), (2,1), (0,2), (1,2), (2,2)
    let g = createGrid(10, 10);
    g = setCell(g, 1, 0, 1);
    g = setCell(g, 2, 1, 1);
    g = setCell(g, 0, 2, 1);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);

    const initialPositions = liveCells(g).sort();

    g = step(step(step(step(g))));

    const finalPositions = liveCells(g).sort();

    // Each cell should have translated by (+1, +1)
    const expectedPositions = initialPositions
      .map(([x, y]) => [x + 1, y + 1] as [number, number])
      .sort();
    expect(finalPositions).toEqual(expectedPositions);
  });
});

describe('Determinism', () => {
  it('same input produces byte-identical output across 100 runs', () => {
    let g = createGrid(5, 5);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);
    g = setCell(g, 3, 2, 1);

    const reference = step(g);
    for (let i = 0; i < 100; i++) {
      const result = step(g);
      expect(result.cells).toEqual(reference.cells);
    }
  });
});

describe('Immutability', () => {
  it('step() does not mutate the input grid', () => {
    let g = createGrid(5, 5);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);
    g = setCell(g, 3, 2, 1);
    const cellsBefore = new Uint8Array(g.cells);

    step(g);
    expect(g.cells).toEqual(cellsBefore);
  });
});

describe('conwayRules RuleSet object', () => {
  it('has correct id and name', () => {
    expect(conwayRules.id).toBe('conway');
    expect(conwayRules.name).toBe("Conway's Game of Life");
  });

  it('step method produces same result as standalone step function', () => {
    let g = createGrid(5, 5);
    g = setCell(g, 1, 2, 1);
    g = setCell(g, 2, 2, 1);
    g = setCell(g, 3, 2, 1);

    expect(conwayRules.step(g).cells).toEqual(step(g).cells);
  });
});
