// What every world shares: the Red Line's crossing point at each portal, and sprites (sparks, smoke, birds...) as packed arrays.
import { lerp } from "./kit.js";

// The Red Line crosses every portal plane 0.8 m east of the opening's centre, 13.5 cm above its floor. Each world's line starts there
// and ends there at its exit, so the cord is one cord from the plain to the last ridge.
export const LINE_DX = 0.795, LINE_DZ = 0.135;

// Finish a line at an exit: converge onto the crossing point, then run 1.2 m beyond the plane so the next world takes it up.
export function lineToExit(pts, exit, floorAt) {
  const ex = exit.x + LINE_DX, ey = exit.y, ez = exit.z + LINE_DZ;
  const keep = pts.filter((p) => p[1] < ey - 7);
  const last = keep.at(-1);
  for (let i = 1; i <= 6; i++) {
    const t = i / 6, x = lerp(last[0], ex, t), y = lerp(last[1], ey - 0.6, t);
    keep.push([x, y, lerp(floorAt(x, y) + 0.3, ez, t * t)]);
  }
  keep.push([ex, ey, ez], [ex + 0.06, ey + 1.2, ez]);
  return keep;
}

export class Sprites {
  constructor() { this.pos = []; this.seed = []; this.col = []; this.kind = []; }
  get count() { return this.pos.length / 3; }
  // Blender axes in, three's stored. colour as 0xRRGGBB. r: radius or rise, meaning depends on the kind.
  add(kind, x, y, z, r, colour, R, n = 1, spread = 0) {
    for (let i = 0; i < n; i++) {
      this.pos.push(x + (R() - 0.5) * spread, z, -(y + (R() - 0.5) * spread));
      this.seed.push(R(), R(), R(), R());
      this.col.push(((colour >> 16) & 255) / 255, ((colour >> 8) & 255) / 255, (colour & 255) / 255);
      this.kind.push(kind, r);
    }
  }
  pack() { return { position: new Float32Array(this.pos), seed: new Float32Array(this.seed), colour: new Float32Array(this.col), kind: new Float32Array(this.kind) }; }
}
export const spriteBuffers = (s) => (s ? [s.position.buffer, s.seed.buffer, s.colour.buffer, s.kind.buffer] : []);
export const KIND = { spark: 0, smoke: 1, firefly: 2, bird: 3, rain: 4, dust: 5, leaf: 6 };
