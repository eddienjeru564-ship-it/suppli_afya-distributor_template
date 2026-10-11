/**
 * Prepares official product photos for the storefront (see assets/products/README.md).
 *
 *   npm run photos
 *
 * Each photo is shown on a white "studio" surface, the e-commerce standard, so nothing is cut out of
 * the pack: BF Suma's white bottles and boxes can't be separated from a white background without
 * biting into caps and box edges. Instead the background is made exactly white, so it disappears
 * into the page's white product stages, and the pack itself is left untouched.
 *
 * For every assets/products/<product id>.(png|jpg|webp) with a source in sources.json:
 *   1. the near-white background connected to the image's edge is set to pure white, and the
 *      pale shadow around the pack is eased into it
 *   2. the image is trimmed to the pack, with the same 4% margin on every product
 *   3. it is saved as WebP at its own resolution (never enlarged; the long side capped at 1600px),
 *      with a small copy for thumbnails and a small JPEG for the link preview
 * and src/storefront/product-photos.json is rewritten for the page to read.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/products";
const OUT = "public/products";
const MANIFEST = "src/storefront/product-photos.json";
const LONG_SIDE = 1600;
const SMALL_SIDE = 480;
const CARD_SIDE = 360;
const MARGIN = 0.04;

const sources = JSON.parse(readFileSync(path.join(SRC, "sources.json"), "utf8"));
const known = new Set([...readFileSync("src/engine/catalogue.ts", "utf8").matchAll(/^\s+id: "([a-z0-9-]+)"/gm)].map((m) => m[1]));

/** Whiten the background and return the pack's bounding box. */
async function whiten(file) {
  const { data, info } = await sharp(file).rotate().flatten({ background: "#ffffff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const lightness = new Uint8Array(n);
  for (let i = 0; i < n; i++) lightness[i] = Math.min(data[3 * i], data[3 * i + 1], data[3 * i + 2]);

  // The background's level, read from the border. Most are pure white; some are a shade off.
  const border = [];
  for (let x = 0; x < w; x++) border.push(lightness[x], lightness[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) border.push(lightness[y * w], lightness[y * w + w - 1]);
  border.sort((a, b) => a - b);
  const level = border[Math.floor(border.length * 0.75)];
  const threshold = level >= 200 ? Math.min(250, level - 5) : 250;

  // Flood the background in from the edges, so white inside the pack is never touched.
  const bg = new Uint8Array(n);
  const stack = [];
  const visit = (i) => {
    if (!bg[i] && lightness[i] >= threshold) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    visit(x);
    visit((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    visit(y * w);
    visit(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < n - w) visit(i + w);
  }
  // The background becomes pure white, and the pale greys around it (the soft shadow under a
  // pack) are eased up to meet it, so a shadow fades out instead of stopping at a visible edge.
  // Only near-neutral pixels are eased; the pack's colours are left exactly as they are.
  const low = threshold - 25;
  const ease = (255 - low) / (threshold - low);
  for (let i = 0; i < n; i++) {
    if (bg[i]) {
      data[3 * i] = data[3 * i + 1] = data[3 * i + 2] = lightness[i] = 255;
    } else if (lightness[i] > low) {
      for (let c = 0; c < 3; c++) data[3 * i + c] = Math.min(255, Math.round(low + (data[3 * i + c] - low) * ease));
      lightness[i] = Math.min(255, Math.round(low + (lightness[i] - low) * ease));
    }
  }

  // The pack's extent, shadow included: rows and columns with a few visibly non-white pixels
  // (a lone compression speck doesn't count).
  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  for (let i = 0; i < n; i++) {
    if (lightness[i] < 245) {
      rows[(i / w) | 0]++;
      cols[i % w]++;
    }
  }
  const first = (a) => a.findIndex((v) => v >= 3);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v >= 3);
  const box = { left: first(cols), top: first(rows), right: last(cols), bottom: last(rows) };
  return { image: sharp(data, { raw: { width: w, height: h, channels: 3 } }), box, w, h };
}

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f));
const manifest = {};
for (const file of readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()) {
  const id = file.replace(/\.[^.]+$/, "");
  if (!known.has(id)) {
    console.warn(`skip ${file}: no product "${id}" in the engine catalogue`);
    continue;
  }
  if (!sources[id]) {
    console.warn(`skip ${file}: add where it came from to ${SRC}/sources.json`);
    continue;
  }
  const { image, box } = await whiten(path.join(SRC, file));
  const width = box.right - box.left + 1;
  const height = box.bottom - box.top + 1;
  const pad = Math.round(Math.max(width, height) * MARGIN);
  const framed = await image
    .extract({ left: box.left, top: box.top, width, height })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#ffffff" })
    .png()
    .toBuffer();
  const full = await sharp(framed)
    .resize({ width: LONG_SIDE, height: LONG_SIDE, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .webp({ quality: 88, smartSubsample: true })
    .toBuffer();
  const small = await sharp(framed)
    .resize({ width: SMALL_SIDE, height: SMALL_SIDE, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: 84 })
    .toBuffer();
  // The link preview's renderer reads JPEG, not WebP.
  const card = await sharp(framed)
    .resize({ width: CARD_SIDE, height: CARD_SIDE, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  const meta = await sharp(full).metadata();
  writeFileSync(path.join(OUT, `${id}.webp`), full);
  writeFileSync(path.join(OUT, `${id}-sm.webp`), small);
  writeFileSync(path.join(OUT, `${id}-card.jpg`), card);
  manifest[id] = {
    src: `/products/${id}.webp`,
    small: `/products/${id}-sm.webp`,
    card: `/products/${id}-card.jpg`,
    width: meta.width,
    height: meta.height,
    source: sources[id],
  };
  const note = Math.max(meta.width, meta.height) < 700 ? "  (small original: a larger one would look sharper on big screens)" : "";
  console.log(`ok ${id.padEnd(18)} ${meta.width}×${meta.height}${note}`);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${Object.keys(manifest).length} photo(s) ready. Products without one keep their illustration.`);
