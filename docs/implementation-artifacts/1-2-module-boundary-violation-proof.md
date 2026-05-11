# Story 1.2 Module Boundary Violation Proof

This artifact captures the deliberate violation run for `libs/sim` and the resulting lint failure.

## Command

`pnpm nx lint sim`

## Failing Console Output

```text
> nx run sim:lint

> eslint .

(node:16140) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

/home/andre/exam/conways-game-of-life/libs/sim/jest.config.cts
  1:1  warning  Unused eslint-disable directive (no problems were reported)

/home/andre/exam/conways-game-of-life/libs/sim/src/index.ts
  1:1   error    'react' import is restricted from being used. libs/sim must remain framework-agnostic and cannot import React  no-restricted-imports
  1:13  warning  'React' is defined but never used                                                                              @typescript-eslint/no-unused-vars

✖ 3 problems (1 error, 2 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.

Warning: command "eslint ." exited with non-zero status code

 NX   Running target lint for project sim failed

Failed tasks:

- sim:lint

Hint: run the command with --verbose for more details.
```
