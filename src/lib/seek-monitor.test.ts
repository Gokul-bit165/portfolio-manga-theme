import { describe, expect, test } from "vitest";
import { createSeekMonitor } from "./seek-monitor";

const feed = (monitor: ReturnType<typeof createSeekMonitor>, samples: number[]) => {
  samples.forEach((ms) => monitor.record(ms));
};

describe("createSeekMonitor", () => {
  test("does not judge before it has enough samples", () => {
    const monitor = createSeekMonitor({ windowSize: 8, slowMs: 200 });
    feed(monitor, [900, 900, 900]);
    expect(monitor.isTooSlow()).toBe(false);
  });

  test("fast seeks are fine", () => {
    const monitor = createSeekMonitor({ windowSize: 8, slowMs: 200 });
    feed(monitor, [5, 6, 4, 8, 12, 5, 6, 7]);
    expect(monitor.isTooSlow()).toBe(false);
  });

  test("a sustained run of slow seeks is too slow", () => {
    const monitor = createSeekMonitor({ windowSize: 8, slowMs: 200 });
    feed(monitor, [300, 280, 310, 290, 305, 295, 320, 300]);
    expect(monitor.isTooSlow()).toBe(true);
  });

  test("one long stall among fast seeks does not trigger a downgrade", () => {
    const monitor = createSeekMonitor({ windowSize: 8, slowMs: 200 });
    feed(monitor, [5, 6, 900, 8, 12, 5, 6, 7]);
    expect(monitor.isTooSlow()).toBe(false);
  });

  test("only the recent window counts, so a recovered decoder is not punished", () => {
    const monitor = createSeekMonitor({ windowSize: 8, slowMs: 200 });
    feed(monitor, [300, 300, 300, 300, 300, 300, 300, 300]);
    feed(monitor, [5, 5, 5, 5, 5, 5, 5, 5]);
    expect(monitor.isTooSlow()).toBe(false);
  });

  test("reports the median it judged", () => {
    const monitor = createSeekMonitor({ windowSize: 4, slowMs: 200 });
    feed(monitor, [10, 20, 30, 40]);
    expect(monitor.medianMs()).toBe(25);
  });
});
