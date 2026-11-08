import { fredoka } from "@/components/utils/title-fonts";

// Card artwork drawn on 2D canvases. Kept free of three.js so the static,
// reduced-motion card can use it without loading the 3D scene.

/** The site logo on the back of every card. */
export const CARD_BACK_LOGO_SRC = "/icons/golden_trophy_lrg.webp";

// 4:5, at least 1024px tall so the wordmark stays crisp up close.
export const CARD_TEXTURE_WIDTH = 820;
export const CARD_TEXTURE_HEIGHT = 1024;

const FONT_TIMEOUT_MS = 3000;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function loadFont(font: string) {
  try {
    await Promise.race([
      document.fonts.load(font),
      new Promise((_, reject) => setTimeout(reject, FONT_TIMEOUT_MS)),
    ]);
  } catch {
    // Draw with the fallback font rather than not at all.
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

/**
 * The card back. It is the same for every rarity, so it never hints at the
 * achievement on the other side.
 */
export async function renderCardBack(): Promise<HTMLCanvasElement> {
  const wordmarkFont = `600 54px ${fredoka.style.fontFamily}`;
  const [logo] = await Promise.all([
    loadImage(CARD_BACK_LOGO_SRC),
    loadFont(wordmarkFont),
  ]);

  const w = CARD_TEXTURE_WIDTH;
  const h = CARD_TEXTURE_HEIGHT;
  const canvas = document.createElement("canvas");

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  // Brand gradient frame, like the in-app card's border.
  const frame = ctx.createLinearGradient(0, 0, w, h);

  frame.addColorStop(0, "#7c3aed");
  frame.addColorStop(1, "#3b82f6");
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, w, h);

  // Light surface inside the frame.
  const border = 18;
  const surface = ctx.createRadialGradient(
    w / 2,
    h * 0.42,
    40,
    w / 2,
    h * 0.42,
    h * 0.7,
  );

  surface.addColorStop(0, "#ffffff");
  surface.addColorStop(0.5, "#f1ecff");
  surface.addColorStop(1, "#dbe7ff");
  ctx.fillStyle = surface;
  roundedRect(ctx, border, border, w - border * 2, h - border * 2, 52);
  ctx.fill();

  // A faint diamond lattice, for texture without detail.
  ctx.save();
  roundedRect(ctx, border, border, w - border * 2, h - border * 2, 52);
  ctx.clip();
  ctx.fillStyle = "rgba(124, 58, 237, 0.07)";

  for (let y = 0; y < h + 60; y += 56) {
    for (let x = (y / 56) % 2 ? 28 : 0; x < w + 60; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x, y + 9);
      ctx.lineTo(x - 9, y);
      ctx.fill();
    }
  }
  ctx.restore();

  // Inner keyline.
  ctx.strokeStyle = "rgba(124, 58, 237, 0.28)";
  ctx.lineWidth = 4;
  roundedRect(ctx, 46, 46, w - 92, h - 92, 34);
  ctx.stroke();

  if (logo) {
    const size = w * 0.6;

    ctx.save();
    ctx.shadowColor = "rgba(124, 58, 237, 0.3)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    ctx.drawImage(logo, (w - size) / 2, h * 0.42 - size / 2, size, size);
    ctx.restore();
  }

  ctx.fillStyle = "#4c1d95";
  ctx.font = wordmarkFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Useless Achievements", w / 2, h * 0.8);

  return canvas;
}
