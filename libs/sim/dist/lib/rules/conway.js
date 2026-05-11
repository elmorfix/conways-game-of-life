import { getCell } from '../grid.js';
function countNeighbors(grid, x, y) {
    return (getCell(grid, x - 1, y - 1) +
        getCell(grid, x, y - 1) +
        getCell(grid, x + 1, y - 1) +
        getCell(grid, x - 1, y) +
        getCell(grid, x + 1, y) +
        getCell(grid, x - 1, y + 1) +
        getCell(grid, x, y + 1) +
        getCell(grid, x + 1, y + 1));
}
export function step(grid) {
    const { width, height } = grid;
    const cells = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const neighbors = countNeighbors(grid, x, y);
            const alive = grid.cells[y * width + x];
            if (alive) {
                cells[y * width + x] = neighbors === 2 || neighbors === 3 ? 1 : 0;
            }
            else {
                cells[y * width + x] = neighbors === 3 ? 1 : 0;
            }
        }
    }
    return { width, height, cells };
}
export const conwayRules = {
    id: 'conway',
    name: "Conway's Game of Life",
    step,
};
