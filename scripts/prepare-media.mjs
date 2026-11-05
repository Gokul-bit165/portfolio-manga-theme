/**
 * Copies the approved V7 film into public/ byte for byte, and cuts the stills from its
 * lossless source frames. Nothing in blender_scratch is modified.
 *
 *   npm run media
 *
 * Source location can be overridden with V7_DIR.
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const V7_DIR = process.env.V7_DIR ?? path.join(homedir(), "blender_scratch", "v7_validation", "motion_land");
const OUT_DIR = path.join(process.cwd(), "public", "media", "prologue");

const FILMS = [
  { from: "video/arc_paced_1920.mp4", to: "film-v7-1920.mp4" },
  { from: "video/arc_paced_960.mp4", to: "film-v7-960.mp4" },
];

/** Frame numbers match the holds in the paced arc; frame 1 doubles as the poster. */
const STILLS = [
  { stage: "ink", frame: 1 },
  { stage: "monochrome", frame: 108 },
  { stage: "sepia", frame: 159 },
  { stage: "colour", frame: 240 },
];
const WIDTHS = [1920, 1440, 960];

const sha256 = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");
const kilobytes = async (file) => `${Math.round((await stat(file)).size / 1024)} KB`;

await mkdir(OUT_DIR, { recursive: true });

for (const { from, to } of FILMS) {
  const source = path.join(V7_DIR, from);
  const target = path.join(OUT_DIR, to);
  await copyFile(source, target);
  const identical = (await sha256(source)) === (await sha256(target));
  if (!identical) throw new Error(`Copy of ${from} does not match its source`);
  console.log(`${to}  ${await kilobytes(target)}  identical to source: ${identical}`);
}

for (const { stage, frame } of STILLS) {
  const source = path.join(V7_DIR, "arc", `${String(frame).padStart(3, "0")}.png`);
  for (const width of WIDTHS) {
    const base = path.join(OUT_DIR, `still-${stage}-${width}`);
    const image = sharp(source).resize({ width });
    await image.clone().avif({ quality: 55, effort: 6 }).toFile(`${base}.avif`);
    await image.clone().webp({ quality: 78, effort: 6 }).toFile(`${base}.webp`);
    console.log(`still-${stage}-${width}  avif ${await kilobytes(`${base}.avif`)}  webp ${await kilobytes(`${base}.webp`)}`);
  }
}
