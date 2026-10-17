import type { DragEvent } from "react";

// Snapshot static cards: cloning a flip animation restarts it edge-on.
export function createCardDragPreview(
  event: DragEvent<HTMLButtonElement>,
  cards: HTMLButtonElement[],
) {
  const firstRect = cards[0].getBoundingClientRect();
  const lastRect = cards[cards.length - 1].getBoundingClientRect();
  const preview = document.createElement("div");
  Object.assign(preview.style, {
    position: "fixed",
    top: "-10000px",
    left: "0",
    width: `${firstRect.width}px`,
    height: `${lastRect.bottom - firstRect.top}px`,
    pointerEvents: "none",
  });

  for (const card of cards) {
    const clone = card.cloneNode(true) as HTMLButtonElement;
    clone.querySelectorAll(".animate-card-flip-in").forEach((element) => {
      element.classList.remove("animate-card-flip-in");
    });
    Object.assign(clone.style, {
      position: "absolute",
      left: "0",
      top: `${card.getBoundingClientRect().top - firstRect.top}px`,
      margin: "0",
      transition: "none",
    });
    preview.appendChild(clone);
  }

  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(
    preview,
    event.clientX - firstRect.left,
    event.clientY - firstRect.top,
  );
  // The browser captures the image after the dragstart handler returns.
  window.setTimeout(() => preview.remove(), 0);
}
