'use client';

import { useState, useCallback } from 'react';

const MIN_SIZE = 5;
const MAX_SIZE = 100;

interface GridSizeFormProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
}

export function GridSizeForm({
  currentWidth,
  currentHeight,
  onResize,
}: GridSizeFormProps) {
  const [width, setWidth] = useState(String(currentWidth));
  const [height, setHeight] = useState(String(currentHeight));
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (w: string, h: string): string | null => {
      const wNum = Number(w);
      const hNum = Number(h);

      if (w.trim() === '' || h.trim() === '') {
        return 'Width and height are required.';
      }
      if (!Number.isInteger(wNum) || !Number.isInteger(hNum)) {
        return 'Width and height must be whole numbers.';
      }
      if (wNum < MIN_SIZE || wNum > MAX_SIZE) {
        return `Width must be between ${MIN_SIZE} and ${MAX_SIZE}.`;
      }
      if (hNum < MIN_SIZE || hNum > MAX_SIZE) {
        return `Height must be between ${MIN_SIZE} and ${MAX_SIZE}.`;
      }
      return null;
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(width, height);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onResize(Number(width), Number(height));
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="grid-size-form"
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="grid-width"
          className="text-xs text-neutral-400"
        >
          Width
        </label>
        <input
          id="grid-width"
          data-testid="width-input"
          type="number"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={width}
          onChange={(e) => {
            setWidth(e.target.value);
            setError(null);
          }}
          aria-label="Grid width"
          className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        />
      </div>

      <span className="pb-1 text-neutral-500">×</span>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="grid-height"
          className="text-xs text-neutral-400"
        >
          Height
        </label>
        <input
          id="grid-height"
          data-testid="height-input"
          type="number"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={height}
          onChange={(e) => {
            setHeight(e.target.value);
            setError(null);
          }}
          aria-label="Grid height"
          className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        />
      </div>

      <button
        type="submit"
        data-testid="resize-btn"
        className="rounded bg-cyan-600 px-3 py-1 text-sm font-medium text-white hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        Resize
      </button>

      {error && (
        <p
          role="alert"
          className="w-full text-sm text-red-400"
          data-testid="size-error"
        >
          {error}
        </p>
      )}
    </form>
  );
}
