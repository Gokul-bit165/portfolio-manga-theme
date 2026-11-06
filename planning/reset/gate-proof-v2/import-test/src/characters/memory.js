// Memories (2026-11-06): what happened in a place before the visitor came. A memory is triggered by an event (an actor reaching a mark)
// or by the visitor (clicking the object, or its button in the page). It plays as a change of drawing: ink spreads out from the trigger,
// figures from the past appear drawn in ink, the frame passes through sepia, and colour returns from where it began. Discoveries
// persist: in this browser, a remembered place stays changed when the visitor leaves and comes back.
const KEY = "journey.state.v1";
export function loadState() { try { return JSON.parse(localStorage.getItem(KEY)) ?? { seen: {}, flags: {} }; } catch { return { seen: {}, flags: {} }; } }
export function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage may be blocked */ } }

// The timeline of one memory, in seconds: ink spreads (A), the past plays in ink (B), it fades through sepia (C), colour returns (D).
export const PHASES = { A: 1.4, B: 4.6, C: 1.4, D: 1.4 };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createMemories({ U, defs, state, worldId, reduced, onChange }) {
  let playing = null;
  const seenKey = (id) => `${worldId}/${id}`;
  function play(id, screen = [0.5, 0.5]) {
    const m = defs.find((d) => d.id === id);
    if (!m || playing) return false;
    playing = { m, t: 0, screen };
    m.begin?.();
    return true;
  }
  // Drives the frame's style uniforms. Returns true while a memory is on screen.
  function update(dt) {
    const o = typeof window !== "undefined" && window.__styleOverride;   // tests and the comparison board: hold one style over the whole frame
    if (o) { U.uStyleMode.value = o.mode; U.uStyleAmt.value = o.mode ? 1 : 0; U.uStyleR.value = 5; U.uStyleC.value.set(0.5, 0.5); return false; }
    if (!playing) { U.uStyleAmt.value = 0; return false; }
    const p = playing, { A, B, C, D } = PHASES, T = A + B + C + D;
    p.t += dt;
    const t = p.t;
    U.uStyleC.value.set(...p.screen);
    if (reduced) {
      // No spreading or fading: the frame cuts to ink, holds, and cuts back.
      U.uStyleMode.value = 1; U.uStyleAmt.value = t < A + B + C ? 1 : 0; U.uStyleR.value = 4;
    } else if (t < A) { U.uStyleMode.value = 1; U.uStyleAmt.value = 1; U.uStyleR.value = sm(0, A, t) * 2.2; }
    else if (t < A + B) { U.uStyleMode.value = 1; U.uStyleAmt.value = 1; U.uStyleR.value = 2.2; }
    else if (t < A + B + C) { U.uStyleMode.value = 2; U.uStyleAmt.value = 1; U.uStyleR.value = 2.2; }
    else { U.uStyleMode.value = 2; U.uStyleAmt.value = 1; U.uStyleR.value = (1 - sm(A + B + C, T, t)) * 2.2; }
    p.m.during?.(t, t >= A && t < A + B + C);
    if (t >= T) {
      U.uStyleAmt.value = 0; p.m.end?.();
      state.seen[seenKey(p.m.id)] = true; saveState(state); onChange?.(p.m.id);
      playing = null;
    }
    return !!playing;
  }
  return { play, update, playing: () => playing?.m.id ?? null, seen: (id) => !!state.seen[seenKey(id)], defs };
}
