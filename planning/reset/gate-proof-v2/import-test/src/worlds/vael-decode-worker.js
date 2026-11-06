// Decodes Vael's painted images off the main thread, so streaming the world cannot stall the page.
// Message: { layers: [url], scale, cards: [url] }. Reply: { size, layers: Uint8Array, count, cards: [{ w, h, data }] }.
// Cards are stored bottom row first, so v = 0 is the foot of the picture.
async function pixels(url, opts) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const bm = await createImageBitmap(await res.blob(), { premultiplyAlpha: "none", colorSpaceConversion: "none", ...opts });
  const w = bm.width, h = bm.height, ctx = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bm, 0, 0); bm.close();
  return { w, h, data: new Uint8Array(ctx.getImageData(0, 0, w, h).data.buffer) };
}
onmessage = async ({ data: { layers, size, cards } }) => {
  try {
    const out = new Uint8Array(size * size * 4 * layers.length);
    const decoded = await Promise.all(layers.map((u) => pixels(u, { resizeWidth: size, resizeHeight: size, resizeQuality: "high" })));
    decoded.forEach((d, i) => out.set(d.data, i * size * size * 4));
    const painted = await Promise.all(cards.map((u) => pixels(u, { imageOrientation: "flipY" })));
    postMessage({ size, count: layers.length, layers: out, cards: painted }, [out.buffer, ...painted.map((c) => c.data.buffer)]);
  } catch (e) {
    postMessage({ error: String(e?.stack || e) });
  }
};
