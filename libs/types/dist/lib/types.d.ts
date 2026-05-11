export interface Grid {
    readonly width: number;
    readonly height: number;
    readonly cells: Uint8Array;
}
export interface RuleSet {
    readonly id: string;
    readonly name: string;
    step(grid: Grid): Grid;
}
//# sourceMappingURL=types.d.ts.map