import type { KlondikeHint } from "./klondike-hint";

export function isHintSourceCard(
  hint: KlondikeHint | null,
  cardId: string,
): boolean {
  return Boolean(hint && "cardId" in hint && hint.cardId === cardId);
}

export function isHintWasteSource(hint: KlondikeHint | null): boolean {
  return (
    hint?.type === "waste-to-foundation" || hint?.type === "waste-to-tableau"
  );
}

export function isHintTableauSource(
  hint: KlondikeHint | null,
  columnIndex: number,
): boolean {
  return (
    (hint?.type === "tableau-to-tableau" ||
      hint?.type === "tableau-to-foundation") &&
    hint.sourceColumnIndex === columnIndex
  );
}

export function isHintTableauTarget(
  hint: KlondikeHint | null,
  columnIndex: number,
): boolean {
  return (
    (hint?.type === "tableau-to-tableau" ||
      hint?.type === "waste-to-tableau") &&
    hint.targetColumnIndex === columnIndex
  );
}

export function isHintFoundationTarget(
  hint: KlondikeHint | null,
  foundationIndex: number,
): boolean {
  return (
    (hint?.type === "tableau-to-foundation" ||
      hint?.type === "waste-to-foundation") &&
    hint.foundationIndex === foundationIndex
  );
}

export function isHintStock(hint: KlondikeHint | null): boolean {
  return hint?.type === "stock";
}
