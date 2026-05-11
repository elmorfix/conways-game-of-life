export function createGrid(width, height) {
    if (width <= 0 || height <= 0) {
        throw new RangeError(`Grid dimensions must be positive integers, got ${width}×${height}`);
    }
    return { width, height, cells: new Uint8Array(width * height) };
}
export function cloneGrid(grid) {
    return { width: grid.width, height: grid.height, cells: new Uint8Array(grid.cells) };
}
export function getCell(grid, x, y) {
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
        return 0;
    }
    return grid.cells[y * grid.width + x];
}
export function setCell(grid, x, y, alive) {
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
        return grid;
    }
    const cells = new Uint8Array(grid.cells);
    cells[y * grid.width + x] = alive;
    return { width: grid.width, height: grid.height, cells };
}
export function toggleCell(grid, x, y) {
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
        return grid;
    }
    const idx = y * grid.width + x;
    const cells = new Uint8Array(grid.cells);
    cells[idx] = cells[idx] === 1 ? 0 : 1;
    return { width: grid.width, height: grid.height, cells };
}
export function clearGrid(grid) {
    return { width: grid.width, height: grid.height, cells: new Uint8Array(grid.width * grid.height) };
}
