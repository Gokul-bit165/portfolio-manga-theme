/**
 * Watches how long video seeks take. Sustained slowness means this device cannot
 * scrub, and the prologue should fall back to stills. The median over a window is
 * used so that one long stall does not cost a visitor the film.
 */
export interface SeekMonitorOptions {
  windowSize: number;
  slowMs: number;
}

export function createSeekMonitor({ windowSize, slowMs }: SeekMonitorOptions) {
  let samples: readonly number[] = [];

  const medianMs = (): number => {
    if (samples.length === 0) return 0;
    const sorted = samples.toSorted((a, b) => a - b);
    const middle = sorted.length / 2;
    return Number.isInteger(middle)
      ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
      : (sorted[Math.floor(middle)] ?? 0);
  };

  return {
    record(ms: number): void {
      samples = [...samples, ms].slice(-windowSize);
    },
    medianMs,
    isTooSlow(): boolean {
      return samples.length >= windowSize && medianMs() > slowMs;
    },
  };
}
