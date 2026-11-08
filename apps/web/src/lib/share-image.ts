import tokens from "@useless/design-tokens/tokens.json";
import {
  achievementCardTokens,
  getBadgeTextColor,
  getRarityToken,
  typeNames,
} from "@/components/achievement-styles";
import { fredoka, nunito } from "@/components/utils/title-fonts";
import type { AchievementType } from "@/lib/supabase";

export const SHARE_IMAGE_WIDTH = 1080;
export const SHARE_IMAGE_HEIGHT = 1350;

export interface ShareImageInput {
  title: string;
  description: string;
  type: AchievementType;
  emoji: string;
  iconUrl: string | null;
}

const WORDMARK = "Useless Achievements";
const SITE_LABEL = "uselessachievements.com";
const SITE_URL = "https://www.uselessachievements.com";

const COLORS = {
  // Translucent, so the rarity color shows through as it does in the app.
  surface: achievementCardTokens.surface.light,
  title: achievementCardTokens.title.colorLight,
  description: achievementCardTokens.description.colorLight,
  footerText: "#FFFFFF",
  footerMuted: "rgba(255, 255, 255, 0.85)",
  cardShadow: "rgba(17, 24, 39, 0.28)",
  medallionCore: "rgba(255, 255, 255, 0.5)",
};

// Side margins stay wider than the ~34px that a 3:4 profile grid crop removes.
const CARD = { x: 70, y: 80, width: 940, height: 1020, radius: 56, border: 8 };

type CardRect = typeof CARD;
const CARD_PADDING_X = 72;
const CARD_PADDING_Y = 64;
const TEXT_WIDTH = CARD.width - CARD_PADDING_X * 2;

const BADGE_HEIGHT = 74;
const BADGE_PADDING_X = 40;
const BADGE_FONT_SIZE = 36;

const TITLE_SIZES = [84, 76, 68, 60];
const TITLE_MAX_LINES = 3;
const TITLE_LINE_RATIO = 1.15;

const DESCRIPTION_SIZE = 42;
const DESCRIPTION_LINE_HEIGHT = 56;
const DESCRIPTION_MAX_LINES = 4;

const ICON_MAX_SIZE = 420;
const STACK_GAP = 36;
const TITLE_DESCRIPTION_GAP = 24;

const FONT_TIMEOUT_MS = 3000;
const ICON_TIMEOUT_MS = 5000;

const EMOJI_FONT_STACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const titleFont = (size: number) =>
  `600 ${size}px ${fredoka.style.fontFamily}`;
const badgeFont = () => `600 ${BADGE_FONT_SIZE}px ${fredoka.style.fontFamily}`;
const descriptionFont = () =>
  `500 ${DESCRIPTION_SIZE}px ${nunito.style.fontFamily}`;
const wordmarkFont = () => `600 56px ${fredoka.style.fontFamily}`;
const siteLabelFont = () => `600 38px ${nunito.style.fontFamily}`;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out")), ms);

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// document.fonts.ready is not enough: it ignores fonts the page has not used,
// such as a weight that only the shared image needs.
async function loadFonts(): Promise<void> {
  const fonts = [
    titleFont(TITLE_SIZES[0]!),
    descriptionFont(),
    siteLabelFont(),
  ];

  try {
    await withTimeout(
      Promise.all(fonts.map((font) => document.fonts.load(font))),
      FONT_TIMEOUT_MS,
    );
  } catch (error) {
    console.error("Share image fonts did not load in time:", error);
  }
}

async function loadIcon(url: string): Promise<HTMLImageElement | null> {
  try {
    return await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();

        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      }),
      ICON_TIMEOUT_MS,
    );
  } catch (error) {
    console.error("Failed to load achievement icon:", error);
    return null;
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
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const inner = size * 0.35;

  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + inner, y - inner);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + inner, y + inner);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - inner, y + inner);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - inner, y - inner);
  ctx.closePath();
  ctx.fill();
}

function truncateLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
): string {
  let result = line.trim();

  while (result && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1).trimEnd();
  }

  return `${result}...`;
}

// Splits a word that is wider than the line on its own.
function splitLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
): string[] {
  const parts: string[] = [];
  let part = "";

  for (const character of word) {
    if (part && ctx.measureText(part + character).width > maxWidth) {
      parts.push(part);
      part = character;
    } else {
      part += character;
    }
  }

  if (part) parts.push(part);

  return parts;
}

/** Wraps text using the context's current font. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): { lines: string[]; fits: boolean } {
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => splitLongWord(ctx, word, maxWidth));
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);

  if (lines.length <= maxLines) return { lines, fits: true };

  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncateLine(ctx, kept[maxLines - 1]!, maxWidth);

  return { lines: kept, fits: false };
}

/** Picks the largest title size that fits without breaking or cutting text. */
function fitTitle(ctx: CanvasRenderingContext2D, title: string) {
  const smallest = TITLE_SIZES[TITLE_SIZES.length - 1]!;

  for (const size of TITLE_SIZES) {
    ctx.font = titleFont(size);

    const wordsFit = title
      .split(/\s+/)
      .every((word) => ctx.measureText(word).width <= TEXT_WIDTH);
    const wrapped = wrapLines(ctx, title, TEXT_WIDTH, TITLE_MAX_LINES);

    if (wordsFit && wrapped.fits) return { size, lines: wrapped.lines };
  }

  ctx.font = titleFont(smallest);

  return {
    size: smallest,
    lines: wrapLines(ctx, title, TEXT_WIDTH, TITLE_MAX_LINES).lines,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const { start, end } = tokens.color.brand.primaryGradient;
  const gradient = ctx.createLinearGradient(
    0,
    0,
    SHARE_IMAGE_WIDTH,
    SHARE_IMAGE_HEIGHT,
  );

  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  type: AchievementType,
  rect: CardRect = CARD,
) {
  const rarity = getRarityToken(type);
  const { x, y, width, height, radius, border } = rect;
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);

  gradient.addColorStop(0, rarity.borderStart);
  gradient.addColorStop(1, rarity.borderEnd);

  ctx.save();
  ctx.shadowColor = COLORS.cardShadow;
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = gradient;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.surface;
  roundedRect(
    ctx,
    x + border,
    y + border,
    width - border * 2,
    height - border * 2,
    radius - border,
  );
  ctx.fill();
}

function drawIconImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  top: number,
  size: number,
) {
  // Fit inside the square so that a non-square icon is not stretched.
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    centerX - width / 2,
    top + (size - height) / 2,
    width,
    height,
  );
}

function drawEmojiMedallion(
  ctx: CanvasRenderingContext2D,
  input: ShareImageInput,
  centerX: number,
  top: number,
  size: number,
) {
  const rarity = getRarityToken(input.type);
  const radius = size / 2;
  const centerY = top + radius;
  const glow = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius,
  );

  glow.addColorStop(0, rarity.medallionMid);
  glow.addColorStop(0.6, rarity.medallionMid);
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.medallionCore;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rarity.sparkleA;
  drawSparkle(ctx, centerX - radius * 0.72, centerY - radius * 0.66, size * 0.07);

  ctx.fillStyle = rarity.sparkleB;
  drawSparkle(ctx, centerX + radius * 0.68, centerY + radius * 0.68, size * 0.05);

  ctx.fillStyle = COLORS.title;
  ctx.font = `${Math.round(size * 0.46)}px ${EMOJI_FONT_STACK}`;

  // Center on the visible glyph. Safari's text width can include invisible
  // characters such as the U+FE0F in many emoji, which pushes them off-center.
  // Metrics are relative to the current alignment, so set it before measuring.
  ctx.textAlign = "left";

  const metrics = ctx.measureText(input.emoji);
  const inkCenterX =
    (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2;
  const inkCenterY =
    (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2;

  ctx.fillText(input.emoji, centerX - inkCenterX, centerY - inkCenterY);
  ctx.textAlign = "center";
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  type: AchievementType,
  centerX: number,
  top: number,
) {
  const rarity = getRarityToken(type);
  const label = typeNames[type].toUpperCase();

  ctx.font = badgeFont();

  const width = ctx.measureText(label).width + BADGE_PADDING_X * 2;
  const left = centerX - width / 2;
  const gradient = ctx.createLinearGradient(left, 0, left + width, 0);

  gradient.addColorStop(0, rarity.badgeStart);
  gradient.addColorStop(1, rarity.badgeEnd);

  ctx.fillStyle = gradient;
  roundedRect(ctx, left, top, width, BADGE_HEIGHT, BADGE_HEIGHT / 2);
  ctx.fill();

  ctx.fillStyle = getBadgeTextColor(type);
  ctx.textBaseline = "middle";
  ctx.fillText(label, centerX, top + BADGE_HEIGHT / 2 + 2);
  ctx.textBaseline = "alphabetic";
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  const centerX = SHARE_IMAGE_WIDTH / 2;

  ctx.fillStyle = COLORS.footerText;
  ctx.font = wordmarkFont();
  ctx.fillText(WORDMARK, centerX, 1205);

  ctx.fillStyle = COLORS.footerMuted;
  ctx.font = siteLabelFont();
  ctx.fillText(SITE_LABEL, centerX, 1262);
}

/** Draws the icon, badge, title and description, centred in `area`. */
function drawContent(
  ctx: CanvasRenderingContext2D,
  input: ShareImageInput,
  icon: HTMLImageElement | null,
  area: { y: number; height: number } = CARD,
) {
  const centerX = SHARE_IMAGE_WIDTH / 2;
  const title = fitTitle(ctx, input.title);
  const titleLineHeight = Math.round(title.size * TITLE_LINE_RATIO);

  ctx.font = descriptionFont();

  const description = wrapLines(
    ctx,
    input.description,
    TEXT_WIDTH,
    DESCRIPTION_MAX_LINES,
  ).lines;

  const textHeight =
    BADGE_HEIGHT +
    STACK_GAP +
    title.lines.length * titleLineHeight +
    (description.length
      ? TITLE_DESCRIPTION_GAP + description.length * DESCRIPTION_LINE_HEIGHT
      : 0);

  // The icon takes whatever room long text leaves, then the stack is centered.
  const available = area.height - CARD_PADDING_Y * 2;
  const iconSize = Math.min(ICON_MAX_SIZE, available - textHeight - STACK_GAP);
  const stackHeight = iconSize + STACK_GAP + textHeight;
  let y = area.y + (area.height - stackHeight) / 2;

  if (icon) {
    drawIconImage(ctx, icon, centerX, y, iconSize);
  } else {
    drawEmojiMedallion(ctx, input, centerX, y, iconSize);
  }

  y += iconSize + STACK_GAP;

  drawBadge(ctx, input.type, centerX, y);

  y += BADGE_HEIGHT + STACK_GAP;

  ctx.fillStyle = COLORS.title;
  ctx.font = titleFont(title.size);
  ctx.textBaseline = "top";

  for (const line of title.lines) {
    ctx.fillText(line, centerX, y);
    y += titleLineHeight;
  }

  y += TITLE_DESCRIPTION_GAP;

  ctx.fillStyle = COLORS.description;
  ctx.font = descriptionFont();

  for (const line of description) {
    ctx.fillText(line, centerX, y);
    y += DESCRIPTION_LINE_HEIGHT;
  }

  ctx.textBaseline = "alphabetic";
}

/**
 * Draws the shareable image at a fixed size. The output does not depend on the
 * device pixel ratio or on the page theme.
 */
export async function renderShareImage(input: ShareImageInput): Promise<Blob> {
  const [icon] = await Promise.all([
    input.iconUrl ? loadIcon(input.iconUrl) : null,
    loadFonts(),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_IMAGE_WIDTH;
  canvas.height = SHARE_IMAGE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.textAlign = "center";

  drawBackground(ctx);
  drawCard(ctx, input.type);
  drawContent(ctx, input, icon);
  drawFooter(ctx);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode share image"));
    }, "image/png");
  });
}

// The card on its own, filling a 4:5 face: used for the hero's 3D cards.
const FACE_CARD: CardRect = {
  x: 0,
  y: 0,
  width: SHARE_IMAGE_WIDTH,
  height: SHARE_IMAGE_HEIGHT,
  radius: 72,
  border: 14,
};
const FACE_WORDMARK_Y = SHARE_IMAGE_HEIGHT - 92;
const FACE_FOOTER_HEIGHT = 150;

/**
 * Draws just the achievement card, with the same layout as the share image
 * but no background or footer around it: the rarity border fills the whole
 * 4:5 face and a small wordmark sits inside the bottom of the card. It is
 * drawn at `width` × `height` (keep 4:5) and returned as a canvas, ready to
 * become a texture. The corners outside the rounded card are transparent.
 */
export async function renderCardFace(
  input: ShareImageInput,
  width = SHARE_IMAGE_WIDTH,
  height = SHARE_IMAGE_HEIGHT,
): Promise<HTMLCanvasElement> {
  const [icon] = await Promise.all([
    input.iconUrl ? loadIcon(input.iconUrl) : null,
    loadFonts(),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Lay out at share-image size, then scale to the requested size.
  ctx.scale(width / SHARE_IMAGE_WIDTH, height / SHARE_IMAGE_HEIGHT);
  ctx.textAlign = "center";

  drawCard(ctx, input.type, FACE_CARD);
  drawContent(ctx, input, icon, {
    y: FACE_CARD.y,
    height: FACE_CARD.height - FACE_FOOTER_HEIGHT,
  });

  ctx.fillStyle = COLORS.description;
  ctx.font = wordmarkFont();
  ctx.globalAlpha = 0.75;
  ctx.fillText(WORDMARK, SHARE_IMAGE_WIDTH / 2, FACE_WORDMARK_Y);
  ctx.globalAlpha = 1;

  return canvas;
}

export async function createShareFile(input: ShareImageInput): Promise<File> {
  const blob = await renderShareImage(input);
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return new File([blob], slug ? `achievement-${slug}.png` : "achievement.png", {
    type: "image/png",
  });
}

export function getShareCaption(title: string): string {
  return `I just unlocked "${title}" on Useless Achievements! ${SITE_URL}`;
}
