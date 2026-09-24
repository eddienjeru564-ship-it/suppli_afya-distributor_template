/**
 * Prepares official product photos (see assets/products/README.md).
 * Each pack is trimmed to its edges and scaled to the same height, as a transparent cut-out,
 * so it stands on the storefront's stage exactly where the pack illustrations do.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/products";
const OUT = "public/products";
const MANIFEST = "src/storefront/product-photos.json";
const HEIGHT = 1200;
const SMALL = 360;

const sources = JSON.parse(readFileSync(path.join(SRC, "sources.json"), "utf8"));
const known = new Set([...readFileSync("src/engine/catalogue.ts", "utf8").matchAll(/^\s+id: "([a-z0-9-]+)"/gm)].map((m) => m[1]));

mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const file of readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
  const id = file.replace(/\.[^.]+$/, "");
  if (!known.has(id)) {
    console.warn(`skip ${file}: no product "${id}" in the engine catalogue`);
    continue;
  }
  if (!sources[id]) {
    console.warn(`skip ${file}: add where it came from to ${SRC}/sources.json`);
    continue;
  }
  // White backgrounds become transparent at the trim; the pack itself is untouched.
  const trimmed = await sharp(path.join(SRC, file)).rotate().ensureAlpha().trim({ background: "#ffffff", threshold: 18 }).png().toBuffer();
  const full = await sharp(trimmed).resize({ height: HEIGHT, kernel: "lanczos3" }).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
  const meta = await sharp(full).metadata();
  writeFileSync(path.join(OUT, `${id}.webp`), full);
  writeFileSync(path.join(OUT, `${id}-sm.webp`), await sharp(full).resize({ height: SMALL }).webp({ quality: 84 }).toBuffer());
  manifest[id] = { src: `/products/${id}.webp`, small: `/products/${id}-sm.webp`, width: meta.width, height: meta.height, source: sources[id] };
  console.log(`ok ${id} (${meta.width}×${meta.height})`);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${Object.keys(manifest).length} photo(s) ready. Products without one keep their illustration.`);
