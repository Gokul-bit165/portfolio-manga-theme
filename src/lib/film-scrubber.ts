import { createSeekMonitor } from "./seek-monitor";

export interface FilmScrubberOptions {
  video: HTMLVideoElement;
  url: string;
  onProgress: (fraction: number) => void;
  /** The first frame at the requested time has been decoded. */
  onReady: () => void;
  /** Anything went wrong. The page carries on with stills. */
  onFail: (reason: string) => void;
}

export interface FilmScrubber {
  seek: (seconds: number) => void;
  dispose: () => void;
}

/** Above this median, per the V7 validation, a device is better served by stills. */
const SLOW_SEEK_MS = 200;
const SEEK_WINDOW = 8;
/** A download that has not finished by now is not going to feel like a film. */
const LOAD_TIMEOUT_MS = 60_000;
/** Half a frame at 24 fps: closer than this and another seek changes nothing on screen. */
const SEEK_TOLERANCE_S = 1 / 48;

/**
 * The whole file is loaded before scrubbing starts. Validation measured 2–3 ms seeks that way,
 * against 6 seeks in 8 s when each one waited on the network.
 *
 * Only one seek runs at a time, and the newest target wins, so fast scrolling never queues
 * up a backlog of frames the visitor has already scrolled past.
 */
export function createFilmScrubber({ video, url, onProgress, onReady, onFail }: FilmScrubberOptions): FilmScrubber {
  const abort = new AbortController();
  const monitor = createSeekMonitor({ windowSize: SEEK_WINDOW, slowMs: SLOW_SEEK_MS });
  let objectUrl: string | null = null;
  let target = 0;
  let seekStartedAt: number | null = null;
  let loaded = false;
  let announced = false;
  let finished = false;

  const fail = (reason: string) => {
    if (finished) return;
    finished = true;
    onFail(reason);
  };

  const startSeek = () => {
    seekStartedAt = performance.now();
    video.currentTime = target;
  };

  const onSeeked = () => {
    if (seekStartedAt !== null) monitor.record(performance.now() - seekStartedAt);
    seekStartedAt = null;
    if (!announced) {
      announced = true;
      onReady();
    }
    if (monitor.isTooSlow()) {
      fail(`median seek ${Math.round(monitor.medianMs())} ms`);
      return;
    }
    if (Math.abs(video.currentTime - target) > SEEK_TOLERANCE_S) startSeek();
  };

  const onVideoError = () => fail("video could not be decoded");

  const onMetadata = () => {
    loaded = true;
    startSeek();
  };

  video.addEventListener("seeked", onSeeked);
  video.addEventListener("error", onVideoError);
  video.addEventListener("loadedmetadata", onMetadata, { once: true });

  const load = async () => {
    const timeout = window.setTimeout(() => abort.abort(new Error("timed out")), LOAD_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const total = Number(response.headers.get("content-length")) || 0;
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (total > 0) onProgress(Math.min(1, received / total));
      }
      objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      video.src = objectUrl;
      video.load();
    } catch (error) {
      fail(error instanceof Error ? error.message : "load failed");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  void load();

  return {
    seek(seconds: number) {
      target = seconds;
      if (!loaded || finished || seekStartedAt !== null) return;
      if (Math.abs(video.currentTime - target) > SEEK_TOLERANCE_S) startSeek();
    },
    dispose() {
      finished = true;
      abort.abort();
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onVideoError);
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeAttribute("src");
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
  };
}
