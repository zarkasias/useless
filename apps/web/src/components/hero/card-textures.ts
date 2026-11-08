import { CanvasTexture, SRGBColorSpace } from "three";

import { renderCardFace, type ShareImageInput } from "@/lib/share-image";
import {
  CARD_TEXTURE_HEIGHT,
  CARD_TEXTURE_WIDTH,
  renderCardBack,
} from "./card-canvas";

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);

  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;

  return texture;
}

/**
 * The card back. It is the same for every rarity, so it never hints at the
 * achievement on the other side.
 */
export async function drawCardBack(): Promise<CanvasTexture> {
  return toTexture(await renderCardBack());
}

/**
 * The card front: the share image's card layout (rarity border, art, badge,
 * title, description and wordmark), drawn by the same code as the share
 * image so the two always match.
 */
export async function drawCardFront(
  input: ShareImageInput,
): Promise<CanvasTexture> {
  return toTexture(
    await renderCardFace(input, CARD_TEXTURE_WIDTH, CARD_TEXTURE_HEIGHT),
  );
}
