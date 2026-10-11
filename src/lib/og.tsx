import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { kes } from "@/storefront/money";
import { initials } from "@/storefront/order";
import photos from "@/storefront/product-photos.json";
import { listings, shortName } from "@/storefront/products";
import type { Storefront } from "@/storefront/types";

export const ogSize = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [regular, italic, sans] = await Promise.all([
    readFile(join(dir, "Newsreader-Regular.woff")),
    readFile(join(dir, "Newsreader-Italic.woff")),
    readFile(join(dir, "HankenGrotesk-SemiBold.woff")),
  ]);
  return [
    { name: "Newsreader", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Newsreader", data: italic, style: "italic" as const, weight: 400 as const },
    { name: "Hanken", data: sans, style: "normal" as const, weight: 600 as const },
  ];
}

type Photo = { card: string; width: number; height: number };

/** The first products the distributor features that have an official photo, ready to draw. */
async function shelf(sf: Storefront, n: number) {
  const out: { id: string; name: string; price: string; src: string; ratio: number }[] = [];
  for (const { product, offer } of listings(sf)) {
    const photo = (photos as Record<string, Photo>)[product.id];
    if (!photo) continue;
    const data = await readFile(join(process.cwd(), "public", photo.card));
    out.push({
      id: product.id,
      name: shortName(product),
      price: kes(offer.price),
      src: `data:image/jpeg;base64,${data.toString("base64")}`,
      ratio: photo.width / photo.height,
    });
    if (out.length === n) break;
  }
  return out;
}

/**
 * The link preview. It mostly appears in WhatsApp chats, so it has to read at thumbnail size:
 * the distributor, the promise, and the real packs they sell.
 */
export async function storefrontCard(sf: Storefront) {
  const d = sf.distributor;
  const accent = sf.theme.accent;
  const count = Object.keys(sf.catalogue.offers).length;
  const packs = await shelf(sf, 3);
  const [center, left, right] = packs;
  const table = [
    { p: left, w: 150, x: 18, y: 206, turn: -4 },
    { p: right, w: 150, x: 232, y: 176, turn: 3 },
    { p: center, w: 176, x: 112, y: 92, turn: 0 },
  ].filter((t) => t.p);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 48,
          background: "#f5f3ee",
          fontFamily: "Hanken",
          color: "#1c1a17",
          padding: "56px 56px 56px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: accent,
                color: sf.theme.onAccent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Newsreader",
                fontStyle: "italic",
                fontSize: 30,
              }}
            >
              {initials(d.name)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30 }}>{d.name}</div>
              <div style={{ fontSize: 22, color: "#6b655c" }}>{[d.role, d.area].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Newsreader",
              fontSize: packs.length ? 60 : 78,
              lineHeight: 1.04,
              letterSpacing: packs.length ? -1.6 : -2.4,
              maxWidth: packs.length ? 640 : 900,
            }}
          >
            <span>Not sure which product is right for you?</span>
            <span style={{ fontStyle: "italic", color: accent }}>Let&apos;s narrow it down.</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#48443d" }}>
            {!packs.length && <span>Help choosing</span>}
            {!packs.length && <span style={{ color: accent }}>·</span>}
            <span>{count} products with prices</span>
            <span style={{ color: accent }}>·</span>
            <span>Order on WhatsApp</span>
          </div>
        </div>

        {/* The hero's front table: the first featured products with a photo, on white tiles. */}
        {packs.length > 0 && (
          <div style={{ display: "flex", position: "relative", width: 400, borderRadius: 36, background: sf.theme.accentSoft }}>
            {table.map(({ p, w, x, y, turn }) => {
              const box = { w: w - 28, h: Math.round((w - 28) * 1.18) };
              const fit = p!.ratio > box.w / box.h ? { width: box.w, height: Math.round(box.w / p!.ratio) } : { width: Math.round(box.h * p!.ratio), height: box.h };
              return (
                <div
                  key={p!.id}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: w,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "14px 14px 12px",
                    borderRadius: 22,
                    background: "#ffffff",
                    boxShadow: "0 14px 30px -14px rgba(28,26,23,0.32)",
                    transform: `rotate(${turn}deg)`,
                  }}
                >
                  <div style={{ display: "flex", width: box.w, height: box.h, alignItems: "center", justifyContent: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p!.src} width={fit.width} height={fit.height} alt="" />
                  </div>
                  <div style={{ display: "flex", marginTop: 8, fontSize: 17, color: "#6b655c", textAlign: "center", justifyContent: "center" }}>
                    {p!.name}
                  </div>
                  <div style={{ display: "flex", fontSize: 21, color: "#1c1a17" }}>{p!.price}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}
