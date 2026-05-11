export {
  createGrid,
  cloneGrid,
  getCell,
  setCell,
  toggleCell,
  clearGrid,
} from './lib/grid.js';

export { step, conwayRules } from './lib/rules/conway.js';

export type { Grid, RuleSet } from '@conways-game-of-life/types';
